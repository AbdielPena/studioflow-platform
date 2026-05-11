import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Camera, Lock } from "lucide-react";
import { prisma } from "@/packages/db";
import { GalleryUnlockForm } from "./unlock-form";
import { GalleryViewer } from "./viewer";

export const metadata = { title: "Galería" };

export default async function PublicGalleryPage({
  params,
}: {
  params: { slug: string };
}) {
  const gallery = await prisma.gallery.findFirst({
    where: { slug: params.slug, deletedAt: null, status: "PUBLISHED" },
    include: { photos: { orderBy: { position: "asc" } }, company: true },
  });

  if (!gallery) notFound();
  if (gallery.expiresAt && gallery.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Galería expirada</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El acceso a esta galería ya no está disponible.
          </p>
        </div>
      </div>
    );
  }

  if (gallery.password) {
    const cookie = cookies().get(`gallery-${gallery.slug}`);
    if (!cookie || cookie.value !== "ok") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-background p-6">
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold">{gallery.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta galería está protegida. Ingresa la contraseña para verla.
            </p>
            <div className="mt-6">
              <GalleryUnlockForm slug={gallery.slug} />
            </div>
          </div>
        </div>
      );
    }
  }

  return <GalleryViewer gallery={gallery} />;
}
