"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Interview, InterviewWithMessages } from "@/types";
import type { LangCode } from "@/lib/languages";
import { LANGUAGES } from "@/lib/languages";

interface Stats {
  total: number;
  completed: number;
  averageDurationSeconds: number | null;
}

export default function DashboardClient() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<LangCode | "all">("all");
  const [selected, setSelected] = useState<InterviewWithMessages | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/interviews");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        setInterviews(data.interviews as Interview[]);
        setStats(data.stats as Stats);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load interviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openInterview(id: string) {
    try {
      const res = await fetch(`/api/admin/interviews/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setSelected(data.interview as InterviewWithMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  }

  const filtered = langFilter === "all" ? interviews : interviews.filter((i) => i.language === langFilter);

  const fmtDuration = (s: number | null) =>
    s == null ? "—" : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Research dashboard
          </h1>
          <p className="text-sm text-muted">Interview transcripts and AI-generated summaries.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">
            ← Back to app
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total interviews" value={stats ? String(stats.total) : "—"} />
        <StatCard label="Completed" value={stats ? String(stats.completed) : "—"} />
        <StatCard
          label="Avg duration"
          value={stats ? fmtDuration(stats.averageDurationSeconds) : "—"}
        />
      </div>

      {/* Filter */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-sm text-muted">Filter:</span>
        {(["all", "de", "it"] as const).map((code) => (
          <button
            key={code}
            onClick={() => setLangFilter(code)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              langFilter === code
                ? "bg-foreground text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {code === "all" ? "All" : LANGUAGES[code as LangCode].targetLanguageName}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted">No interviews yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => openInterview(i.id)}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent-soft"
                >
                  <td className="px-4 py-3">{LANGUAGES[i.language].targetLanguageName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        i.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : i.status === "in_progress"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(i.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted">{fmtDuration(i.durationSeconds)}</td>
                  <td className="px-4 py-3 text-muted">{i.provider ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {i.generatedSummary ? "✓ generated" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="mt-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {LANGUAGES[selected.language].targetLanguageName} interview
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            <p className="mb-4 text-sm text-muted">
              {new Date(selected.startedAt).toLocaleString()} · {selected.messages.length} messages
              {selected.provider ? ` · provider: ${selected.provider}` : ""}
            </p>

            {selected.generatedSummary && (
              <div className="mb-6 rounded-xl border border-border p-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  AI summary
                </h3>
                <SummaryText summary={selected.generatedSummary} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {selected.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    m.role === "interviewer"
                      ? "bg-accent-soft text-foreground"
                      : "border border-border text-foreground"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                    {m.role === "interviewer" ? "Interviewer" : "Participant"}
                    {m.isFollowup ? " · follow-up" : ""}
                    {m.questionCategory ? ` · ${m.questionCategory}` : ""}
                  </p>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryText({ summary }: { summary: NonNullable<Interview["generatedSummary"]> }) {
  const rows: [string, string][] = [
    ["Main challenge", summary.mainChallenge ?? ""],
    ["Real situation", summary.realSituation ?? ""],
    ["Current solution", summary.currentSolution ?? ""],
    ["Main frustration", summary.mainFrustration ?? ""],
    ["Desired improvement", summary.desiredImprovement ?? ""],
    ["Estimated level", summary.estimatedLevel ?? ""],
    ["Paying interest", summary.payingInterest ?? ""],
  ];

  return (
    <div className="flex flex-col gap-1">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <p key={k} className="text-sm">
            <strong className="font-medium">{k}:</strong> {v}
          </p>
        ))}
      {summary.importantQuotes.length > 0 && (
        <p className="mt-2 text-sm">
          <strong className="font-medium">Quotes:</strong> {summary.importantQuotes.join(" · ")}
        </p>
      )}
    </div>
  );
}
