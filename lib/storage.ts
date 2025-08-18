import type { DSAQuestion } from "./types";

const STORAGE_KEY = "dsa-questions";

type RevisionFilter = "all" | "revision" | "normal";

export const storage = {
  // Get all questions from localStorage
  getQuestions(): DSAQuestion[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      const questions = JSON.parse(stored);
      return questions.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        solvedAt: q.solvedAt ? new Date(q.solvedAt) : undefined,
      }));
    } catch {
      return [];
    }
  },

  // Save questions to localStorage
  saveQuestions(questions: DSAQuestion[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  },

  // Add a new question
  addQuestion(
    question: Omit<DSAQuestion, "id" | "createdAt" | "isSolved">
  ): DSAQuestion {
    const questions = this.getQuestions();
    const newQuestion: DSAQuestion = {
      ...question,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isSolved: false,
    };

    questions.push(newQuestion);
    this.saveQuestions(questions);
    return newQuestion;
  },

  // Mark question as solved
  markAsSolved(questionId: string): void {
    const questions = this.getQuestions();
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      question.isSolved = true;
      question.solvedAt = new Date();
      this.saveQuestions(questions);
    }
  },

  // Mark question as unsolved
  markAsUnsolved(questionId: string): void {
    const questions = this.getQuestions();
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      question.isSolved = false;
      question.solvedAt = undefined;
      this.saveQuestions(questions);
    }
  },

  // Update notes for a question
  updateNotes(questionId: string, notes: string): void {
    const questions = this.getQuestions();
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      question.notes = notes.trim() || undefined;
      this.saveQuestions(questions);
    }
  },

  // Get random unsolved question by topic and difficulty
  getRandomQuestion(
    topics?: string[] | string,
    difficulty?: string
  ): DSAQuestion | null {
    const questions = this.getQuestions();

    let topicsArray: string[] = [];
    if (topics) {
      if (typeof topics === "string") {
        topicsArray = [topics];
      } else if (Array.isArray(topics)) {
        topicsArray = topics;
      }
    }

    const unsolvedQuestions = questions.filter((q) => {
      if (q.isSolved) return false;

      if (difficulty && difficulty !== "all" && q.difficulty !== difficulty)
        return false;

      if (!topicsArray.length || topicsArray.includes("all")) return true;

      const questionTopics = Array.isArray(q.topics)
        ? q.topics
        : q.topics
        ? [q.topics]
        : [];

      // Check if any of the selected topics exist in the question's topics array
      return topicsArray.some((topic) => questionTopics.includes(topic));
    });

    if (unsolvedQuestions.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length);
    return unsolvedQuestions[randomIndex];
  },

  getRandomQuestions(
    count: number,
    topics?: string[] | string,
    difficulty?: string,
    revision: RevisionFilter = "all"
  ): DSAQuestion[] {
    const questions = this.getQuestions();

    let topicsArray: string[] = [];
    if (topics) topicsArray = typeof topics === "string" ? [topics] : topics;

    const pool = questions.filter((q) => {
      if (q.isSolved) return false;

      // difficulty
      if (difficulty && difficulty !== "all" && q.difficulty !== difficulty)
        return false;

      // topics
      if (topicsArray.length && !topicsArray.includes("all")) {
        const qTopics = Array.isArray(q.topics)
          ? q.topics
          : q.topics
          ? [q.topics]
          : [];
        if (!topicsArray.some((t) => qTopics.includes(t))) return false;
      }

      // 👇 revision
      if (revision === "revision" && !q.reviseLater) return false;
      if (revision === "normal" && q.reviseLater) return false;

      return true;
    });

    if (pool.length === 0) return [];

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // cache last set (SSR-safe)
    if (typeof window !== "undefined") {
      localStorage.setItem("lastRandomQuestions", JSON.stringify(selected));
    }

    return selected;
  },

  // Reset all questions to unsolved state
  resetAllQuestions(): void {
    const questions = this.getQuestions();
    questions.forEach((q) => {
      q.isSolved = false;
      q.solvedAt = undefined;
      // Notes are preserved during reset
    });
    this.saveQuestions(questions);
  },

  // Delete a question by ID
  deleteQuestion(questionId: string): void {
    const questions = this.getQuestions();
    const filteredQuestions = questions.filter((q) => q.id !== questionId);
    this.saveQuestions(filteredQuestions);
  },

  // Get unique topics from questions
  getTopics(): string[] {
    const questions = this.getQuestions();
    const topicsSet = new Set<string>();

    questions.forEach((q) => {
      if (q.topics && Array.isArray(q.topics)) {
        q.topics.forEach((topic) => topicsSet.add(topic));
      }
    });

    return Array.from(topicsSet).sort();
  },

  // Get application statistics
  getStats(): {
    totalQuestions: number;
    solvedQuestions: number;
    topics: { name: string; count: number; solvedCount: number }[];
  } {
    const questions = this.getQuestions();
    const topicStats = new Map<
      string,
      { count: number; solvedCount: number }
    >();

    questions.forEach((q) => {
      if (q.topics && Array.isArray(q.topics)) {
        q.topics.forEach((topic) => {
          const current = topicStats.get(topic) || { count: 0, solvedCount: 0 };
          current.count++;
          if (q.isSolved) current.solvedCount++;
          topicStats.set(topic, current);
        });
      }
    });

    return {
      totalQuestions: questions.length,
      solvedQuestions: questions.filter((q) => q.isSolved).length,
      topics: Array.from(topicStats.entries())
        .map(([name, stats]) => ({
          name,
          ...stats,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  },

  // Toggle reviseLater for a question
  toggleReviseLater(questionId: string): DSAQuestion {
    const questions = this.getQuestions();
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      question.reviseLater = !question.reviseLater;
      this.saveQuestions(questions);

      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("lastRandomQuestions");
        if (cached) {
          const parsed = JSON.parse(cached) as DSAQuestion[];
          const updated = parsed.map((q) =>
            q.id === questionId
              ? { ...q, reviseLater: question.reviseLater }
              : q
          );
          localStorage.setItem("lastRandomQuestions", JSON.stringify(updated));
        }
      }
    }

    return question;
  },
};

export const getQuestions = () => storage.getQuestions();
export const getTopics = () => storage.getTopics().map((name) => ({ name }));
export const resetAllProgress = () => storage.resetAllQuestions();
export const addQuestion = (
  question: Omit<DSAQuestion, "id" | "createdAt" | "isSolved">
) => storage.addQuestion(question);
export const markAsSolved = (questionId: string) =>
  storage.markAsSolved(questionId);
export const markAsUnsolved = (questionId: string) =>
  storage.markAsUnsolved(questionId);
export const updateNotes = (questionId: string, notes: string) =>
  storage.updateNotes(questionId, notes);
export const getRandomQuestion = (
  topics?: string[] | string,
  difficulty?: string
) => storage.getRandomQuestion(topics, difficulty);
export const getRandomQuestions = (
  count: number,
  topics?: string[] | string,
  difficulty?: string
) => storage.getRandomQuestions(count, topics, difficulty);
export const deleteQuestion = (questionId: string) =>
  storage.deleteQuestion(questionId);
export const getStats = () => storage.getStats();
export const toggleReviseLater = (questionId: string) =>
  storage.toggleReviseLater(questionId);
