import { VersionDrawer } from "@/components/VersionDrawer";
import { useState } from "react";
import { Btn } from "@/components/Btn";

export function PlanVersionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Btn
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-finityo-textBody text-finityo-textBody"
      >
        History
      </Btn>

      <VersionDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
