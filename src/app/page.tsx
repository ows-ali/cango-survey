import Link from "next/link";
import { getLang } from "@/lib/languages";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const config = getLang(lang ?? null);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <p className="mb-8 text-sm font-medium uppercase tracking-[0.2em] text-muted">
          {config.microLabel}
        </p>

        <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
          {config.landingTitle}
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          {config.landingSubtitle}
        </p>

        <Link
          href={`/interview?lang=${config.code}`}
          className="mt-10 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-4 text-base font-medium text-background transition-colors hover:opacity-85"
        >
          {config.primaryCta}
        </Link>

        <p className="mt-6 text-sm text-muted">
          No account needed. A few short questions, spoken aloud.
        </p>
      </div>
    </main>
  );
}
