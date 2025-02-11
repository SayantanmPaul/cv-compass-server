import { Request, Response } from "express";
// import { hfInterface } from "../lib/huggingface";
import "dotenv/config";
import fs from "fs";
import { RateLimitError } from "groq-sdk";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  createErrorResponse,
  getATSScore,
  getATSScoreBreakups,
  getFeedbacks,
  getMissingKeywords,
  getRelevantKeywords,
  getSummary,
} from "../lib/helper";
import { HFDeepSeepEvaluation } from "../lib/huggingface";
import { generateMarkdownResume } from "../lib/llama-parser";
import { Llama3Evaluation } from "../lib/llama3";
import { redis } from "../lib/redis";
import { isValidResumeFileType } from "../lib/supportedFileType";

// handleing temporary file
const handleTempFile = async ({
  fileBuffer,
  extension,
}: {
  fileBuffer: Buffer;
  extension: "pdf";
}) => {
  const tempPath = path.join(__dirname, `temp-${Date.now()}.${extension}`);
  await fs.promises.writeFile(tempPath, fileBuffer);
  return tempPath;
};

// rate limit handler
const handleRateLimitError = (error: RateLimitError, res: Response) => {
  const retryAfter = error.headers?.["retry-after"];
  let retryMessage;

  if (retryAfter) {
    const countMinutes = Math.ceil(parseInt(retryAfter, 10) / 60);
    retryMessage = `API rate limit reached. Please try again after ${countMinutes} minutes.`;
  } else {
    retryMessage = "API rate limit reached. Please try again later.";
  }
  return createErrorResponse(res, 429, retryMessage);
};

// handle model evaluation
const handleModelEvaluation = ({
  modelName,
  markDownResume,
  jobDescription,
}: {
  modelName: string;
  markDownResume: string;
  jobDescription: string;
}) => {
  const evalutorFn: Record<
    string,
    typeof Llama3Evaluation | typeof HFDeepSeepEvaluation
  > = {
    "Llama-3.3-70b-versatile": Llama3Evaluation,
    "DeepSeek-R1-Distill-Qwen-32B": HFDeepSeepEvaluation,
  };

  const evaluator = evalutorFn[modelName];

  if (!evaluator) throw new Error("Invalid model specified");

  return evaluator({ markDownResume, jobDescription });
};

export const resumeParserController = async (req: Request, res: Response) => {
  try {
    const resume = req.file;
    const jobDescription = req.body.jobDescription;
    const modelName = req.body.modelName;

    //vadidate resume type and job description
    if (!resume || !jobDescription) {
      return createErrorResponse(res, 400, "Missing resume or job description");
    }

    if (!isValidResumeFileType(resume.mimetype)) {
      return createErrorResponse(res, 400, "Invalid file type. Supported: PDF");
    }

    // temporary file path to store resume
    const resumeTempPath = await handleTempFile({
      fileBuffer: resume.buffer,
      extension: "pdf",
    });

    try {
      // LlamaParseReader to parse the resume
      const markDownResume = await generateMarkdownResume(resumeTempPath);

      // evaluate resume against job description
      try {
        const evaluationResult = await handleModelEvaluation({
          markDownResume: markDownResume,
          jobDescription: jobDescription,
          modelName: modelName,
        });

        if (!evaluationResult) {
          return createErrorResponse(
            res,
            501,
            "Error in generating response from llama3.3"
          );
        }

        await redis.incr("successful_feedbacks");
        res.status(200).json({
          message: "Resume feedback generated successfully",
          // providedResume: parsedResData[0].text,
          // jobDescription: jobDescription,
          status: "success",
          data: {
            atsScore: getATSScore(evaluationResult),
            atsBreakDown: getATSScoreBreakups(evaluationResult),
            summary: getSummary(evaluationResult),
            relavantKeywords: getRelevantKeywords(evaluationResult),
            missingKeywords: getMissingKeywords(evaluationResult),
            feedback: getFeedbacks(evaluationResult),
          },
        });
      } catch (error) {
        if (error instanceof RateLimitError)
          return handleRateLimitError(error, res);
        //generic error
        return createErrorResponse(
          res,
          501,
          "Model evaluation failed, Please try another model",
          error
        );
      }
    } catch (error) {
      return createErrorResponse(
        res,
        501,
        "Resume parsing failed, Please try again later",
        error
      );
    } finally {
      // delete temporary file after processing
      await fs.promises.unlink(resumeTempPath).catch(console.error);
    }
  } catch (error) {
    return createErrorResponse(res, 501, "Error processing the request", error);
  }
};

export const countVisitorSuccessFeedback = async (
  req: Request,
  res: Response
) => {
  try {
    const visitId = req.cookies.visitorId;
    if (!visitId) {
      const newVisitId = uuidv4();
      res.cookie("visitorId", newVisitId, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days cookies store
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    }
    await redis.sadd("unique_visits", visitId);

    const [uniqueVisitorCount, successfulGenerationCount] = await Promise.all([
      redis.scard("unique_visits"),
      redis.get("successful_feedbacks").then((res) => parseInt(res || "0", 10)),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        uniqueVisitorsCount: uniqueVisitorCount,
        successfulFeedbacksCount: successfulGenerationCount,
      },
    });
  } catch (error) {
    return createErrorResponse(
      res,
      500,
      "Error retrieving visitor counts",
      error
    );
  }
};
