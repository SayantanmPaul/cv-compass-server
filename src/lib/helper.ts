import { Response } from "express";

// dynamic error response
interface ErrorResponse {
  error: string;
  code: number;
  message: string | unknown;
  details?: unknown;
}
export function createErrorResponse(
  res: Response,
  statusCode: number,
  errorMessage: string,
  errorDetails?: unknown
) {
  const response: ErrorResponse = {
    error: errorMessage,
    code: statusCode,
    message: errorDetails,
  };

  return res.status(statusCode).json(response);
}

// Get the ATS score from the content
export const getATSScore = (content: string): number => {
  const atsScoreRegex = /## ATS Score:\s*([\d]+)/i;
  const match = content.match(atsScoreRegex);
  return match ? parseInt(match[1]) : 0;
};

// Get the summary from the content
export const getSummary = (content: string): string => {
  const summaryRegex = /## Summary:\s*(.*)/i;
  const match = content.match(summaryRegex);
  return match ? match[1] : "";
};

// Get the missing keywords from the content
export const getMissingKeywords = (content: string): string[] => {
  const missingKeywordsRegex = /## Missing Keywords:\s*(.*)/i;
  const match = content.match(missingKeywordsRegex);

  return match ? match[1].split(",").map((keyword) => keyword.trim()) : [];
};

// Get the relavant keywords from the content
export const getRelevantKeywords = (content: string): string[] => {
  const relavantKeywordsRegex = /## Relevant Keywords:\s*(.*)/i;
  const match = content.match(relavantKeywordsRegex);

  return match ? match[1].split(",").map((keyword) => keyword.trim()) : [];
};

// get the feedback from the content
export const getFeedbacks = (content: string): string[] => {
  const feedbackRegex = /## Feedback:\s*([\s\S]*)/i;
  const match = content.match(feedbackRegex);

  return match
    ? match[1]
        .split(/\*\s+/)
        .map((feedback) => feedback.trim())
        .filter((feedback) => feedback.length > 0)
    : [];
};

// get the ats score breakups from the content
export const getATSScoreBreakups = (
  content: string
): { [key: string]: number } => {
  const regex =
    /## (Keyword Matching|Years of Experience|Project Relevance|Quantifiable Achievements) Percentage:\s*(\d+)%/gi;
  const data: { [key: string]: number } = {};
  let match;

  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = parseInt(match[2], 10);
    data[key] = value;
  }

  return data;
};
