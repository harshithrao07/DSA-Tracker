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
import { RotateCcw, Mail } from "lucide-react";
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
        { withCredentials: true }
      );

      if (!result.data.success) {
        toast({
          title: "Progress Reset",
          description: "Error resetting questions progress.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Progress Reset",
        description: "All question progress has been reset successfully.",
      });

      refreshStats();
    } catch (error) {
      toast({
        title: "Progress Reset",
        description: "Error resetting questions progress.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-8 mb-10">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        
        {/* 1. Profile Section - Reorganized to Horizontal Layout */}
        <Card className="gradient-card glow-primary w-full overflow-hidden">
          <div className="flex flex-col md:flex-row items-center p-6 gap-6">
            
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
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
            </div>

            {/* User Details */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-3xl font-bold gradient-text-primary">
                {user.name}
              </h2>
              <div className="flex items-center justify-center md:justify-start text-gray-400 gap-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0">
              <Button
                variant="destructive"
                onClick={handleResetProgress}
                className="shadow-md"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Progress
              </Button>
            </div>
          </div>
        </Card>

        {/* 2. Heatmap Section - Full Width */}
        <Card className="gradient-card glow-accent w-full">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold gradient-text-primary">
                  Heatmap Activity
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your daily coding consistency
                </CardDescription>
              </div>
              
              {/* Year Tabs */}
              {years.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
                        year === activeYear
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                      onClick={() => setActiveYear(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {heatmapData.length > 0 ? (
              <>
                {activeYear != null && heatmapByYear[activeYear] && (
                  <div className="w-full overflow-x-auto pb-2">
                    {/* Width Wrapper */}
                    <div style={{ width: "max-content", minWidth: "100%" }}>
                      <HeatMap
                        // FIX: maxWidth: 'none' ensures the SVG expands fully and doesn't squash
                        style={{ color: "#dadada", maxWidth: "none" }}
                        
                        value={heatmapByYear[activeYear].map((d) => ({
                          date: d.date,
                          count: d.count,
                        }))}
                        
                        startDate={new Date(Number(activeYear), 0, 1)}
                        
                        // FIX: Logic to handle current year vs past years correctly
                        endDate={
                          Number(activeYear) === new Date().getFullYear()
                            ? new Date() // Today
                            : new Date(Number(activeYear), 11, 31) // Dec 31
                        }
                        
                        rectSize={14}
                        space={4} // Slightly more space between squares for readability
                        weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
                        monthLabels={[
                          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                        ]}
                        panelColors={{
                          0: "#1f2937", // Empty
                          2: "#14532d", // Low (Darker green)
                          4: "#166534", 
                          6: "#22c55e", 
                          8: "#4ade80", // High (Bright green)
                        }}
                        rectRender={(props, data) => {
                          if (!data.date) return <rect {...props} />;
                          const formatted = format(new Date(data.date), "MMM do, yyyy");
                          return (
                            <Tippy
                              content={`${data.count ?? 0} activities on ${formatted}`}
                            >
                              <rect {...props} className="cursor-pointer hover:stroke-white hover:stroke-1" />
                            </Tippy>
                          );
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center items-center h-40 text-gray-400">
                No activity recorded yet. Start solving problems!
              </div>
            )}
          </CardContent>
        </Card>
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