"use client";

import {
  AtSign,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Instagram,
  MessageCircle,
  MessageSquareText,
  PhoneForwarded,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { useMemo, useState } from "react";
import { analyzeSharedPost, type BotPlatform } from "@/lib/bot-intake";
import { summarizeEmailConfidence } from "@/lib/outreach";

const sampleUrl = "https://www.instagram.com/p/example/";
const sampleCaption =
  "Shared post: @asterathletics just teased a summer running campaign with creators in NYC. Looks like a fit for our commercial models.";

export function BotIntakeWorkspace() {
  const [platform, setPlatform] = useState<BotPlatform>("telegram");
  const [postUrl, setPostUrl] = useState(sampleUrl);
  const [caption, setCaption] = useState(sampleCaption);
  const [submitted, setSubmitted] = useState({ platform, postUrl, caption });

  const result = useMemo(() => analyzeSharedPost(submitted), [submitted]);
  const topLead = result.leads[0];

  function processShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted({ platform, postUrl, caption });
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)_360px]">
      <aside className="flex min-w-0 flex-col gap-5">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Bot intake</h2>
              <p className="text-sm text-ink/58">Share a post, get an outreach workflow.</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-md border border-ink/10 bg-fog p-1">
            <button
              type="button"
              onClick={() => setPlatform("telegram")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded text-sm font-medium ${
                platform === "telegram" ? "bg-white text-ink shadow-panel" : "text-ink/58"
              }`}
            >
              <Send size={15} />
              Telegram
            </button>
            <button
              type="button"
              onClick={() => setPlatform("whatsapp")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded text-sm font-medium ${
                platform === "whatsapp" ? "bg-white text-ink shadow-panel" : "text-ink/58"
              }`}
            >
              <MessageCircle size={15} />
              WhatsApp
            </button>
          </div>

          <form onSubmit={processShare} className="mt-5 flex flex-col gap-4">
            <label className="block">
              <span className="text-sm font-semibold">Instagram post URL</span>
              <span className="relative mt-2 block">
                <Instagram className="pointer-events-none absolute left-3 top-3 text-ink/40" size={16} />
                <input
                  value={postUrl}
                  onChange={(event) => setPostUrl(event.target.value)}
                  className="h-11 w-full rounded-md border border-ink/15 bg-fog pl-9 pr-3 text-sm outline-none ring-moss/30 focus:ring-4"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Shared caption or message</span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="mt-2 min-h-36 w-full resize-y rounded-md border border-ink/15 bg-fog p-3 text-sm leading-6 outline-none ring-moss/30 focus:ring-4"
              />
            </label>

            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-medium text-white transition hover:bg-clay/90">
              <Sparkles size={16} />
              Process shared post
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquareText size={17} />
            Bot reply
          </div>
          <div className="mt-4 rounded-lg border border-ink/10 bg-fog p-3 text-sm leading-6 text-ink/72">
            {result.replyText}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-clay">Detected brand</p>
              <h2 className="mt-2 text-3xl font-semibold">{result.brand}</h2>
              <p className="mt-1 text-sm text-ink/58">{result.confidence}% confidence from post metadata and message text</p>
            </div>
            <span className="inline-flex h-10 items-center gap-2 rounded-md bg-moss/10 px-3 text-sm font-medium text-moss">
              <ShieldCheck size={16} />
              Human approval before send
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.signals.map((signal) => (
              <div key={`${signal.label}-${signal.value}`} className="rounded-md border border-ink/10 bg-fog p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink/45">{signal.label}</p>
                  <span className="rounded bg-white px-2 py-1 text-xs text-ink/55">{signal.confidence}</span>
                </div>
                <p className="mt-2 break-words text-sm text-ink/76">{signal.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
            <h2 className="text-sm font-semibold">Automation path</h2>
            <div className="mt-4 flex flex-col gap-3">
              {result.steps.map((step) => (
                <div key={step.label} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      step.status === "done"
                        ? "bg-moss text-white"
                        : step.status === "review"
                          ? "bg-clay/15 text-clay"
                          : "bg-steel/15 text-steel"
                    }`}
                  >
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="text-sm leading-5 text-ink/70">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Lead search result</h2>
              <span className="text-xs text-ink/50">{result.leads.length} contacts</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-md border border-ink/10">
              {result.leads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="grid gap-3 border-b border-ink/10 p-3 last:border-0 md:grid-cols-[minmax(0,1fr)_150px]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{lead.name}</p>
                    <p className="mt-1 truncate text-xs text-ink/55">{lead.title}</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-fog px-2 py-1 text-xs text-ink/62 md:justify-self-end">
                    <AtSign size={13} />
                    {summarizeEmailConfidence(lead.emailConfidence)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-center gap-2">
            <UserRoundSearch size={18} />
            <h2 className="text-lg font-semibold">Recommended contact</h2>
          </div>
          {topLead ? (
            <div className="mt-4">
              <p className="text-xl font-semibold">{topLead.name}</p>
              <p className="mt-1 text-sm text-ink/58">{topLead.title}</p>
              <div className="mt-4 grid gap-3">
                <InfoLine icon={<AtSign size={15} />} label="Email" value={topLead.email ?? "Needs more research"} />
                <InfoLine icon={<ClipboardCheck size={15} />} label="Source" value={topLead.source} />
                <InfoLine icon={<Search size={15} />} label="Fit score" value={`${topLead.fitScore}%`} />
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Outreach draft</h2>
            <span className="rounded-md bg-clay/10 px-2 py-1 text-xs text-clay">Review</span>
          </div>
          <div className="mt-4 max-h-80 overflow-hidden rounded-lg border border-ink/10 bg-fog p-3">
            <p className="text-sm font-semibold">{result.draftSubject}</p>
            <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap pr-2 font-sans text-sm leading-6 text-ink/70">
              {result.draftPreview}
            </pre>
          </div>
          <button className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/88">
            <PhoneForwarded size={16} />
            Queue for CRM review
          </button>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-center gap-2">
            <ExternalLink size={17} />
            <h2 className="text-lg font-semibold">Production bridge</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/66">
            Real bot webhooks can write the shared post, detected brand, candidate leads, approval status, and thread id into Supabase.
          </p>
        </section>
      </aside>
    </section>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-ink/10 bg-fog p-3">
      <span className="mt-0.5 text-steel">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-[0.1em] text-ink/42">{label}</span>
        <span className="mt-1 block break-words text-sm text-ink/72">{value}</span>
      </span>
    </div>
  );
}
