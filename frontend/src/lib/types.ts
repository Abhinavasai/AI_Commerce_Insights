export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_key: string;
  status: string;
  chunk_count: number;
  error_message: string | null;
  meta: Record<string, unknown>;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  token_count: number;
}

export interface DocumentDetail extends Document {
  chunks: DocumentChunk[];
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  insight_type: string;
  confidence: number;
  source_document_ids: string[];
  tags: string[];
  generated_by: string;
  owner_id: string | null;
  created_at: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  token_count: number;
  meta: Record<string, unknown>;
  created_at: string | null;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, unknown>;
  seller_id: string | null;
  category_id: string | null;
  seller_name: string | null;
  category_name: string | null;
}

export interface Seller {
  id: string;
  name: string;
  region: string;
  meta: Record<string, unknown>;
  product_count: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  product_count: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  rel: string;
}

export interface CatalogGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: Record<string, unknown>;
}

export interface DashboardStats {
  runtime_mode: string;
  totals: {
    documents: number;
    insights: number;
    chat_sessions: number;
    products: number;
    sellers: number;
    categories: number;
  };
  document_status: {
    completed: number;
    pending: number;
    processing: number;
    failed: number;
  };
  insights_by_type: Record<string, number>;
  recent_documents: { id: string; title: string; status: string }[];
  recent_insights: {
    id: string;
    title: string;
    insight_type: string;
    confidence: number;
  }[];
}

export type ChatStreamEvent = {
  event: "token" | "tool_call" | "tool_result" | "done";
  data: unknown;
};
