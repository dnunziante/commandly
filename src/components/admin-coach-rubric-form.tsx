"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";
import { updateCoachScenarioRubric, type CoachScenarioActionState } from "@/app/admin/coach/actions";
import type { CoachScenario } from "@/lib/coach/types";

const initialState: CoachScenarioActionState = { error: "", success: "" };
const skills = ["Clarify", "Listen", "Open", "Solve", "Explain", "Recommend"] as const;

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16}/> Saving...</> : <><Save size={16}/> Save rubric</>}</button>;
}

export function AdminCoachRubricForm({ scenarios, demo }: { scenarios: CoachScenario[]; demo: boolean }) {
  const [state, action] = useActionState(updateCoachScenarioRubric, initialState);
  const first = scenarios[0];
  return <form className="card form-stack" action={action}>
    <div><h2>C.L.O.S.E.R. scoring rubric</h2><p style={{ fontSize: 12, marginBottom: 0 }}>Adjust how each skill contributes to a scenario&apos;s final deterministic score.</p></div>
    <div><label className="label" htmlFor="rubric-scenario">Scenario</label><select className="input" id="rubric-scenario" name="scenarioId" required>{scenarios.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.title}</option>)}</select></div>
    <div className="grid grid-3">{skills.map((skill) => <div key={skill}><label className="label" htmlFor={`rubric-${skill}`}>{skill}</label><input className="input" id={`rubric-${skill}`} name={`weight${skill}`} type="number" min="0" max="100" defaultValue={first?.rubricWeights[skill] ?? (skill === "Clarify" || skill === "Listen" ? 20 : 15)} required/></div>)}</div>
    <small className="field-help">Weights must total 100. Selecting another scenario keeps the displayed defaults editable before saving.</small>
    {demo && <p className="demo-note">Sign in to a workspace to save rubric changes.</p>}{state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}
    <SaveButton/>
  </form>;
}
