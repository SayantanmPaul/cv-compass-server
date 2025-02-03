import { Request, Response } from "express";
// import { hfInterface } from "../lib/huggingface";
import { RateLimitError } from "groq-sdk";
import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  createErrorResponse,
  getATSScore,
  getATSScoreBreakups,
  getFeedbacks,
  getMissingKeywords,
  getRelevantKeywords,
  getSummary,
} from "../lib/helper";
import { generateMarkdownResume } from "../lib/llama-parser";
import { llama3Evaluation } from "../lib/llama3";
import { isValidResumeFileType } from "../lib/supportedFileType";
import { v4 as uuidv4 } from "uuid";
import { loadMetrics, saveCounters } from "../lib/fileStorage";

// website visit metrics
let { uniqueVisitors, successfulFeedbacks } = loadMetrics();
const uniqueVisitorIds = new Set<string>();

export const resumeParserController = async (req: Request, res: Response) => {
  try {
    const resume = req.file;
    const jobDescription = req.body.jobDescription;

    //vadidate resume type and job description
    if (!resume || !jobDescription) {
      return res.status(400).json({
        message: "Either job description or resume isn't provided",
        code: 400,
      });
    }

    if (!isValidResumeFileType(resume.mimetype)) {
      return res.status(400).json({
        message: "Invalid file type. Supported file type is pdf",
        code: 400,
      });
    }

    // temporary file path to store resume
    const resumeTempPath = path.join(__dirname, `temp-${Date.now()}.pdf`);
    await fs.promises.writeFile(resumeTempPath, resume.buffer);

    try {
      // LlamaParseReader to parse the resume
      const markDownResume = await generateMarkdownResume(resumeTempPath);

      // evaluate resume against job description
      try {
        const llama3EvaluationRes = await llama3Evaluation({
          markDownResume: markDownResume,
          jobDescription: jobDescription,
        });

        if (llama3EvaluationRes == null) {
          return createErrorResponse(
            res,
            501,
            "Error in generating response from llama3.3"
          );
        }

        successfulFeedbacks++;
        saveCounters({ uniqueVisitors, successfulFeedbacks });

        res.status(200).json({
          message: "Resume feedback generated successfully",
          // providedResume: parsedResData[0].text,
          // jobDescription: jobDescription,
          status: "success",
          data: {
            atsScore: getATSScore(llama3EvaluationRes),
            atsBreakDown: getATSScoreBreakups(llama3EvaluationRes),
            summary: getSummary(llama3EvaluationRes),
            relavantKeywords: getRelevantKeywords(llama3EvaluationRes),
            missingKeywords: getMissingKeywords(llama3EvaluationRes),
            feedback: getFeedbacks(llama3EvaluationRes),
          },
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          //count retry time based on retry-after header
          const retryAfter = error.headers?.["retry-after"];
          let retryMessage;

          if (retryAfter) {
            const countMinutes = Math.ceil(parseInt(retryAfter, 10) / 60);
            retryMessage = `API rate limit reached. Please try again after ${countMinutes} minutes.`;
          } else {
            retryMessage = "API rate limit reached. Please try again later.";
          }
          return createErrorResponse(res, 429, retryMessage);
        }
        //generic error
        else
          return createErrorResponse(
            res,
            501,
            "Error in generating response from llama3.3",
            error
          );
      }
    } catch (error) {
      return createErrorResponse(
        res,
        501,
        "Error in parsing the resume",
        error
      );
    } finally {
      // delete temporary file after processing
      await fs.promises
        .unlink(resumeTempPath)
        .catch((err) => console.error("Error deleting temp file:", err));
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
      uniqueVisitorIds.add(newVisitId);
      uniqueVisitors++;
      saveCounters({ uniqueVisitors, successfulFeedbacks });
    }

    res.status(200).json({
      status: "success",
      data: {
        uniqueVisitorsCount: uniqueVisitors,
        successfulFeedbacksCount: successfulFeedbacks,
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
