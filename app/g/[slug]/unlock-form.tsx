"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { unlockGalleryAction } from "@/modules/gallery/actions/gallery.actions";

export function GalleryUnlockForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await unlockGalleryAction({ slug, password });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormField label="Contraseña" required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
}
