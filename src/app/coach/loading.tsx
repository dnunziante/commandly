import { LoaderCircle } from "lucide-react";

export default function CoachLoading() {
  return <main className="content"><div className="output empty"><div><LoaderCircle className="spin"/><h2>Loading Sales Coach...</h2><p>Getting the latest scenarios and practice history.</p></div></div></main>;
}
