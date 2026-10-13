"use client";

import { useEffect, useState } from "react";
import { CatalogGraphViz } from "@/components/CatalogGraphViz";
import { PageHeader } from "@/components/PageHeader";
import {
  fetchCatalogGraph,
  fetchCategories,
  fetchProducts,
  fetchSellers,
  getApiErrorMessage,
} from "@/lib/api";
import type { CatalogGraph, Category, Product, Seller } from "@/lib/types";

type Tab = "products" | "sellers" | "categories" | "graph";

export default function CatalogPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [graph, setGraph] = useState<CatalogGraph | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchProducts().then(setProducts),
      fetchSellers().then(setSellers),
      fetchCategories().then(setCategories),
      fetchCatalogGraph().then(setGraph),
    ]).catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "products", label: "Products" },
    { id: "sellers", label: "Sellers" },
    { id: "categories", label: "Categories" },
    { id: "graph", label: "Relationships" },
  ];

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Products, sellers, categories, and entity relationships from the graph store."
      />
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div data-tour="catalog-tabs" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-coral text-white"
                : "bg-paper text-ink-soft ring-1 ring-ink/15 hover:bg-paper-warm/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="overflow-hidden rounded-xl border-[2.5px] border-ink/15 bg-paper/80 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-paper-warm/80 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.sku}</td>
                  <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.seller_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.category_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "sellers" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border-[2.5px] border-ink/15 bg-paper/80 p-4 shadow-sm"
            >
              <h3 className="font-display font-semibold text-ink">{s.name}</h3>
              <p className="text-sm text-ink-muted">{s.region}</p>
              <p className="mt-2 text-xs text-ink-muted">{s.product_count} products</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border-[2.5px] border-ink/15 bg-paper/80 p-4 shadow-sm"
            >
              <h3 className="font-display font-semibold text-ink">{c.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
              <p className="mt-2 text-xs text-ink-muted">{c.product_count} products</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "graph" ? (
        <div className="space-y-4">
          {graph ? <CatalogGraphViz graph={graph} /> : null}
          {graph?.summary ? (
            <pre className="overflow-x-auto rounded-lg bg-ink p-4 text-xs text-ink-muted">
              {JSON.stringify(graph.summary, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
