import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import TopicHub from "../../TopicHub";
import { SESSION_COOKIE, STAFF_ROLES, verifySession } from "@/utils/authSession";
import { getPublishedTopics, getTopicBySlug, getTopicRefs, resolveItems } from "@/lib/topicsServer";

// Staff-only look at a draft topic. Never indexed, never cached.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Topic preview | Diving Sanatan" }, robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function TopicPreviewPage({ params }: Props) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? verifySession(token) : null;
  if (!user || !STAFF_ROLES.includes(user.role)) notFound();

  const { slug } = await params;
  const topic = await getTopicBySlug(slug, { includeDraft: true });
  if (!topic) notFound();
  const [items, all] = await Promise.all([getTopicRefs(topic.id).then(resolveItems), getPublishedTopics()]);
  return <TopicHub topic={topic} items={items} otherTopics={all.filter((t) => t.id !== topic.id)} preview />;
}
