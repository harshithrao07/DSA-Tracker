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
import { Plus, LinkIcon, Download, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import axios from "axios";
import { QuestionAutofillResponse, QuestionResponse } from "@/types/question";
import { ApiResponse } from "@/types/response";
import { Topic } from "@/types/topic";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function AddQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [existingTopics, setExistingTopics] = useState<Topic[]>([]);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [selectedExistingTopic, setSelectedExistingTopic] = useState("");
  const [platformName, setPlatformName] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    topics: [] as string[],
    newTopic: "",
    difficulty: "" as "EASY" | "MEDIUM" | "HARD" | "",
    link: "",
    reviseLater: false,
    notes: "",
  });

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

        setExistingTopics(result.data.data);
      } catch (error) {
        console.error(
          "Error in fetching all topics from server: ",
          error
        );
        setExistingTopics([]);
      }
    }

    fetchTopics();
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

    setIsAutoFetching(true);
    try {
      const result = await axios.post<ApiResponse<QuestionAutofillResponse>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions/autofill`,
        {
          link: formData.link,
        },
        {
          withCredentials: true,
        }
      );

      if (!result.data.success) {
        console.error("Auto-fetch error in server: ", result.data.errorMessage);
        toast({
          title: "Could not fetch details",
          description: "Unable to extract problem information from this link",
          variant: "destructive",
        });
        return;
      }

      const data = result.data.data;
      const platform = data.platform;
      if (!platform) {
        toast({
          title: "Unsupported platform",
          description:
            "Currently supports LeetCode, Codeforces and GeeksForGeeks",
          variant: "destructive",
        });
        return;
      } else {
        setPlatformName(platform);
      }

      const suggestedTopics = data.topics.map((t) => t.trim());
      const newTopics = suggestedTopics.filter(
        (topic) => !formData.topics.includes(topic)
      );

      setFormData((prev) => ({
        ...prev,
        title: data.title,
        difficulty: data.difficulty,
        topics: [...prev.topics, ...newTopics],
      }));

      toast({
        title: "Problem details fetched!",
        description: `Successfully loaded details from ${
          data.platform
        }. Added ${newTopics.length} topic${newTopics.length > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Auto-fetch error: ", error);
      toast({
        title: "Fetch failed",
        description: "An error occurred while fetching problem details",
        variant: "destructive",
      });
    } finally {
      setIsAutoFetching(false);
    }
  };

  const handleAddTopic = async () => {
    const topic = formData.newTopic.trim();
    if (!topic) return;

    try {
      const result = await axios.post<ApiResponse<Topic>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/topics`,
        {
          name: topic,
        },
        {
          withCredentials: true,
        }
      );

      if (!result.data.success) {
        console.error("Error while adding topic: ", result.data.errorMessage);
        toast({
          title: "Could not add topic",
          description: "Unable to add a new topic",
          variant: "destructive",
        });
        return;
      }

      if (!formData.topics.includes(topic)) {
        setFormData((prev) => ({
          ...prev,
          topics: [...prev.topics, topic],
          newTopic: "",
        }));

        setExistingTopics((prev) => {
          if (!prev.some((t) => t.name === topic)) {
            return [...prev, result.data.data];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error while adding topic: ", error);
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

  const performQuestionValidation = async (e: React.FormEvent) => {
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

    var duplicate: boolean = true;
    try {
      const result = await axios.post<ApiResponse<boolean>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions/checkIfExists`,
        {
          title: formData.title.trim(),
        },
        {
          withCredentials: true,
        }
      );

      if (!result.data.success) {
        console.error(
          "Error while adding question: ",
          result.data.errorMessage
        );
        toast({
          title: "Could not add question",
          description: "Unable to add a new question",
          variant: "destructive",
        });
        return;
      }

      duplicate = result.data.data;
    } catch (error) {
      console.error("Error while checking for question: ", error);
    }

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
      const result = await axios.post<ApiResponse<QuestionResponse>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/questions`,
        {
          title: formData.title.trim(),
          link: formData.link.trim(),
          reviseLater: formData.reviseLater || false,
          topics: formData.topics,
          difficulty: formData.difficulty,
          note: formData.notes || undefined,
        },
        {
          withCredentials: true,
        }
      );

      if (!result.data.success) {
        console.error(
          "Error while adding question: ",
          result.data.errorMessage
        );
        toast({
          title: "Could not add question",
          description: "Unable to add a new question",
          variant: "destructive",
        });
        return;
      }

      setFormData({
        title: "",
        topics: [],
        newTopic: "",
        difficulty: "",
        link: "",
        reviseLater: false,
        notes: "",
      });
      setPlatformName("");

      toast({
        title: "Added question successfully",
      });
    } catch (error) {
      console.error("Add question error:", error);
      toast({
        title: "Error adding question",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExistingTopic = (topic: string) => {
    if (topic && !formData.topics.includes(topic)) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, topic],
      }));
    }

    setSelectedExistingTopic("");
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
              Add a new question to your practice collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={performQuestionValidation} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Problem Link
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
                {!platformName.trim() && (
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
                      <Select
                        value={selectedExistingTopic}
                        onValueChange={handleSelectExistingTopic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing topic" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                          {existingTopics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.name}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Add New Topic Input */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Add new topic:
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
                  onValueChange={(value: "EASY" | "MEDIUM" | "HARD") =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Revise Later Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reviseLater"
                  checked={formData.reviseLater}
                  onChange={(e) =>
                    setFormData({ ...formData, reviseLater: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="reviseLater">Mark for revision later</Label>
              </div>

              {/* Notes Field */}
              <div className="space-y-2" data-color-mode="dark">
                <Label htmlFor="notes">Notes (Markdown supported)</Label>
                <MDEditor
                  value={formData.notes}
                  onChange={(value) =>
                    setFormData({ ...formData, notes: value || "" })
                  }
                  height={200}
                />
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
                  onClick={() => {
                    setFormData({
                      title: "",
                      topics: [],
                      newTopic: "",
                      difficulty: "",
                      link: "",
                      reviseLater: false,
                      notes: "",
                    });
                    setPlatformName("");
                  }}
                  disabled={isSubmitting || isAutoFetching}
                  className="bg-transparent hover:gradient-secondary hover:text-white"
                >
                  Clear
                </Button>
              </div>
            </form>
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
