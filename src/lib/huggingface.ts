import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";
import { systemInstructions } from "./llama3";

dotenv.config();

const hfToken = process.env.HUGGING_FACE_TOKEN;

if (!hfToken) {
  throw new Error("Error: HF token not found");
}

export const hfInterface = new HfInference(hfToken);
console.log("Hugging Face Inference initialized successfully.");

// const model = "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B";

export const HFDeepSeepEvaluation = async ({
  modelName,
  markDownResume,
  jobDescription,
}: {
  modelName: string;
  markDownResume: string;
  jobDescription: string;
}) => {
  const prompt = `
      ${systemInstructions}
      
      Resume Content: ${markDownResume}
      Job Description: ${jobDescription}
    `;

  try {
    const result = await hfInterface.textGeneration({
      model: modelName,
      inputs: prompt,
      parameters: {
        max_new_tokens: 1500,
        return_full_text: false,
      },
    });
    console.log(result.generated_text);

    return result.generated_text;
  } catch (error) {
    console.log(error);
  }
};
