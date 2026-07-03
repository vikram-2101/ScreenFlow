import client from "./client";

export const fetchClassificationAnalytics = async () => {
  const res = await client.get("/analytics/classification");
  return res.data;
};