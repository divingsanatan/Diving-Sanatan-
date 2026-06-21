"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogSidebar } from "@/components/blog/BlogSidebar";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <div className="blog-layout-container">
        <main className="blog-main-content">
          {children}
        </main>
        
        <aside className="blog-sidebar-container">
          <BlogSidebar />
        </aside>
      </div>

      <Footer />

      <style jsx global>{`
        .blog-layout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          display: flex;
          gap: 40px;
          width: 100%;
          align-items: flex-start;
        }
        .blog-main-content {
          flex: 9;
          min-width: 0; /* Prevents flex children from breaking width */
        }
        .blog-sidebar-container {
          flex: 1;
          min-width: 130px;
        }

        @media (max-width: 1024px) {
          .blog-layout-container {
            gap: 20px;
          }
          .blog-sidebar-container {
            flex: 1.2;
            min-width: 120px;
          }
        }

        @media (max-width: 968px) {
          .blog-layout-container {
            flex-direction: column;
            padding: 30px 20px 60px;
          }
          .blog-sidebar-container {
            width: 100%;
            margin-top: 20px;
          }
        }
      `}</style>
    </div>
  );
}
