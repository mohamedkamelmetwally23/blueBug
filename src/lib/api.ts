import type { ApiErrorBody, OverviewResponse, WeeklyTasksResponse } from "../types/contracts.js";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
export const fetchOverview = async (): Promise<OverviewResponse> => {
  const response = await fetch(`${API_URL}/overview`);
  if (!response.ok) {
    const body = await response.json() as ApiErrorBody;
    throw new Error(body.error.message);
  }
  return response.json() as Promise<OverviewResponse>;
};

export const fetchWeeklyTasks = async (): Promise<WeeklyTasksResponse> => {
  const response = await fetch(`${API_URL}/tasks/weekly`);
  if (!response.ok) {
    const body = await response.json() as ApiErrorBody;
    throw new Error(body.error.message);
  }
  return response.json() as Promise<WeeklyTasksResponse>;
};

