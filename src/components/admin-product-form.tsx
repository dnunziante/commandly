"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { createProduct, type ProductActionState } from "@/app/admin/products/actions";

const initialState: ProductActionState = { error: "", success: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" disabled={pending} type="submit">{pending ? <><LoaderCircle className="spin" size={16}/> Saving…</> : <><Plus size={16}/> Add product</>}</button>;
}

export function AdminProductForm() {
  const [state, action] = useActionState(createProduct, initialState);
  return <form className="card form-stack" action={action}>
    <div><h2>Add product</h2><p style={{fontSize:12,marginBottom:0}}>New products belong only to the active organization.</p></div>
    <div className="grid grid-2"><div><label className="label" htmlFor="name">Product name</label><input className="input" id="name" name="name" required placeholder="Nexus"/></div><div><label className="label" htmlFor="model">Configuration</label><input className="input" id="model" name="model" placeholder="4 Passenger Forward"/></div></div>
    <div><label className="label" htmlFor="description">Description</label><textarea className="input" id="description" name="description" rows={3} placeholder="Customer-ready positioning statement"/></div>
    <div className="grid grid-2"><div><label className="label" htmlFor="price">Starting price</label><input className="input" id="price" name="price" type="number" min="0" step="0.01" required placeholder="15995"/></div><div><label className="label" htmlFor="status">Status</label><select className="input" id="status" name="status"><option value="draft">Draft</option><option value="published">Published</option></select></div></div>
    <div className="grid grid-2"><div><label className="label" htmlFor="range">Range</label><input className="input" id="range" name="range" placeholder="Up to 55 mi"/></div><div><label className="label" htmlFor="seats">Capacity</label><input className="input" id="seats" name="seats" placeholder="4 passengers"/></div></div>
    <div><label className="label" htmlFor="highlights">Highlights</label><input className="input" id="highlights" name="highlights" placeholder="72V lithium, Power steering, Touchscreen"/><small className="field-help">Separate features with commas.</small></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}
    <SaveButton/>
  </form>;
}
