"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import Profile from "@/components/ProfileComponent";
import { useStats } from "@/context/StatsContext";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Dashboard() {
  const { stats } = useStats();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      router.replace("/dashboard"); // remove query param from URL
    }
  }, [searchParams, router]);

  const totalQuestions = stats.totalQuestions;
  const solvedQuestions = stats.solvedQuestions;
  const unsolvedQuestions = stats.remQuestions;
  const overallProgress =
    totalQuestions > 0 ? (solvedQuestions / totalQuestions) * 100 : 0;

  const topicStats = stats.questionStatsCountTopics;

  // Difficulty-wise statistics
  const difficultyStats = stats.questionStatsCountDifficulties.map((d) => ({
    name: d.name, // "Easy", "Medium", "Hard"
    solved: d.solvedQuestions,
    total: d.totalQuestions,
    remaining: d.remQuestions,
    progress:
      d.totalQuestions > 0
        ? Math.round((d.solvedQuestions / d.totalQuestions) * 100)
        : 0,
  }));

  const pieData = difficultyStats.map((stat) => ({
    name: stat.name,
    value: stat.solved,
    total: stat.total,
  }));

  const COLORS = {
    EASY: "#22c55e",
    MEDIUM: "#f59e0b",
    HARD: "#ef4444",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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

        <Profile />

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
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats?.questionStatsCountTopics?.map((topic) => {
                  const progress =
                    topic.totalQuestions > 0
                      ? (topic.solvedQuestions / topic.totalQuestions) * 100
                      : 0;

                  return (
                    <Card
                      key={topic.id}
                      className="p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 hover:shadow-lg hover:shadow-primary/10 transition-all"
                    >
                      {/* Topic header */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-100">
                          {topic.name}
                        </h3>
                        <span className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                          {topic.solvedQuestions}/{topic.totalQuestions}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <Progress
                          value={progress}
                          className="h-2 rounded-full bg-gray-800 [&>div]:bg-primary"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {progress.toFixed(0)}% complete
                        </p>
                      </div>

                      {/* Solved / Remaining info */}
                      <div className="flex justify-between text-sm mb-4">
                        <span className="flex items-center gap-1 text-green-400 font-medium">
                          <CheckCircle size={14} /> {topic.solvedQuestions}{" "}
                          solved
                        </span>
                        <span className="flex items-center gap-1 text-red-400 font-medium">
                          <XCircle size={14} /> {topic.remQuestions} remaining
                        </span>
                      </div>

                      {/* Difficulty breakdown */}
                      <div className="space-y-2">
                        {topic.questionStatsCountDifficulties?.map((d) => {
                          const dProgress =
                            d.totalQuestions > 0
                              ? (d.solvedQuestions / d.totalQuestions) * 100
                              : 0;

                          const colors: Record<string, string> = {
                            Easy: "text-green-400",
                            Medium: "text-yellow-400",
                            Hard: "text-red-400",
                          };

                          return (
                            <div key={d.name} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 ${
                                    colors[d.name]
                                  }`}
                                >
                                  {d.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {d.solvedQuestions}/{d.totalQuestions}
                                </span>
                              </div>
                              <Progress
                                value={dProgress}
                                className="h-1.5 rounded-full [&>div]:bg-current"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </CardContent>
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
                    <div className="w-full h-[280px] flex flex-col items-center justify-center">
                      <ChartContainer
                        config={{}}
                        className="w-full h-[220px] bg-gray-900 rounded-lg p-2"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    COLORS[entry.name as keyof typeof COLORS]
                                  }
                                  stroke="#1f2937" // dark stroke to separate slices
                                />
                              ))}
                            </Pie>
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              cursor={{ fill: "rgba(255,255,255,0.1)" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      {/* Legend */}
                      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
                        {pieData.map((entry) => {
                          const total = pieData.reduce(
                            (sum, e) => sum + e.value,
                            0
                          );
                          const percentage =
                            total > 0
                              ? ((entry.value / total) * 100).toFixed(0)
                              : 0;

                          return (
                            <div
                              key={entry.name}
                              className="flex items-center gap-2"
                            >
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    COLORS[entry.name as keyof typeof COLORS],
                                }}
                              />
                              <span className="text-gray-200">
                                {entry.name}:{" "}
                                <span className="font-semibold">
                                  {entry.value}
                                </span>{" "}
                                ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
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

                {topicStats.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Topics Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {topicStats.map((topic) => (
                        <Badge
                          key={topic.id}
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          {topic.name}
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
    </div>
  );
}
