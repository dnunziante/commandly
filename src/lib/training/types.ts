import type { GeneratedTrainingContent, TrainingType } from "./generated";

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
  content: GeneratedTrainingContent;
  isPublished: boolean;
  generationStatus: "pending" | "generating" | "ready" | "failed";
  generationError?: string;
  trainingType: TrainingType;
  includeKnowledgeCheck: boolean;
  sourceReviewRequired: boolean;
  locationId?: string;
  locationName?: string;
  generatedAt?: string;
  publishedAt?: string;
};

export type TrainingResult = {
  lessons: TrainingLessonDTO[];
  error?: string;
};

export type TrainingModuleDTO = {
  id: string;
  title: string;
  description: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  lessons: TrainingLessonDTO[];
};

export type TrainingModulesResult = {
  modules: TrainingModuleDTO[];
  lessons: TrainingLessonDTO[];
  error?: string;
};
