import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const getDefaultProjectId = () => {
  const fromEnv = Number(process.env.DEFAULT_PROJECT_ID || 1);
  return Number.isNaN(fromEnv) ? 1 : fromEnv;
};

export default apiClient;
