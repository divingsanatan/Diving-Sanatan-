import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TopicHub from "../TopicHub";
import { getPublishedTopics, getTopicBySlug, getTopicRefs, resolveItems } from "@/lib/topicsServer";
import { effectiveCanonical, effectiveMetaDescription, effectiveMetaTitle, isIndexableTopic, topicUrl } from "@/lib/topicsShared";
import { SITE_NAME } from "@/lib/shopShared";

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getPublishedTopics();
  return all.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTopicBySlug(slug);
  if (!t) return { title: { absolute: `Topic not found | ${SITE_NAME}` }, robots: { index: false, follow: false } };
  const title = effectiveMetaTitle(t);
  const description = effectiveMetaDescription(t);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: effectiveCanonical(t) },
    robots: isIndexableTopic(t) ? { index: true, follow: true } : { index: false, follow: true },
    keywords: [t.focusKeyword, ...t.secondaryKeywords].filter(Boolean),
    openGraph: {
      type: "article",
      title,
      description,
      url: topicUrl(t.slug),
      siteName: SITE_NAME,
      images: t.ogImage ? [{ url: t.ogImage, alt: t.title }] : undefined,
      ...(t.updatedAt ? { modifiedTime: t.updatedAt } : {}),
    },
    twitter: { card: t.ogImage ? "summary_large_image" : "summary", title, description, images: t.ogImage ? [t.ogImage] : undefined },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();
  const [items, all] = await Promise.all([getTopicRefs(topic.id).then(resolveItems), getPublishedTopics()]);
  return <TopicHub topic={topic} items={items} otherTopics={all.filter((t) => t.id !== topic.id)} />;
}
