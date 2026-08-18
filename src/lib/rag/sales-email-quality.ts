export type SalesEmailDraft = { subject: string; body: string; primaryCallToAction: string };

const bannedPhrases = ["i hope this email finds you well", "i wanted to reach out", "just checking in", "please don't hesitate to reach out"];

export function validateSalesEmailDraft(draft: SalesEmailDraft) {
  const normalized = `${draft.subject} ${draft.body}`.toLowerCase().replaceAll("’", "'");
  if (!draft.subject.trim() || !draft.body.trim() || !draft.primaryCallToAction.trim()) return false;
  if (bannedPhrases.some((phrase) => normalized.includes(phrase))) return false;
  const words = draft.body.trim().split(/\s+/).length;
  return words >= 45 && words <= 200;
}

export type SalesTextDraft = { message: string; primaryCallToAction: string };

export function validateSalesTextDraft(draft: SalesTextDraft) {
  const normalized = draft.message.toLowerCase().replaceAll("’", "'");
  if (!draft.message.trim() || !draft.primaryCallToAction.trim()) return false;
  if (bannedPhrases.some((phrase) => normalized.includes(phrase))) return false;
  const words = draft.message.trim().split(/\s+/).length;
  return words >= 15 && words <= 90;
}
