export const TOUR_STORAGE_KEY = "aci_product_tour_v1";

export type TourStep = {
  id: string;
  /** Matches [data-tour="..."] on the page */
  target?: string;
  /** Navigate here before highlighting (optional) */
  href?: string;
  title: string;
  body: string;
  placement?: "auto" | "right" | "left" | "bottom" | "top";
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    href: "/dashboard",
    title: "What is AI Commerce Insights?",
    body: "A decision-support workspace for ecommerce teams. You upload seller catalogs, compliance packs, and competitive reports — the platform extracts products/sellers, builds a knowledge graph, and answers commerce questions with AI.",
  },
  {
    id: "outcome",
    href: "/dashboard",
    title: "What outcome do you get?",
    body: "Instead of reading PDFs for hours, you get: structured catalog entities, AI insight cards (trends, anomalies, recommendations), and a chat agent that can search documents + the catalog graph. Typical win: ~80–90% less manual review time.",
  },
  {
    id: "flow",
    href: "/dashboard",
    title: "How the pipeline works",
    body: "Documents → async processing (parse, chunk, embed) → knowledge graph + vector store → Chat / Insights / Catalog. Everything starts with an upload; intelligence shows up on these screens once status is Completed.",
  },
  {
    id: "nav",
    href: "/dashboard",
    target: "sidebar",
    title: "Navigation rail",
    body: "Stations for Signal deck, Documents, Ask agent, Insights, Catalog graph, and Settings. Each item shows a short hint so you know the job of that screen. Re-open this tour from Product tour anytime.",
    placement: "right",
  },
  {
    id: "header",
    href: "/dashboard",
    target: "page-header",
    title: "Page context",
    body: "Every screen has a clear title and one-line purpose. Page-specific actions sit on the right so you always know what this view is for.",
    placement: "bottom",
  },
  {
    id: "kpis",
    href: "/dashboard",
    target: "kpi-cards",
    title: "Intelligence pipeline",
    body: "These dark stations are actionable — click Corpus → Documents, Graph → Catalog, Signals → Insights, Ask → Chat. The flow is the product story: files → entities → findings → questions.",
    placement: "bottom",
  },
  {
    id: "charts",
    href: "/dashboard",
    target: "analytics",
    title: "Daily brief + prompts",
    body: "Instead of a generic chart wall, you get an attention brief and ready-made agent prompts. Click a prompt to jump into Ask agent with that question prefilled.",
    placement: "left",
  },
  {
    id: "activity",
    href: "/dashboard",
    target: "activity",
    title: "Signal river",
    body: "A timeline of recent documents and insights — click any row to open the detail. This replaces the usual twin list cards with a single narrative stream.",
    placement: "top",
  },
  {
    id: "documents",
    href: "/documents",
    target: "upload-zone",
    title: "Documents — start here",
    body: "Upload PDF/CSV/DOCX/HTML/text. Files land in storage, then the worker/ingest pipeline chunks and embeds them. Watch status badges move from Pending → Processing → Completed.",
    placement: "bottom",
  },
  {
    id: "chat",
    href: "/chat",
    target: "chat-panel",
    title: "Chat — ask commerce questions",
    body: "Create a session and ask things like “Which sellers lead Electronics?” The agent streams tokens, shows tool calls (vector search, catalog, graph), and grounds answers in your corpus.",
    placement: "left",
  },
  {
    id: "insights",
    href: "/insights",
    target: "insights-grid",
    title: "Insights — AI cards",
    body: "Filterable trend / anomaly / recommendation / summary cards with confidence scores. Open a card to see source documents and act on the finding.",
    placement: "top",
  },
  {
    id: "catalog",
    href: "/catalog",
    target: "catalog-tabs",
    title: "Catalog — extracted entities",
    body: "Browse products, sellers, and categories pulled from documents, plus a relationship graph (SELLS, BELONGS_TO, MENTIONED_IN). This is the SQL/Neo4j knowledge layer behind chat tools.",
    placement: "bottom",
  },
  {
    id: "done",
    href: "/dashboard",
    title: "You’re ready",
    body: "Try the demo corpus already seeded, or upload a CSV and ask Chat about it. Re-open this tour from the sidebar “Product tour” button anytime.",
  },
];
