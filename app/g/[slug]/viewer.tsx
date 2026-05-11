"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import type { Gallery, GalleryPhoto, Company } from "@prisma/client";

type Props = {
  gallery: Gallery & { photos: GalleryPhoto[]; company: Company };
};

export function GalleryViewer({ gallery }: Props) {
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {gallery.company.tradeName ?? gallery.company.legalName}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{gallery.title}</h1>
          {gallery.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{gallery.description}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{gallery.photos.length} fotos</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {gallery.photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-16 text-center">
            <Camera className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Sin fotos cargadas todavía</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.photos.map((p) => (
              <button
                key={p.id}
                onClick={() => setLightbox(p)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl ?? p.storagePath}
                  alt={p.fileName}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.storagePath}
            alt={lightbox.fileName}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <footer className="mt-12 border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-muted-foreground">
          Powered by StudioFlow Platform
        </div>
      </footer>
    </div>
  );
}
