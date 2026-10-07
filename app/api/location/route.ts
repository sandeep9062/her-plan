import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "locations.json");

export interface SavedLocation {
  id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  source: "gps" | "ip";
  userAgent?: string;
  ip?: string;
  createdAt: string;
}

async function readLocations(): Promise<SavedLocation[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedLocation[]) : [];
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: unknown }).code === "ENOENT"
    )
      return [];
    throw err;
  }
}

async function writeLocations(locations: SavedLocation[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(locations, null, 2), "utf-8");
  await fs.rename(tmp, DATA_FILE);
}

const pickNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
};

const pickOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const pickString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();

    // Accept either { lat, lng, ... } or { latitude, longitude, ... }
    const coords =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : null;
    const lat = pickNumber(coords?.lat ?? coords?.latitude, NaN);
    const lng = pickNumber(coords?.lng ?? coords?.longitude, NaN);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Missing lat/lng in request body" }, { status: 400 });
    }

    const location: SavedLocation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lat,
      lng,
      accuracy: pickOptionalNumber(coords?.accuracy),
      source: pickString(coords?.source, "gps") as SavedLocation["source"],
      userAgent: pickString(coords?.userAgent, ""),
      ip: pickString(coords?.ip, ""),
      createdAt: new Date().toISOString(),
    };

    const locations = await readLocations();
    locations.unshift(location);
    await writeLocations(locations);

    return NextResponse.json({ ok: true, id: location.id });
  } catch (err: unknown) {
    console.error("Failed to save location:", err);
    return NextResponse.json(
      { error: "Failed to save location" },
      { status: 500 }
    );
  }
}
