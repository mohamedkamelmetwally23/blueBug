import type { ApiErrorBody, OverviewResponse, WeeklyTasksResponse } from "../types/contracts.js";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
export interface MonthlyPlanFigure {
  value: number;
  label: string;
  detail: string;
}
export interface MonthlyPlanFigures {
  monthlyNeed: MonthlyPlanFigure;
  progressSep: MonthlyPlanFigure;
  currentGap: MonthlyPlanFigure;
  receivedFromManager: MonthlyPlanFigure;
  currentCashBalance: MonthlyPlanFigure;
  reservedBudget: MonthlyPlanFigure;
}
export interface MonthlyPlanData { content: string; figures: MonthlyPlanFigures; }
const readError = async (response: Response): Promise<Error> => {
  const body = await response.json() as ApiErrorBody;
  return new Error(body.error.message);
};
export const fetchOverview = async (): Promise<OverviewResponse> => {
  const response = await fetch(`${API_URL}/overview`);
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<OverviewResponse>;
};

export const fetchMonthlyPlan = async (): Promise<MonthlyPlanData> => {
  const response = await fetch(`${API_URL}/overview/monthly-plan`);
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<MonthlyPlanData>;
};

export const saveMonthlyPlan = async (content: string): Promise<string> => {
  const response = await fetch(`${API_URL}/overview/monthly-plan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!response.ok) throw await readError(response);
  const body = await response.json() as { content: string };
  return body.content;
};

export const saveMonthlyPlanFigures = async (figures: MonthlyPlanFigures): Promise<MonthlyPlanFigures> => {
  const response = await fetch(`${API_URL}/overview/monthly-plan/figures`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ figures })
  });
  if (!response.ok) throw await readError(response);
  const body = await response.json() as { figures: MonthlyPlanFigures };
  return body.figures;
};

export const fetchWeeklyTasks = async (): Promise<WeeklyTasksResponse> => {
  const response = await fetch(`${API_URL}/tasks/weekly`);
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<WeeklyTasksResponse>;
};

export interface GoogleSheetsSyncResult { synced: number; failures: Array<{ row: number; message: string }>; }
export const syncGoogleSheet = async (): Promise<GoogleSheetsSyncResult> => {
  const response = await fetch(`${API_URL}/google-sheets/sync`, { method: "POST" });
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<GoogleSheetsSyncResult>;
};
