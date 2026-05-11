"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BranchRowActions({ branchId }: { branchId: string }) {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href={`/settings/branches/${branchId}`}>
        <Pencil className="h-4 w-4" />
      </Link>
    </Button>
  );
}
