"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, THEME_LIST, isTheme, type Theme } from "@/lib/theme";

/* ---------- config ---------- */
type Step = {
  e: string;
  q: string;
  key?: string;
  o?: string[];
  yesNo?: boolean;
};
type Mood = "idle" | "jump" | "cry" | "dance" | "shock";
type Heart = {
  id: number;
  left: number;
  size: number;
  dur: number;
  emoji: string;
};
type TrailBit = { id: number; emoji: string; left: number };

const STEPS: Step[] = [
  { e: "🥺", q: "Will you go on a date with me?", yesNo: true },
  {
    e: "📅",
    q: "Which day works for you?",
    key: "Day",
    o: ["Friday", "Saturday", "Sunday", "Any day with you"],
  },
  {
    e: "⏰",
    q: "What time?",
    key: "Time",
    o: ["Afternoon", "Sunset", "Evening", "Late night"],
  },
  {
    e: "📍",
    q: "Where should we go?",
    key: "Place",
    o: [
      "Cozy cafe ☕",
      "Beach or park 🌅",
      "Movie theatre 🎬",
      "Rooftop dinner 🌃",
    ],
  },
  {
    e: "🍽️",
    q: "What shall we eat?",
    key: "Food",
    o: ["Pizza 🍕", "Sushi 🍣", "Street food 🌮", "Dessert only 🍰"],
  },
];
const PET_FACE: Record<Mood, string> = {
  idle: "😺",
  jump: "😸",
  cry: "😿",
  dance: "😻",
  shock: "🙀",
};
const REPLIES: Record<string, string> = {
  Day: "Great pick! 📅",
  Time: "I'll be early ⏰",
  Place: "Ooh, fancy! ✨",
  Food: "I'm hungry already 🤤",
};
const TRAIL = ["💗", "💖", "✨", "🌸"];
const DAYS: Record<string, number> = {
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
  "Any day with you": 6,
};
const HOURS: Record<string, number> = {
  Afternoon: 16,
  Sunset: 18,
  Evening: 19.5,
  "Late night": 22,
};
const NO_LINES = [
  "No",
  "Are you sure?",
  "Think again 🥺",
  "Nope, not allowed",
  "Too slow 😜",
  "Just say yes!",
];
/* Module-scope random helpers: react-hooks/purity forbids Math.random
   inside component scope, so randomness lives in plain functions. */
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickTrail = () => TRAIL[Math.floor(Math.random() * TRAIL.length)];
const randomHeart = (n: number): Heart => ({
  id: n,
  left: Math.random() * 96,
  size: 14 + Math.random() * 18,
  dur: 6 + Math.random() * 5,
  emoji: TRAIL[n % TRAIL.length],
});
const PET_ANIM: Record<Mood, string> = {
  idle: "pet-idle",
  jump: "pet-jump",
  cry: "pet-cry",
  dance: "pet-dance",
  shock: "pet-jump",
};
const makeTrail = (emojis: string[]): TrailBit[] =>
  emojis.map((emoji, i) => ({
    id: Date.now() + i + Math.random(),
    emoji,
    left: 8 + Math.random() * 40,
  }));

/* ---------- date + calendar helpers ---------- */
function planDate(day: string, time: string) {
  const d = new Date();
  d.setDate(d.getDate() + (((DAYS[day] ?? 6) - d.getDay() + 7) % 7 || 7)); // next such weekday
  const h = HOURS[time] ?? 19;
  d.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
  return d;
}
const p2 = (n: number) => String(n).padStart(2, "0");
const icsDate = (d: Date) =>
  `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`;

function buildPlan(a: Record<string, string>) {
  const start = planDate(a.Day, a.Time);
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  const title = "Our date 💖";
  const details = `${a.Place} · ${a.Food}`;
  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//date-invite//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@date-invite`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${a.Place}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const google =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(a.Place)}` +
    `&dates=${icsDate(start)}/${icsDate(end)}`;
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const timeStr = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return { dateStr, timeStr, ical, google };
}
const downloadIcs = (ical: string) => {
  const blob = new Blob([ical.replace(/\\r\\n/g, "\r\n")], {
    type: "text/calendar",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "our-date.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};

/* ---------- page ---------- */
export default function Page() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [theme, setTheme] = useState<Theme>("pink");
  const [mood, setMood] = useState<Mood>("idle");
  const [bubble, setBubble] = useState("");
  const [trail, setTrail] = useState<TrailBit[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [noCount, setNoCount] = useState(0);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [gifOk, setGifOk] = useState(true);
  const [gifSrc, setGifSrc] = useState("/cat.gif");
  const [musicOn, setMusicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);

  const t = THEMES[theme];

  /* url params: ?name=Priya&from=Rahul&theme=midnight&gif=https://... */
  /* Mount-only sync from window.location (no useSearchParams, so no Suspense needed). */
  /* eslint-disable react-hooks/set-state-in-effect -- intentional one-time param hydration on mount */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setName((p.get("name") || "").trim().slice(0, 30));
    setFrom((p.get("from") || "").trim().slice(0, 30));
    const tParam = p.get("theme");
    if (isTheme(tParam)) setTheme(tParam);
    const g = p.get("gif");
    if (g) {
      try {
        const u = new URL(g);
        if (u.protocol === "https:") setGifSrc(g);
      } catch {
        /* ignore bad gif param — keep default cat */
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* intro hearts (ambient) */
  useEffect(() => {
    let alive = true;
    let n = 0;
    const id = setInterval(() => {
      if (!alive) return;
      const h = randomHeart(n++);
      setHearts((hs) => [...hs.slice(-14), h]);
      setTimeout(() => setHearts((hs) => hs.filter((x) => x.id !== h.id)), 200);
    }, 900);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* music */
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audio.current = new Audio("/music.mp3");
    audio.current.loop = true;
    return () => audio.current?.pause();
  }, []);
  const toggleMusic = async () => {
    if (!audio.current) return;
    audio.current.muted = muted;
    if (musicOn) {
      audio.current.pause();
      setMusicOn(false);
    } else {
      try {
        await audio.current.play();
        setMusicOn(true);
      } catch {
        /* autoplay policy */
      }
    }
  };
  useEffect(() => {
    if (audio.current) audio.current.muted = muted;
  }, [muted]);

  /* runaway No */
  const flee = () => {
    setNoCount((c) => c + 1);
    react("cry", "Heyy 🥺", 1200, "", true);
    const b = noRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const pad = 12;
    let x = r.left + rand(-130, 130);
    // eslint-disable-next-line react-hooks/purity -- event handler, not render
    let y = r.top + (Math.random() < 0.5 ? -1 : 1) * rand(90, 210);
    x = Math.min(Math.max(pad, x), window.innerWidth - r.width - pad);
    y = Math.min(Math.max(pad, y), window.innerHeight - r.height - pad);
    setNoPos({ x, y });
  };
  useEffect(() => {
    if (step !== 0) return;
    const onMove = (e: PointerEvent) => {
      const b = noRef.current;
      if (!b || noPos) return;
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < 110) flee();
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flee is stable-by-ref for this listener; re-subscribing on every noCount change would alter No-button behavior
  }, [step]);

  /* reactions */
  const timers = useRef<number[]>([]);
  const react = (
    m: Mood,
    line: string,
    ms = 1400,
    thenSay = "",
    cry = false,
  ) => {
    setMood(m);
    setBubble(line);
    timers.current.forEach(clearTimeout);
    if (ms > 0)
      timers.current = [
        window.setTimeout(() => {
          setMood("idle");
          setBubble(thenSay);
        }, ms),
      ];
    if (cry) setMood("cry");
  };
  const pick = (o: string) => {
    const k = STEPS[step].key!;
    const a = { ...answers, [k]: o };
    setAnswers(a);
    react("jump", REPLIES[k] ?? "Cute!", 1100, "", false);
    const burst = Array.from(
      { length: 12 },
      (_, i) => TRAIL[(i + step) % TRAIL.length],
    );
    setTrail((tr) => [...tr, ...makeTrail(burst)]);
    setTimeout(
      () => setTrail((tr) => tr.filter((x) => Date.now() - x.id < 800)),
      900,
    );
    setTimeout(() => {
      if (step + 1 < STEPS.length) {
        setStep(step + 1);
        react("idle", "", 0);
      } else setStep(99);
      setNoPos(null);
    }, 950);
  };

  const spawnPetTrail = () => {
    const n = 3 + Math.floor(Math.random() * 3);
    const burst = Array.from({ length: n }, () => pickTrail());
    setTrail((tr) => [...tr.slice(-40), ...makeTrail(burst)]);
    setTimeout(
      () => setTrail((tr) => tr.filter((x) => Date.now() - x.id < 800)),
      950,
    );
  };

  const current: Step | null =
    step >= 0 && step < STEPS.length ? STEPS[step] : null;
  const done = step === 99;
  const plan = done ? buildPlan(answers) : null;
  const whatsapp = () => {
    const msg = `She said YES!! 💖\n${plan?.dateStr} at ${plan?.timeStr}\n${answers.Place}\n${answers.Food}${from ? `\n— ${from}` : ""}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <main
      className={`relative grid min-h-screen min-h-dvh place-items-center overflow-x-hidden px-5 pt-[70px] pb-[120px] ${t.page}`}
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className="heart-float"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animationDuration: `${h.dur}s`,
          }}
        >
          {h.emoji}
        </span>
      ))}

      {/* ---- floating tool buttons ---- */}
      <div className="fixed top-[calc(env(safe-area-inset-top,0px)+14px)] right-3.5 z-20 flex gap-2.5">
        <button
          className={`sw-btn btn-focus ${t.card} ${t.border}`}
          onClick={() => setMuted((m) => !m)}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🚫" : "🔊"}
        </button>
        {THEME_LIST.map((th) => (
          <button
            key={th.id}
            title={th.label}
            onClick={() => setTheme(th.id)}
            className={`sw-btn sw-dot-btn btn-focus ${theme === th.id ? "outline-3 outline-offset-2" : ""}`}
            style={{ background: th.color }}
          />
        ))}
      </div>

      {/* ---- pet (mouth trail spawner) ---- */}
      <div
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+20px)] left-5 z-10 cursor-pointer text-center select-none"
        onPointerMove={spawnPetTrail}
      >
        <div className="relative text-[56px]">
          <span
            className={`pet-face-anim ${PET_ANIM[mood]}`}
            style={mood === "dance" ? { display: "inline-block" } : undefined}
          >
            {PET_FACE[mood]}
          </span>
          {mood === "cry" && (
            <>
              <span className="tear-drop">💧</span>
              <span
                className="tear-drop"
                style={{ left: 34, animationDelay: ".35s" }}
              >
                💧
              </span>
            </>
          )}
          {trail.map((s) => (
            <span
              key={s.id}
              className="trail-dot text-[18px]"
              style={{
                left: `${s.left}px`,
                top: "-6px",
              }}
            >
              {s.emoji}
            </span>
          ))}
        </div>
        <div
          className={`mx-auto -mt-2 w-fit rounded-full px-3 py-1 text-[13px] font-bold ${t.soft} ${t.softText}`}
        >
          {bubble || "pet me!"}
        </div>
      </div>
      <button
        onClick={toggleMusic}
        className={`btn-base btn-focus fixed bottom-[calc(env(safe-area-inset-bottom,0px)+22px)] right-5 z-10 flex-[0_0_auto] px-5 py-2.5 text-[15px] ${t.soft} ${t.softText}`}
      >
        {musicOn ? "⏸ music" : "▶ music"}
      </button>

      {/* ---- main card ---- */}
      <div className={`invite-card ${t.card}`}>
        {current && (
          <>
            {/* progress */}
            <div className="mb-[18px] flex justify-center gap-1.5">
              {STEPS.map((s, i) => (
                <i
                  key={i}
                  className={`h-[9px] w-[9px] rounded-full ${i <= step ? t.accentBg : t.soft}`}
                />
              ))}
            </div>

            {step === 0 && gifOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="mb-2.5 h-[min(140px,22vh)] w-auto max-w-full rounded-[18px] object-cover max-lg:h-20"
                src={gifSrc}
                alt="A cat pleading"
                onError={() => setGifOk(false)}
              />
            ) : (
              <span
                className="mb-2.5 block text-[64px] leading-none max-sm:text-[40px]"
                aria-hidden="true"
              >
                {current.e}
              </span>
            )}

            <h1 className="mx-1.5 my-2 font-[Georgia,'Fraunces',serif] text-[clamp(26px,6vw,34px)] leading-[1.15]">
              {name && step === 0 ? (
                <>
                  {name}, {current.q}
                </>
              ) : (
                current.q
              )}
            </h1>
            <p className={`mb-[22px] ${t.muted}`}>
              {name && from && step === 0
                ? `— from ${from}`
                : "Choose wisely 😌"}
            </p>

            <div className="flex min-h-[54px] flex-wrap justify-center gap-3">
              {current.yesNo ? (
                <>
                  <button
                    className={`btn-yes btn-focus ${t.accentBg} ${t.accentTextOn}`}
                    style={{ fontSize: 17 + Math.min(noCount * 2, 22) }}
                    onClick={() => {
                      setStep(1);
                      react("dance", "YAY!! 🎉", 1600, "Pick one!");
                    }}
                  >
                    Yes 💖
                  </button>
                  <button
                    ref={noRef}
                    className={`btn-no btn-focus ${t.soft} ${t.softText} ${noPos ? "btn-no-fly" : ""}`}
                    style={noPos ? { left: noPos.x, top: noPos.y } : undefined}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      flee();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        flee();
                      }
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {NO_LINES[noCount % NO_LINES.length]}
                  </button>
                </>
              ) : (
                current.o!.map((o) => (
                  <button
                    key={o}
                    className={`btn-opt btn-focus ${t.soft} ${t.softText}`}
                    onClick={() => pick(o)}
                  >
                    {o}
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* ---- ticket ---- */}
        {done && plan && (
          <>
            <h1 className="mx-1.5 my-2 font-[Georgia,'Fraunces',serif] text-[clamp(26px,6vw,34px)] leading-[1.15]">
              It&apos;s a date! 🎉
            </h1>
            <p className={`mb-[22px] ${t.muted}`}>Screenshot your ticket 📸</p>
            <div
              className={`relative mb-[18px] overflow-hidden rounded-[20px] text-left ${t.accentBg} ${t.accentTextOn}`}
            >
              <div className="px-5 pt-[18px] pb-3">
                <small className="block text-xs font-bold opacity-75">
                  Date night · admit two
                </small>
                <div className="mt-1.5 flex items-center justify-between font-[Georgia,serif] text-[26px] font-bold">
                  <span>{from || "Me"}</span>
                  <b>💖</b>
                  <span>{name || "You"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 px-5 pb-3">
                <div>
                  <small className="block text-xs font-bold opacity-75">
                    Day
                  </small>
                  <b>{plan.dateStr}</b>
                </div>
                <div>
                  <small className="block text-xs font-bold opacity-75">
                    Time
                  </small>
                  <b>{plan.timeStr}</b>
                </div>
                <div>
                  <small className="block text-xs font-bold opacity-75">
                    Place
                  </small>
                  <b>{answers.Place}</b>
                </div>
                <div>
                  <small className="block text-xs font-bold opacity-75">
                    Food
                  </small>
                  <b>{answers.Food}</b>
                </div>
              </div>
              <div
                className="mx-[-10px] h-6 opacity-90"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 10px -3px, transparent 12px, rgba(255,255,255,.9) 13px)",
                  backgroundSize: "20px 20px",
                }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-3 px-5 pb-4">
                <div
                  className="barcode-lines"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,.9) 0 3px, transparent 3px 8px)",
                  }}
                  aria-hidden="true"
                />
                <small className="text-xs font-bold opacity-75">
                  No cancellations 😌
                </small>
              </div>
            </div>
            <div className="flex min-h-[54px] flex-wrap justify-center gap-3">
              <button
                className={`btn-opt btn-focus ${t.soft} ${t.softText}`}
                onClick={() => downloadIcs(plan.ical)}
              >
                Add to calendar 📅
              </button>
              <a
                className={`btn-opt btn-focus ${t.soft} ${t.softText}`}
                href={plan.google}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Calendar
              </a>
              <a
                className={`btn-yes btn-focus ${t.accentBg} ${t.accentTextOn}`}
                href={whatsapp()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Send my answers 💌
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
