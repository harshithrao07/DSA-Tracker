"use client";

import { useState } from "react";
import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { storage } from "@/lib/storage";
import { Plus, LinkIcon, Download, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  autoFetchProblemDetails,
  detectPlatform,
  platforms,
} from "@/lib/auto-fetch";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function AddQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [existingTopics, setExistingTopics] = useState<string[]>([]);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    topics: [] as string[],
    newTopic: "",
    difficulty: "" as "Easy" | "Medium" | "Hard" | "",
    link: "",
  });

  useEffect(() => {
    const allQuestions = storage.getQuestions() || [];
    const topicsSet = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.topics) {
        q.topics.forEach((topic) => topicsSet.add(topic));
      }
    });
    setExistingTopics(Array.from(topicsSet).sort());
  }, []);

  const handleAutoFetch = async () => {
    if (!formData.link.trim()) {
      toast({
        title: "Link required",
        description: "Please enter a problem link first",
        variant: "destructive",
      });
      return;
    }

    const platform = detectPlatform(formData.link);
    if (!platform) {
      toast({
        title: "Unsupported platform",
        description:
          "Currently supports LeetCode, Coding Ninjas and GeekForGeeks",
        variant: "destructive",
      });
      return;
    }

    setIsAutoFetching(true);

    try {
      const result = await autoFetchProblemDetails(formData.link);

      if (result) {
        const suggestedTopics = result.topic.split(",").map((t) => t.trim());
        const newTopics = suggestedTopics.filter(
          (topic) => !formData.topics.includes(topic)
        );

        setFormData((prev) => ({
          ...prev,
          title: result.title,
          difficulty: result.difficulty,
          topics: [...prev.topics, ...newTopics],
        }));

        toast({
          title: "Problem details fetched!",
          description: `Successfully loaded details from ${
            result.platform
          }. Added ${newTopics.length} topic${
            newTopics.length > 1 ? "s" : ""
          }.`,
        });
      } else {
        toast({
          title: "Could not fetch details",
          description: "Unable to extract problem information from this link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] Auto-fetch error:", error);
      toast({
        title: "Fetch failed",
        description: "An error occurred while fetching problem details",
        variant: "destructive",
      });
    } finally {
      setIsAutoFetching(false);
    }
  };

  const handleAddTopic = () => {
    const topic = formData.newTopic.trim();
    if (topic && !formData.topics.includes(topic)) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, topic],
        newTopic: "",
      }));
    }
  };

  const handleTopicRemove = (topic: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t !== topic),
    }));
  };

  const handleTopicKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.difficulty) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and difficulty.",
        variant: "destructive",
      });
      return;
    }

    if (formData.topics.length === 0) {
      toast({
        title: "Topic required",
        description: "Please add at least one topic.",
        variant: "destructive",
      });
      return;
    }

    // 🔹 Check for duplicate title
    const existingQuestions = storage.getQuestions() || [];
    const duplicate = existingQuestions.find(
      (q) =>
        q.title.trim().toLowerCase() === formData.title.trim().toLowerCase()
    );

    if (duplicate) {
      toast({
        title: "Duplicate question",
        description: `A question with the title "${formData.title}" already exists.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      storage.addQuestion({
        title: formData.title.trim(),
        topics: formData.topics,
        difficulty: formData.difficulty,
        link: formData.link.trim() || undefined,
      });

      toast({
        title: "Question added successfully!",
        description: `Added "${formData.title}" with ${
          formData.topics.length
        } topic${formData.topics.length > 1 ? "s" : ""}`,
      });

      setFormData({
        title: "",
        topics: [],
        newTopic: "",
        difficulty: "",
        link: "",
      });
    } catch (error) {
      console.error("[v0] Add question error:", error);
      toast({
        title: "Error adding question",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const detectedPlatform = formData.link ? detectPlatform(formData.link) : null;
  const platformName = detectedPlatform
    ? platforms[detectedPlatform]?.name
    : null;

  const handleSelectExistingTopic = (topic: string) => {
    if (topic && !formData.topics.includes(topic)) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, topic],
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="gradient-card border-0 glow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text-primary">
              <Plus className="h-5 w-5" />
              Add New DSA Question
            </CardTitle>
            <CardDescription>
              Add a new question to your practice collection. Fill in the
              details to help organize your study sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Link Field with Auto-Fetch */}
              <div className="space-y-2">
                <Label htmlFor="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Problem Link (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://leetcode.com/problems/two-sum/"
                    value={formData.link}
                    autoComplete="off"
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoFetch}
                    disabled={!formData.link.trim() || isAutoFetching}
                    className="flex items-center gap-2 shrink-0 bg-transparent hover:gradient-primary hover:text-white"
                  >
                    {isAutoFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isAutoFetching ? "Fetching..." : "Auto-Fill"}
                  </Button>
                </div>
                {platformName && (
                  <p className="text-sm text-muted-foreground">
                    Detected platform: {platformName}
                  </p>
                )}
              </div>

              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">Question Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Two Sum, Binary Tree Inorder Traversal"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              {/* Topic Selection */}
              <div className="space-y-2">
                <Label>Topics *</Label>
                <div className="space-y-3">
                  {existingTopics.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Select from existing topics:
                      </Label>
                      <Select onValueChange={handleSelectExistingTopic}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingTopics.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Add New Topic Input */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Or add new topic:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter topic name (e.g., Arrays, Dynamic Programming)"
                        value={formData.newTopic}
                        onChange={(e) =>
                          setFormData({ ...formData, newTopic: e.target.value })
                        }
                        onKeyPress={handleTopicKeyPress}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddTopic}
                        disabled={!formData.newTopic.trim()}
                        className="gradient-primary text-white border-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Added Topics Display */}
                  {formData.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.topics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() => handleTopicRemove(topic)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: "Easy" | "Medium" | "Hard") =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isAutoFetching}
                  className="flex-1 gradient-primary text-white border-0 glow-primary hover:glow-accent"
                >
                  {isSubmitting ? "Adding Question..." : "Add Question"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting || isAutoFetching}
                  className="bg-transparent hover:gradient-secondary hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Auto-Fetch Support</CardTitle>
            <CardDescription>
              Automatically extract problem details from supported platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(platforms).map(([key, platform]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{platform.name}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Paste a problem link and click "Auto-Fill" to automatically
              populate the form with problem details.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        title="Add Question"
        description={`Are you sure you want to add "${formData.title}" with ${
          formData.topics.length
        } topic${formData.topics.length > 1 ? "s" : ""}?`}
        confirmText="Add Question"
        onConfirm={confirmSubmit}
      />
    </div>
  );
}
