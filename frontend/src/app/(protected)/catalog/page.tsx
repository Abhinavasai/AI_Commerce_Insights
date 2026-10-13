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
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.sku}</td>
                  <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.seller_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.category_name ?? "—"}</td>
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
              className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
            >
              <h3 className="font-display font-semibold text-slate-900">{s.name}</h3>
              <p className="text-sm text-slate-500">{s.region}</p>
              <p className="mt-2 text-xs text-slate-400">{s.product_count} products</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
            >
              <h3 className="font-display font-semibold text-slate-900">{c.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{c.description}</p>
              <p className="mt-2 text-xs text-slate-400">{c.product_count} products</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "graph" ? (
        <div className="space-y-4">
          {graph ? <CatalogGraphViz graph={graph} /> : null}
          {graph?.summary ? (
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
              {JSON.stringify(graph.summary, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
