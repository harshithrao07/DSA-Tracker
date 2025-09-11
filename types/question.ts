export interface QuestionAutofillResponse {
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "";
  platform: "LEETCODE" | "CODEFORCES" | "GEEKSFORGEEKS" | string;
  topics: string[];
  link: string;
}

export interface QuestionResponse {
  id: string;
  link: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "";
  solved: boolean;
  reviseLater: boolean;
  topics: string[];
  noteId: string;
}
