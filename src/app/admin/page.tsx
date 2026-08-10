import Link from "next/link";
import { BookOpen, Boxes, Building2, ChevronRight, GraduationCap, Settings, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export default function Admin() {
  const items = [
    [Boxes, "Products & pricing", "Manage models, positioning, prices, and visibility.", "/admin/products"],
    [GraduationCap, "Coach scenarios", "Create and publish tenant-specific practice conversations.", "/admin/coach"],
    [BookOpen, "Sales content", "Manage scripts, objections, templates, and training.", "/admin/content"],
    [Building2, "Locations", "Manage BGC storefront details and local information.", "/admin/settings"],
    [Users, "Team members", "Invite users and assign future roles.", "/admin/settings"],
    [Settings, "Workspace settings", "Control branding and assistant behavior.", "/admin/settings"],
  ] as const;
  return <AppShell title="Admin"><PageHeader eyebrow="Workspace administration" title="Manage the BGC experience" description="A simple control center for approved content, users, and workspace settings."/><div className="card">{items.map(([Icon, title, copy, href]) => <Link className="activity-row" href={href} key={title}><span className="metric-icon"><Icon size={18}/></span><div style={{ flex: 1 }}><strong>{title}</strong><p style={{ margin: 2, fontSize: 12 }}>{copy}</p></div><ChevronRight size={18}/></Link>)}</div></AppShell>;
}
