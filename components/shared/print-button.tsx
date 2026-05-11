import { Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PrintButton({ href }: { href: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </Link>
    </Button>
  );
}
