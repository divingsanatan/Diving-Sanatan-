"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComparisonPage } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { useBlog } from "../BlogContext";

export default function ComparisonIndexPage() {
  const router = useRouter();
  const { searchQuery } = useBlog();
  const [pages, setPages] = useState<ComparisonPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comparisons")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const data: ComparisonPage[] = json.data;
          if (data.length === 1) {
            router.replace(`/blog/comparison/${data[0].slug}`);
            return;
          }
          setPages(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.modalityAName.toLowerCase().includes(q) ||
        p.modalityBName.toLowerCase().includes(q)
    );
  }, [pages, searchQuery]);

  if (loading) {
    return <p className="text-center-pad">Loading comparisons...</p>;
  }

  return (
    <div className="comparison-index">
      <div className="comp-header">
        <h1 className="page-title">Healing Modal Comparisons</h1>
        <p className="page-subtitle">
          Browse side-by-side comparisons of our signature spiritual practices to find your ideal session.
        </p>
      </div>

      {filtered.length === 0 ? (
        <Card variant="glass" className="card-empty-muted-lg">
          {searchQuery ? "No comparisons match your search." : "No comparison pages available yet."}
        </Card>
      ) : (
        <div className="comparison-grid">
          {filtered.map(page => (
            <Link key={page.id} href={`/blog/comparison/${page.slug}`} className="comparison-card-link">
              <Card variant="glass" className="comparison-card">
                <h3>{page.title}</h3>
                <p>{page.subtitle || "Compare modalities side-by-side"}</p>
                <div className="modality-pills">
                  <span>{page.modalityAName}</span>
                  <span className="vs">vs</span>
                  <span>{page.modalityBName}</span>
                </div>
                <span className="view-link">View Comparison →</span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .comparison-index { display: flex; flex-direction: column; gap: 32px; }
        .comp-header { text-align: center; }
        .page-title { font-size: 2.4rem; color: #4c1d95; margin-bottom: 8px; font-family: var(--font-serif); }
        .page-subtitle { font-size: 1rem; color: hsl(var(--text-muted)); max-width: 600px; margin: 0 auto; }
        .comparison-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        :global(.comparison-card-link) { text-decoration: none; }
        :global(.comparison-card) { padding: 28px !important; display: flex; flex-direction: column; gap: 12px; transition: var(--transition-smooth); cursor: pointer; height: 100%; }
        :global(.comparison-card:hover) { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(124, 58, 237, 0.1); }
        :global(.comparison-card h3) { font-family: var(--font-serif); color: #4c1d95; font-size: 1.25rem; }
        :global(.comparison-card p) { font-size: 0.88rem; color: hsl(var(--text-muted)); line-height: 1.5; flex: 1; }
        .modality-pills { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .modality-pills span { font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 99px; background: rgba(168, 85, 247, 0.08); color: #6d28d9; }
        .vs { background: transparent !important; color: hsl(var(--text-muted)) !important; font-weight: 400 !important; padding: 0 !important; }
        .view-link { font-size: 0.85rem; font-weight: 700; color: #7c3aed; margin-top: 4px; }
      `}</style>
    </div>
  );
}
