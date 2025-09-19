export interface QuestionStatsCount {
  totalQuestions: number;
  solvedQuestions: number;
  remQuestions: number;
  markedForRevision: number;
  questionStatsCountDifficulties: QuestionStatsCountDifficulty[];
  questionStatsCountTopics: QuestionStatsCountTopic[];
}

export interface QuestionStatsCountDifficulty {
  name: string;
  totalQuestions: number;
  solvedQuestions: number;
  remQuestions: number;
}

export interface QuestionStatsCountTopic {
  id: string;
  name: string;
  totalQuestions: number;
  solvedQuestions: number;
  remQuestions: number;
  questionStatsCountDifficulties: QuestionStatsCountDifficulty[];
}

export interface HeatMapValue {
  date: string;
  count: number;
}
