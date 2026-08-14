"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ImprovementsError({ reset }: { error: Error; reset: () => void }) {
  return <div className="card output empty"><div><AlertTriangle size={28}/><h2>Improvement work could not be loaded</h2><p>Try loading this section again. No submission was changed.</p><button className="btn btn-primary" onClick={reset}><RotateCcw size={16}/> Try again</button></div></div>;
}
