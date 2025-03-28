import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { resumeScreeningRouter } from "./routes/screening.route";

//load environment variables
dotenv.config();

const isProductionMode = true;

const app = express();
const PORT = process.env.PORT || 3001;

// rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests from this IP, please try again later",
  headers: true,
  statusCode: 429,
});

app.use(limiter);

//setup cors
app.use(
  cors({
    origin: isProductionMode
      ? process.env.ORIGIN_PATH
      : "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//helath checkup route: cron job lambda will hit this route to check if the server is up
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    message: "Server is up and running",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api", resumeScreeningRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
