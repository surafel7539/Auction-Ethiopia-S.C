"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useI18n } from "@/components/LocaleProvider";

export function ListingGallery({ images, title }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[active] || images[0];

  if (!current) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-forest/10 text-muted">
        {t("noPhotograph")}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-[1.8rem] bg-forest/10 shadow-[0_24px_50px_-32px_rgba(46,16,101,0.7)]"
        aria-label={t("previewTitle", { title })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={title}
          className="aspect-[4/3] w-full object-cover"
        />
      </button>
      <p className="mt-2 text-center text-xs text-muted">{t("clickToPreview")}</p>
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
              aria-label={t("viewPhoto", { index: index + 1 })}
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
