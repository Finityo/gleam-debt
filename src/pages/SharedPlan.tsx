import { useParams, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";

export default function SharedPlan() {
  const { id } = useParams();
  const nav = useNavigate();

  if (!id) return null;

  const raw = localStorage.getItem(`finityo:snapshot:${id}`);
  if (!raw) {
    return (
      <PageShell>
        <div className="max-w-lg mx-auto pt-20 text-center text-finityo-textBody">
          Shared link not found.
        </div>
      </PageShell>
    );
  }

  const snap = JSON.parse(raw);

  return (
    <PageShell>
      <div className="max-w-xl mx-auto pt-20 px-4 space-y-6 text-center">
        <h1 className="text-3xl font-bold text-finityo-textMain">
          Shared Debt Plan
        </h1>

        <p className="text-finityo-textBody">
          This is a read-only copy. Create your own below.
        </p>

        <button
          onClick={() => nav("/demo/start")}
          className="mt-6 text-blue-400 underline"
        >
          Try Finityo
        </button>
      </div>
    </PageShell>
  );
}
