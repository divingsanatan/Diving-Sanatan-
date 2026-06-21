"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Blog {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
}

export default function BlogDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    
    async function loadBlogDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs?id=${id}`);
        const json = await res.json();
        if (json.success) {
          setBlog(json.data);
        } else {
          setError(json.error || "Article not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to resolve article server connection.");
      } finally {
        setLoading(false);
      }
    }
    loadBlogDetail();
  }, [id]);

  return (
    <div className="blog-detail-page">
      {loading ? (
        <p style={{ textAlign: "center", padding: "80px 0" }}>Unrolling manuscript...</p>
      ) : error || !blog ? (
        <div className="error-card glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <h3>Error Resolving Article</h3>
          <p style={{ margin: "16px 0", color: "hsl(var(--text-muted))" }}>{error}</p>
          <Button variant="gold" onClick={() => router.push("/blog")}>Back to Blog</Button>
        </div>
      ) : (
        <article className="blog-article-content">
          
          {/* Header info */}
          <div className="article-header">
            <span className="article-category">{blog.category}</span>
            <h1 className="article-title">{blog.title}</h1>
            <div className="article-meta">
              <span>Written by: <strong>{blog.author}</strong></span>
              <span>•</span>
              <span>Released: <strong>{blog.date}</strong></span>
              <span>•</span>
              <span>Reading estimate: <strong>{blog.readTime}</strong></span>
            </div>
          </div>

          {/* Content panel */}
          <Card variant="glass" className="article-body-card">
            <div className="article-paragraph-wrapper">
              <p className="first-paragraph-dropcap">
                {blog.content}
              </p>
              
              {/* Visual quote spacer */}
              <div className="article-blockquote">
                <span className="quote-mark">“</span>
                <p>Energy flow balances are the foundational blueprint of physical comfort. Maintain your aura, and your mind will follow.</p>
              </div>

              <p>
                Somatic therapies remind us that blockades within our chakras aren't just mystical constructs. They represent chemical blockades in our nervous pathways. By introducing sound bowls vibrating at specific frequencies (e.g. 528Hz for DNA repair or 432Hz for deep meditation), we assist our bodies in aligning these frequencies, which stabilizes cortisol flow and reduces tension. Ensure you discuss layout sessions with a certified practitioner to customize crystals based on your current physical conditions.
              </p>
            </div>

            {/* Actions footer */}
            <div className="article-footer-actions">
              <Button variant="gold-outline" onClick={() => router.push("/blog")}>
                ← Back to Listings
              </Button>
              
              <Button variant="gold" onClick={() => router.push(`/search?query=${encodeURIComponent(blog.category)}`)}>
                Book Related Sessions
              </Button>
            </div>
          </Card>

        </article>
      )}

      <style jsx>{`
        .blog-detail-page {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .article-header {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .article-category {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .article-title {
          font-size: 2.5rem;
          color: #4c1d95;
          line-height: 1.3;
        }
        .article-meta {
          display: flex;
          gap: 12px;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          margin-top: 8px;
        }
        .article-body-card {
          padding: 40px !important;
        }
        .article-paragraph-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .article-paragraph-wrapper p {
          font-size: 1.05rem;
          line-height: 1.8;
          color: hsl(var(--text-cream));
        }
        .first-paragraph-dropcap::first-letter {
          font-family: var(--font-serif);
          font-size: 3.5rem;
          float: left;
          line-height: 0.8;
          padding-right: 8px;
          padding-top: 4px;
          color: #7c3aed;
          font-weight: 700;
        }
        .article-blockquote {
          background: rgba(168, 85, 247, 0.04);
          border-left: 3px solid #7c3aed;
          padding: 24px;
          border-radius: 0 16px 16px 0;
          margin: 12px 0;
          position: relative;
        }
        .quote-mark {
          position: absolute;
          top: -10px;
          left: 10px;
          font-size: 4rem;
          font-family: var(--font-serif);
          color: rgba(168, 85, 247, 0.15);
          line-height: 1;
        }
        .article-blockquote p {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 1.15rem;
          color: #4c1d95 !important;
        }
        .article-footer-actions {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 32px;
          margin-top: 40px;
        }
        @media (max-width: 640px) {
          .article-title {
            font-size: 1.8rem;
          }
          .article-meta {
            flex-direction: column;
            gap: 4px;
            align-items: center;
          }
          .article-meta span:nth-child(even) {
            display: none;
          }
          .article-body-card {
            padding: 20px !important;
          }
          .article-footer-actions {
            flex-direction: column;
            gap: 16px;
          }
          .article-footer-actions :global(button) {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
