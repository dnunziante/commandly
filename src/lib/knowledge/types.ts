export type KnowledgeDocumentDTO = {
  id: string;
  title: string;
  filename: string;
  collection: string;
  mimeType: string;
  sizeBytes: number;
  status: "Uploaded" | "Processing" | "Ready" | "Failed" | "Error";
  createdAt: string;
  chunkCount: number;
  trainingLessonId?: string;
  trainingLessonStatus?: "pending" | "generating" | "ready" | "failed";
  trainingLessonPublished?: boolean;
  trainingSourceReviewRequired?: boolean;
};

export type KnowledgeResult = {
  documents: KnowledgeDocumentDTO[];
  error?: string;
};
