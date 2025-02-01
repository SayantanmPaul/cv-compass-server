import fs from "fs";
import path from "path";

const metricsFilePath = path.join(__dirname, "counters.json");

export const loadMetrics = (): {
  uniqueVisitors: number;
  successfulFeedbacks: number;
} => {
  if (fs.existsSync(metricsFilePath)) {
    const data = fs.readFileSync(metricsFilePath, "utf8");
    return JSON.parse(data);
  }
  return { uniqueVisitors: 0, successfulFeedbacks: 0 };
};

export const saveCounters = (counters: {
  uniqueVisitors: number;
  successfulFeedbacks: number;
}): void => {
  fs.writeFileSync(metricsFilePath, JSON.stringify(counters));
};
