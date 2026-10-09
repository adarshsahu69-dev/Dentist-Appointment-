"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ServiceActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Could not update this service.");
        return;
      }
      toast.success(isActive ? "Service unpublished." : "Service published.");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant={isActive ? "destructive" : "default"} onClick={toggle} disabled={pending}>
      {pending ? "Saving…" : isActive ? "Unpublish" : "Publish"}
    </Button>
  );
}
