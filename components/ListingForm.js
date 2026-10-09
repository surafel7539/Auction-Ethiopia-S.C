"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createListingAction } from "@/app/actions/listings";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CONDITIONS, LOCATIONS, MAX_LISTING_PHOTOS } from "@/lib/constants";
import { useI18n } from "@/components/LocaleProvider";
import { categoryName, cityName, conditionName } from "@/lib/messages";

export function ListingForm({ categories }) {
  const { locale, t } = useI18n();
  const [state, action, pending] = useActionState(createListingAction, {});
  const [schedule, setSchedule] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <Field label={t("lotTitle")}>
        <input
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-xl border border-forest/15 px-3 py-2"
        />
      </Field>
      <Field label={t("description")}>
        <textarea
          name="description"
          required
          rows={6}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-xl border border-forest/15 px-3 py-2"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("category")}>
          <select
            name="categoryId"
            required
            className="w-full rounded-xl border border-forest/15 bg-field px-3 py-2"
          >
            <option value="">{t("selectCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryName(locale, category)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("city")}>
          <select
            name="location"
            required
            className="w-full rounded-xl border border-forest/15 bg-field px-3 py-2"
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {cityName(locale, location)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("condition")}>
          <select
            name="condition"
            required
            className="w-full rounded-xl border border-forest/15 bg-field px-3 py-2"
          >
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {conditionName(locale, condition)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("auctionLength")}>
          <select
            name="durationHours"
            defaultValue="72"
            className="w-full rounded-xl border border-forest/15 bg-field px-3 py-2"
          >
            <option value="24">{t("hours24")}</option>
            <option value="48">{t("hours48")}</option>
            <option value="72">{t("days3")}</option>
            <option value="120">{t("days5")}</option>
            <option value="168">{t("days7")}</option>
          </select>
        </Field>
        <Field label={t("startingBid")}>
          <input
            type="number"
            name="startingBid"
            min="1"
            required
            className="w-full rounded-xl border border-forest/15 px-3 py-2"
          />
        </Field>
        <Field label={t("bidIncrement")}>
          <input
            type="number"
            name="bidIncrement"
            min="1"
            defaultValue="1000"
            className="w-full rounded-xl border border-forest/15 px-3 py-2"
          />
        </Field>
        <Field label={t("reserveOptional")}>
          <input
            type="number"
            name="reservePrice"
            min="1"
            className="w-full rounded-xl border border-forest/15 px-3 py-2"
          />
        </Field>
      </div>
      <div className="rounded-2xl border border-forest/10 p-4">
        <label className="flex items-start gap-3 text-sm text-heading">
          <input
            type="checkbox"
            name="scheduleEnabled"
            value="1"
            checked={schedule}
            onChange={(event) => setSchedule(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block font-medium">{t("scheduleStart")}</span>
            <span className="mt-1 block text-muted">{t("scheduleHelp")}</span>
          </span>
        </label>
        {schedule ? (
          <div className="mt-4">
            <Field label={t("opensAt")}>
              <input
                type="datetime-local"
                name="startsAt"
                required
                className="w-full rounded-xl border border-forest/15 px-3 py-2"
              />
            </Field>
          </div>
        ) : null}
      </div>
      <PhotoPicker />
      {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-on disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("publishing") : t("publishAuction")}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-heading">{label}</span>
      {children}
    </label>
  );
}

function PhotoPicker() {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function sync(nextFiles) {
    const limited = nextFiles.slice(0, MAX_LISTING_PHOTOS);
    setFiles(limited);
    setActive((current) => {
      if (!limited.length) return 0;
      return Math.min(current, limited.length - 1);
    });
    const transfer = new DataTransfer();
    limited.forEach((file) => transfer.items.add(file));
    if (inputRef.current) {
      inputRef.current.files = transfer.files;
    }
  }

  function addFiles(incoming) {
    const merged = [...files];
    for (const file of incoming) {
      if (merged.length >= MAX_LISTING_PHOTOS) break;
      const duplicate = merged.some(
        (existing) => existing.name === file.name && existing.size === file.size,
      );
      if (!duplicate) merged.push(file);
    }
    sync(merged);
  }

  const current = previews[active];
  const canAdd = files.length < MAX_LISTING_PHOTOS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-heading">
          {t("photographs")}
        </span>
        {canAdd ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-forest hover:text-gold"
          >
            {files.length ? t("addPhotos") : t("choosePhotos")}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        name="images"
        accept="image/*"
        multiple
        required
        onChange={(event) => {
          const picked = Array.from(event.target.files || []);
          event.target.value = "";
          addFiles(picked);
        }}
        className="sr-only"
      />

      {current ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block w-full overflow-hidden rounded-2xl bg-forest/10"
            aria-label={t("previewSelected")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={files[active]?.name || t("selectedPhotograph")}
              className="aspect-[4/3] w-full object-cover"
            />
          </button>
          <p className="text-xs text-muted">
            {t("photoHelp", { count: files.length, max: MAX_LISTING_PHOTOS })}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews.map((src, index) => (
              <div key={`${files[index]?.name}-${index}`} className="relative">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={`block w-full overflow-hidden rounded-xl ring-2 ${
                    index === active ? "ring-gold" : "ring-transparent"
                  }`}
                  aria-label={t("previewNamed", { name: files[index]?.name || t("photoN", { index: index + 1 }) })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-20 w-full object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => sync(files.filter((_, item) => item !== index))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-forest-deep text-xs text-on"
                  aria-label={t("removeNamed", { name: files[index]?.name || t("photoN", { index: index + 1 }) })}
                >
                  ×
                </button>
              </div>
            ))}
            {canAdd ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="grid h-20 place-items-center rounded-xl border border-dashed border-forest/25 text-xs font-medium text-forest"
              >
                {t("addPhotos")}
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-dashed border-forest/25 bg-paper px-4 text-sm text-muted"
        >
          {t("chooseOnePhoto")}
        </button>
      )}

      {open && current ? (
        <ImageLightbox
          images={previews}
          index={active}
          title={files[active]?.name || t("lotPhotograph")}
          onClose={() => setOpen(false)}
          onSelect={setActive}
        />
      ) : null}
    </div>
  );
}
