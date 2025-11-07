import { useEffect, useMemo, useState } from "react";
import { Card } from "./Card";
import { Btn } from "./Btn";
import { Chip } from "./ui/chip";
import { coachGet, coachAdd, coachToggle, coachDelete, CoachComment } from "@/lib/coach";

type DebtMini = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  planId: string;
  coachName: string;
  monthsCount: number;
  debts: DebtMini[];
};

export function CoachSuggestDrawer({
  open,
  onClose,
  planId,
  coachName,
  monthsCount,
  debts,
}: Props) {
  const [tab, setTab] = useState<"active" | "resolved" | "all">("active");
  const [list, setList] = useState<CoachComment[]>([]);
  const [text, setText] = useState("");
  const [targetType, setTargetType] = useState<"none" | "month" | "debt">("none");
  const [targetRef, setTargetRef] = useState<string>("");

  useEffect(() => {
    if (open) {
      (async () => setList(await coachGet(planId)))();
    }
  }, [open, planId]);

  const filtered = useMemo(() => {
    if (tab === "all") return list;
    if (tab === "active") return list.filter((x) => !x.resolved);
    return list.filter((x) => !!x.resolved);
  }, [list, tab]);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const area =
      targetType === "none"
        ? undefined
        : targetType === "month"
        ? {
            type: "month" as const,
            refId: targetRef,
            label: `Month ${Number(targetRef) + 1}`,
          }
        : {
            type: "debt" as const,
            refId: targetRef,
            label: debts.find((d) => d.id === targetRef)?.name || "Debt",
          };

    const c: CoachComment = {
      id: "c-" + Math.random().toString(36).slice(2, 9),
      coachName: coachName || "Coach",
      text: trimmed,
      createdAt: new Date().toISOString(),
      area,
    };

    await coachAdd(planId, c);
    setList(await coachGet(planId));
    setText("");
    setTargetType("none");
    setTargetRef("");
  }

  async function toggle(id: string) {
    await coachToggle(planId, id);
    setList(await coachGet(planId));
  }

  async function remove(id: string) {
    await coachDelete(planId, id);
    setList(await coachGet(planId));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${
          open ? "block" : "hidden"
        } fixed inset-0 bg-black/30 z-40 animate-fade`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full md:w-[440px] bg-background z-50 shadow-2xl
                    ${open ? "animate-slideIn" : "animate-slideOut pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between">
          <div className="font-semibold">Coach Suggestions</div>
          <Btn variant="outline" onClick={onClose}>
            Close
          </Btn>
        </div>

        {/* Content */}
        <div
          className="p-4 space-y-4 overflow-y-auto"
          style={{ height: "calc(100% - 64px)" }}
        >
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Chip active={tab === "active"} onClick={() => setTab("active")}>
              Active
            </Chip>
            <Chip active={tab === "resolved"} onClick={() => setTab("resolved")}>
              Resolved
            </Chip>
            <Chip active={tab === "all"} onClick={() => setTab("all")}>
              All
            </Chip>
          </div>

          {/* New Suggestion Form */}
          <Card title="New Suggestion">
            <div className="grid sm:grid-cols-3 gap-2 items-center">
              <div className="sm:col-span-1 text-sm text-muted-foreground">
                Target
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as any);
                    setTargetRef("");
                  }}
                  className="border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
                >
                  <option value="none">None</option>
                  <option value="month">Month</option>
                  <option value="debt">Debt</option>
                </select>

                {targetType === "month" && (
                  <select
                    value={targetRef}
                    onChange={(e) => setTargetRef(e.target.value)}
                    className="border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
                  >
                    <option value="">Select Month…</option>
                    {Array.from({ length: monthsCount }).map((_, i) => (
                      <option key={i} value={String(i)}>
                        Month {i + 1}
                      </option>
                    ))}
                  </select>
                )}

                {targetType === "debt" && (
                  <select
                    value={targetRef}
                    onChange={(e) => setTargetRef(e.target.value)}
                    className="border border-brand-border rounded-base p-2 text-sm bg-background text-foreground"
                  >
                    <option value="">Select Debt…</option>
                    {debts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="sm:col-span-3">
                <textarea
                  rows={4}
                  placeholder="Type your suggestion…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="border border-brand-border rounded-base p-2 text-sm w-full bg-background text-foreground"
                />
              </div>
              <div className="sm:col-span-3">
                <Btn onClick={submit}>Add Suggestion</Btn>
              </div>
            </div>
          </Card>

          {/* List */}
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No suggestions yet.
              </div>
            )}

            {filtered.map((c) => (
              <div
                key={c.id}
                className={`border border-brand-border rounded-base p-3 ${
                  c.resolved ? "bg-muted text-muted-foreground" : "bg-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{c.coachName}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>

                {c.area && (
                  <div className="mt-1">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full border border-brand-border">
                      {c.area.type === "month"
                        ? c.area.label
                        : `Debt: ${c.area.label}`}
                    </span>
                  </div>
                )}

                <div className="mt-2 text-sm whitespace-pre-wrap">{c.text}</div>

                <div className="mt-3 flex items-center gap-2">
                  <Btn variant="outline" onClick={() => toggle(c.id)}>
                    {c.resolved ? "Mark Active" : "Resolve"}
                  </Btn>
                  <Btn variant="danger" onClick={() => remove(c.id)}>
                    Delete
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile helper bar */}
      <div
        className={`${
          open ? "hidden" : "block"
        } md:hidden fixed bottom-0 inset-x-0 bg-card border-t shadow-sheet p-3 z-30`}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground">Coach suggestions</div>
          <Btn variant="outline" onClick={onClose}>
            Open
          </Btn>
        </div>
      </div>
    </>
  );
}
