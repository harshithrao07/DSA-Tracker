"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { NotesDialog } from "@/components/notes-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { storage } from "@/lib/storage";
import type { DSAQuestion } from "@/lib/types";
import {
  RefreshCw,
  RotateCcw,
  NotebookPen,
  CheckCircle,
  Bookmark,
  BookMarked,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedRevision, setSelectedRevision] = useState<
    "all" | "revision" | "normal"
  >("all");
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [topics, setTopics] = useState<string[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<DSAQuestion[]>([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    solvedQuestions: 0,
    topics: [],
  });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedQuestionForNotes, setSelectedQuestionForNotes] =
    useState<DSAQuestion | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("filters");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.topic) setSelectedTopic(parsed.topic);
        if (parsed.difficulty) setSelectedDifficulty(parsed.difficulty);
        if (parsed.revision) setSelectedRevision(parsed.revision);
        if (parsed.count) setQuestionCount(parsed.count);
      } catch (err) {
        console.error("Failed to parse stored filters", err);
      }
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("lastRandomQuestions");
    if (cached) {
      try {
        const parsed: DSAQuestion[] = JSON.parse(cached);
        if (parsed.length) {
          setCurrentQuestions(parsed);
        }
      } catch (err) {
        console.error("Failed to parse cached questions", err);
      }
    }
  }, []);

  const loadData = () => {
    const allTopics = JSON.parse(localStorage.getItem("topics")) || [];
    const appStats = storage.getStats();
    setTopics(allTopics);
    setStats(appStats);
  };

  const getRandomQuestions = () => {
    setIsLoading(true);
    setTimeout(() => {
      const topic = selectedTopic === "all" ? undefined : selectedTopic;
      const difficulty =
        selectedDifficulty === "all" ? undefined : selectedDifficulty;
      const revision = selectedRevision === "all" ? "all" : selectedRevision; // 👈 new state

      const questions = storage.getRandomQuestions(
        questionCount,
        topic,
        difficulty,
        revision
      );

      setCurrentQuestions(questions);
      const filters = {
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        revision: selectedRevision,
        count: questionCount,
      };
      localStorage.setItem("filters", JSON.stringify(filters));
      localStorage.setItem("lastRandomQuestions", JSON.stringify(questions));
      setIsLoading(false);
    }, 300);
  };

  const markAsSolved = (questionId: string) => {
    storage.markAsSolved(questionId);
    setCurrentQuestions((prev) => {
      const updated = prev.filter((q) => q.id !== questionId);
      // also update localStorage cache
      if (typeof window !== "undefined") {
        localStorage.setItem("lastRandomQuestions", JSON.stringify(updated));
      }
      return updated;
    });
    loadData();

    toast({
      title: "🎉 Congratulations!",
      description: "You just solved this problem. Keep going! 🚀",
      variant: "default",
    });
  };

  const resetAllProgress = () => {
    setResetConfirmOpen(true);
  };

  const confirmResetProgress = () => {
    storage.resetAllQuestions();
    setCurrentQuestions([]);
    loadData();
  };

  const handleNotesUpdated = () => {
    if (selectedQuestionForNotes) {
      const updatedQuestions = storage.getQuestions();
      const updatedQuestion = updatedQuestions.find(
        (q) => q.id === selectedQuestionForNotes.id
      );
      if (updatedQuestion) {
        setCurrentQuestions((prev) =>
          prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
        );
        setSelectedQuestionForNotes(updatedQuestion);
      }
    }
  };

  const openNotesDialog = (question: DSAQuestion) => {
    setSelectedQuestionForNotes(question);
    setNotesDialogOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  function markForRevision(id: string): void {
    storage.toggleReviseLater(id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="gradient-card border-0 glow-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium gradient-text-primary">
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 glow-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium gradient-text-primary">
                Solved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats.solvedQuestions}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 glow-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium gradient-text-primary">
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {stats.totalQuestions - stats.solvedQuestions}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Picker Section */}
        <Card className="mb-6 gradient-card border-0 glow-accent">
          <CardHeader>
            <CardTitle className="gradient-text-primary">
              Random Question Picker
            </CardTitle>
            <CardDescription>
              Select filters and specify how many questions you want to practice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Topic</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Difficulty
                </label>
                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Revision
                </label>
                <Select
                  value={selectedRevision}
                  onValueChange={setSelectedRevision}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Revision filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Questions</SelectItem>
                    <SelectItem value="revision">
                      Marked for Revision
                    </SelectItem>
                    <SelectItem value="normal">Not Marked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <label className="text-sm font-medium mb-2 block">
                  Questions
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(
                      Math.max(
                        1,
                        Math.min(50, Number.parseInt(e.target.value) || 1)
                      )
                    )
                  }
                  className="text-center"
                />
              </div>

              <Button
                onClick={getRandomQuestions}
                disabled={isLoading || stats.totalQuestions === 0}
                className="gradient-primary text-white border-0 glow-primary hover:glow-accent transition-all duration-300"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Get Questions
              </Button>
            </div>

            {stats.totalQuestions === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No questions added yet.{" "}
                <Button
                  variant="link"
                  asChild
                  className="p-0 h-auto gradient-text-primary"
                >
                  <a href="/add">Add your first question</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {currentQuestions.length == 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No questions available
          </div>
        )}

        {/* Current Question Display */}
        {currentQuestions.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold gradient-text-primary">
              Practice Questions ({currentQuestions.length})
            </h3>
            {currentQuestions.map((question, index) => (
              <Card
                key={question.id}
                className="gradient-card border-0 glow-accent"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl gradient-text-primary">
                        {index + 1}.{" "}
                        <Link
                          href={question.link}
                          target="_blank"
                          className="cursor-pointer"
                        >
                          {question.title}
                        </Link>
                      </CardTitle>
                      <div className="flex gap-2">
                        {question.topics.map((topic, topicIndex) => (
                          <Badge
                            key={topicIndex}
                            variant="secondary"
                            className="gradient-secondary text-white border-0"
                          >
                            {topic}
                          </Badge>
                        ))}
                        <Badge
                          className={getDifficultyColor(question.difficulty)}
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Added on{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(question.createdAt))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNotesDialog(question)}
                        className="hover:gradient-primary hover:text-white transition-all duration-300 bg-transparent flex items-center gap-2"
                        title={question.notes ? "View/Edit Notes" : "Add Notes"}
                      >
                        <NotebookPen className="h-4 w-4" />
                        {question.notes ? "Notes" : "Add Notes"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentQuestions((prev) => {
                            const updated = prev.filter(
                              (q) => q.id !== question.id
                            );
                            // also update localStorage cache
                            if (typeof window !== "undefined") {
                              localStorage.setItem(
                                "lastRandomQuestions",
                                JSON.stringify(updated)
                              );
                            }
                            return updated;
                          });

                          toast({
                            title: "Skipped Question from practice",
                          });
                        }}
                        className="hover:gradient-primary hover:text-white transition-all duration-300 bg-transparent"
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => markAsSolved(question.id)}
                      className="gradient-primary text-white border-0 glow-primary hover:glow-accent transition-all duration-300 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Solved
                    </Button>

                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        {(() => {
                          const current = currentQuestions.find(
                            (q) => q.id === question.id
                          );

                          return (
                            <Button
                              onClick={() => {
                                const updatedQuestion =
                                  storage.toggleReviseLater(question.id);

                                setCurrentQuestions((prev) => {
                                  const updated = prev.map((q) =>
                                    q.id === question.id
                                      ? {
                                          ...q,
                                          reviseLater:
                                            updatedQuestion.reviseLater,
                                        }
                                      : q
                                  );

                                  // also update localStorage cache
                                  if (typeof window !== "undefined") {
                                    localStorage.setItem(
                                      "lastRandomQuestions",
                                      JSON.stringify(updated)
                                    );
                                  }

                                  return updated;
                                });

                                // ✅ Show correct toast based on new state
                                toast({
                                  title: updatedQuestion.reviseLater
                                    ? "Marked for Revision"
                                    : "Removed from Revision",
                                  description: updatedQuestion.reviseLater
                                    ? "Question added to your revision list."
                                    : "Question removed from your revision list.",
                                });
                              }}
                              className={`gradient-secondary text-white border-0 glow-secondary hover:glow-accent transition-all duration-300 flex items-center gap-2 ${
                                current?.reviseLater
                                  ? "opacity-100"
                                  : "opacity-70"
                              }`}
                            >
                              {/* ✅ Show tick when marked, repeat otherwise */}
                              {current?.reviseLater ? (
                                <BookMarked className="h-4 w-4" />
                              ) : (
                                <Bookmark className="h-4 w-4" />
                              )}
                              {current?.reviseLater
                                ? "Marked for Revision"
                                : "Mark for Revision"}
                            </Button>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("lastRandomQuestions");
                  setCurrentQuestions([]);
                }}
                className="hover:gradient-secondary hover:text-white transition-all duration-300"
              >
                Clear All Questions
              </Button>
            </div>
          </div>
        )}

        {/* Congratulations Section */}
        {currentQuestions.length === 0 &&
          stats.totalQuestions > 0 &&
          stats.solvedQuestions === stats.totalQuestions && (
            <Card className="mb-6 gradient-card border-0 glow-accent">
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2 gradient-text-primary">
                  Congratulations!
                </h3>
                <p className="text-muted-foreground mb-4">
                  You've solved all questions in the selected topic. Great job!
                </p>

                {/* Reset Progress Button */}
                {stats.solvedQuestions > 0 && (
                  <div className="text-center">
                    <Button
                      onClick={resetAllProgress}
                      variant="outline"
                      className="gradient-hover text-white border-0 glow-primary bg-transparent"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Progress
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
      </div>

      {/* Notes Dialog Component */}
      {selectedQuestionForNotes && (
        <NotesDialog
          questionId={selectedQuestionForNotes.id}
          questionTitle={selectedQuestionForNotes.title}
          currentNotes={selectedQuestionForNotes.notes}
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          onNotesUpdated={handleNotesUpdated}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset All Progress"
        description="Are you sure you want to reset all progress? This will mark all questions as unsolved but preserve your notes."
        confirmText="Reset Progress"
        variant="destructive"
        onConfirm={confirmResetProgress}
      />
    </div>
  );
}
