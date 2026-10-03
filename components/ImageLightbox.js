"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/LocaleProvider";

export function ImageLightbox({
  images,
  index,
  title,
  onClose,
  onSelect,
}) {
  const { t } = useI18n();
  const current = images[index];

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        onSelect((index + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        onSelect((index - 1 + images.length) % images.length);
      }
    }

    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [images.length, index, onClose, onSelect]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? t("photoPreviewTitle", { title }) : t("photoPreview")}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-paper px-3 py-1.5 text-sm font-medium text-forest"
      >
        {t("close")}
      </button>
      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect((index - 1 + images.length) % images.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-paper px-3 py-2 text-forest"
            aria-label={t("previousPhoto")}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect((index + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-paper px-3 py-2 text-forest"
            aria-label={t("nextPhoto")}
          >
            ›
          </button>
        </>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={title || t("lotPhotograph")}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain"
        onClick={(event) => event.stopPropagation()}
      />
      {images.length > 1 ? (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-paper/90 px-3 py-1 text-xs text-heading">
          {index + 1} / {images.length}
        </p>
      ) : null}
    </div>
  );
}
