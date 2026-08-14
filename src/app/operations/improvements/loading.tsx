import { LoaderCircle } from "lucide-react";

export default function ImprovementsLoading() {
  return <div className="card operations-loading"><LoaderCircle className="spin" size={22}/><div><h2>Loading improvement work</h2><p>Preparing submissions, review steps, and measurements.</p></div></div>;
}
