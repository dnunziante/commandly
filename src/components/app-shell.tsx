"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, ArrowRightLeft, BarChart3, BookOpen, BookOpenCheck, Bot, Boxes, BriefcaseBusiness, CalendarClock, CalendarDays, ChevronDown, ClipboardCheck, Crown, GitCompareArrows, GraduationCap, LayoutDashboard, Lightbulb, Mail, Menu, MessageSquareQuote, MessagesSquare, Search, Settings, ShieldAlert, ShieldCheck, Sparkles, Target, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { logout } from "@/app/auth/actions";
import type { Viewer } from "@/lib/auth/viewer";

const links = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Ask the Assistant", "/assistant", Bot],
  ["Products", "/products", Boxes],
  ["Comparisons", "/comparisons", GitCompareArrows],
  ["Write an Email", "/email", Mail],
  ["Write a Text", "/text", MessagesSquare],
  ["Role Play", "/role-play", Sparkles],
  ["Training", "/training", GraduationCap],
  ["Knowledge Base", "/knowledge-base", BookOpen],
  ["Analytics", "/analytics", BarChart3],
  ["Admin", "/admin", ShieldCheck],
] as const;

const plannedModules = [
  { label: "Executive Advisor", Icon: Crown, features: ["Performance summaries", "Location comparisons", "Forecasting", "Strategic recommendations"] },
] as const;

const operationsLinks = [
  ["Operations Dashboard", "/operations", LayoutDashboard],
  ["Today’s Checklists", "/operations/checklists", ClipboardCheck],
  ["Procedures", "/operations/procedures", BookOpenCheck],
  ["Operational Alerts", "/operations/alerts", AlertTriangle],
  ["Recurring Schedules", "/operations/schedules", CalendarClock],
  ["Task Calendar", "/operations/calendar", CalendarDays],
  ["Handoff Logs", "/operations/handoffs", ArrowRightLeft],
  ["Incident Reports", "/operations/incidents", ShieldAlert],
  ["Performance", "/operations/performance", Activity],
] as const;

const coachLinks = [
  ["Coach Dashboard", "/coach", GraduationCap],
  ["Objection Handling", "/objections", MessageSquareQuote],
  ["Practice Scenarios", "/coach/scenarios", Target],
  ["Start Role Play", "/coach/session", MessagesSquare],
  ["Session Review", "/coach/review", BarChart3],
] as const;

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState<Pick<Viewer, "fullName" | "initials" | "organizationName" | "role" | "demo">>({
    fullName: "Demo User",
    initials: "DU",
    organizationName: "BGC Dealerships",
    role: "tenant_admin",
    demo: true,
  });

  useEffect(() => {
    fetch("/api/auth/context")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setViewer(data))
      .catch(() => undefined);
  }, []);

  const roleLabel = viewer.role === "platform_owner" ? "Platform Owner" : viewer.role === "tenant_admin" ? "Tenant Admin" : viewer.role === "manager" ? "Manager" : "Salesperson";
  const coachSectionActive = pathname.startsWith("/coach") || pathname === "/objections";
  const growthSectionActive = pathname.startsWith("/growth") || pathname.startsWith("/admin/growth");
  const operationsSectionActive = pathname.startsWith("/operations");
  const salesSectionActive = links.some(([, href]) => pathname === href || (href === "/admin" && pathname.startsWith("/admin") && !pathname.startsWith("/admin/growth")));
  return <div className="shell">
    {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand-row sidebar-controls"><button className="icon-btn close-nav" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <Link className="sidebar-logo" href="/dashboard" aria-label="Commandly dashboard" onClick={() => setOpen(false)}>
        <Image src="/commandly-logo-light.png" alt="Commandly — Your business. One command center." width={1976} height={796} priority />
      </Link>
      <div className="workspace"><span className="avatar avatar-square">{viewer.organizationName.charAt(0)}</span><span><small>{viewer.demo ? "Demo workspace" : "Workspace"}</small><strong>{viewer.organizationName}</strong></span><ChevronDown size={16}/></div>
      <nav className="nav module-nav" aria-label="Main navigation">
        <details className="module-group" key={`sales-${pathname}`} open={salesSectionActive}>
          <summary><span className="module-icon"><BriefcaseBusiness size={18}/></span><span>Sales Assistant</span><ChevronDown className="module-chevron" size={16}/></summary>
          <div className="module-links">{links.map(([label, href, Icon]) => {
            const active = pathname === href || (href === "/admin" && pathname.startsWith("/admin") && !pathname.startsWith("/admin/growth"));
            return <Link className={active ? "active" : ""} href={href} key={href} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></Link>;
          })}</div>
        </details>
        <details className="module-group" key={`growth-${pathname}`} open={growthSectionActive}>
          <summary><span className="module-icon"><TrendingUp size={18}/></span><span>Business Growth Advisor</span><span className="live-badge">Prototype</span><ChevronDown className="module-chevron" size={16}/></summary>
          <div className="module-links"><Link className={pathname === "/growth" || pathname.startsWith("/growth/opportunities") ? "active" : ""} href="/growth" onClick={() => setOpen(false)}><Lightbulb size={18}/><span>Growth Opportunities</span></Link><Link className={pathname === "/growth/priorities" ? "active" : ""} href="/growth/priorities" onClick={() => setOpen(false)}><BarChart3 size={18}/><span>Priority Scoring</span></Link><Link className={pathname === "/growth/plans" ? "active" : ""} href="/growth/plans" onClick={() => setOpen(false)}><ClipboardCheck size={18}/><span>Action Plans</span></Link><Link className={pathname === "/growth/performance" ? "active" : ""} href="/growth/performance" onClick={() => setOpen(false)}><Activity size={18}/><span>Performance</span></Link><Link className={pathname === "/admin/growth" ? "active" : ""} href="/admin/growth" onClick={() => setOpen(false)}><Settings size={18}/><span>Scoring Settings</span></Link></div>
        </details>
        <details className="module-group" key={`coach-${pathname}`} open={coachSectionActive}>
          <summary><span className="module-icon"><GraduationCap size={18}/></span><span>Sales Coach</span><span className="live-badge">Prototype</span><ChevronDown className="module-chevron" size={16}/></summary>
          <div className="module-links">{coachLinks.map(([label, href, Icon]) => {
            const active = pathname === href;
            return <Link className={active ? "active" : ""} href={href} key={href} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></Link>;
          })}</div>
        </details>
        <details className="module-group" key={`operations-${pathname}`} open={operationsSectionActive}>
          <summary><span className="module-icon"><ClipboardCheck size={18}/></span><span>Operations Assistant</span><span className="live-badge">Prototype</span><ChevronDown className="module-chevron" size={16}/></summary>
          <div className="module-links">{operationsLinks.map(([label, href, Icon]) => <Link className={pathname === href ? "active" : ""} href={href} key={href} onClick={() => setOpen(false)}><Icon size={18}/><span>{label}</span></Link>)}</div>
        </details>
        {plannedModules.map(({ label, Icon, features }) => <details className="module-group planned" key={label}>
          <summary><span className="module-icon"><Icon size={18}/></span><span>{label}</span><span className="planned-badge">Planned</span><ChevronDown className="module-chevron" size={16}/></summary>
          <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        </details>)}
      </nav>
      <div className="sidebar-footer"><Link href="/admin/settings"><Settings size={18}/> Settings</Link><div className="profile"><span className="avatar">{viewer.initials}</span><span><strong>{viewer.fullName}</strong><small>{roleLabel}</small></span>{viewer.demo ? <span className="demo-mode-label">Local demo</span> : <form action={logout}><button className="logout-button" type="submit">Sign out</button></form>}</div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="topbar-title"><button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={21}/></button><strong>{title}</strong></div><div className="top-actions"><button className="search-btn"><Search size={17}/><span>Search anything</span><kbd>⌘ K</kbd></button><span className="status-dot" title={viewer.demo ? "Demo environment" : "Connected"}/><span className="avatar">{viewer.initials}</span></div></header>
      <div className="content">{children}</div>
    </main>
  </div>;
}
