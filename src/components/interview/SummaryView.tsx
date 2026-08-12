"use client";

import Link from "next/link";
import type { ResearchSummary } from "@/types";

export default function SummaryView({
  summary,
  targetLanguage,
  langCode,
}: {
  summary: ResearchSummary;
  targetLanguage: string;
  langCode?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Thank you
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        Your answers will help us better understand how people learn {targetLanguage}. The
        interview is now complete.
      </p>

      <div className="mt-10 w-full max-w-xl rounded-2xl border border-border bg-surface p-6 text-left">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
          Research summary
        </h2>

        {summary.mainChallenge && (
          <SummaryRow label="Main challenge" value={summary.mainChallenge} />
        )}
        {summary.realSituation && (
          <SummaryRow label="Real situation mentioned" value={summary.realSituation} />
        )}
        {summary.currentSolution && (
          <SummaryRow label="Current solution" value={summary.currentSolution} />
        )}
        {summary.mainFrustration && (
          <SummaryRow label="Main frustration" value={summary.mainFrustration} />
        )}
        {summary.desiredImprovement && (
          <SummaryRow label="Desired improvement" value={summary.desiredImprovement} />
        )}
        {summary.estimatedLevel && (
          <SummaryRow label="Estimated level" value={summary.estimatedLevel} />
        )}
        {summary.payingInterest && (
          <SummaryRow label="Paying interest" value={summary.payingInterest} />
        )}

        <SummaryList label="Learning problems" items={summary.mainLearningProblems} />
        <SummaryList label="Real-life situations" items={summary.realLifeSituations} />
        <SummaryList label="Learning methods" items={summary.currentLearningMethods} />
        <SummaryList label="Frustrations" items={summary.frustrations} />
        <SummaryList label="Desired outcomes" items={summary.desiredOutcomes} />
        <SummaryList label="Existing paid solutions" items={summary.existingPaidSolutions} />
        <SummaryList label="Important quotes" items={summary.importantQuotes} quoted />
        <SummaryList label="Other insights" items={summary.otherInsights} />
      </div>

      <Link
        href={langCode ? `/?lang=${langCode}` : "/"}
        className="mt-8 text-sm text-muted underline-offset-4 hover:underline"
      >
        Return home
      </Link>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-base leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function SummaryList({
  label,
  items,
  quoted = false,
}: {
  label: string;
  items: string[];
  quoted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-base leading-relaxed text-foreground">
            {quoted ? <span className="italic">“{item}”</span> : item}
          </li>
        ))}
      </ul>
    </div>
  );
}
