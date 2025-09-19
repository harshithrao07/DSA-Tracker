"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { ApiResponse } from "@/types/response";
import { QuestionStatsCount } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

interface StatsContextType {
  stats: QuestionStatsCount;
  refreshStats: () => Promise<void>; // async refresh
}

const defaultStats: QuestionStatsCount = {
  totalQuestions: 0,
  solvedQuestions: 0,
  remQuestions: 0,
  markedForRevision: 0,
  questionStatsCountDifficulties: [],
  questionStatsCountTopics: [],
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<QuestionStatsCount>(defaultStats);
  const { toast } = useToast();

  const getQuestionStatsCount = async () => {
    try {
      const result = await axios.get<ApiResponse<QuestionStatsCount>>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/stats-count`,
        { withCredentials: true }
      );

      if (!result.data.success) {
        console.error("Error fetching stats:", result.data.errorMessage);
        toast({
          title: "Error",
          description: "Failed to fetch question stats",
          variant: "destructive",
        });
        return;
      }

      setStats(result.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch question stats",
        variant: "destructive",
      });
    }
  };

  // Expose a refresh function
  const refreshStats = async () => {
    await getQuestionStatsCount();
  };

  useEffect(() => {
    getQuestionStatsCount();
  }, []);

  return (
    <StatsContext.Provider value={{ stats, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
};

// Hook to consume stats context
export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) throw new Error("useStats must be used within a StatsProvider");
  return context;
};
