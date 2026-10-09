import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { MAX_LISTING_PHOTOS } from "./constants";

const BUCKET = "listing-images";

function supabaseConfig() {
  const url = (process.env.SQL_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SQL_SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function listingFilename(file) {
  const ext = path.extname(file.name || "") || ".jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
}

async function ensureBucket(url, key) {
  const headers = {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": "application/json",
  };
  const existing = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers });
  if (existing.ok) return;
  await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
}

async function saveToSupabase(files, { url, key }) {
  await ensureBucket(url, key);
  const saved = [];

  for (const file of files.slice(0, MAX_LISTING_PHOTOS)) {
    if (!file || typeof file === "string" || !file.size) continue;
    if (!file.type?.startsWith("image/")) continue;
    if (file.size > 5 * 1024 * 1024) continue;

    const filename = listingFilename(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await fetch(`${url}/storage/v1/object/${BUCKET}/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buffer,
    });
    if (!upload.ok) continue;
    saved.push(`${url}/storage/v1/object/public/${BUCKET}/${filename}`);
  }

  return saved;
}

async function saveToDisk(files) {
  const saved = [];
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  for (const file of files.slice(0, MAX_LISTING_PHOTOS)) {
    if (!file || typeof file === "string" || !file.size) continue;
    if (!file.type?.startsWith("image/")) continue;
    if (file.size > 5 * 1024 * 1024) continue;

    const filename = listingFilename(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    saved.push(`/uploads/${filename}`);
  }

  return saved;
}

export async function saveListingImages(files) {
  const supabase = supabaseConfig();
  if (supabase) {
    const uploaded = await saveToSupabase(files, supabase);
    if (uploaded.length) return uploaded;
  }
  return saveToDisk(files);
}
