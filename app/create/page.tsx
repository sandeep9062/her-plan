"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Theme = "pink" | "midnight" | "pastel";
type GifChoice = "default" | "custom";

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "pink", label: "Romantic pink", color: "#e8456b" },
  { id: "midnight", label: "Dark midnight", color: "#8b9cff" },
  { id: "pastel", label: "Cute pastel", color: "#ffb3c7" },
];

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

  /* eslint-disable react-hooks/set-state-in-effect -- window is client-only; origin can't be computed during static prerender */
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
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
    const t = window.setTimeout(() => setPreviewSrc(link), 400);
    return () => window.clearTimeout(t);
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
    <main className="stage create-stage">
      <div className="card create-card">
        <span className="emoji" aria-hidden="true">
          💌
        </span>
        <h1>Make your own</h1>
        <p>Fill this in and get a link to send to someone special.</p>

        <form className="create-form" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="her">Her name *</label>
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
            />
            <div className="hint" id="her-hint">
              Required, max 30 characters.
            </div>
            {herMissing && (
              <div className="error" role="alert">
                Please add her name to get your link.
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="me">Your name</label>
            <input
              id="me"
              name="me"
              type="text"
              maxLength={30}
              autoComplete="off"
              placeholder="e.g. Rahul (optional)"
              value={me}
              onChange={(e) => setMe(e.target.value)}
            />
          </div>

          <fieldset className="field">
            <legend>Theme</legend>
            <div className="theme-cards" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => {
                const selected = theme === t.id;
                return (
                  <label
                    key={t.id}
                    className={`theme-card${selected ? " picked" : ""}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={t.id}
                      checked={selected}
                      onChange={() => setTheme(t.id)}
                    />
                    <span
                      className="sw-dot"
                      style={{ background: t.color }}
                      aria-hidden="true"
                    />
                    <span>{t.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend>Cat GIF</legend>
            <div className="gif-choices" role="radiogroup" aria-label="Cat GIF">
              <label
                className={`gif-choice${gifChoice === "default" ? " picked" : ""}`}
              >
                <input
                  type="radio"
                  name="gifChoice"
                  value="default"
                  checked={gifChoice === "default"}
                  onChange={() => onGifChoiceChange("default")}
                />
                <span>Default cat</span>
              </label>
              <label
                className={`gif-choice${gifChoice === "custom" ? " picked" : ""}`}
              >
                <input
                  type="radio"
                  name="gifChoice"
                  value="custom"
                  checked={gifChoice === "custom"}
                  onChange={() => onGifChoiceChange("custom")}
                />
                <span>Use my own GIF link</span>
              </label>
            </div>

            {gifChoice === "custom" && (
              <>
                <label htmlFor="gif-url" className="sub-label">
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
                />
                <div className="hint" id="gif-hint">
                  Right-click a GIF on GIPHY or Tenor, then “Copy image
                  address”. Direct https image links work best.
                </div>
              </>
            )}

            <div className="gif-preview-box">
              {gifChoice === "default" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="gif-prev"
                  src="/cat.gif"
                  alt="Default pleading cat preview"
                />
              ) : customTrim && customUrlValid && !gifError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="gif-prev"
                  src={previewGifSrc}
                  alt="Your GIF preview"
                  referrerPolicy="no-referrer"
                  onError={() => setGifError(true)}
                />
              ) : null}
            </div>

            <div aria-live="assertive">
              {gifChoice === "custom" && customEmpty && (
                <div className="error" role="alert">
                  Add an https GIF link, or pick Default cat.
                </div>
              )}
              {gifInvalid && (
                <div className="error" role="alert">
                  That link must start with https://
                </div>
              )}
              {gifError && (
                <div className="error" role="alert">
                  That image could not load, so the link is disabled. Check
                  the URL or pick Default cat.
                </div>
              )}
            </div>
          </fieldset>

          <div className="field out">
            <label htmlFor="link">Your link</label>
            <input
              id="link"
              name="link"
              type="text"
              readOnly
              placeholder="Add her name to get your link..."
              value={link}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="hint">
              {isLinkReady
                ? "Looks good! Copy it or share it below."
                : "Your link appears here once the form is valid."}
            </div>
          </div>

          <div className="row actions">
            <button
              type="button"
              className="yes"
              onClick={copy}
              disabled={!isLinkReady}
            >
              {copied ? "Copied \u2713" : "Copy link \u{1F517}"}
            </button>
            {whatsappHref ? (
              <a
                className="opt link"
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
            ) : (
              <a
                className="opt link is-disabled"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                Share on WhatsApp
              </a>
            )}
            {isLinkReady ? (
              <a
                className="opt link"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open my link
              </a>
            ) : (
              <a
                className="opt link is-disabled"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                Open my link
              </a>
            )}
          </div>
          <div aria-live="polite" className="hint live-status">
            {copied ? "Copied \u2713 - now send it to her!" : ""}
          </div>
        </form>

        {previewSrc && isLinkReady ? (
          <div className="preview-wrap">
            <h2 className="preview-title">Live preview</h2>
            <div className="phone">
              <div className="phone-notch" aria-hidden="true" />
              <iframe
                title="Preview"
                src={previewSrc}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        ) : null}

        <footer className="create-footer">
          <Link href="/">Preview the invite</Link>
        </footer>
      </div>
    </main>
  );
}

