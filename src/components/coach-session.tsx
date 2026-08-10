"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronLeft, LoaderCircle, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { completeCoachSession } from "@/app/coach/session/actions";
import type { CoachScenario } from "@/lib/coach/types";

export function CoachSession({ scenario }: { scenario: CoachScenario }) {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [choices, setChoices] = useState<Array<number | null>>(() => scenario.rounds.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const round = scenario.rounds[roundIndex];
  const choice = choices[roundIndex];
  const finalRound = roundIndex === scenario.rounds.length - 1;
  const preferred = round?.preferredOptionIndices.includes(choice ?? -1) || false;

  function choose(index: number) {
    setChoices((current) => current.map((value, itemIndex) => itemIndex === roundIndex ? index : value));
    setSubmitted(false);
    setError("");
  }

  function reset() {
    setChoices(scenario.rounds.map(() => null));
    setRoundIndex(0);
    setSubmitted(false);
    setError("");
  }

  function continueSession() {
    if (!finalRound) {
      setRoundIndex((current) => current + 1);
      setSubmitted(false);
      setError("");
      return;
    }
    const completedChoices = choices.filter((value): value is number => value !== null);
    setError("");
    startTransition(async () => {
      const result = await completeCoachSession(scenario.id, completedChoices);
      if (result.error || !result.sessionId) {
        setError(result.error || "The practice session could not be saved.");
        return;
      }
      router.push(`/coach/review?session=${result.sessionId}`);
    });
  }

  if (!round) return <div className="card error-card"><h2>Scenario rounds unavailable</h2><p>Ask an administrator to configure at least one practice round.</p></div>;

  return <div className="coach-session-grid">
    <section className="card coach-conversation" aria-labelledby="conversation-title">
      <div className="coach-card-head"><div><span className="badge blue">Round {roundIndex + 1} of {scenario.rounds.length}</span><h2 id="conversation-title">Customer conversation</h2></div><span className="coach-live"><span/> Structured simulation</span></div>
      <div className="coach-round-progress" aria-label={`Round ${roundIndex + 1} of ${scenario.rounds.length}`}>{scenario.rounds.map((item, index) => <span className={index <= roundIndex ? "complete" : ""} key={item.id}/>)}</div>
      <div className="coach-customer"><span className="avatar">JM</span><div><strong>Jordan · Customer</strong><p>&ldquo;{round.customerPrompt}&rdquo;</p></div></div>
      <fieldset className="coach-options">
        <legend>How would you respond?</legend>
        {round.responseOptions.map((response, index) => <label className={choice === index ? "selected" : ""} key={response}>
          <input type="radio" name={`response-${round.roundNumber}`} checked={choice === index} onChange={() => choose(index)}/>
          <span><strong>Option {index + 1}</strong>{response}</span>
        </label>)}
      </fieldset>
      <div className="coach-actions"><button className="btn btn-ghost" onClick={reset}><RotateCcw size={16}/> Restart</button>{roundIndex > 0 && !submitted && <button className="btn btn-ghost" onClick={() => { setRoundIndex((current) => current - 1); setSubmitted(false); }}><ChevronLeft size={16}/> Previous</button>}<button className="btn btn-primary" disabled={choice === null || submitted} onClick={() => setSubmitted(true)}>Submit response <ArrowRight size={16}/></button></div>
    </section>
    <aside className="coach-side-stack" aria-label="Coaching panel">
      <section className="card"><span className="badge"><Sparkles size={13}/> Practice objective</span><h2>{scenario.title}</h2><p>{scenario.goal}</p><div className="chips">{round.skillImpacts.map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div></section>
      <section className={`card coach-feedback ${submitted ? "ready" : ""}`} aria-live="polite">
        {submitted ? <><CheckCircle2 size={27}/><h2>Round feedback</h2><p>{preferred ? "Strong response. You kept the conversation consultative and advanced the skills highlighted for this round." : "You moved forward before completing enough discovery. Slow down and invite the customer to clarify their priorities."}</p><strong>Skills evaluated</strong><p>{round.skillImpacts.join(" · ")}</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={isPending} onClick={continueSession}>{isPending ? <><LoaderCircle className="spin" size={16}/> Saving session...</> : finalRound ? <>Complete session <ArrowRight size={16}/></> : <>Continue to round {roundIndex + 2} <ArrowRight size={16}/></>}</button></> : <><MessageCircle size={27}/><h2>Feedback appears here</h2><p>Select and submit a response. Your final score combines all rounds using this scenario&apos;s C.L.O.S.E.R. weights.</p></>}
      </section>
    </aside>
  </div>;
}
