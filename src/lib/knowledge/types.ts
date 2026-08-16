export type KnowledgeDocumentDTO = {
  id: string;
  title: string;
  filename: string;
  collection: string;
  mimeType: string;
  sizeBytes: number;
  status: "Uploaded" | "Processing" | "Ready" | "Failed" | "Error";
  createdAt: string;
  trainingLessonId?: string;
};

export type KnowledgeResult = {
  documents: KnowledgeDocumentDTO[];
  error?: string;
};
