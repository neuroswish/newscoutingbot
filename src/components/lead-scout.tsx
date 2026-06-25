"use client";

import {
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  Loader2,
  Mail,
  Phone,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createOutreachDraft, type LeadResult } from "@/lib/leads";

export function LeadScout() {
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [leads, setLeads] = useState<LeadResult[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0] ?? null;

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setLeads([]);
    setSelectedId("");

    try {
      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, jobTitle }),
      });
      const result = (await response.json()) as { leads?: LeadResult[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not search for leads.");
      const matches = result.leads ?? [];
      setLeads(matches);
      setSelectedId(matches[0]?.id ?? "");
      setStatus(matches.length ? `${matches.length} matches found.` : "No public matches found.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not search for leads.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[310px_minmax(0,1fr)_350px]">
      <aside className="flex flex-col gap-4">
        <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <label htmlFor="lead-company" className="text-sm font-semibold">
              Company
            </label>
            <input
              id="lead-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="e.g. Maison Lumi"
              required
              className="h-10 w-full rounded-md border border-ink/15 bg-fog px-3 text-sm outline-none ring-moss/30 focus:ring-4"
            />
            <label htmlFor="lead-title" className="text-sm font-semibold">
              Job title
            </label>
            <input
              id="lead-title"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="e.g. Casting Director"
              required
              className="h-10 w-full rounded-md border border-ink/15 bg-fog px-3 text-sm outline-none ring-moss/30 focus:ring-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-medium text-white transition hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Find contacts
            </button>
          </form>
          {status ? <p className="mt-3 text-sm text-ink/65">{status}</p> : null}
        </div>

        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <p className="text-sm font-semibold">Matches</p>
            <p className="text-xs text-ink/55">{leads.length} found</p>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedId(lead.id)}
                className={`block w-full border-b border-ink/10 px-4 py-3 text-left transition last:border-0 ${
                  selected?.id === lead.id ? "bg-fog" : "hover:bg-fog/60"
                }`}
              >
                <span className="block truncate text-sm font-medium">{lead.name}</span>
                <span className="mt-1 block truncate text-xs text-ink/55">{lead.title}</span>
                <span className={`mt-2 inline-flex items-center gap-1 text-xs ${lead.emails.length ? "text-moss" : "text-ink/45"}`}>
                  <Mail size={12} />
                  {lead.emails.length ? "Email found" : "No public email"}
                </span>
              </button>
            ))}
            {!leads.length ? (
              <div className="flex min-h-36 items-center justify-center px-5 text-center text-sm text-ink/50">
                No results yet.
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0 rounded-lg border border-ink/10 bg-white shadow-panel">
        {selected ? <LeadDetail lead={selected} /> : <EmptySelection loading={loading} />}
      </div>

      <div className="min-w-0 rounded-lg border border-ink/10 bg-white shadow-panel">
        {selected ? <DraftPanel lead={selected} /> : <EmptyDraft />}
      </div>
    </section>
  );
}

function LeadDetail({ lead }: { lead: LeadResult }) {
  return (
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-steel text-white">
          <UserRound size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold">{lead.name}</h2>
          <p className="mt-1 text-sm text-ink/60">{lead.title}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <LeadInfo icon={<Building2 size={16} />} label="Company" value={lead.company} />
        <LeadInfo icon={<Mail size={16} />} label="Email" value={lead.emails.join(", ")} />
        <LeadInfo icon={<Phone size={16} />} label="Phone" value={lead.phone} />
        <LeadInfo label="LinkedIn" value={lead.linkedinUrl ? "Profile found" : null} />
      </div>

      {lead.notes ? (
        <section className="mt-6">
          <h3 className="text-sm font-semibold">Research notes</h3>
          <p className="mt-2 rounded-md border border-ink/10 bg-fog p-3 text-sm leading-6 text-ink/72">{lead.notes}</p>
        </section>
      ) : null}

      <section className="mt-6">
        <h3 className="text-sm font-semibold">Public sources</h3>
        <div className="mt-2 flex flex-col gap-2">
          {lead.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-start justify-between gap-2 rounded-md border border-ink/10 bg-fog p-3 text-sm text-steel transition hover:border-steel/35"
            >
              <span className="line-clamp-2">{source.title}</span>
              <ArrowUpRight size={15} className="mt-0.5 shrink-0" />
            </a>
          ))}
          {!lead.sources.length ? <p className="rounded-md bg-fog p-3 text-sm text-ink/55">No source links returned.</p> : null}
        </div>
      </section>
    </div>
  );
}

function DraftPanel({ lead }: { lead: LeadResult }) {
  const generated = createOutreachDraft(lead);
  const [subject, setSubject] = useState(generated.subject);
  const [body, setBody] = useState(generated.body);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const nextDraft = createOutreachDraft(lead);
    setSubject(nextDraft.subject);
    setBody(nextDraft.body);
    setCopied(false);
  }, [lead]);

  async function copyDraft() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
  }

  const recipient = lead.emails[0] ?? "";
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <aside className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Outreach draft</h2>
        <button
          type="button"
          onClick={copyDraft}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-ink/15 bg-fog px-3 text-sm font-medium text-ink/75 transition hover:bg-white"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <label className="mt-5 block text-xs font-medium uppercase tracking-[0.12em] text-ink/45" htmlFor="draft-subject">
        Subject
      </label>
      <input
        id="draft-subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-ink/15 bg-fog px-3 text-sm outline-none ring-moss/30 focus:ring-4"
      />
      <label className="mt-4 block text-xs font-medium uppercase tracking-[0.12em] text-ink/45" htmlFor="draft-body">
        Message
      </label>
      <textarea
        id="draft-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="mt-2 min-h-[360px] w-full resize-y rounded-md border border-ink/15 bg-fog p-3 text-sm leading-6 outline-none ring-moss/30 focus:ring-4"
      />

      <a
        href={mailto}
        className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-white transition ${
          recipient ? "bg-moss hover:bg-moss/90" : "pointer-events-none bg-ink/25"
        }`}
        aria-disabled={!recipient}
      >
        <Send size={16} />
        Open email draft
      </a>
    </aside>
  );
}

function LeadInfo({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink/10 bg-fog p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
        {icon}
        {label}
      </div>
      <p className="mt-2 min-h-5 break-words text-sm text-ink/80">{value || "Not found"}</p>
    </div>
  );
}

function EmptySelection({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[580px] items-center justify-center p-8 text-center text-sm text-ink/50">
      {loading ? "Searching public sources..." : "Select a match to view details."}
    </div>
  );
}

function EmptyDraft() {
  return (
    <div className="flex min-h-[580px] items-center justify-center p-8 text-center text-sm text-ink/50">
      Select a match to draft outreach.
    </div>
  );
}
