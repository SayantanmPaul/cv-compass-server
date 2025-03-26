import express from "express";
import { upload } from "../controller/multer.controller";
import {
  countVisitorSuccessFeedback,
  getModelNames,
  resumeParserController,
} from "../controllers/resu.controller";

export const resumeScreeningRouter = express.Router();

resumeScreeningRouter.post(
  "/upload",
  upload.single("resume"),
  resumeParserController,
);

resumeScreeningRouter.get("/available-models", getModelNames);

resumeScreeningRouter.get("/visits", countVisitorSuccessFeedback);

//os_3ZYk3ziUs4Vn7VrPRSXERoPy
