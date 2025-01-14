import { LlamaParseReader } from "llamaindex";
import "dotenv/config";

const reader = new LlamaParseReader({
  resultType: "markdown",
  apiKey: process.env.LLAMA_CLOUD_API_KEY,
});
// generateMarkdownResume function to parse the resume pdf file and return the markdown resume
export const generateMarkdownResume = async (resumeTempPath: string) => {
  const parsedResData = await reader.loadData(resumeTempPath);

  const markDownResume = parsedResData[0].text;

  return markDownResume;
};
