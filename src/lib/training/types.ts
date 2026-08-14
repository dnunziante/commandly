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
