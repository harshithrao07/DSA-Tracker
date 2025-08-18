"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Trophy, Target, TrendingUp, RotateCcw, BookOpen } from "lucide-react";
import { storage } from "@/lib/storage";
import type { DSAQuestion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export default function Dashboard() {
  const [questions, setQuestions] = useState<DSAQuestion[]>([]);
  const { toast } = useToast();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    setQuestions(storage.getQuestions());
  }, []);

  const totalQuestions = questions.length;
  const solvedQuestions = questions.filter((q) => q.isSolved).length;
  const unsolvedQuestions = totalQuestions - solvedQuestions;
  const overallProgress =
    totalQuestions > 0 ? (solvedQuestions / totalQuestions) * 100 : 0;

  const allTopics = questions.flatMap((q) => q.topics);
  const uniqueTopics = [...new Set(allTopics)].filter(Boolean);
  const topicStats = uniqueTopics
    .map((topicName) => {
      const topicQuestions = questions.filter((q) =>
        q.topics.includes(topicName)
      );
      const topicSolved = topicQuestions.filter((q) => q.isSolved).length;
      const topicTotal = topicQuestions.length;
      const progress = topicTotal > 0 ? (topicSolved / topicTotal) * 100 : 0;

      return {
        name: topicName,
        total: topicTotal,
        solved: topicSolved,
        unsolved: topicTotal - topicSolved,
        progress: Math.round(progress),
      };
    })
    .filter((stat) => stat.total > 0);

  // Difficulty-wise statistics
  const difficultyStats = [
    {
      name: "Easy",
      solved: questions.filter((q) => q.difficulty === "Easy" && q.isSolved)
        .length,
      total: questions.filter((q) => q.difficulty === "Easy").length,
    },
    {
      name: "Medium",
      solved: questions.filter((q) => q.difficulty === "Medium" && q.isSolved)
        .length,
      total: questions.filter((q) => q.difficulty === "Medium").length,
    },
    {
      name: "Hard",
      solved: questions.filter((q) => q.difficulty === "Hard" && q.isSolved)
        .length,
      total: questions.filter((q) => q.difficulty === "Hard").length,
    },
  ].filter((stat) => stat.total > 0);

  const pieData = difficultyStats.map((stat) => ({
    name: stat.name,
    value: stat.solved,
    total: stat.total,
  }));

  const handleResetProgress = () => {
    setResetConfirmOpen(true);
  };

  const confirmResetProgress = () => {
    storage.resetAllQuestions();
    setQuestions(storage.getQuestions());
    toast({
      title: "Progress Reset",
      description: "All question progress has been reset successfully.",
    });
  };

  const COLORS = {
    Easy: "#22c55e",
    Medium: "#f59e0b",
    Hard: "#ef4444",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold gradient-text-primary">
            DSA Progress Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your Data Structures & Algorithms journey
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="gradient-card border-0 glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Questions
              </CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalQuestions}
              </div>
              <p className="text-xs text-muted-foreground">
                Questions in your collection
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 glow-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solved</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {solvedQuestions}
              </div>
              <p className="text-xs text-muted-foreground">
                Problems completed
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 glow-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unsolvedQuestions}</div>
              <p className="text-xs text-muted-foreground">Problems to solve</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 glow-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Math.round(overallProgress)}%
              </div>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts and Statistics */}
        <Tabs defaultValue="topics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger
              value="topics"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Topics
            </TabsTrigger>
            <TabsTrigger
              value="difficulty"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Difficulty
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="space-y-6">
            <Card className="gradient-card border-0 glow-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Topic-wise Progress
                </CardTitle>
                <CardDescription>
                  Your progress across different DSA topics
                </CardDescription>
              </CardHeader>

              {topicStats.length == 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No questions added yet
                </div>
              )}

              {/* Topic Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
                {topicStats.map((topic) => (
                  <Card key={topic.name} className="gradient-card border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {topic.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{topic.progress}%</span>
                      </div>
                      <Progress value={topic.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{topic.solved} solved</span>
                        <span>{topic.total} total</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="difficulty" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="gradient-card border-0 glow-primary">
                <CardHeader>
                  <CardTitle>Difficulty Distribution</CardTitle>
                  <CardDescription>
                    Problems solved by difficulty level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <div className="w-full h-[300px] flex items-center justify-center">
                      <ChartContainer config={{}} className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    COLORS[entry.name as keyof typeof COLORS]
                                  }
                                />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions added yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 glow-primary">
                <CardHeader>
                  <CardTitle>Difficulty Breakdown</CardTitle>
                  <CardDescription>
                    Detailed statistics by difficulty
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {difficultyStats.length == 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions added yet
                    </div>
                  )}

                  {difficultyStats.map((stat) => (
                    <div key={stat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-current"
                            style={{
                              color: COLORS[stat.name as keyof typeof COLORS],
                            }}
                          >
                            {stat.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {stat.solved}/{stat.total}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((stat.solved / stat.total) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(stat.solved / stat.total) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <Card className="gradient-card border-0 glow-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Overall Statistics
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleResetProgress}
                    className="glow-accent"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Progress
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      {totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Questions
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-400">
                      {solvedQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Questions Solved
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      {Math.round(overallProgress)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Completion Rate
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">
                      {Math.round(overallProgress)}%
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>

                {uniqueTopics.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Topics Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {uniqueTopics.map((topicName) => (
                        <Badge
                          key={topicName}
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          {topicName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
