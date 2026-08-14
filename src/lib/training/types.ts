export type TrainingLessonDTO = {
  id: string;
  knowledgeDocumentId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sourceFilename: string;
  mimeType?: string;
  collection: string;
  createdAt: string;
};

export type TrainingResult = {
  lessons: TrainingLessonDTO[];
  error?: string;
};
