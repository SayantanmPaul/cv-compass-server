import express from "express";
import {
  countVisitorSuccessFeedback,
  resumeParserController,
} from "../controllers/resu.controller";
import { upload } from "../controller/multer.controller";

export const resumeScreeningRouter = express.Router();

resumeScreeningRouter.post(
  "/upload",
  upload.single("resume"),
  resumeParserController
);

resumeScreeningRouter.get("/visits", countVisitorSuccessFeedback);


//os_3ZYk3ziUs4Vn7VrPRSXERoPy