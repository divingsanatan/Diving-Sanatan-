"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoBlogForm from "@/components/admin/VideoBlogForm";
import { Blog } from "@/types/database";

export default function EditVideoBlogPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    fetch(`/api/blogs?id=${encodeURIComponent(id)}&admin_view=true`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && json.data) {
          setBlog(json.data);
        } else {
          setError("Video blog post not found.");
        }
      })
      .catch((err) => {
        console.error("Failed to load video blog for editing:", err);
        if (isMounted) setError("Error fetching video blog data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading video blog details for editing...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>{error || "Video blog post not found."}</h3>
        <button
          onClick={() => router.push("/admin/video-blogs")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Return to Video Catalog
        </button>
      </div>
    );
  }

  return <VideoBlogForm initialData={blog} isEdit={true} />;
}
