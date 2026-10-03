"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/LocaleProvider";

const INTERVAL_MS = 5000;

export function HeroSlideshow({ slides }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) {
    return <div className="absolute inset-0 bg-blue/30" />;
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, slideIndex) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.id}
          src={slide.image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            slideIndex === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/20 to-transparent lg:bg-gradient-to-l" />
      {slides.map((slide, slideIndex) => (
        <Link
          key={slide.id}
          href={`/auctions/${slide.id}`}
          aria-hidden={slideIndex === index ? undefined : true}
          tabIndex={slideIndex === index ? undefined : -1}
          className={`absolute bottom-5 left-5 right-5 rounded-3xl border border-white/20 bg-paper/95 p-4 text-heading shadow-xl transition-opacity duration-700 sm:left-auto sm:w-80 ${
            slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange">{t("featuredLot")}</p>
          <p className="display mt-1 text-2xl leading-tight">{slide.title}</p>
          <p className="mt-2 text-sm text-blue">{slide.price}</p>
        </Link>
      ))}
    </div>
  );
}
