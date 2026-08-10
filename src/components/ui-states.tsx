"use client";
import { AlertCircle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";

export function StateShowcase() {
  return <details className="states"><summary>Preview interface states</summary><div className="state-grid"><div><LoaderCircle className="spin"/><strong>Loading</strong><p>Getting the latest workspace data…</p></div><div><Inbox/><strong>Empty</strong><p>Nothing here yet. Create your first item.</p></div><div><AlertCircle/><strong>Couldn’t load</strong><p>Something went wrong.</p><button className="text-button"><RotateCcw size={14}/> Try again</button></div></div></details>;
}
