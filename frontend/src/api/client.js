import axios from "axios";

const client = axios.create({ baseURL: "/api" });

export async function uploadCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function runQuery(sessionId, question) {
  const { data } = await client.post("/query", { sessionId, question });
  return data;
}

export async function getHistory(sessionId) {
  const { data } = await client.get(`/session/${sessionId}/history`);
  return data;
}
