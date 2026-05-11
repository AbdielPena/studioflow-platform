import Link from "next/link";
import { Camera, Plus, ExternalLink, Lock } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { listGalleriesService } from "@/modules/gallery/services/gallery.service";

export const metadata = { title: "Galerías" };

export default async function GalleryPage() {
  const ctx = await requireCompany();
  const galleries = await listGalleriesService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Galerías"
        description="Galerías de fotos estilo Pixieset para clientes."
        breadcrumbs={[{ label: "Galerías" }]}
        actions={
          <Button asChild>
            <Link href="/gallery/new">
              <Plus className="h-4 w-4" />
              Nueva galería
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {galleries.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Sin galerías"
            description="Crea tu primera galería para compartir fotos con clientes."
            actionLabel="Crear galería"
            actionHref="/gallery/new"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => (
              <Card key={g.id} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                <Link href={`/gallery/${g.id}`}>
                  <div className="relative aspect-video bg-muted">
                    {g.coverUrl || g.photos[0]?.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.coverUrl ?? g.photos[0]?.thumbUrl ?? ""}
                        alt={g.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Camera className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    {g.password && (
                      <Badge variant="secondary" className="absolute right-2 top-2 text-[10px]">
                        <Lock className="h-3 w-3" /> Protegida
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{g.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {g.customer?.legalName ?? "Sin cliente"}
                        </p>
                      </div>
                      <StatusBadge status={g.status} />
                    </div>
                  </CardContent>
                </Link>
                {g.status === "PUBLISHED" && (
                  <div className="border-t bg-muted/30 px-4 py-2">
                    <Link
                      href={`/g/${g.slug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      /g/{g.slug}
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
