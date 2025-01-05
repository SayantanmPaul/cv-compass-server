import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { resumeScreeningRouter } from "./routes/screening.route";

//load environment variables
dotenv.config({ path: ".env.local" });

console.log("Loaded Environment Variables:", process.env.PORTNAME);

const isProductionMode = false;

const app = express();
const PORT = process.env.PORT || 3001;

//setup cors
app.use(
  cors({
    origin: isProductionMode
      ? process.env.ORIGIN_PATH
      : "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", resumeScreeningRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
