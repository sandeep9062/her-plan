"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- config ---------- */
type Step = {
  e: string;
  q: string;
  key?: string;
  o?: string[];
  yesNo?: boolean;
};
type Theme = "pink" | "midnight" | "pastel";
type Mood = "idle" | "jump" | "cry" | "dance" | "shock";
type Heart = {
  id: number;
  left: number;
  size: number;
  dur: number;
  emoji: string;
};

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
const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "pink", label: "Romantic pink", color: "#e8456b" },
  { id: "midnight", label: "Dark midnight", color: "#8b9cff" },
  { id: "pastel", label: "Cute pastel", color: "#ffb3c7" },
];

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
    `&dates=${icsDate(start)}/${icsDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(a.Place)}`;
  return {
    ical,
    google,
    dateStr: start.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "short",
    }),
    timeStr: start.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function downloadIcs(ical: string) {
  const url = URL.createObjectURL(new Blob([ical], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "our-date.ics";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- page ---------- */
export default function Page() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [theme, setTheme] = useState<Theme>("pink");
  const [noCount, setNoCount] = useState(0);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [gifOk, setGifOk] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);
  const idRef = useRef(0);
  const audio = useRef<{
    ctx: AudioContext;
    master: GainNode;
    timer: number;
  } | null>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const noN = useRef(0);
  const petTimer = useRef<number | null>(null);
  const [pet, setPet] = useState<{ mood: Mood; msg: string }>({
    mood: "idle",
    msg: "Say yes, please? 🥺",
  });

  /* pet reacts, then goes back to idle */
  const react = (mood: Mood, msg: string, ms: number, back: string) => {
    if (petTimer.current) clearTimeout(petTimer.current);
    setPet({ mood, msg });
    petTimer.current = window.setTimeout(
      () => setPet({ mood: "idle", msg: back }),
      ms,
    );
  };

  const done = step >= STEPS.length;
  const current = STEPS[step];
  const plan = done ? buildPlan(answers) : null;

  /* url params: ?name=Priya&from=Rahul&theme=midnight */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setName((p.get("name") || "").trim());
    setFrom((p.get("from") || "").trim());
    const t = p.get("theme");
    if (t === "pink" || t === "midnight" || t === "pastel") setTheme(t);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /* floating hearts */
  const addHeart = (emoji?: string) => {
    const id = idRef.current++;
    const pool = ["💗", "💕", "🌸", "✨"];
    setHearts((h) => [
      ...h,
      {
        id,
        left: Math.random() * 100,
        size: 14 + Math.random() * 26,
        dur: 6 + Math.random() * 6,
        emoji: emoji ?? pool[Math.floor(Math.random() * pool.length)],
      },
    ]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 12500);
  };
  useEffect(() => {
    const t = setInterval(() => addHeart(), 1400);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (done)
      for (let k = 0; k < 30; k++) setTimeout(() => addHeart("💖"), k * 80);
  }, [done]);

  /* heart trail: follows finger / cursor, burst on tap */
  useEffect(() => {
    let lx = -100,
      ly = -100;
    const spawn = (x: number, y: number) => {
      const box = trailRef.current;
      if (!box) return;
      const s = document.createElement("span");
      s.className = "trail";
      s.textContent = TRAIL[Math.floor(Math.random() * TRAIL.length)];
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.fontSize = `${12 + Math.random() * 14}px`;
      s.addEventListener("animationend", () => s.remove());
      box.appendChild(s);
    };
    const move = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - lx, e.clientY - ly) > 26) {
        lx = e.clientX;
        ly = e.clientY;
        spawn(lx, ly);
      }
    };
    const down = (e: PointerEvent) => {
      for (let k = 0; k < 6; k++)
        spawn(
          e.clientX + (Math.random() - 0.5) * 50,
          e.clientY + (Math.random() - 0.5) * 50,
        );
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  /* background music: soft generated chimes, starts on her first tap/click */
  useEffect(() => {
    const start = () => {
      if (audio.current) return;
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      const chords = [
        [261.63, 329.63, 392],
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [196, 246.94, 293.66],
      ];
      const note = (f: number, len: number, vol: number) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          t = ctx.currentTime;
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + len);
      };
      let n = 0;
      const tick = () => {
        const c = chords[Math.floor(n / 6) % 4];
        if (n % 6 === 0) note(c[0] / 2, 2.6, 0.12);
        note(c[n % 3] * 2, 1.4, 0.08);
        n++;
      };
      tick();
      audio.current = { ctx, master, timer: window.setInterval(tick, 450) };
      setMusicOn(true);
      window.removeEventListener("click", start);
      window.removeEventListener("touchend", start);
    };
    window.addEventListener("click", start);
    window.addEventListener("touchend", start);
    return () => {
      window.removeEventListener("click", start);
      window.removeEventListener("touchend", start);
      const a = audio.current;
      if (a) {
        clearInterval(a.timer);
        a.ctx.close();
        audio.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (audio.current) audio.current.master.gain.value = muted ? 0 : 0.5;
  }, [muted, musicOn]);

  /* runaway "No" button */
  const flee = () => {
    const b = noRef.current;
    if (!b) return;
    const m = 12;
    const top = 64; // keep clear of the theme / music buttons and the notch
    setNoCount((c) => c + 1);
    noN.current++;
    const n = noN.current;
    react(
      n >= 3 ? "cry" : "shock",
      n >= 6
        ? "Why are you like this 😭"
        : n >= 3
          ? "Don't break my heart 😿"
          : "Hey! Click Yes! 🙀",
      1400,
      "Say yes, please? 🥺",
    );
    setNoPos({
      x: Math.random() * (window.innerWidth - b.offsetWidth - 2 * m) + m,
      y: Math.random() * (window.innerHeight - b.offsetHeight - top - m) + top,
    });
  };
  useEffect(() => {
    if (step !== 0) return;
    const onMove = (e: PointerEvent) => {
      const b = noRef.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      if (
        Math.hypot(
          e.clientX - (r.left + r.width / 2),
          e.clientY - (r.top + r.height / 2),
        ) < 120
      )
        flee();
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [step]);

  /* sad reactions */
  const sadEmoji = noCount >= 6 ? "😭" : noCount >= 3 ? "😢" : "🥺";
  const sadMsg =
    noCount >= 8
      ? "I'll plan everything, you just show up 🥹"
      : noCount >= 5
        ? "Please? I'll buy dessert 🍰"
        : noCount >= 3
          ? "Pretty please? 🥺"
          : name
            ? `${name}, I have a question…`
            : "I have a question…";

  const pick = (o: string) => {
    const key = current.key!;
    setAnswers((a) => ({ ...a, [key]: o }));
    if (step === STEPS.length - 1) {
      if (petTimer.current) clearTimeout(petTimer.current);
      setPet({ mood: "dance", msg: "It's a date!! 💖" });
    } else {
      react("jump", REPLIES[key] ?? "Nice!", 1400, "Pick one!");
    }
    setStep((s) => s + 1);
  };

  const whatsapp = () => {
    if (!plan) return "#";
    const txt = `Yes! It's a date 💖\n📅 ${plan.dateStr}\n⏰ ${plan.timeStr}\n📍 ${answers.Place}\n🍽️ ${answers.Food}`;
    return `https://wa.me/?text=${encodeURIComponent(txt)}`;
  };

  return (
    <main className={`stage ${done ? "" : "playing"}`}>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="heart"
          style={{
            left: `${h.left}vw`,
            fontSize: h.size,
            animationDuration: `${h.dur}s`,
          }}
        >
          {h.emoji}
        </span>
      ))}

      <div className="tools">
        {musicOn && (
          <button
            className="sw"
            aria-label={muted ? "Unmute music" : "Mute music"}
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        )}
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`sw dot ${theme === t.id ? "sel" : ""}`}
            style={{ background: t.color }}
            aria-label={t.label}
            title={t.label}
            onClick={() => setTheme(t.id)}
          />
        ))}
      </div>

      <div ref={trailRef} className="trail-box" aria-hidden="true" />
      <div className="pet" aria-live="polite">
        <span className={`pet-face ${pet.mood}`}>
          {PET_FACE[pet.mood]}
          {pet.mood === "cry" && <span className="tear">💧</span>}
        </span>
        <span className="bubble">{pet.msg}</span>
      </div>

      <div className="card">
        <div className="dots">
          {STEPS.map((_, k) => (
            <i
              key={k}
              className={k <= Math.min(step, STEPS.length - 1) ? "on" : ""}
            />
          ))}
        </div>

        {/* ---- questions ---- */}
        {!done && (
          <>
            {step === 0 && gifOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="gif"
                src="/cat.gif"
                alt="A cat pleading"
                onError={() => setGifOk(false)}
              />
            ) : (
              <span className="emoji">{step === 0 ? sadEmoji : current.e}</span>
            )}
            <h1>
              {current.q}
              {step === 0 && gifOk ? ` ${sadEmoji}` : ""}
            </h1>
            <p>{step === 0 ? sadMsg : "Pick one"}</p>

            <div className="row">
              {current.yesNo ? (
                <>
                  <button
                    className="yes"
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
                    className={`no ${noPos ? "fly" : ""}`}
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
                  <button key={o} className="opt" onClick={() => pick(o)}>
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
            <h1>It&apos;s a date! 🎉</h1>
            <p>Screenshot your ticket 📸</p>
            <div className="ticket">
              <div className="t-top">
                <small>Date night · admit two</small>
                <div className="route">
                  <span>{from || "Me"}</span>
                  <b>💖</b>
                  <span>{name || "You"}</span>
                </div>
              </div>
              <div className="t-grid">
                <div>
                  <small>Day</small>
                  <b>{plan.dateStr}</b>
                </div>
                <div>
                  <small>Time</small>
                  <b>{plan.timeStr}</b>
                </div>
                <div>
                  <small>Place</small>
                  <b>{answers.Place}</b>
                </div>
                <div>
                  <small>Food</small>
                  <b>{answers.Food}</b>
                </div>
              </div>
              <div className="perf" />
              <div className="t-bottom">
                <div className="barcode" />
                <small>No cancellations 😌</small>
              </div>
            </div>
            <div className="row actions">
              <button className="opt" onClick={() => downloadIcs(plan.ical)}>
                Add to calendar 📅
              </button>
              <a
                className="opt link"
                href={plan.google}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Calendar
              </a>
              <a
                className="send"
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
