"use client";

import {
  AlarmClock,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  MailCheck,
  MailPlus,
  MessageSquareReply,
  PauseCircle,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildDemoOutreachLeads,
  createPartnershipOutreachDraft,
  summarizeEmailConfidence,
  type OutreachLead,
} from "@/lib/outreach";

const initialBrand = "Maison Lumi";

const pipelineCards = [
  { label: "Leads found", value: "42", detail: "31 named people, 11 to verify" },
  { label: "Emails ready", value: "24", detail: "16 listed, 8 inferred" },
  { label: "Replies", value: "9", detail: "4 active opportunities" },
  { label: "Follow-ups due", value: "7", detail: "Queued for Friday" },
];

const crmColumns = [
  {
    title: "Replied",
    tone: "border-moss/25 bg-moss/5",
    items: [
      {
        name: "Elena Ross",
        company: "Aster Athletics",
        subject: "Q3 campaign casting",
        count: 3,
        summary: "Asked for a curated set of sport and lifestyle models by Monday.",
      },
      {
        name: "Priya Shah",
        company: "Northline Beauty",
        subject: "Creator event availability",
        count: 2,
        summary: "Interested in two models for an in-store launch; budget pending.",
      },
    ],
  },
  {
    title: "No reply",
    tone: "border-steel/25 bg-steel/5",
    items: [
      {
        name: "Maya Chen",
        company: "Maison Lumi",
        subject: "Model partnership opportunities",
        count: 1,
        summary: "Initial email sent 5 days ago; first follow-up not yet sent.",
      },
      {
        name: "Jordan Ellis",
        company: "Maison Lumi",
        subject: "Creator casting for next month",
        count: 1,
        summary: "Email opened once; no thread response detected.",
      },
    ],
  },
  {
    title: "Follow-up due",
    tone: "border-clay/30 bg-clay/5",
    items: [
      {
        name: "Sofia Grant",
        company: "Verde Studio",
        subject: "Checking in on July briefs",
        count: 2,
        summary: "Second touch due today; previous email had a lookbook link.",
      },
      {
        name: "Nina Patel",
        company: "Harbor Denim",
        subject: "New faces for upcoming shoots",
        count: 2,
        summary: "Follow-up should reference social-first editorial talent.",
      },
    ],
  },
];

export function OutreachWorkspace() {
  const [brand, setBrand] = useState(initialBrand);
  const [searchedBrand, setSearchedBrand] = useState(initialBrand);
  const [leads, setLeads] = useState<OutreachLead[]>(() => buildDemoOutreachLeads(initialBrand));
  const [selectedIds, setSelectedIds] = useState(() => new Set(leads.slice(0, 3).map((lead) => lead.id)));
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id ?? "");
  const [monthlyAutomation, setMonthlyAutomation] = useState(true);
  const [followUps, setFollowUps] = useState(true);
  const [activity, setActivity] = useState([
    "Gmail sync checked 18 active threads",
    "7 follow-ups placed in review queue",
    "4 replies summarized for opportunity review",
  ]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
  const selectedDraft = selectedLead ? createPartnershipOutreachDraft(selectedLead, "July") : null;
  const selectedCount = selectedIds.size;
  const readyCount = leads.filter((lead) => lead.email).length;

  const automationStatus = useMemo(() => {
    if (!monthlyAutomation) return "Paused";
    return followUps ? "Monthly research + follow-ups active" : "Monthly research active";
  }, [followUps, monthlyAutomation]);

  function researchBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBrand = brand.trim() || initialBrand;
    const nextLeads = buildDemoOutreachLeads(nextBrand);
    setSearchedBrand(nextBrand);
    setLeads(nextLeads);
    setSelectedIds(new Set(nextLeads.slice(0, 3).map((lead) => lead.id)));
    setSelectedLeadId(nextLeads[0]?.id ?? "");
    setActivity((items) => [`Research run created for ${nextBrand}`, ...items].slice(0, 5));
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function queueSelected() {
    if (!selectedCount) return;
    setLeads((current) =>
      current.map((lead) =>
        selectedIds.has(lead.id) && lead.email ? { ...lead, status: "sent", lastTouch: "Outreach sent just now" } : lead
      )
    );
    setActivity((items) => [`${selectedCount} selected emails moved to sent`, ...items].slice(0, 5));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pipelineCards.map((card) => (
            <article key={card.label} className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-ink/60">{card.detail}</p>
            </article>
          ))}
        </div>

        <section className="rounded-lg border border-ink/10 bg-white shadow-panel">
          <div className="grid gap-4 border-b border-ink/10 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <form onSubmit={researchBrand} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
              <label className="block min-w-0">
                <span className="text-sm font-semibold">Target brand</span>
                <span className="relative mt-2 block">
                  <Search className="pointer-events-none absolute left-3 top-3 text-ink/40" size={16} />
                  <input
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    className="h-11 w-full rounded-md border border-ink/15 bg-fog pl-9 pr-3 text-sm outline-none ring-moss/30 focus:ring-4"
                  />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Role focus</span>
                <select className="mt-2 h-11 w-full rounded-md border border-ink/15 bg-fog px-3 text-sm outline-none ring-moss/30 focus:ring-4">
                  <option>Social + partnerships</option>
                  <option>Influencer marketing</option>
                  <option>Brand marketing</option>
                  <option>Casting + production</option>
                </select>
              </label>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/88">
                <Sparkles size={16} />
                Research
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
              <span className="inline-flex h-9 items-center gap-2 rounded-md bg-moss/10 px-3 text-moss">
                <UserCheck size={15} />
                No general PR inboxes
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-md bg-steel/10 px-3 text-steel">
                <ShieldCheck size={15} />
                Review before send
              </span>
            </div>
          </div>

          <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{searchedBrand} leads</h2>
                  <p className="mt-1 text-sm text-ink/58">
                    {readyCount} direct emails available, {leads.length - readyCount} needs more research
                  </p>
                </div>
                <button
                  type="button"
                  onClick={queueSelected}
                  disabled={!selectedCount}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-medium text-white transition hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                  Send selected
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-ink/10">
                <div className="overflow-x-auto">
                  <div className="grid min-w-[760px] grid-cols-[44px_minmax(170px,1.2fr)_minmax(180px,1fr)_130px_100px] border-b border-ink/10 bg-fog px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink/45">
                    <span />
                    <span>Person</span>
                    <span>Evidence</span>
                    <span>Email</span>
                    <span>Fit</span>
                  </div>
                  <div className="max-h-[430px] min-w-[760px] overflow-y-auto">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`grid grid-cols-[44px_minmax(0,1fr)] items-center border-b border-ink/10 px-3 py-3 last:border-0 ${
                          selectedLead?.id === lead.id ? "bg-steel/7" : "bg-white hover:bg-fog"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSelected(lead.id)}
                          className={`flex h-6 w-6 items-center justify-center rounded border ${
                            selectedIds.has(lead.id) ? "border-moss bg-moss text-white" : "border-ink/20 bg-white"
                          }`}
                          aria-label={`${selectedIds.has(lead.id) ? "Remove" : "Select"} ${lead.name}`}
                          aria-pressed={selectedIds.has(lead.id)}
                        >
                          {selectedIds.has(lead.id) ? <CheckCircle2 size={15} /> : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="grid grid-cols-[minmax(170px,1.2fr)_minmax(180px,1fr)_130px_100px] items-center text-left"
                        >
                          <span className="min-w-0 pr-3">
                            <span className="block truncate text-sm font-semibold">{lead.name}</span>
                            <span className="mt-1 block truncate text-xs text-ink/55">{lead.title}</span>
                          </span>
                          <span className="min-w-0 pr-3 text-xs text-ink/62">
                            <span className="line-clamp-2">{lead.source}</span>
                          </span>
                          <span className="pr-3">
                            <span
                              className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs ${
                                lead.emailConfidence === "listed"
                                  ? "bg-moss/10 text-moss"
                                  : lead.emailConfidence === "inferred"
                                    ? "bg-clay/10 text-clay"
                                    : "bg-ink/8 text-ink/50"
                              }`}
                            >
                              <MailCheck size={13} />
                              <span className="truncate">{summarizeEmailConfidence(lead.emailConfidence)}</span>
                            </span>
                          </span>
                          <span className="text-sm font-semibold">{lead.fitScore}%</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-ink/10 p-4 lg:border-l lg:border-t-0">
              {selectedLead && selectedDraft ? (
                <div className="flex h-full flex-col">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold">{selectedLead.name}</h3>
                        <p className="mt-1 text-sm text-ink/58">{selectedLead.email ?? "Email not found yet"}</p>
                      </div>
                      <span className="rounded-md bg-fog px-2 py-1 text-xs font-medium text-ink/60">
                        {selectedLead.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <InfoRow icon={<ClipboardCheck size={15} />} label="Source" value={selectedLead.source} />
                      <InfoRow icon={<RefreshCw size={15} />} label="Last touch" value={selectedLead.lastTouch} />
                      <InfoRow icon={<ExternalLink size={15} />} label="Notes" value={selectedLead.notes} />
                    </div>
                  </div>

                  <div className="mt-5 flex min-h-0 max-h-80 flex-col overflow-hidden rounded-lg border border-ink/10 bg-fog p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">Draft</p>
                    <p className="mt-3 text-sm font-semibold">{selectedDraft.subject}</p>
                    <pre className="mt-3 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-2 font-sans text-sm leading-6 text-ink/72">
                      {selectedDraft.body}
                    </pre>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {crmColumns.map((column) => (
            <div key={column.title} className={`rounded-lg border ${column.tone} p-3`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <span className="rounded bg-white px-2 py-1 text-xs font-medium text-ink/55">{column.items.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {column.items.map((item) => (
                  <article key={`${item.company}-${item.name}`} className="rounded-lg border border-ink/10 bg-white p-3 shadow-panel">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="mt-1 truncate text-xs text-ink/55">{item.company}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-fog px-2 py-1 text-xs text-ink/60">
                        <MessageSquareReply size={13} />
                        {item.count}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium">{item.subject}</p>
                    <p className="mt-2 text-sm leading-5 text-ink/64">{item.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5">
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Automation</h2>
              <p className="mt-1 text-sm text-ink/58">{automationStatus}</p>
            </div>
            <button
              type="button"
              onClick={() => setMonthlyAutomation((value) => !value)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                monthlyAutomation ? "bg-moss text-white" : "bg-fog text-ink/55"
              }`}
              aria-label={monthlyAutomation ? "Pause monthly automation" : "Resume monthly automation"}
            >
              {monthlyAutomation ? <PauseCircle size={17} /> : <Play size={17} />}
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            <AutomationRow icon={<CalendarClock size={16} />} label="Next research run" value="July 1, 9:00 AM" />
            <AutomationRow icon={<AlarmClock size={16} />} label="Follow-up delay" value="5 business days" />
            <AutomationRow icon={<MailPlus size={16} />} label="Monthly send cap" value="80 reviewed emails" />
          </div>
          <button
            type="button"
            onClick={() => setFollowUps((value) => !value)}
            className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition ${
              followUps ? "border-moss/25 bg-moss/10 text-moss" : "border-ink/10 bg-fog text-ink/55"
            }`}
          >
            <RefreshCw size={16} />
            {followUps ? "Follow-ups on" : "Follow-ups off"}
          </button>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <h2 className="text-lg font-semibold">Review queue</h2>
          <div className="mt-4 flex flex-col gap-3">
            {[
              ["Verify inferred emails", "8 leads"],
              ["Approve first touches", `${selectedCount} selected`],
              ["Review follow-up copy", "7 drafts"],
              ["Confirm opt-out footer", "Enabled"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-fog px-3 py-2">
                <span className="text-sm text-ink/68">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Activity</h2>
            <ArrowRight size={17} className="text-ink/35" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {activity.map((item) => (
              <div key={item} className="flex min-w-0 gap-3 text-sm text-ink/66">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-clay" />
                <span className="min-w-0 break-words">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-ink/10 bg-white p-3">
      <span className="mt-0.5 text-steel">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-[0.1em] text-ink/42">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-ink/72">{value}</span>
      </span>
    </div>
  );
}

function AutomationRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-fog px-3 py-2">
      <span className="inline-flex min-w-0 items-center gap-2 text-sm text-ink/64">
        <span className="text-steel">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  );
}
