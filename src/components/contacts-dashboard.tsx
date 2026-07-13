"use client";

import Fuse from "fuse.js";
import {
  Activity,
  Building2,
  Check,
  ChevronRight,
  Filter,
  Home,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  Search,
  Settings,
  Telescope,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContactView, ParsedContactInput } from "@/lib/contacts";
import { LeadScout } from "@/components/lead-scout";

type ImportPreview = {
  fileName: string;
  sheetName: string;
  totalRows: number;
  skippedRows: number;
  contacts: ParsedContactInput[];
  headers: string[];
};

type GmailStatus = {
  connected: boolean;
  email: string | null;
};

type GmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
};

type AppTab = "home" | "search" | "leadGen" | "profile";

const tabItems: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "leadGen", label: "Lead Gen", icon: Telescope },
  { id: "profile", label: "Profile", icon: UserRound },
];

export function ContactsDashboard({ initialContacts }: { initialContacts: ContactView[] }) {
  const [activeView, setActiveView] = useState<AppTab>("home");
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedId, setSelectedId] = useState(initialContacts[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({ connected: false, email: null });
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [messageStatus, setMessageStatus] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(contacts, {
        threshold: 0.34,
        ignoreLocation: true,
        keys: ["name", "company", "title", "emails", "department", "notes"],
      }),
    [contacts]
  );

  const companies = useMemo(() => {
    const values = contacts.map((contact) => contact.company).filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const searched = search.trim() ? fuse.search(search).map((result) => result.item) : contacts;
    return searched.filter((contact) => company === "all" || contact.company === company);
  }, [company, contacts, fuse, search]);

  const selected = contacts.find((contact) => contact.id === selectedId) ?? filteredContacts[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((response) => response.json())
      .then(setGmailStatus)
      .catch(() => setGmailStatus({ connected: false, email: null }));
  }, []);

  useEffect(() => {
    const updateMobileTabOffset = () => {
      const visualHeight = window.visualViewport?.height ?? window.innerHeight;
      const visualOffsetTop = window.visualViewport?.offsetTop ?? 0;
      const offset = Math.max(0, window.innerHeight - visualHeight - visualOffsetTop);
      document.documentElement.style.setProperty("--mobile-tab-offset", `${offset}px`);
    };

    updateMobileTabOffset();
    window.addEventListener("resize", updateMobileTabOffset);
    window.visualViewport?.addEventListener("resize", updateMobileTabOffset);
    window.visualViewport?.addEventListener("scroll", updateMobileTabOffset);
    return () => {
      window.removeEventListener("resize", updateMobileTabOffset);
      window.visualViewport?.removeEventListener("resize", updateMobileTabOffset);
      window.visualViewport?.removeEventListener("scroll", updateMobileTabOffset);
    };
  }, [activeView]);

  async function handlePreviewUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.name) return;

    setIsUploading(true);
    setImportStatus("");
    setPreview(null);
    try {
      const response = await fetch("/api/import/preview", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not preview this file.");
      setPreview(result);
      setImportStatus(`Previewed ${result.contacts.length} contacts from ${result.sheetName}.`);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Could not preview this file.");
    } finally {
      setIsUploading(false);
      form.reset();
    }
  }

  async function handleImportPreview() {
    if (!preview) return;
    setIsUploading(true);
    setImportStatus("Importing contacts...");
    try {
      const response = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: preview.fileName,
          totalRows: preview.totalRows,
          contacts: preview.contacts,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not import contacts.");
      setContacts(result.contacts);
      setSelectedId(result.contacts[0]?.id ?? "");
      setPreview(null);
      setImportStatus(`Imported ${result.importedCount} contacts. Skipped ${result.skippedCount}.`);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Could not import contacts.");
    } finally {
      setIsUploading(false);
    }
  }

  async function loadMessages(contact: ContactView | null) {
    const email = contact?.emails[0];
    if (!email) {
      setMessages([]);
      setMessageStatus("This contact does not have an email address yet.");
      return;
    }

    setIsLoadingMessages(true);
    setMessageStatus("");
    setMessages([]);
    try {
      const response = await fetch(`/api/gmail/messages?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load Gmail messages.");
      setMessages(result.messages);
      setMessageStatus(result.messages.length ? "" : "No Gmail threads found for this email.");
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : "Could not load Gmail messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  return (
    <>
    <main className="min-h-screen px-4 pb-28 pt-4 text-ink sm:px-5 md:px-8 md:pb-8 md:pt-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-clay">New Scouting</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Joe's agent console</h1>
          </div>
          <a
            href="/api/gmail/connect"
            className="hidden h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white shadow-panel transition hover:bg-ink/88 md:inline-flex"
          >
            <Mail size={16} />
            {gmailStatus.connected ? `Gmail: ${gmailStatus.email ?? "connected"}` : "Connect Gmail"}
          </a>
        </header>

        <nav className="hidden w-fit max-w-full overflow-auto rounded-md border border-ink/10 bg-white p-1 shadow-panel md:inline-flex">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`inline-flex h-10 items-center gap-2 rounded px-4 text-sm font-medium transition ${
                  active ? "bg-ink text-white" : "text-ink/65 hover:bg-fog"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {activeView === "home" ? (
          <HomeOverview contacts={contacts} gmailStatus={gmailStatus} onOpenTab={setActiveView} />
        ) : activeView === "leadGen" ? (
          <LeadScout />
        ) : activeView === "profile" ? (
          <ProfilePanel contacts={contacts} gmailStatus={gmailStatus} />
        ) : (
        <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
              <form onSubmit={handlePreviewUpload} className="flex flex-col gap-3">
                <label className="text-sm font-semibold" htmlFor="file">
                  Import contacts
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="block w-full rounded-md border border-ink/15 bg-fog px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-moss px-4 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Preview upload
                </button>
              </form>

              {importStatus ? <p className="mt-3 text-sm text-ink/70">{importStatus}</p> : null}

              {preview ? (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{preview.contacts.length} contacts ready</p>
                      <p className="text-xs text-ink/55">{preview.fileName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleImportPreview}
                      disabled={isUploading}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-clay px-3 text-sm font-medium text-white transition hover:bg-clay/90"
                    >
                      <Check size={15} />
                      Import
                    </button>
                  </div>
                  <div className="mt-3 max-h-40 overflow-auto rounded-md border border-ink/10">
                    {preview.contacts.slice(0, 5).map((contact, index) => (
                      <div key={`${contact.name}-${index}`} className="border-b border-ink/10 px-3 py-2 last:border-0">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-ink/55">{contact.title || contact.emails[0] || "No title/email"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-ink/45" size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search contacts"
                  className="h-10 w-full rounded-md border border-ink/15 bg-fog pl-9 pr-3 text-sm outline-none ring-moss/30 focus:ring-4"
                />
              </div>
              <div className="relative mt-3">
                <Filter className="pointer-events-none absolute left-3 top-2.5 text-ink/45" size={16} />
                <select
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="h-10 w-full appearance-none rounded-md border border-ink/15 bg-fog pl-9 pr-8 text-sm outline-none ring-moss/30 focus:ring-4"
                >
                  <option value="all">All companies</option>
                  {companies.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel">
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                <p className="text-sm font-semibold">Contacts</p>
                <p className="text-xs text-ink/55">{filteredContacts.length} shown</p>
              </div>
              <div className="max-h-[52vh] overflow-auto">
                {filteredContacts.map((contact) => (
                  <button
                    type="button"
                    key={contact.id}
                    onClick={() => {
                      setSelectedId(contact.id);
                      setMessages([]);
                      setMessageStatus("");
                    }}
                    className={`flex w-full items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 text-left transition last:border-0 ${
                      selected?.id === contact.id ? "bg-fog" : "hover:bg-fog/60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{contact.name}</span>
                      <span className="block truncate text-xs text-ink/55">
                        {contact.company || contact.title || contact.emails[0] || "No company yet"}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-ink/40" />
                  </button>
                ))}
                {!filteredContacts.length ? (
                  <div className="px-4 py-8 text-center text-sm text-ink/55">No contacts match this view.</div>
                ) : null}
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-lg border border-ink/10 bg-white shadow-panel">
            {selected ? (
              <ContactDetail
                contact={selected}
                messages={messages}
                messageStatus={messageStatus}
                isLoadingMessages={isLoadingMessages}
                onLoadMessages={() => loadMessages(selected)}
                gmailConnected={gmailStatus.connected}
              />
            ) : (
              <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-ink/55">
                Import contacts to start working.
              </div>
            )}
          </section>
        </section>
        )}
      </div>
    </main>
    <nav
      className="fixed inset-x-0 z-[100] isolate border-t border-ink/10 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(20,20,17,0.08)] md:hidden"
      aria-label="Primary"
      style={{ bottom: "var(--mobile-tab-offset, 0px)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onPointerDown={() => setActiveView(item.id)}
              onClick={() => setActiveView(item.id)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition ${
                active ? "bg-ink text-white" : "text-ink/55 hover:bg-fog hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}

function HomeOverview({
  contacts,
  gmailStatus,
  onOpenTab,
}: {
  contacts: ContactView[];
  gmailStatus: GmailStatus;
  onOpenTab: (tab: AppTab) => void;
}) {
  const contactsWithEmail = contacts.filter((contact) => contact.emails.length).length;
  const companies = Array.from(
    new Set(contacts.map((contact) => contact.company).filter((company): company is string => Boolean(company)))
  ).sort((a, b) => a.localeCompare(b));
  const topCompanies = companies.slice(0, 4);
  const needsEmail = Math.max(0, contacts.length - contactsWithEmail);
  const recentActivity = [
    "Instagram post intake is ready for brand lookup",
    "Lead research returns named marketing and social contacts",
    gmailStatus.connected ? "Gmail is connected for reply checks" : "Gmail needs to be connected before reply tracking",
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink/50">New leads</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">Find brand contacts</h2>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-white">
            <Telescope size={19} />
          </span>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-ink/62">
          Start with a brand Joe wants to work with and generate a short list of marketing, social, and partnership leads.
        </p>
        <button
          type="button"
          onClick={() => onOpenTab("leadGen")}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/88"
        >
          <Telescope size={16} />
          Generate leads
        </button>
      </article>

      <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink/50">Outreach queue</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">{contactsWithEmail} reachable</h2>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-steel/10 text-steel">
            <Mail size={19} />
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink/62">
          {needsEmail > 0
            ? `${needsEmail} contacts still need emails before they can be used for outreach.`
            : "Every imported contact has at least one email ready for outreach review."}
        </p>
        <button
          type="button"
          onClick={() => onOpenTab("search")}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/10 bg-fog px-4 text-sm font-medium text-ink/72 transition hover:bg-white"
        >
          <Search size={16} />
          Search contacts
        </button>
      </article>

      <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink/50">Campaign targets</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              {companies.length ? `${companies.length} brands` : "Needs brand data"}
            </h2>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-moss/10 text-moss">
            <Building2 size={19} />
          </span>
        </div>
        <div className="mt-4 flex min-h-16 flex-wrap gap-2">
          {topCompanies.length ? (
            topCompanies.map((company) => (
              <span key={company} className="rounded-full border border-ink/10 bg-fog px-3 py-1 text-sm text-ink/68">
                {company}
              </span>
            ))
          ) : (
            <p className="text-sm leading-6 text-ink/62">
              Add brand or company names to contacts so Joe can group outreach around real campaign targets.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink/50">Agent status</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">{gmailStatus.connected ? "Ready" : "Setup needed"}</h2>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-clay/10 text-clay">
            <Activity size={19} />
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {recentActivity.map((item) => (
            <div key={item} className="flex gap-3 text-sm leading-6 text-ink/64">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              <span className="min-w-0">{item}</span>
            </div>
          ))}
        </div>
        {!gmailStatus.connected ? (
          <button
            type="button"
            onClick={() => onOpenTab("profile")}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/10 bg-fog px-4 text-sm font-medium text-ink/72 transition hover:bg-white"
          >
            <Settings size={16} />
            Finish setup
          </button>
        ) : null}
      </article>
    </section>
  );
}

function ProfilePanel({ contacts, gmailStatus }: { contacts: ContactView[]; gmailStatus: GmailStatus }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-ink text-white">
            <UserRound size={25} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-clay">Profile</p>
            <h2 className="mt-2 text-2xl font-semibold">Joe at New Scouting</h2>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              Configure the integrations and account settings that power the bot and outreach workflow.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <SettingsRow label="Contacts imported" value={String(contacts.length)} />
          <SettingsRow label="Gmail account" value={gmailStatus.connected ? gmailStatus.email ?? "Connected" : "Not connected"} />
          <SettingsRow label="Review before send" value="Enabled" />
          <SettingsRow label="Telegram intake" value="Webhook configured" />
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
          <h3 className="text-lg font-semibold">Settings</h3>
          <div className="mt-4 grid gap-2">
            <a
              href="/api/gmail/connect"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/88"
            >
              <Mail size={16} />
              {gmailStatus.connected ? "Reconnect Gmail" : "Connect Gmail"}
            </a>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/10 bg-fog px-4 text-sm font-medium text-ink/70"
            >
              <Settings size={16} />
              Notification settings
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-clay/20 bg-clay/10 px-4 text-sm font-medium text-clay"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </section>
      </aside>
    </section>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-fog p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-2 min-h-5 break-words text-sm font-semibold text-ink/80">{value}</p>
    </div>
  );
}

function ContactDetail({
  contact,
  messages,
  messageStatus,
  isLoadingMessages,
  onLoadMessages,
  gmailConnected,
}: {
  contact: ContactView;
  messages: GmailMessage[];
  messageStatus: string;
  isLoadingMessages: boolean;
  onLoadMessages: () => void;
  gmailConnected: boolean;
}) {
  return (
    <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="border-b border-ink/10 p-5 lg:border-b-0 lg:border-r">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-steel text-white">
            <UserRound size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold">{contact.name}</h2>
            <p className="mt-1 text-sm text-ink/60">{contact.title || "No title yet"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <InfoBlock icon={<Building2 size={16} />} label="Company" value={contact.company} />
          <InfoBlock icon={<Mail size={16} />} label="Email" value={contact.emails.join(", ")} />
          <InfoBlock label="Phone" value={contact.phone} />
          <InfoBlock label="Region" value={contact.region} />
          <InfoBlock label="Department" value={contact.department} />
          <InfoBlock label="Priority" value={contact.priority} />
          <InfoBlock label="Status" value={contact.status} wide />
          <InfoBlock label="Confidence" value={contact.confidence} wide />
        </div>

        <div className="mt-6 grid gap-4">
          <TextPanel title="Notes" value={contact.notes} />
          <TextPanel title="Source" value={contact.source} />
          <TextPanel title="Source URLs" value={contact.sourceUrls} />
        </div>
      </div>

      <aside className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Gmail history</p>
            <p className="mt-1 text-xs text-ink/55">
              {contact.emails[0] ? contact.emails[0] : "Add an email to search Gmail."}
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadMessages}
            disabled={isLoadingMessages || !gmailConnected}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-white transition hover:bg-ink/88 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingMessages ? <Loader2 size={15} className="animate-spin" /> : <Inbox size={15} />}
            Load
          </button>
        </div>

        {!gmailConnected ? (
          <div className="mt-4 rounded-md border border-clay/20 bg-clay/10 p-3 text-sm text-ink/70">
            Connect Gmail first, then load communication history for this contact.
          </div>
        ) : null}

        {messageStatus ? (
          <div className="mt-4 rounded-md border border-ink/10 bg-fog p-3 text-sm text-ink/65">{messageStatus}</div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-md border border-ink/10 bg-fog p-3">
              <p className="line-clamp-2 text-sm font-semibold">{message.subject}</p>
              <p className="mt-2 text-xs text-ink/55">{formatMailDate(message.date)}</p>
              <p className="mt-2 truncate text-xs text-ink/60">From: {message.from || "Unknown"}</p>
              <p className="truncate text-xs text-ink/60">To: {message.to || "Unknown"}</p>
              <p className="mt-3 text-sm leading-6 text-ink/75">{message.snippet}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  icon,
  wide,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-md border border-ink/10 bg-fog p-3 ${wide ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink/45">
        {icon}
        {label}
      </div>
      <p className="mt-2 min-h-5 break-words text-sm text-ink/80">{value || "Not set"}</p>
    </div>
  );
}

function TextPanel({ title, value }: { title: string; value: string | null }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 rounded-md border border-ink/10 bg-fog p-3 text-sm leading-6 text-ink/72">
        {value || "Not set"}
      </p>
    </section>
  );
}

function formatMailDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || "Unknown date" : date.toLocaleString();
}
