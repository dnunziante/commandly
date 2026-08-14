"use client";

import { AlertTriangle } from "lucide-react";

export default function ExecutiveError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="card output empty"><AlertTriangle size={28}/><h2>The executive view could not load</h2><p>The underlying module pages are still available. Try preparing the summary again.</p><button className="btn btn-secondary" type="button" onClick={reset}>Try again</button></div>;
}
