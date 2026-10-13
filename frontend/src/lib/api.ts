import axios, { AxiosError, type AxiosInstance } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";
import type {
  CatalogGraph,
  Category,
  ChatSession,
  ChatSessionDetail,
  ChatStreamEvent,
  DashboardStats,
  Document,
  DocumentDetail,
  Insight,
  Product,
  Seller,
  TokenResponse,
  User,
} from "./types";

// Empty = same-origin Next.js API routes (Vercel demo with bundled SQLite).
// Override with NEXT_PUBLIC_API_URL to point at a separate FastAPI backend.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config;
      if (
        error.response?.status === 401 &&
        original &&
        !(original as { _retry?: boolean })._retry
      ) {
        (original as { _retry?: boolean })._retry = true;
        const refresh = getRefreshToken();
        if (refresh) {
          try {
            const { data } = await axios.post<TokenResponse>(
              `${API_BASE}/api/v1/auth/refresh`,
              { refresh_token: refresh }
            );
            setTokens(data.access_token, data.refresh_token);
            original.headers.Authorization = `Bearer ${data.access_token}`;
            return client.request(original);
          } catch {
            clearTokens();
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createClient();

export async function login(email: string, password: string) {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    email,
    password,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(
  email: string,
  password: string,
  full_name: string
) {
  const { data } = await api.post<TokenResponse>("/auth/register", {
    email,
    password,
    full_name,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export async function updateMe(body: {
  full_name?: string;
  password?: string;
}) {
  const { data } = await api.patch<User>("/users/me", body);
  return data;
}

export async function fetchDashboardStats() {
  const { data } = await api.get<DashboardStats>("/dashboard/stats");
  return data;
}

export async function fetchDocuments() {
  const { data } = await api.get<Document[]>("/documents");
  return data;
}

export async function fetchDocument(id: string) {
  const { data } = await api.get<DocumentDetail>(`/documents/${id}`);
  return data;
}

export async function uploadDocument(file: File, title: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  const { data } = await api.post<Document>("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchInsights(params?: {
  insight_type?: string;
  tag?: string;
}) {
  const { data } = await api.get<Insight[]>("/insights", { params });
  return data;
}

export async function fetchInsight(id: string) {
  const { data } = await api.get<Insight>(`/insights/${id}`);
  return data;
}

export async function fetchChatSessions() {
  const { data } = await api.get<ChatSession[]>("/chat/sessions");
  return data;
}

export async function createChatSession(title = "New Chat") {
  const { data } = await api.post<ChatSession>("/chat/sessions", { title });
  return data;
}

export async function fetchChatSession(id: string) {
  const { data } = await api.get<ChatSessionDetail>(`/chat/sessions/${id}`);
  return data;
}

export async function deleteChatSession(id: string) {
  await api.delete(`/chat/sessions/${id}`);
}

export async function streamChatMessage(
  sessionId: string,
  content: string,
  onEvent: (ev: ChatStreamEvent) => void
): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(
    `${API_BASE}/api/v1/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Chat failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const block of chunks) {
      for (const line of block.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as ChatStreamEvent;
          onEvent(parsed);
        } catch {
          /* ignore malformed SSE */
        }
      }
    }
  }
}

export async function fetchProducts() {
  const { data } = await api.get<Product[]>("/catalog/products");
  return data;
}

export async function fetchSellers() {
  const { data } = await api.get<Seller[]>("/catalog/sellers");
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get<Category[]>("/catalog/categories");
  return data;
}

export async function fetchCatalogGraph() {
  const { data } = await api.get<CatalogGraph>("/catalog/graph");
  return data;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg).join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
