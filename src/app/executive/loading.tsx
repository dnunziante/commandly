import { LoaderCircle } from "lucide-react";

export default function ExecutiveLoading() {
  return <div className="card operations-loading"><LoaderCircle className="spin" size={22}/><div><h2>Preparing the executive view</h2><p>Bringing the latest business signals into one scorecard.</p></div></div>;
}
