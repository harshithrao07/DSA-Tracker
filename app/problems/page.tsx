"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { NotesDialog } from "@/components/notes-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import {
  Search,
  Filter,
  Trash2,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Circle,
  NotebookPen,
  BookMarked,
  Bookmark,
  ChevronDown,
  History,
  X,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiResponse } from "@/types/response";
import { AllQuestions, QuestionResponse } from "@/types/question";
import axios from "axios";
import { Topic } from "@/types/topic";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

// Multi-Select Topic Component Props Interface
interface MultiTopicSelectorProps {
  topics: Topic[];
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  className?: string;
}

// Multi-Select Topic Component
const MultiTopicSelector: React.FC<MultiTopicSelectorProps> = ({
  topics,
  selectedTopics,
  onTopicsChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredTopics = topics.filter((topic: Topic) =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTopic = (topicName: string): void => {
    const updatedTopics = selectedTopics.includes(topicName)
      ? selectedTopics.filter((t: string) => t !== topicName)
      : [...selectedTopics, topicName];
    onTopicsChange(updatedTopics);
  };

  const removeTopic = (topicName: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    onTopicsChange(selectedTopics.filter((t: string) => t !== topicName));
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedTopics.length === 0 ? (
            <span className="text-muted-foreground">Select topics...</span>
          ) : (
            selectedTopics.map((topic: string) => (
              <Badge
                key={topic}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {topic}
                <X
                  className="h-3 w-3 hover:text-red-400 cursor-pointer"
                  onClick={(e) => removeTopic(topic, e)}
                />
              </Badge>
            ))
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <div className="p-2">
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {selectedTopics.length > 0 && (
              <div className="px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start text-xs text-muted-foreground"
                  onClick={() => onTopicsChange([])}
                >
                  Clear all selections
                </Button>
              </div>
            )}
            {filteredTopics.map((topic: Topic) => (
              <div
                key={topic.id}
                className="flex items-center px-2 py-1 hover:bg-accent cursor-pointer"
                onClick={() => toggleTopic(topic.name)}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border rounded-sm flex items-center justify-center">
                    {selectedTopics.includes(topic.name) && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <span className="text-sm">{topic.name}</span>
                </div>
              </div>
            ))}
            {filteredTopics.length === 0 && searchTerm && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No topics found
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

// Stats Interface
interface Stats {
  totalQuestions: number;
  solvedQuestions: number;
  remQuestions: number;
}

// Confirmation Dialog State Interface
interface ConfirmationDialogState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

// Main Component
const ProblemsPage: React.FC = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    solvedQuestions: 0,
    remQuestions: 0,
  });
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [notesDialogOpen, setNotesDialogOpen] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionResponse | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<string[]>([]);
  const [confirmationDialog, setConfirmationDialog] =
    useState<ConfirmationDialogState>({
      open: false,
      title: "",
      description: "",
      onConfirm: () => {},
    });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [infiniteLoading, setInfiniteLoading] = useState<boolean>(false); // start as false
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filtersVersion, setFiltersVersion] = useState<number>(0); // new trigger for filters

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Fetch topics once
  useEffect(() => {
    async function fetchTopics(): Promise<void> {
      try {
        const result = await axios.get<ApiResponse<Topic[]>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
          { withCredentials: true }
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

  // Reset and bump version when filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setQuestions([]);
    setFiltersVersion((v) => v + 1); // forces fetch
  }, [
    debouncedSearchTerm,
    selectedTopics,
    selectedDifficulty,
    selectedStatus,
    sortBy,
  ]);

  // Fetch whenever page or filtersVersion changes
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filtersVersion]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !infiniteLoading && hasMore) {
          console.log("🔹 Loading next page...");
          setPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 } // prefetch a bit earlier
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [infiniteLoading, hasMore]);

  // ✅ Fixed fetchQuestions
  async function fetchQuestions(): Promise<void> {
    if (infiniteLoading) return; // avoid overlapping fetches

    console.log("📦 Fetching page:", page);
    setInfiniteLoading(true);

    try {
      let apiSortBy = sortBy;
      let sortDir = "";

      switch (sortBy) {
        case "oldest":
          apiSortBy = "createdAt";
          sortDir = "asc";
          break;
        case "title":
          apiSortBy = "title";
          sortDir = "asc";
          break;
        case "newest":
        default:
          apiSortBy = "createdAt";
          sortDir = "desc";
          break;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        key: debouncedSearchTerm.trim(),
        topics: selectedTopics.length === 0 ? "" : selectedTopics.join(","),
        difficulty: selectedDifficulty === "all" ? "" : selectedDifficulty,
        status: selectedStatus === "all" ? "" : selectedStatus,
        sortBy: apiSortBy,
        sortDir,
      });

      const result = await axios.get<ApiResponse<AllQuestions>>(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/v1/questions?${params.toString()}`,
        { withCredentials: true }
      );

      if (!result.data.success) {
        toast({
          title: "Error",
          description: "Error in fetching questions",
          variant: "destructive",
        });
        return;
      }

      const allQuestions = result.data.data.questionResponseDTOList || [];

      if (page === 0) {
        setStats({
          totalQuestions: result.data.data.totalQuestions,
          solvedQuestions: result.data.data.solvedQuestions,
          remQuestions: result.data.data.remQuestions,
        });
        setQuestions(allQuestions);
      } else {
        setQuestions((prev) => {
          const merged = [...prev, ...allQuestions];
          const unique = Array.from(
            new Map(merged.map((q) => [q.id, q])).values()
          );
          return unique;
        });
      }

      // If fewer results than pageSize, no more pages
      setHasMore(allQuestions.length >= pageSize);
      if (allQuestions.length === 0 && page === 0) {
        setHasMore(false);
      }

      console.log("✅ Fetch done, total questions:", allQuestions.length);
    } catch (error) {
      console.error("Error in fetching questions from server:", error);
      toast({
        title: "Error",
        description: "Error in fetching questions",
        variant: "destructive",
      });
      if (page === 0) setQuestions([]);
      setHasMore(false);
    } finally {
      setInfiniteLoading(false);
    }
  }

  const deleteQuestion = (questionId: string, title: string): void => {
    setConfirmationDialog({
      open: true,
      title: "Delete Question",
      description: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const result = await axios.delete<ApiResponse<boolean>>(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions/${questionId}`,
            { withCredentials: true }
          );

          if (!result.data.success) {
            console.error(
              "Error in deleting question: ",
              result.data.errorMessage
            );
            return;
          }

          setQuestions((prevQuestion) => {
            const updated = prevQuestion.filter(
              (quest) => quest.id !== questionId
            );

            const stored = localStorage.getItem("lastRandomQuestions");
            if (stored) {
              const parsed: QuestionResponse[] = JSON.parse(stored);
              const updatedStored = parsed.filter((q) => q.id !== questionId);
              localStorage.setItem(
                "lastRandomQuestions",
                JSON.stringify(updatedStored)
              );
            }

            return updated;
          });

          toast({
            title: "Question deleted",
            description: `"${title}" has been removed`,
          });
        } catch (error) {
          console.error("Error in deleting question: ", error);
          toast({
            title: "Error",
            description: "Error in deleting question",
            variant: "destructive",
          });
        }
      },
    });
  };

  const updateQuestionField = async (
    questionId: string,
    field: "solved" | "reviseLater",
    value: boolean
  ): Promise<void> => {
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

      const updatedQuestion = result.data.data;

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updatedQuestion : q))
      );

      const stored = localStorage.getItem("lastRandomQuestions");
      if (stored) {
        const parsed: QuestionResponse[] = JSON.parse(stored);
        const updatedStored = parsed.map((q) =>
          q.id === questionId ? updatedQuestion : q
        );
        localStorage.setItem(
          "lastRandomQuestions",
          JSON.stringify(updatedStored)
        );
      }

      toast({
        title: `Question updated`,
        description:
          field === "solved"
            ? value
              ? "Marked as solved"
              : "Marked as unsolved"
            : value
            ? "Marked for revision"
            : "Removed from revision list",
      });
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

  const openNotesDialog = (question: QuestionResponse): void => {
    setSelectedQuestion(question);
    setNotesDialogOpen(true);
  };

  const resetAllFilters = (): void => {
    setSearchTerm("");
    setSelectedTopics([]); // Reset to empty array
    setSelectedDifficulty("all");
    setSelectedStatus("all");
    setSortBy("newest");
    setPageSize(10);
  };

  const toggleSolveHistory = (questionId: string): void => {
    setExpandedHistories((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getDifficultyColor = (difficulty: string): string => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Problems</h1>
              <p className="text-muted-foreground">
                Manage your DSA question collection.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.totalQuestions}</p>
              </Card>
              <Card className="p-4 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">Solved</p>
                <p className="text-xl font-bold text-green-600">
                  {stats.solvedQuestions}
                </p>
              </Card>
              <Card className="p-4 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-red-600">
                  {stats.remQuestions}
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="xl:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions and notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Multi-Topic Filter */}
              <MultiTopicSelector
                topics={topics || []}
                selectedTopics={selectedTopics}
                onTopicsChange={setSelectedTopics}
              />

              {/* Difficulty Filter */}
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="solved">Solved</SelectItem>
                  <SelectItem value="notSolved">Unsolved</SelectItem>
                  <SelectItem value="reviseLater">Revise Later</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {selectedTopics.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    Active Topic Filters:
                  </span>
                  {selectedTopics.map((topic: string) => (
                    <Badge
                      key={topic}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {topic}
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTopics([])}
                    className="text-xs h-6"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions List */}
        {(questions || []).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {(questions || []).length === 0
                  ? "No questions added yet"
                  : "No questions match your filters"}
              </div>
              {(questions || []).length === 0 ? (
                <Button asChild>
                  <a href="/add">Add Your First Question</a>
                </Button>
              ) : (
                <Button variant="outline" onClick={resetAllFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(questions || []).map((question: QuestionResponse) => (
              <Card
                key={question.id}
                className={`transition-all hover:shadow-lg bg-[#0e0e0e] border-gray-800 ${
                  question.solved
                    ? "border-green-700/50 bg-green-950/20"
                    : "hover:border-gray-700"
                }`}
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
                          className={`mt-1 cursor-pointer transition-colors ${
                            question.solved
                              ? "text-green-500 hover:text-green-400"
                              : "text-gray-500 hover:text-gray-300"
                          }`}
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
                              className={`text-lg font-semibold hover:text-blue-400 transition-colors cursor-pointer ${
                                question.solved
                                  ? "line-through text-gray-500"
                                  : "text-white"
                              }`}
                            >
                              {question.title}
                            </Link>
                          ) : (
                            <h3
                              className={`text-lg font-semibold ${
                                question.solved
                                  ? "line-through text-gray-500"
                                  : "text-white"
                              }`}
                            >
                              {question.title}
                            </h3>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNotesDialog(question)}
                          className="flex cursor-pointer items-center gap-2 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
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
                        {(question.topics || []).map(
                          (topic: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="px-2 py-1 bg-gray-800 text-gray-300 border-gray-700 text-xs"
                            >
                              {topic}
                            </Badge>
                          )
                        )}
                        <Badge
                          className={`px-2 py-1 text-xs ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty.charAt(0).toUpperCase() +
                            question.difficulty.slice(1).toLowerCase()}
                        </Badge>
                        {question.solved && (
                          <Badge className="px-2 py-1 bg-green-900/50 text-green-400 border-green-700/50 text-xs">
                            ✓ Solved
                          </Badge>
                        )}
                        {question.reviseLater && (
                          <Badge className="px-2 py-1 bg-orange-900/50 text-orange-400 border-orange-700/50 text-xs">
                            Revision
                          </Badge>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Added {formatDate(question.createdAt)}
                          </div>
                          {question.solveHistory &&
                            question.solveHistory.length > 0 && (
                              <button
                                onClick={() => toggleSolveHistory(question.id)}
                                className="flex items-center gap-1 cursor-pointer text-green-400 hover:text-green-300 transition-colors"
                                title="View solve history"
                              >
                                <History className="h-4 w-4" />
                                <span>
                                  {question.solveHistory.length} solve
                                  {question.solveHistory.length !== 1
                                    ? "s"
                                    : ""}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedHistories?.includes(question.id)
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>
                            )}
                        </div>

                        {/* Solve History Timeline */}
                        {question.solveHistory &&
                          question.solveHistory.length > 0 &&
                          expandedHistories?.includes(question.id) && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-700 space-y-2">
                              <div className="text-xs font-medium text-gray-300 mb-2">
                                Solved Timeline
                              </div>
                              {question.solveHistory.map(
                                (date: number, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <div className="w-2 h-2 bg-green-500 rounded-full -ml-[5px]"></div>
                                    <span className="text-gray-400">
                                      Solved on {formatDate(date)}
                                    </span>
                                  </div>
                                )
                              )}
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
                        className={`flex cursor-pointer items-center gap-2 ${
                          question.reviseLater
                            ? "bg-orange-900/30 border-orange-700/50 text-orange-400"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-orange-400"
                        }`}
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

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          deleteQuestion(question.id, question.title)
                        }
                        className="text-red-400 bg-gray-800 border-gray-700 hover:text-red-300 hover:bg-red-900/20 hover:border-red-700/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedQuestion && (
        <NotesDialog
          selectedQuestion={selectedQuestion}
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
        />
      )}

      <ConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open: boolean) =>
          setConfirmationDialog((prev) => ({ ...prev, open }))
        }
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmationDialog.onConfirm}
      />

      <div ref={loaderRef} className="h-10 flex items-center justify-center">
        {infiniteLoading && <span className="text-gray-400">Loading...</span>}
      </div>
    </div>
  );
};

export default ProblemsPage;
