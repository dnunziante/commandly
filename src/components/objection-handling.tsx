"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, MessageSquareQuote } from "lucide-react";

export type ObjectionResponse = { id: string; title: string; response: string; type: string; followUp: string };

export function ObjectionHandling({ objections }: { objections: ObjectionResponse[] }) {
  const [selected, setSelected] = useState(0);
  const current = objections[selected];
  if (!current) return <div className="card output empty"><div><h2>No published objection responses</h2><p>An administrator can publish approved objection responses in Sales Content to make them available here.</p></div></div>;
  return <div className="grid grid-2"><div className="card"><label className="label">What did the customer say?</label><select className="input" value={selected} onChange={(event) => setSelected(Number(event.target.value))}>{objections.map((objection, index) => <option value={index} key={objection.id}>{objection.title}</option>)}</select><div className="section-heading"><h2>Common objections</h2></div>{objections.map((objection, index) => <button key={objection.id} onClick={() => setSelected(index)} className="prompt" style={{ width: "100%", background: index === selected ? "#edf3ff" : "white", border: "1px solid #e3e7ef", borderRadius: 9, padding: 13, marginBottom: 8, textAlign: "left", display: "flex", justifyContent: "space-between" }}>{objection.title}<ChevronDown size={16}/></button>)}</div><div className="card"><span className="badge blue"><MessageSquareQuote size={13}/> {current.type}</span><h2 style={{ marginTop: 15 }}>Suggested response</h2><div className="callout"><p style={{ color: "#14213d", fontSize: 16, margin: 0 }}>“{current.response}”</p></div><h3 style={{ marginTop: 20 }}>Follow-up question</h3><p>{current.followUp}</p><Link className="btn btn-primary" href="/coach/session?mode=objection">Practice this objection live</Link></div></div>;
}
