import client from "./client";

export const fetchScreenshots = async () => {
  const res = await client.get("/screenshots/");
  return res.data;
};

export const getScreenshot = async (id) => {
  const res = await client.get(`/screenshots/${id}`);
  return res.data;
};

export const searchScreenshots = async (q) => {
  const res = await client.get(`/screenshots/search?q=${encodeURIComponent(q)}`);
  return res.data;
};

export const uploadScreenshot = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await client.post("/screenshots/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data;
};

export const overrideScreenshot = async (id, payload) => {
  const res = await client.patch(`/screenshots/${id}/override`, payload);
  return res.data;
};

export const bulkDelete = async (ids) => {
  const res = await client.delete("/screenshots/bulk", { data: { ids } });
  return res.data;
};

export const fetchTrash = async () => {
  const res = await client.get("/screenshots/trash");
  return res.data;
};

export const bulkRestore = async (ids) => {
  const res = await client.post("/screenshots/bulk/restore", { ids });
  return res.data;
};

export const bulkHardDelete = async (ids) => {
  const res = await client.delete("/screenshots/bulk/permanent", { data: { ids } });
  return res.data;
};