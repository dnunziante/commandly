"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

export default function CoachError({ reset }: { error: Error; reset: () => void }) {
  return <main className="content"><div className="card error-card"><AlertCircle/><h1>Sales Coach could not load</h1><p>Try the request again. If the problem continues, check the workspace database connection.</p><button className="btn btn-primary" onClick={reset}><RotateCcw size={16}/> Try again</button></div></main>;
}
