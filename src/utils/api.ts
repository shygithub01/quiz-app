export interface Question {
  question: string;
  options: string[];
  answer: string;
}

export interface QuizSettings {
  numQuestions: number;
  difficulty: string;
  quizType: string;
}

export interface QuizTemplate {
  id?: string;
  title: string;
  type: "document" | "topic";
  questions: Question[];
  fileName?: string;
  topic?: string;
  settings: QuizSettings;
  questionHash: string;
}

export interface QuizResponse {
  questions: Question[];
  questionHash: string;
}

export interface GenerateQuizFromDocumentParams {
  fileContent: string;
  fileName: string;
  settings: QuizSettings;
}

export interface GenerateQuizFromTopicParams {
  topic: string;
  settings: QuizSettings;
}

