"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Save } from "lucide-react";
import { saveSalesGuide, type SalesGuideActionState } from "@/app/admin/products/actions";
import type { ProductDTO } from "@/lib/products/types";

const initialState: SalesGuideActionState = { error: "", success: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16}/> Saving…</> : <><Save size={16}/> Save sales guide</>}</button>;
}

function LinesField({ id, label, help, value, placeholder }: { id: string; label: string; help: string; value: string[]; placeholder: string }) {
  return <div><label className="label" htmlFor={id}>{label}</label><textarea className="input" id={id} name={id} rows={5} defaultValue={value.join("\n")} placeholder={placeholder}/><small className="field-help">{help}</small></div>;
}

export function SalesGuideEditor({ product }: { product: ProductDTO }) {
  const [state, action] = useActionState(saveSalesGuide, initialState);
  const guide = product.salesGuide;
  return <form className="card form-stack sales-guide-editor" action={action}>
    <input type="hidden" name="productId" value={product.id}/>
    <div className="callout"><strong>Approved content only</strong><p>Enter verified product guidance. Do not add unconfirmed pricing, availability, specifications, or policies.</p></div>
    <div><label className="label" htmlFor="bestFitCustomer">Best-fit customer</label><textarea className="input" id="bestFitCustomer" name="bestFitCustomer" rows={4} defaultValue={guide.bestFitCustomer} placeholder="Describe the customer needs, use cases, and priorities this product fits best."/></div>
    <div className="grid grid-2">
      <LinesField id="sellingPoints" label="Key selling points" help="One approved point per line." value={guide.sellingPoints} placeholder="Feature and its verified customer benefit"/>
      <LinesField id="discoveryQuestions" label="Discovery questions" help="One question per line." value={guide.discoveryQuestions} placeholder="How do you plan to use your cart most often?"/>
      <LinesField id="demonstrationSteps" label="Demonstration steps" help="One step per line, in presentation order." value={guide.demonstrationSteps} placeholder="Show the customer…"/>
      <LinesField id="objectionResponses" label="Objections and responses" help="Use: Objection | Approved response." value={guide.objectionResponses} placeholder="Price concern | Compare the included verified equipment…"/>
      <LinesField id="accessoryOpportunities" label="Accessories and upgrades" help="One approved opportunity per line." value={guide.accessoryOpportunities} placeholder="Accessory and relevant customer use case"/>
    </div>
    <div className="grid grid-2"><div><label className="label" htmlFor="followUpNotes">Follow-up guidance</label><textarea className="input" id="followUpNotes" name="followUpNotes" rows={5} defaultValue={guide.followUpNotes} placeholder="What the salesperson should recap and send after the conversation."/></div><div><label className="label" htmlFor="disclaimers">Required disclaimers</label><textarea className="input" id="disclaimers" name="disclaimers" rows={5} defaultValue={guide.disclaimers} placeholder="Approved qualifications, policy reminders, or disclosures."/></div></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}
    <SaveButton/>
  </form>;
}
