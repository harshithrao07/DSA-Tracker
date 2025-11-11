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
import {
  RefreshCw,
  RotateCcw,
  Bookmark,
  BookMarked,
  CheckCircle2,
  Circle,
  NotebookPen,
  Calendar,
  ChevronDown,
  History,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { ApiResponse } from "@/types/response";
import { QuestionResponse } from "@/types/question";
import { Topic } from "@/types/topic";
import { useStats } from "@/context/StatsContext";
import { cn, formatDate } from "@/lib/utils";
import { NotesDialog } from "@/components/notes-dialog";

export default function HomePage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<QuestionResponse[]>(
    []
  );
  const { stats, refreshStats } = useStats();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedHistories, setExpandedHistories] = useState<string[]>([]);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionResponse | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const result = await axios.get<ApiResponse<Topic[]>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
          {
            withCredentials: true,
          }
        );

        if (!result.data.success) {
          console.error(
            "Error in fetching all topics from server: ",
            result.data.errorMessage
          );
          return;
        }

        setTopics(result.data.data);
      } catch (error) {
        console.error("Error in fetching all topics from server: ", error);
        setTopics([]);
      }
    }

    fetchTopics();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("filters");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.topics) setSelectedTopics(parsed.topics);
      if (parsed.difficulty) setSelectedDifficulty(parsed.difficulty);
      if (parsed.count) setQuestionCount(parsed.count);
    }
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      const cached = localStorage.getItem("lastRandomQuestions");
      if (!cached) return;

      try {
        const parsed: QuestionResponse[] = JSON.parse(cached);
        if (!parsed.length) return;

        const ids = parsed.map((q) => q.id);

        const result = await axios.post<ApiResponse<QuestionResponse[]>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions/getQuestionsBasedOnIds`,
          { questionsIds: ids },
          { withCredentials: true }
        );

        if (!result.data.success || !result.data.data) {
          console.error("Failed to fetch questions", result.data.errorMessage);
          return;
        }

        // put API results in a map for quick lookup
        const dataMap = new Map(result.data.data.map((q) => [q.id, q]));

        // preserve order based on cached ids
        const ordered = ids
          .map((id) => dataMap.get(id))
          .filter((q): q is QuestionResponse => !!q);

        // filter out solved
        const unsolvedOnly = ordered.filter((q) => !q.solved);

        setCurrentQuestions(unsolvedOnly);

        localStorage.setItem(
          "lastRandomQuestions",
          JSON.stringify(unsolvedOnly)
        );
      } catch (err) {
        console.error("Failed to fetch cached questions", err);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (currentQuestions.length === 0) {
      refreshStats();
    }
  }, [currentQuestions]);

  const openNotesDialog = (question: QuestionResponse) => {
    setSelectedQuestion(question);
    setNotesDialogOpen(true);
  };

  // Function to add a topic to the selected topics
  const addTopic = (topicName: string) => {
    if (topicName && !selectedTopics.includes(topicName)) {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };

  // Function to remove a topic from the selected topics
  const removeTopic = (topicName: string) => {
    setSelectedTopics(selectedTopics.filter((topic) => topic !== topicName));
  };

  // Function to clear all selected topics
  const clearAllTopics = () => {
    setSelectedTopics([]);
  };

  // Get available topics for the dropdown (exclude already selected ones)
  const availableTopics = topics.filter(
    (topic) => !selectedTopics.includes(topic.name)
  );

  const getRandomQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        topics: selectedTopics.length ? selectedTopics.join(",") : "",
        difficulty: selectedDifficulty === "all" ? "" : selectedDifficulty,
        count: questionCount.toString(),
      });

      const result = await axios.get<ApiResponse<QuestionResponse[]>>(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/v1/questions/random?${params.toString()}`,
        {
          withCredentials: true,
        }
      );

      if (!result.data.success) {
        console.error(
          "Error in getting random quesions from server: ",
          result.data.errorMessage
        );
        return;
      }

      setCurrentQuestions(result.data.data);
      localStorage.setItem(
        "lastRandomQuestions",
        JSON.stringify(result.data.data)
      );
    } catch (error) {
      console.error("Error in getting random question from server: ", error);
    }

    const filters = {
      topics: selectedTopics,
      difficulty: selectedDifficulty,
      count: questionCount,
    };
    localStorage.setItem("filters", JSON.stringify(filters));

    setIsLoading(false);
  };

  const updateQuestionField = async (
    questionId: string,
    field: "solved" | "reviseLater",
    value: boolean
  ) => {
    if (updating === questionId) return;
    setUpdating(questionId);

    try {
      const result = await axios.put<ApiResponse<QuestionResponse>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions/${questionId}`,
        { [field]: value }, // dynamic field update
        { withCredentials: true }
      );

      if (!result.data.success) {
        toast({
          title: "Error",
          description: `Failed to update question ${field}`,
          variant: "destructive",
        });
        return;
      }

      if (field === "solved") {
        setCurrentQuestions((prev) => {
          const updated = prev.filter((q) => q.id !== questionId);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "lastRandomQuestions",
              JSON.stringify(updated)
            );
          }
          return updated;
        });

        toast({
          title: "🎉 Congratulations!",
          description: "You just solved this problem. Keep going! 🚀",
          variant: "default",
        });
      } else if (field === "reviseLater") {
        setCurrentQuestions((prev) => {
          const updated = prev.map((q) =>
            q.id === questionId ? result.data.data : q
          );
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "lastRandomQuestions",
              JSON.stringify(updated)
            );
          }
          return updated;
        });

        toast({
          title: `Question updated`,
          description: value
            ? "Marked for revision"
            : "Removed from revision list",
        });
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        title: "Error",
        description: "Something went wrong updating the question",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleSolveHistory = (questionId: string) => {
    setExpandedHistories((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "HARD":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const confirmResetProgress = async () => {
    try {
      const result = await axios.get<ApiResponse<boolean>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/reset-progress`,
        {
          withCredentials: true,
        }
      );

      if (!result.data.success) {
        console.error(
          "Error resetting questions progress. ",
          result.data.errorMessage
        );
        toast({
          title: "Progress Reset",
          description: "Error resetting questions progress.",
          variant: "destructive",
        });
        return;
      }

      if (result.data.data) {
        toast({
          title: "Progress Reset",
          description: "All question progress has been reset successfully.",
        });

        refreshStats();
      }
    } catch (error) {
      console.error("Error resetting questions progress. ", error);
      toast({
        title: "Progress Reset",
        description: "Error resetting questions progress.",
        variant: "destructive",
      });
    }
  };

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
            <div className="space-y-4">
              {/* Topics Section */}
              <div>
                <label className="text-sm font-medium mb-2 block">Topics</label>

                {/* Selected Topics Display */}
                {selectedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-background/20 rounded-lg border border-white/10">
                    {selectedTopics.map((topic) => (
                      <Badge
                        key={topic}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm flex items-center gap-2"
                      >
                        {topic}
                        <button
                          onClick={() => removeTopic(topic)}
                          className="hover:text-blue-300 transition-colors"
                          title="Remove topic"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllTopics}
                      className="h-7 px-2 text-xs bg-transparent border-white/20 text-gray-400 hover:bg-white/10 hover:text-white"
                    >
                      Clear All
                    </Button>
                  </div>
                )}

                {/* Topic Selector */}
                <div className="flex gap-2">
                  <Select
                    value=""
                    onValueChange={addTopic}
                    disabled={availableTopics.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue
                        placeholder={
                          availableTopics.length === 0
                            ? "All topics selected"
                            : selectedTopics.length === 0
                            ? "Select topics"
                            : "Add another topic"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTopics.length > 0 ? (
                        availableTopics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.name}>
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              {topic.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-400">
                          No more topics available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTopics.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    No topics selected - will search all topics
                  </p>
                )}
              </div>

              {/* Difficulty and Questions Row */}
              <div className="flex gap-4 items-end">
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
                    className={`h-4 w-4 mr-2 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Get Questions
                </Button>
              </div>
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
                className={cn(
                  "transition-all hover:shadow-lg rounded-2xl bg-background/40 backdrop-blur-md border border-white/10",
                  question.solved && "border-green-500/30 bg-green-950/20"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title and Status */}
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            !updating &&
                            updateQuestionField(
                              question.id,
                              "solved",
                              !question.solved
                            )
                          }
                          disabled={updating === question.id}
                          className={cn(
                            "mt-1 cursor-pointer transition-colors",
                            question.solved
                              ? "text-green-500 hover:text-green-400"
                              : "text-gray-500 hover:text-gray-300"
                          )}
                          title={
                            question.solved
                              ? "Mark as unsolved"
                              : "Mark as solved"
                          }
                        >
                          {updating === question.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : question.solved ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div className="flex-1">
                          {question.link ? (
                            <Link
                              href={question.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "text-lg font-semibold hover:text-blue-400 transition-colors cursor-pointer",
                                question.solved
                                  ? "line-through text-gray-500"
                                  : "text-white"
                              )}
                            >
                              {question.title}
                            </Link>
                          ) : (
                            <h3
                              className={cn(
                                "text-lg font-semibold",
                                question.solved
                                  ? "line-through text-gray-500"
                                  : "text-white"
                              )}
                            >
                              {question.title}
                            </h3>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNotesDialog(question)}
                          className="flex cursor-pointer items-center gap-2 bg-background/40 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                          title={
                            question.noteId ? "View/Edit Notes" : "Add Notes"
                          }
                        >
                          <NotebookPen className="h-4 w-4" />
                          {question.noteId ? "View/Edit Notes" : "Add Notes"}
                        </Button>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 ml-8">
                        {(question.topics || []).map((topic, index) => (
                          <Badge
                            key={index}
                            className="px-2 py-1 bg-background/30 backdrop-blur-sm border border-white/10 text-gray-300 text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                        <Badge
                          className={cn(
                            "px-2 py-1 text-xs bg-background/30 backdrop-blur-sm border border-white/10",
                            getDifficultyColor(question.difficulty)
                          )}
                        >
                          {question.difficulty.charAt(0).toUpperCase() +
                            question.difficulty.slice(1).toLowerCase()}
                        </Badge>
                        {question.solved && (
                          <Badge className="px-2 py-1 bg-green-900/40 text-green-400 border-green-500/30 text-xs">
                            ✓ Solved
                          </Badge>
                        )}
                        {question.reviseLater && (
                          <Badge className="px-2 py-1 bg-orange-900/40 text-orange-400 border-orange-500/30 text-xs">
                            Revision
                          </Badge>
                        )}
                      </div>

                      {/* Dates & Solve History */}
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Added {formatDate(question.createdAt)}
                          </div>
                          {question.solveHistory?.length > 0 && (
                            <button
                              onClick={() => toggleSolveHistory(question.id)}
                              className="flex items-center gap-1 cursor-pointer text-green-400 hover:text-green-300 transition-colors"
                              title="View solve history"
                            >
                              <History className="h-4 w-4" />
                              <span>
                                {question.solveHistory.length} solve
                                {question.solveHistory.length !== 1 ? "s" : ""}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  expandedHistories?.includes(question.id) &&
                                    "rotate-180"
                                )}
                              />
                            </button>
                          )}
                        </div>

                        {question.solveHistory?.length > 0 &&
                          expandedHistories?.includes(question.id) && (
                            <div className="mt-3 pl-4 border-l-2 border-white/10 space-y-2">
                              <div className="text-xs font-medium text-gray-300 mb-2">
                                Solved Timeline
                              </div>
                              {question.solveHistory.map((date, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <div className="w-2 h-2 bg-green-500 rounded-full -ml-[5px]" />
                                  <span className="text-gray-400">
                                    Solved on {formatDate(date)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          !updating &&
                          updateQuestionField(
                            question.id,
                            "reviseLater",
                            !question.reviseLater
                          )
                        }
                        disabled={updating === question.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 transition-colors bg-background/40 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-orange-400",
                          question.reviseLater &&
                            "bg-orange-900/30 border-orange-700/50 text-orange-400"
                        )}
                        title={
                          question.reviseLater
                            ? "Remove from revise later"
                            : "Mark for revision"
                        }
                      >
                        {updating === question.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : question.reviseLater ? (
                          <BookMarked className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                        {question.reviseLater ? "Marked" : "Mark"}
                      </Button>
                    </div>
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
                      onClick={confirmResetProgress}
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
      {selectedQuestion && (
        <NotesDialog
          selectedQuestion={selectedQuestion}
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
        />
      )}
    </div>
  );
}
