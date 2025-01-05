import express from "express";
import { resumeParserController } from "../controllers/resu.controller";

export const resumeScreeningRouter = express.Router();

resumeScreeningRouter.get("/", resumeParserController);
