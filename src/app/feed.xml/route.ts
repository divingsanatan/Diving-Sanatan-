import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET() {
  const baseUrl = "https://divingsanatan.online";

  try {
    const { data: blogs } = await supabaseServer
      .from("blogs")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);

    const itemsXml = (blogs || []).map((blog) => {
      const pubDate = blog.date ? new Date(blog.date).toUTCString() : new Date().toUTCString();
      const blogUrl = `${baseUrl}/blog/${blog.id}`;
      return `
    <item>
      <title><![CDATA[${blog.title || "Spiritual Guide"}]]></title>
      <link>${blogUrl}</link>
      <guid>${blogUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${blog.tldr || blog.content?.substring(0, 250) || ""}]]></description>
      <author><![CDATA[${blog.author || "Diving Sanatan Sanctuary"}]]></author>
    </item>`;
    }).join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Diving Sanatan Sanctuary Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Holistic energy healing, chakra alignment, and mindfulness guides from Diving Sanatan Sanctuary.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8"
      }
    });
  } catch (err: any) {
    return new NextResponse(`<error>${err.message}</error>`, { status: 500 });
  }
}
