import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type CoachReply = {
  reply: string;
  persona_used: string;
  highlights: string[];
};

type PaceResponse = {
  projected_debt_free_date: string | null;
  projected_months: number | null;
  goal_target_date: string | null;
  pace_status: "ahead" | "on_track" | "behind" | "no_goal";
  days_delta: number | null;
  total_debts_estimate: number;
  closed_debts: number;
  progress_pct: number;
};

type ScoreSnapshot = {
  id: string;
  score: number;
  label: string | null;
  created_at: string;
};

type ScoreHistoryResponse = {
  snapshots: ScoreSnapshot[];
};

type ShareCardResponse = {
  card_type: string;
  title: string;
  subtitle: string;
  caption: string;
  hashtags: string[];
};

function useEdgeFunction<T>(name: string, payload?: any) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Wait for session to be ready
        let session = null;
        let retries = 0;
        while (!session && retries < 3 && !cancelled) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          session = currentSession;
          if (!session && retries < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
          }
        }
        
        if (!session) {
          if (!cancelled) setError('Not authenticated');
          if (!cancelled) setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke(name, {
          body: payload ?? {}
        });
        if (error) throw error;
        if (!cancelled) setData(data as T);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, JSON.stringify(payload ?? {})]);

  return { data, loading, error, setData };
}

/* ---------------- CoachChat ---------------- */

type ChatMessage = {
  id: string;
  role: "user" | "coach";
  content: string;
};

const CoachChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "coach",
      content:
        "Welcome to Coach. Ask me about your payoff plan, strategy, or next move and I'll answer based on your actual Finityo data."
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendPrompt = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "ask-the-coach",
        {
          body: {
            prompt: trimmed,
            persona: "hybrid"
          }
        }
      );
      if (error) throw error;
      const reply = data as CoachReply;
      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        role: "coach",
        content: reply.reply
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (e: any) {
      setError(e.message ?? "Coach had trouble answering that.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-cyan-500/25 flex flex-col h-full min-h-[500px]">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
        Coach Chat
      </h3>
      <p className="mt-1 text-xs text-neutral-400">
        Ask questions about your payoff plan. Coach looks at your real
        numbers before answering.
      </p>

      <div
        ref={scrollRef}
        className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-xl bg-black/30 p-3 text-xs text-neutral-100"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-full whitespace-pre-line rounded-lg px-3 py-2 ${
              m.role === "user"
                ? "ml-auto bg-cyan-600/30 text-cyan-100 max-w-[80%]"
                : "mr-auto bg-neutral-800 text-neutral-100 max-w-[90%]"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto rounded-lg bg-neutral-800 px-3 py-2 text-[11px] text-neutral-300">
            Coach is thinking…
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded-md bg-red-900/50 p-2 text-[11px] text-red-200">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sending) sendPrompt();
            }
          }}
          placeholder='Example: "How can I pay this off faster?"'
          className="flex-1 rounded-lg border border-neutral-700 bg-black/60 px-2 py-1 text-xs text-neutral-100 outline-none"
        />
        <button
          type="button"
          onClick={sendPrompt}
          disabled={sending || !input.trim()}
          className="rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-3 py-1 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Ask Coach"}
        </button>
      </div>
    </div>
  );
};


/* ---------------- PaceMonitorCard ---------------- */

const PaceMonitorCard: React.FC = () => {
  const { data, loading, error } =
    useEdgeFunction<PaceResponse>("pace-monitor");

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-lime-800 bg-neutral-900/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-lime-600/60 bg-lime-950/40 p-4 md:p-5 text-xs text-lime-100">
        <div className="text-sm font-semibold">Pace Monitor</div>
        <p className="mt-2">
          We couldn&apos;t calculate your pace yet. Make sure you have
          debts and a goal set.
        </p>
      </div>
    );
  }

  const {
    projected_debt_free_date,
    projected_months,
    goal_target_date,
    pace_status,
    days_delta,
    total_debts_estimate,
    closed_debts,
    progress_pct
  } = data;

  const statusLabel =
    pace_status === "ahead"
      ? "Ahead of schedule"
      : pace_status === "behind"
      ? "Behind schedule"
      : pace_status === "on_track"
      ? "On track"
      : "No goal set";

  const statusColor =
    pace_status === "ahead"
      ? "text-emerald-300"
      : pace_status === "behind"
      ? "text-red-300"
      : pace_status === "on_track"
      ? "text-amber-300"
      : "text-neutral-300";

  let deltaText = "";
  if (days_delta != null && pace_status !== "no_goal") {
    if (days_delta > 0) {
      deltaText = `~${days_delta} day(s) ahead of goal.`;
    } else if (days_delta < 0) {
      deltaText = `~${Math.abs(days_delta)} day(s) behind your goal.`;
    } else {
      deltaText = "Right on your target date.";
    }
  }

  return (
    <div className="rounded-2xl border border-lime-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-lime-500/25">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-lime-300">
        Pace Monitor
      </h3>
      <p className="mt-1 text-xs text-neutral-400">
        See if your current payoff plan is ahead, on track, or behind
        your target.
      </p>

      <div className="mt-3 grid gap-3 text-xs text-neutral-200">
        <div className="rounded-xl bg-black/40 p-3">
          <div className="text-[11px] text-neutral-400">
            Debt-free projection
          </div>
          <div className="mt-1 text-lg font-semibold text-neutral-50">
            {projected_debt_free_date ?? "—"}
          </div>
          <div className="text-[11px] text-neutral-400">
            Approx timeline:{" "}
            <span className="font-semibold">
              {projected_months != null
                ? `${projected_months} month(s)`
                : "—"}
            </span>
          </div>
          {goal_target_date && (
            <div className="mt-1 text-[11px] text-neutral-400">
              Goal date:{" "}
              <span className="font-semibold">
                {new Date(goal_target_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-black/40 p-3">
          <div className="text-[11px] text-neutral-400">
            Status vs goal
          </div>
          <div className={`mt-1 text-lg font-semibold ${statusColor}`}>
            {statusLabel}
          </div>
          {deltaText && (
            <div className="mt-1 text-[11px] text-neutral-300">
              {deltaText}
            </div>
          )}
          <div className="mt-2 text-[11px] text-neutral-400">
            Debts cleared:{" "}
            <span className="font-semibold">
              {closed_debts}/{total_debts_estimate}
            </span>
          </div>
          <div className="mt-1">
            <div className="mb-1 text-[10px] text-neutral-400">
              Plan progress
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800">
              <div
                className="h-2 rounded-full bg-lime-500/80"
                style={{ width: `${progress_pct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-neutral-400">
              ~{progress_pct}% of your estimated debt count paid off.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ---------------- ScoreHistoryCard ---------------- */

const ScoreHistoryCard: React.FC = () => {
  const { data, loading, error, setData } =
    useEdgeFunction<ScoreHistoryResponse>("score-history", {
      mode: "list",
      limit: 12
    });
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const snapshots = data?.snapshots ?? [];
  const latest = snapshots[0];

  const recordSnapshot = async () => {
    try {
      setRecording(true);
      setRecError(null);
      const { error } = await supabase.functions.invoke("score-history", {
        body: { mode: "record" }
      });
      if (error) throw error;
      
      // Refresh list
      const { data: refreshed, error: refreshError } = await supabase.functions.invoke("score-history", {
        body: { mode: "list", limit: 12 }
      });
      if (!refreshError) {
        setData(refreshed as ScoreHistoryResponse);
      }
    } catch (e: any) {
      setRecError(e.message ?? "Could not record snapshot.");
    } finally {
      setRecording(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-indigo-800 bg-neutral-900/60 p-4 md:p-5">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-indigo-600/60 bg-indigo-950/40 p-4 md:p-5 text-xs text-indigo-100">
        <div className="text-sm font-semibold">Score History</div>
        <p className="mt-2">We couldn&apos;t load your score history.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-indigo-500/25">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
        Score History
      </h3>
      <p className="mt-1 text-xs text-neutral-400">
        Simple 0–100 financial health snapshots over time.
      </p>

      {recError && (
        <div className="mt-2 rounded-md bg-red-900/50 p-2 text-[11px] text-red-200">
          {recError}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={recordSnapshot}
          disabled={recording}
          className="rounded-lg border border-indigo-400/70 bg-indigo-500/20 px-3 py-1 text-[11px] font-semibold text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
        >
          {recording ? "Recording..." : "Record Snapshot"}
        </button>
        {latest && (
          <div className="text-right text-xs text-neutral-300">
            Latest: <span className="font-semibold">{latest.score}</span> ({latest.label})
          </div>
        )}
      </div>

      {snapshots.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-400">
          No snapshots yet. Record your first one above.
        </p>
      ) : (
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs text-neutral-100">
          {snapshots.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-black/40 px-3 py-2"
            >
              <div className="flex-1">
                <div className="font-semibold">Score: {s.score}</div>
                <div className="text-[11px] text-neutral-400">
                  {s.label ? `${s.label} • ` : ""}
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


/* ---------------- ShareCardPanel ---------------- */

const ShareCardPanel: React.FC = () => {
  const [cardType, setCardType] = useState<"streak" | "milestone" | "goal" | "generic">("generic");
  const [generating, setGenerating] = useState(false);
  const [card, setCard] = useState<ShareCardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateCard = async () => {
    try {
      setGenerating(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke(
        "share-card-generator",
        {
          body: { card_type: cardType }
        }
      );
      if (error) throw error;
      setCard(data as ShareCardResponse);
    } catch (e: any) {
      setError(e.message ?? "Could not generate card.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-fuchsia-500/40 bg-neutral-900/70 p-4 md:p-5 shadow-lg shadow-fuchsia-500/25">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-fuchsia-300">
        Social Share Cards
      </h3>
      <p className="mt-1 text-xs text-neutral-400">
        Generate shareable content based on your progress.
      </p>

      {error && (
        <div className="mt-2 rounded-md bg-red-900/50 p-2 text-[11px] text-red-200">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs">
        <select
          value={cardType}
          onChange={(e) => setCardType(e.target.value as any)}
          className="flex-1 rounded-lg border border-neutral-700 bg-black/60 px-2 py-1 text-xs text-neutral-100 outline-none"
        >
          <option value="generic">Generic</option>
          <option value="streak">Streak</option>
          <option value="milestone">Milestone</option>
          <option value="goal">Goal</option>
        </select>
        <button
          type="button"
          onClick={generateCard}
          disabled={generating}
          className="rounded-lg border border-fuchsia-400/70 bg-fuchsia-500/20 px-3 py-1 text-[11px] font-semibold text-fuchsia-100 hover:bg-fuchsia-500/30 disabled:opacity-60"
        >
          {generating ? "Generating..." : "Generate"}
        </button>
      </div>

      {card && (
        <div className="mt-3 rounded-xl bg-black/40 p-3 text-xs text-neutral-100">
          <div className="text-sm font-semibold text-fuchsia-200">{card.title}</div>
          <div className="mt-1 text-[11px] text-neutral-400">{card.subtitle}</div>
          <div className="mt-2 rounded-lg bg-neutral-800 p-2 text-[11px]">
            {card.caption}
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-neutral-400">
            {card.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-neutral-800 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/* ---------------- IntelligenceSuite ---------------- */

export const IntelligenceSuite: React.FC = () => {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CoachChat />
        <div className="grid gap-4">
          <PaceMonitorCard />
          <ScoreHistoryCard />
        </div>
      </div>
      <ShareCardPanel />
    </div>
  );
};

export default IntelligenceSuite;
