export const TRAINING_TYPES = [
  "auto_detect",
  "product_knowledge",
  "sales_skills",
  "policy_process",
  "competitor_knowledge",
  "general_knowledge",
] as const;

export type TrainingType = (typeof TRAINING_TYPES)[number];
export type TrainingQuestionType = "multiple_choice" | "true_false" | "scenario";

export type TrainingSection = {
  title: string;
  content: string;
};

export type TrainingScenario = {
  title: string;
  situation: string;
  recommendedApproach: string;
};

export type TrainingQuestion = {
  id: string;
  type: TrainingQuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  sourceEvidence: string;
};

export type GeneratedTrainingContent = {
  learningObjectives: string[];
  sections: TrainingSection[];
  keyTakeaways: string[];
  practicalApplication: string;
  scenario: TrainingScenario | null;
  knowledgeCheck: TrainingQuestion[];
};

export const EMPTY_GENERATED_TRAINING: GeneratedTrainingContent = {
  learningObjectives: [],
  sections: [],
  keyTakeaways: [],
  practicalApplication: "",
  scenario: null,
  knowledgeCheck: [],
};

function text(value: unknown, max = 10_000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function textList(value: unknown, maxItems: number, maxLength = 1_000) {
  return Array.isArray(value)
    ? value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

export function isTrainingType(value: string): value is TrainingType {
  return TRAINING_TYPES.includes(value as TrainingType);
}

export function parseGeneratedTrainingContent(value: unknown): GeneratedTrainingContent {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const scenarioRecord = record.scenario && typeof record.scenario === "object" && !Array.isArray(record.scenario)
    ? record.scenario as Record<string, unknown>
    : null;
  const scenario = scenarioRecord
    ? {
        title: text(scenarioRecord.title, 180),
        situation: text(scenarioRecord.situation, 4_000),
        recommendedApproach: text(scenarioRecord.recommendedApproach, 4_000),
      }
    : null;

  return {
    learningObjectives: textList(record.learningObjectives, 8),
    sections: Array.isArray(record.sections)
      ? record.sections.flatMap((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const section = item as Record<string, unknown>;
          const title = text(section.title, 180);
          const content = text(section.content, 10_000);
          return title && content ? [{ title, content }] : [];
        }).slice(0, 12)
      : [],
    keyTakeaways: textList(record.keyTakeaways, 8),
    practicalApplication: text(record.practicalApplication, 6_000),
    scenario: scenario && scenario.title && scenario.situation && scenario.recommendedApproach ? scenario : null,
    knowledgeCheck: Array.isArray(record.knowledgeCheck)
      ? record.knowledgeCheck.flatMap((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const question = item as Record<string, unknown>;
          const type = ["multiple_choice", "true_false", "scenario"].includes(String(question.type))
            ? question.type as TrainingQuestionType
            : "multiple_choice";
          const prompt = text(question.question, 1_000);
          const correctAnswer = text(question.correctAnswer, 1_000);
          const explanation = text(question.explanation, 2_000);
          const sourceEvidence = text(question.sourceEvidence, 500);
          if (!prompt || !correctAnswer || !explanation || !sourceEvidence) return [];
          return [{
            id: text(question.id, 100) || `question-${index + 1}`,
            type,
            question: prompt,
            options: textList(question.options, 8, 500),
            correctAnswer,
            explanation,
            sourceEvidence,
          }];
        }).slice(0, 10)
      : [],
  };
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, " ").trim();
}

export function validateQuestionEvidence(content: GeneratedTrainingContent, sourceText: string) {
  const source = normalized(sourceText);
  return content.knowledgeCheck.every((question) => {
    const evidence = normalized(question.sourceEvidence);
    return evidence.length >= 8 && source.includes(evidence);
  });
}

export function validateGeneratedTrainingContent(content: GeneratedTrainingContent, includeKnowledgeCheck: boolean) {
  if (content.learningObjectives.length < 3 || content.learningObjectives.length > 5) return "Generate 3–5 learning objectives.";
  if (!content.sections.length) return "Add at least one lesson section.";
  if (content.keyTakeaways.length < 3 || content.keyTakeaways.length > 5) return "Generate 3–5 key takeaways.";
  if (includeKnowledgeCheck && (content.knowledgeCheck.length < 4 || content.knowledgeCheck.length > 6)) return "Generate approximately five knowledge-check questions.";
  if (!includeKnowledgeCheck && content.knowledgeCheck.length) return "Remove the knowledge check when it is disabled.";
  for (const question of content.knowledgeCheck) {
    if (question.type === "true_false" && question.options.length !== 2) return "True/false questions must have two answer options.";
    if (question.type !== "true_false" && question.options.length < 2) return "Each knowledge-check question needs at least two answer options.";
    if (!question.options.includes(question.correctAnswer)) return "Each correct answer must match one of its answer options.";
  }
  return "";
}

export function trainingTypeLabel(value: TrainingType) {
  return ({
    auto_detect: "Auto Detect",
    product_knowledge: "Product Knowledge",
    sales_skills: "Sales Skills",
    policy_process: "Policy / Process",
    competitor_knowledge: "Competitor Knowledge",
    general_knowledge: "General Knowledge",
  } as const)[value];
}
