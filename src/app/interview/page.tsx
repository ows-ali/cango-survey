import { getLang } from "@/lib/languages";
import InterviewSession from "@/components/interview/InterviewSession";

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const config = getLang(lang ?? null);

  return <InterviewSession config={config} />;
}
