"use client";

import { useState, useEffect } from "react";
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
import { storage } from "@/lib/storage";
import type { DSAQuestion } from "@/lib/types";
import {
  Search,
  Filter,
  Check,
  Trash2,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Circle,
  NotebookPen,
  Clock,
  Repeat,
  BookMarked,
  Bookmark,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProblemsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<DSAQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<DSAQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [topics, setTopics] = useState<string[]>([]);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<DSAQuestion | null>(
    null
  );
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    filterAndSortQuestions();
  }, [
    questions,
    searchTerm,
    selectedTopic,
    selectedDifficulty,
    selectedStatus,
    sortBy,
  ]);

  const loadQuestions = () => {
    const allQuestions = storage.getQuestions() || [];
    const topicsSet = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.topics) {
        q.topics.forEach((topic) => topicsSet.add(topic));
      }
    });
    setQuestions(allQuestions);
    setTopics(Array.from(topicsSet).sort());
  };

  const filterAndSortQuestions = () => {
    let filtered = [...(questions || [])];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (q.topics || []).some((topic) =>
            topic.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          (q.notes && q.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply topic filter
    if (selectedTopic !== "all") {
      filtered = filtered.filter((q) =>
        (q.topics || []).includes(selectedTopic)
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      if (selectedStatus === "revise") {
        filtered = filtered.filter((q) => q.reviseLater);
      } else {
        filtered = filtered.filter((q) =>
          selectedStatus === "solved" ? q.isSolved : !q.isSolved
        );
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "difficulty":
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case "topic":
          return (a.topics?.[0] || "").localeCompare(b.topics?.[0] || "");
        default:
          return 0;
      }
    });

    setFilteredQuestions(filtered);
  };

  const toggleSolved = (questionId: string, currentStatus: boolean) => {
    if (currentStatus) {
      storage.markAsUnsolved(questionId);
      toast({
        title: "Marked as unsolved",
        description: "Question moved back to practice list",
      });
    } else {
      storage.markAsSolved(questionId);
      toast({
        title: "Marked as solved",
        description: "Great job! Question completed",
      });
    }
    loadQuestions();
  };

  const deleteQuestion = (questionId: string, title: string) => {
    setConfirmationDialog({
      open: true,
      title: "Delete Question",
      description: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      onConfirm: () => {
        storage.deleteQuestion(questionId);
        toast({
          title: "Question deleted",
          description: `"${title}" has been removed`,
        });
        loadQuestions();
      },
    });
  };

  const openNotesDialog = (question: DSAQuestion) => {
    setSelectedQuestion(question);
    setNotesDialogOpen(true);
  };

  const handleNotesUpdated = () => {
    loadQuestions();
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedTopic("all");
    setSelectedDifficulty("all");
    setSelectedStatus("all");
    setSortBy("newest");
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const stats = storage.getStats();

  const toggleReviseLater = (questionId: string, currentStatus: boolean) => {
    storage.toggleReviseLater(questionId, !currentStatus);
    toast({
      title: currentStatus
        ? "Removed from revise later"
        : "Added to revise later",
      description: currentStatus
        ? "Question removed from revision list"
        : "Question marked for revision",
    });
    loadQuestions();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Problems</h1>
          <p className="text-muted-foreground">
            Manage your DSA question collection. {stats.totalQuestions} total
            questions, {stats.solvedQuestions} solved
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
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

              {/* Topic Filter */}
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {(topics || []).map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                  <SelectItem value="unsolved">Unsolved</SelectItem>
                  <SelectItem value="revise">Revise Later</SelectItem>
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
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="topic">Topic A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(filteredQuestions || []).length} of{" "}
                {(questions || []).length} questions
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {(filteredQuestions || []).length === 0 ? (
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
            {(filteredQuestions || []).map((question) => (
              <Card
                key={question.id}
                className={`transition-all ${
                  question.isSolved ? "bg-green-500/5 border-green-500/20" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title and Status */}
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            toggleSolved(question.id, question.isSolved)
                          }
                          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                          title={
                            question.isSolved
                              ? "Mark as unsolved"
                              : "Mark as solved"
                          }
                        >
                          {question.isSolved ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          {question.link ? (
                            <a
                              href={question.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-lg font-semibold hover:text-blue-400 transition-colors cursor-pointer ${
                                question.isSolved
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {question.title}
                            </a>
                          ) : (
                            <h3
                              className={`text-lg font-semibold ${
                                question.isSolved
                                  ? "line-through text-muted-foreground"
                                  : ""
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
                          className="flex cursor-pointer items-center gap-2"
                          title={
                            question.notes ? "View/Edit Notes" : "Add Notes"
                          }
                        >
                          <NotebookPen className="h-4 w-4" />
                          {question.notes ? "Notes" : "Add Notes"}
                        </Button>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 ml-8">
                        {(question.topics || []).map((topic, index) => (
                          <Badge key={index} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                        <Badge
                          className={getDifficultyColor(question.difficulty)}
                        >
                          {question.difficulty}
                        </Badge>
                        {question.isSolved && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Solved
                          </Badge>
                        )}
                        {question.reviseLater && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Marked for Revision
                          </Badge>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-4 ml-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Added {formatDate(question.createdAt)}
                        </div>
                        {question.solvedAt && (
                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Solved {formatDate(question.solvedAt)}
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
                          toggleReviseLater(
                            question.id,
                            question.reviseLater || false
                          )
                        }
                        className={`flex cursor-pointer items-center gap-2 ${
                          question.reviseLater
                            ? "bg-orange-500/10 border-orange-500/30"
                            : ""
                        }`}
                        title={
                          question.reviseLater
                            ? "Remove from revise later"
                            : "Mark for revision"
                        }
                      >
                        {question?.reviseLater ? (
                          <BookMarked className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                        {question.reviseLater
                          ? "Marked for Revision"
                          : "Mark for Revision"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          deleteQuestion(question.id, question.title)
                        }
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
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
          questionId={selectedQuestion.id}
          questionTitle={selectedQuestion.title}
          currentNotes={selectedQuestion.notes}
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          onNotesUpdated={handleNotesUpdated}
        />
      )}

      <ConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) =>
          setConfirmationDialog((prev) => ({ ...prev, open }))
        }
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmationDialog.onConfirm}
      />
    </div>
  );
}
