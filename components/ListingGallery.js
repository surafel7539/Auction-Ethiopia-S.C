"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ImageLightbox";

export function ListingGallery({ images, title }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[active] || images[0];

  if (!current) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-forest/10 text-muted">
        No photograph supplied
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-3xl bg-forest/10"
        aria-label={`Preview ${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={title}
          className="aspect-[4/3] w-full object-cover"
        />
      </button>
      <p className="mt-2 text-center text-xs text-muted">Click the photo to preview</p>
      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              onDoubleClick={() => {
                setActive(index);
                setOpen(true);
              }}
              aria-label={`View photograph ${index + 1}`}
              className={`overflow-hidden rounded-xl ring-2 ${
                index === active ? "ring-gold" : "ring-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      {open ? (
        <ImageLightbox
          images={images}
          index={active}
          title={title}
          onClose={() => setOpen(false)}
          onSelect={setActive}
        />
      ) : null}
    </div>
  );
}
