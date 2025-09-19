"use client";

import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { ApiResponse } from "@/types/response";
import HeatMap from "@uiw/react-heat-map";
import { HeatMapValue } from "@/types/user";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { format } from "date-fns";
import { ConfirmationDialog } from "./confirmation-dialog";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";
import { useStats } from "@/context/StatsContext";

export default function ProfileHeatmap() {
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [heatmapData, setHeatmapData] = useState<HeatMapValue[]>([]);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { refreshStats } = useStats();

  useEffect(() => {
    async function fetchHeatmap() {
      try {
        const res = await axios.get<ApiResponse<HeatMapValue[]>>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/heatmap-activities`,
          { withCredentials: true }
        );
        if (res.data.success) setHeatmapData(res.data.data);
      } catch (error) {
        console.error("Error fetching heatmap", error);
        toast({ title: "Failed to fetch heatmap", variant: "destructive" });
      }
    }
    fetchHeatmap();
  }, [toast]);

  // Group by year
  const heatmapByYear = heatmapData.reduce((acc, item) => {
    const year = new Date(item.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<number, { date: string; count: number }[]>);

  const years = Object.keys(heatmapByYear)
    .map(Number)
    .sort((a, b) => a - b);

  useEffect(() => {
    if (activeYear === null && years.length > 0) {
      setActiveYear(years[years.length - 1]);
    }
  }, [years, activeYear]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-400 text-lg">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  const handleResetProgress = () => {
    setResetConfirmOpen(true);
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
    <div className="py-8 mb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <Card className="gradient-card glow-primary w-full max-w-xs transition-transform flex flex-col justify-center items-center" >
              <CardHeader className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary mb-4">
                  <img
                    src={
                      typeof user.pictureUrl === "string"
                        ? user.pictureUrl
                        : "/default-avatar.png"
                    }
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl font-semibold gradient-text-primary">
                  {user.name}
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm mt-1">
                  {user.email}
                </CardDescription>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetProgress}
                  className="glow-accent"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Progress
                </Button>
              </CardHeader>
            </Card>
          </div>

          {/* Heatmap Card */}
          <div className="lg:col-span-3">
            <Card className="gradient-card glow-accent w-fulltransition-transform">
              <CardHeader>
                <CardTitle className="text-xl font-semibold gradient-text-primary">
                  Heatmap Activity
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your DSA activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapData.length > 0 ? (
                  <div>
                    {/* Year Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {years.map((year) => (
                        <button
                          key={year}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            year === activeYear
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                          onClick={() => setActiveYear(year)}
                        >
                          {year}
                        </button>
                      ))}
                    </div>

                    {/* Heatmap */}
                    {activeYear != null && heatmapByYear[activeYear] && (
                      <HeatMap
                        value={heatmapByYear[activeYear].map((d) => ({
                          date: d.date,
                          count: d.count,
                        }))}
                        width="100%"
                        startDate={new Date(Number(activeYear), 0, 1)}
                        endDate={
                          Number(activeYear) === new Date().getFullYear()
                            ? new Date()
                            : new Date(Number(activeYear), 11, 31)
                        }
                        rectSize={14}
                        weekLabels={[
                          "Sun",
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                        ]}
                        monthLabels={[
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ]}
                        panelColors={{
                          0: "#1f2937",
                          2: "#22c55e",
                          4: "#16a34a",
                          6: "#15803d",
                          8: "#166534",
                        }}
                        rectRender={(props, data) => {
                          const date = new Date(data.date);
                          const formatted = format(date, "MMM do, yyyy");
                          return (
                            <Tippy
                              content={`${
                                data.count ?? 0
                              } activities on ${formatted}`}
                              followCursor={true}
                              placement="top"
                            >
                              <rect {...props} className="cursor-pointer" />
                            </Tippy>
                          );
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 text-gray-400 text-lg">
                    No heatmap data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
