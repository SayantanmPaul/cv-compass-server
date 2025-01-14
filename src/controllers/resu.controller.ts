import { Request, Response } from "express";
// import { hfInterface } from "../lib/huggingface";
import "dotenv/config";
import fs from "fs";
import { LlamaParseReader } from "llamaindex";
import path from "path";
import { isValidResumeFileType } from "../lib/supportedFileType";


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
    await fs.writeFileSync(resumeTempPath, resume.buffer);

    try {
      // LlamaParseReader initialization
      const reader = new LlamaParseReader({
        resultType: "markdown",
        apiKey: process.env.LLAMA_CLOUD_API_KEY,
      });

      const parsedResData = await reader.loadData(resumeTempPath);

      // delete temporary file after processing
      await fs.promises.unlink(resumeTempPath);

      console.log(parsedResData[0].text);

      res.status(200).json({
        message: "Resume parsed successfully",
        data: parsedResData[0].text,
        // jobDescription: jobDescription,
      });
      
    } catch (error) {
      res.status(501).json({
        error: "error occured while parsing resume",
        code: 501,
        message: error,
      });
    }

  } catch (error) {
    res.status(501).json({
      error: "error occured while parsing resume",
      code: 501,
      message: error,
    });
  }
};
