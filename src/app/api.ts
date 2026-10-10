export type Role = "manager" | "coordinator" | "employee";
export type User = { id: string; name: string; email: string; role: Role };
export type DynamicField = {
  key: string;
  label: string;
  type: "text" | "longtext" | "number" | "date" | "dropdown" | "boolean";
  required: boolean;
  options: string[];
};
export type Category = {
  _id: string;
  name: string;
  description: string;
  mode: "entries" | "aggregate";
  targetBehavior: "optional" | "required" | "none";
  results: string[];
  fields: DynamicField[];
  version: number;
  active: boolean;
};
export type Task = {
  _id: string;
  categoryId: string;
  title: string;
  instructions: string;
  workDate: string;
  assignedEmployee: string;
  employeeName: string;
  target?: number;
  actualQuantity: number;
  aggregateQuantity: number;
  status: string;
  notes: string;
  workFormat?: "sheet" | "legacy";
  day?: string;
  endDate?: string;
  accountNames?: string;
  numDone?: number | null;
  resultStatus?: string;
  categorySchema: Category;
};
export type Entry = {
  _id: string;
  identifier: string;
  result: string;
  values: Record<string, unknown>;
  notes: string;
  updatedAt: string;
};
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
export type Employee = {
  _id: string;
  name: string;
  assigned: number;
  completed: number;
  quantity: number;
  lastActivity: string | null;
  statuses: string[];
};
export type CategoryStats = Category & {
  tasks: number;
  completed: number;
  quantity: number;
  target: number;
  targetedQuantity: number;
  statuses: string[];
};
export type Overview = {
  categories: CategoryStats[];
  trend: { _id: string; quantity: number }[];
};
export const statuses = ["Not Started", "In Progress", "Completed"];
const pending = new Map<string, Promise<unknown>>();
export function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (method !== "GET") return request<T>(path, method, body);
  const key = (sessionStorage.getItem("ops-token") ?? "") + path;
  let promise = pending.get(key);
  if (!promise) {
    promise = request<T>(path, method, body).finally(() => pending.delete(key));
    pending.set(key, promise);
  }
  return promise as Promise<T>;
}
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    (import.meta.env.VITE_API_BASE_URL || "/api/v1") + path,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(sessionStorage.getItem("ops-token")
          ? { Authorization: "Bearer " + sessionStorage.getItem("ops-token") }
          : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login")
      window.dispatchEvent(new Event("ops-logout"));
    throw new Error(
      result.error?.issues
        ?.map(
          (i: { field: string; message: string }) => `${i.field}: ${i.message}`,
        )
        .join("; ") ||
        result.error?.message ||
        "Request failed",
    );
  }
  return result.data as T;
}
export const cairoDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
