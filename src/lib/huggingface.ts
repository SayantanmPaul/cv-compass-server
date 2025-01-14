import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hfToken = process.env.HUGGING_FACE_TOKEN;

if (!hfToken) {
  throw new Error("Error: HF token not found");
}

export const hfInterface = new HfInference(hfToken);
console.log("Hugging Face Inference initialized successfully.");
