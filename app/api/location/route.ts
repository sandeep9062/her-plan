import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getDb } from "@/lib/db";

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

const pickNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
};

const pickOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const pickString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "";
}

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

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const accuracy = pickOptionalNumber(coords?.accuracy) ?? null;
    const source =
      pickString(coords?.source, "gps") === "ip" ? "ip" : "gps";
    const userAgent =
      pickString(coords?.userAgent, "") ||
      request.headers.get("user-agent") ||
      "";
    const ip = pickString(coords?.ip, "") || clientIp(request);

    await ensureSchema();
    const sql = getDb();
    await sql`
      INSERT INTO locations (id, lat, lng, accuracy, source, user_agent, ip)
      VALUES (${id}, ${lat}, ${lng}, ${accuracy}, ${source}, ${userAgent}, ${ip})
    `;

    return NextResponse.json({ ok: true, id });
  } catch (err: unknown) {
    console.error("Failed to save location:", err);
    return NextResponse.json(
      { error: "Failed to save location" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    await ensureSchema();
    const sql = getDb();
    const rows = await sql`
      SELECT id, lat, lng, accuracy, source,
             user_agent AS "userAgent", ip,
             created_at AS "createdAt"
      FROM locations
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, locations: rows });
  } catch (err: unknown) {
    console.error("Failed to read locations:", err);
    return NextResponse.json(
      { error: "Failed to read locations" },
      { status: 500 }
    );
  }
}

