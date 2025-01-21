import express from "express";
import { resumeParserController } from "../controllers/resu.controller";
import { upload } from "../controller/multer.controller";

export const resumeScreeningRouter = express.Router();

resumeScreeningRouter.post(
  "/upload",
  upload.single("resume"),
  resumeParserController
);
