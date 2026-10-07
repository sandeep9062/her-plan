"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { THEMES, THEME_LIST, type Theme } from "@/lib/theme";

type GifChoice = "default" | "custom";

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreatePage() {
  const [her, setHer] = useState("");
  const [me, setMe] = useState("");
  const [theme, setTheme] = useState<Theme>("pink");
  const [gifChoice, setGifChoice] = useState<GifChoice>("default");
  const [customGif, setCustomGif] = useState("");
  const [gifError, setGifError] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");

  const t = THEMES[theme];

  /* eslint-disable react-hooks/set-state-in-effect -- window is client-only; origin can't be computed during static prerender */
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onCustomGifChange = (value: string) => {
    setCustomGif(value);
    setGifError(false);
  };

  const onGifChoiceChange = (choice: GifChoice) => {
    setGifChoice(choice);
    setGifError(false);
  };

  const customTrim = customGif.trim();

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const herTrim = her.trim().slice(0, 30);
  const meTrim = me.trim().slice(0, 30);
  const customUrlValid =
    gifChoice === "default" ? true : isHttpsUrl(customTrim);
  const customEmpty = gifChoice === "custom" && customTrim === "";
  const gifInvalid =
    gifChoice === "custom" && !customEmpty && !customUrlValid;
  const herMissing = herTrim === "";
  const isLinkReady =
    Boolean(origin) &&
    !herMissing &&
    (gifChoice === "default" || (customUrlValid && !customEmpty)) &&
    !gifError &&
    !gifInvalid;

  const link = useMemo(() => {
    if (!origin) return "";
    const p = new URLSearchParams();
    if (herTrim) p.set("name", herTrim);
    if (meTrim) p.set("from", meTrim);
    p.set("theme", theme);
    if (gifChoice === "custom" && customTrim && isHttpsUrl(customTrim)) {
      p.set("gif", customTrim);
    }
    const qs = p.toString();
    return qs ? `${origin}/?${qs}` : `${origin}/`;
  }, [origin, herTrim, meTrim, theme, gifChoice, customTrim]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewSrc(link), 400);
    return () => window.clearTimeout(timer);
  }, [link]);

  const previewGifSrc = gifChoice === "default" ? "/cat.gif" : customTrim;

  const copy = async () => {
    if (!link || !isLinkReady) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        return;
      }
      throw new Error("no clipboard");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (ok) {
          setCopied(true);
          return;
        }
      } catch {
        /* fall through to prompt */
      }
      window.prompt("Copy your link:", link);
    }
  };

  const whatsappHref =
    link && isLinkReady
      ? `https://wa.me/?text=${encodeURIComponent(
          `I made something for you \u{1F48C} ${link}`
        )}`
      : undefined;

  return (
    <main
      className={`grid min-h-screen min-h-dvh place-items-center px-5 pt-[70px] pb-[120px] max-sm:items-start ${t.page}`}
    >
      <div className={`w-full max-w-[720px] rounded-[28px] px-[26px] py-[34px] shadow-[0_18px_50px_rgba(0,0,0,0.15)] max-sm:rounded-3xl max-sm:px-[18px] max-sm:py-[26px] ${t.card}`}>
        <span className="mb-2.5 block text-center text-[64px] leading-none" aria-hidden="true">
          💌
        </span>
        <h1 className="mx-1.5 my-2 text-center font-[Georgia,'Fraunces',serif] text-[clamp(26px,6vw,34px)] leading-[1.15]">
          Make your own
        </h1>
        <p className={`mb-[22px] text-center ${t.muted}`}>
          Fill this in and get a link to send to someone special.
        </p>

        <form className="grid gap-[18px]" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-2 text-left">
            <label htmlFor="her" className="text-[15px] font-extrabold">
              Her name *
            </label>
            <input
              id="her"
              name="her"
              type="text"
              required
              maxLength={30}
              autoComplete="off"
              placeholder="e.g. Priya"
              value={her}
              onChange={(e) => setHer(e.target.value)}
              aria-describedby="her-hint"
              className={`field-input ${t.input} ${t.inputBorder} ${t.ring}`}
            />
            <div className={`hint-text ${t.muted}`} id="her-hint">
              Required, max 30 characters.
            </div>
            {herMissing && (
              <div className={`error-box ${t.errorBox} ${t.errorText} ${t.errorBorder}`} role="alert">
                Please add her name to get your link.
              </div>
            )}
          </div>

          <div className="grid gap-2 text-left">
            <label htmlFor="me" className="text-[15px] font-extrabold">
              Your name
            </label>
            <input
              id="me"
              name="me"
              type="text"
              maxLength={30}
              autoComplete="off"
              placeholder="e.g. Rahul (optional)"
              value={me}
              onChange={(e) => setMe(e.target.value)}
              className={`field-input ${t.input} ${t.inputBorder} ${t.ring}`}
            />
          </div>

          <fieldset className={`m-0 grid gap-2 rounded-[18px] border-2 p-3.5 ${t.border}`}>
            <legend className="px-2 font-extrabold">Theme</legend>
            <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1" role="radiogroup" aria-label="Theme">
              {THEME_LIST.map((th) => {
                const selected = theme === th.id;
                return (
                  <label
                    key={th.id}
                    className={`choice-card ${t.card} ${selected ? `${t.ring} ring-2` : t.border}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={th.id}
                      checked={selected}
                      onChange={() => setTheme(th.id)}
                      className="choice-radio"
                    />
                    <span
                      className="h-[22px] w-[22px] flex-none rounded-full"
                      style={{ background: th.color }}
                      aria-hidden="true"
                    />
                    <span>{th.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={`m-0 grid gap-2 rounded-[18px] border-2 p-3.5 ${t.border}`}>
            <legend className="px-2 font-extrabold">Cat GIF</legend>
            <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1" role="radiogroup" aria-label="Cat GIF">
              <label
                className={`choice-pill ${gifChoice === "default" ? `${t.ring} ring-2 ${t.soft}` : `${t.border} ${t.soft}`} ${t.softText}`}
              >
                <input
                  type="radio"
                  name="gifChoice"
                  value="default"
                  checked={gifChoice === "default"}
                  onChange={() => onGifChoiceChange("default")}
                  className="choice-radio"
                />
                <span>Default cat</span>
              </label>
              <label
                className={`choice-pill ${gifChoice === "custom" ? `${t.ring} ring-2 ${t.soft}` : `${t.border} ${t.soft}`} ${t.softText}`}
              >
                <input
                  type="radio"
                  name="gifChoice"
                  value="custom"
                  checked={gifChoice === "custom"}
                  onChange={() => onGifChoiceChange("custom")}
                  className="choice-radio"
                />
                <span>Use my own GIF link</span>
              </label>
            </div>


            {gifChoice === "custom" && (
              <>
                <label htmlFor="gif-url" className="text-[15px] font-extrabold">
                  GIF / image link (https://...)
                </label>
                <input
                  id="gif-url"
                  name="gif-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://media.giphy.com/.../giphy.gif"
                  value={customGif}
                  onChange={(e) => onCustomGifChange(e.target.value)}
                  aria-describedby="gif-hint"
                  aria-invalid={gifInvalid || gifError}
                  className={`field-input ${t.input} ${t.inputBorder} ${t.ring} aria-[invalid=true]:border-red-500`}
                />
                <div className={`hint-text ${t.muted}`} id="gif-hint">
                  Right-click a GIF on GIPHY or Tenor, then “Copy image
                  address”. Direct https image links work best.
                </div>
              </>
            )}

            <div className="grid place-items-center">
              {gifChoice === "default" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-auto max-h-[160px] w-auto max-w-full rounded-[14px] object-cover"
                  src="/cat.gif"
                  alt="Default pleading cat preview"
                />
              ) : customTrim && customUrlValid && !gifError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-auto max-h-[160px] w-auto max-w-full rounded-[14px] object-cover"
                  src={previewGifSrc}
                  alt="Your GIF preview"
                  referrerPolicy="no-referrer"
                  onError={() => setGifError(true)}
                />
              ) : null}
            </div>


            <div aria-live="assertive">
              {gifChoice === "custom" && customEmpty && (
                <div className={`error-box ${t.errorBox} ${t.errorText} ${t.errorBorder}`} role="alert">
                  Add an https GIF link, or pick Default cat.
                </div>
              )}
              {gifInvalid && (
                <div className={`error-box ${t.errorBox} ${t.errorText} ${t.errorBorder}`} role="alert">
                  That link must start with https://
                </div>
              )}
              {gifError && (
                <div className={`error-box ${t.errorBox} ${t.errorText} ${t.errorBorder}`} role="alert">
                  That image could not load, so the link is disabled. Check
                  the URL or pick Default cat.
                </div>
              )}
            </div>
          </fieldset>

          <div className="grid gap-2 text-left">
            <label htmlFor="link" className="text-[15px] font-extrabold">
              Your link
            </label>
            <input
              id="link"
              name="link"
              type="text"
              readOnly
              placeholder="Add her name to get your link..."
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className={`field-input text-sm ${t.input} ${t.inputBorder} ${t.ring}`}
            />
            <div className={`hint-text ${t.muted}`}>
              {isLinkReady
                ? "Looks good! Copy it or share it below."
                : "Your link appears here once the form is valid."}
            </div>
          </div>


          <div className="flex min-h-[54px] flex-wrap justify-center gap-3">
            <button
              type="button"
              className={`btn-yes btn-focus ${isLinkReady ? `${t.accentBg} ${t.accentTextOn}` : `btn-disabled ${t.soft} ${t.softText}`}`}
              onClick={copy}
              disabled={!isLinkReady}
            >
              {copied ? "Copied ✓" : "Copy link 🔗"}
            </button>
            {whatsappHref ? (
              <a
                className={`btn-opt btn-focus ${t.soft} ${t.softText}`}
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
            ) : (
              <a
                className={`btn-opt btn-focus btn-disabled ${t.soft} ${t.softText}`}
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                Share on WhatsApp
              </a>
            )}
            {isLinkReady ? (
              <a
                className={`btn-opt btn-focus ${t.soft} ${t.softText}`}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open my link
              </a>
            ) : (
              <a
                className={`btn-opt btn-focus btn-disabled ${t.soft} ${t.softText}`}
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                Open my link
              </a>
            )}
          </div>
          <div aria-live="polite" className={`hint-text min-h-5 text-center ${t.muted}`}>
            {copied ? "Copied ✓ - now send it to her!" : ""}
          </div>
        </form>

        {previewSrc && isLinkReady ? (
          <div className="mt-1.5 text-center max-sm:hidden">
            <h2 className="my-2 text-lg font-extrabold">Live preview</h2>
            <div className="relative mx-auto w-full max-w-[300px] rounded-[36px] bg-black px-3 pt-3 pb-[18px]">
              <div className="mx-auto mb-2.5 h-[22px] w-[110px] rounded-full bg-white/85" aria-hidden="true" />
              <iframe
                title="Preview"
                src={previewSrc}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms"
                className="h-[520px] w-full rounded-3xl border-0 bg-white"
              />
            </div>
          </div>
        ) : null}

        <footer className="mt-[18px] text-center">
          <Link href="/" className={`btn-focus font-extrabold underline ${t.accent}`}>
            Preview the invite
          </Link>
        </footer>
      </div>
    </main>
  );
}

