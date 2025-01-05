import { Request, Response } from "express";

export const resumeParserController = async (req: Request, res: Response) => {
  res.send("hello resume parser");
};
