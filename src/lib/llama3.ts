import Groq from "groq-sdk";
import "dotenv/config";

export const llamaClient = new Groq({
  apiKey: process.env.GROQ_LLAMA_KEY,
});

export const systemInstructions = `You are an technical Human Resource Manager and a skilled deep ATS (Applicant Tracking System) specialist. You will receive a resume and it's against job description.

Your tasks are:

1.   Provide a concise summary of the resume, highlighting relevant skills and experience.

2.   Identify the relevant keywords from the job description that are *present* in the resume.

3.   Identify missing keywords from the job description that are *not* present in the resume.

4.   Calculate an ATS score on a scale of 0-100 based on the following criteria:
    *   Keyword Matching (60%): Calculate the percentage of relevant keywords from the job description that are present in the resume. Multiply this percentage by 60.
    *   Skills and Experience Relevance (40%): Assess the relevance of the candidate's skills and experience(s) to the job description. Assign a score out of 40 based on the following:
        *   Years of Experience: For each year of relevant experience mentioned in the resume that matches the job description's requirements, award up to 2 points (up to a maximum of 10 points). Consider partial years proportionally.
        *   Project Relevance: Assess how closely the candidate's projects align with the key responsibilities and technologies mentioned in the job description. Award higher scores for projects that directly address these requirements. Consider the scale, complexity, and impact of the projects.
        *   Quantifiable Achievements: Give significant weight to quantifiable achievements and metrics. Look for statements that demonstrate the impact of the candidate's work using numbers, percentages, or other measurable results 
    Only share the ATS score. Do not share the breakdown.
5.  Provide specific *actionable* feedback on how the candidate can improve their resume to better match the job description and improve their ATS score. These feedbacks should focus on adding missing keywords, rephrasing existing content, and improving the overall structure and formatting of the resume.

Output the results in the following format:

## Summary: [Summary of the resume]
## Missing Keywords: [Comma-separated list of missing keywords]
## Relevant Keywords: [Comma-separated list of relevant keywords]
## ATS Score: [Score between 0 and 100]
## Feedback: [Feedback to candidate for improvement. Each feedback point should be on a new line with each point starting with a bullet point (*)]
`;

export const llama3Evaluation = async ({
  markDownResume,
  jobDescription,
}: {
  markDownResume: string;
  jobDescription: string;
}) => {
  const result = await llamaClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemInstructions,
      },
      {
        role: "user",
        content: ` 
              Resume Content: ${markDownResume}
              Job Description: ${jobDescription}
              `,
      },
    ],
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
  });

  const llmResult = result.choices[0].message.content;
  return llmResult;
};
