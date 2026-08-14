export const KNOWLEDGE_COLLECTIONS = [
  "General",
  "Sales process",
  "Product knowledge",
  "Policies",
  "Operations",
] as const;

export type KnowledgeCollection = (typeof KNOWLEDGE_COLLECTIONS)[number];

export function isKnowledgeCollection(value: string): value is KnowledgeCollection {
  return KNOWLEDGE_COLLECTIONS.some((collection) => collection === value);
}
