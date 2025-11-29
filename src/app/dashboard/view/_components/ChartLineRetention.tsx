"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import { Info, MoreVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";

type RetentionApiResponse = {
  day1_retention: number;
  day1_completed_retention: number;
  day1_users: number;
  day3_retention: number;
  day3_completed_retention: number;
  day3_users: number;
  day7_retention: number;
  day7_completed_retention: number;
  day7_users: number;
  day15_retention: number;
  day15_completed_retention: number;
  day15_users: number;
  day30_retention: number;
  day30_completed_retention: number;
  day30_users: number;
  day60_retention: number;
  day60_completed_retention: number;
  day60_users: number;
  day90_retention: number;
  day90_completed_retention: number;
  day90_users: number;
  day1_exercise_completion?: Array<{
    exercise_index: number;
    users_completed_exercise: number;
    eligible_users_with_exercise: number;
    exercise_completion_percentage: number;
  }>;
  customRangeDays?: number;
  isCustomRange?: boolean;
};

type ChartPoint = {
  day: string;
  retention: number;
  completedRetention: number;
  users: number;
  exerciseBreakdown?: RetentionApiResponse["day1_exercise_completion"];
};

// Define which days to include for each range (must match route.ts logic)
const dayMap: Record<string, string[]> = {
  "3d": ["day1", "day3"],
  "7d": ["day1", "day3", "day7"],
  "15d": ["day1", "day3", "day7", "day15"],
  "30d": ["day1", "day3", "day7", "day15", "day30"],
  "60d": ["day1", "day3", "day7", "day15", "day30", "day60"],
  "90d": ["day1", "day3", "day7", "day15", "day30", "day60", "day90"],
  lifetime: ["day1", "day3", "day7", "day15", "day30", "day60", "day90"],
};

// Helper function to get eligible days based on range days
const getEligibleDays = (rangeDays: number): string[] => {
  const allDays = ["day1", "day3", "day7", "day15", "day30", "day60", "day90"];
  const dayValues = [1, 3, 7, 15, 30, 60, 90];

  // Filter days that are within the range
  return allDays.filter((day, index) => dayValues[index] <= rangeDays);
};

// Helper function to transform time range to human-readable format
const getTimeRangeLabel = (range: string): string => {
  const rangeLabels: Record<string, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "60d": "Last 60 days",
    "90d": "Last 90 days",
    lifetime: "lifetime",
  };
  return rangeLabels[range] || range;
};

const chartConfig = {
  retention: { label: "Active Users %", color: "var(--chart-1)" },
  completedRetention: { label: "Completed Exercises %", color: "#808080" }, // changed to gray
} satisfies ChartConfig;

// Added constants & labels for new eligible types
const PRESET_USER_TYPES = ["all", "vip", "freev2", "free", "eligible_true", "eligible_false"];
const USER_TYPE_LABELS: Record<string, string> = {
  all: "All Users",
  eligible_true: "freev2 (eligible)",
  eligible_false: "freev2 (not eligible)",
  vip: "vip",
  freev2: "freev2",
  free: "free",
};

export function ChartLineRetention() {
  const [chartData, setChartData] = React.useState<ChartPoint[]>([]);
  const [userTypes, setUserTypes] = React.useState<string[]>(PRESET_USER_TYPES);
  const [selectedUserType, setSelectedUserType] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState("lifetime"); // default to lifetime
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  ); // default to today
  const [showCustomRange, setShowCustomRange] = React.useState(false);
  const [showRangeDialog, setShowRangeDialog] = React.useState(false);
  const [rangeMode, setRangeMode] = React.useState<"predefined" | "custom">(
    "predefined"
  );

  // 🧩 Fetch user types (preserve preset eligible types + de-duplicate API results)
  React.useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const res = await fetch("/api/user-types");
        const data = await res.json();
        const apiTypes = Array.isArray(data)
          ? data.map((item: any) => item.user_type).filter(Boolean)
          : [];
        const combined = Array.from(new Set([...PRESET_USER_TYPES, ...apiTypes]));
        setUserTypes(combined);
      } catch (err) {
        console.error("Failed to fetch user types:", err);
        // keep presets if API fails
        setUserTypes(PRESET_USER_TYPES);
      }
    };
    fetchUserTypes();
  }, []);

  // 📊 Fetch retention data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let url = `/api/retention?user_type=${selectedUserType}&range=${timeRange}`;

        if (startDate && endDate) {
          url += `&start_date=${startDate}&end_date=${endDate}`;
        }

        const res = await fetch(url);
        const data: RetentionApiResponse = await res.json();

        let selectedDays: string[];

        if (data.isCustomRange && data.customRangeDays) {
          selectedDays = getEligibleDays(data.customRangeDays);
        } else {
          selectedDays = dayMap[timeRange] || dayMap["lifetime"];
        }

        const points: ChartPoint[] = selectedDays.map((day) => {
          const dayNum = day.replace("day", "");
          return {
            day: `Day ${dayNum}`,
            retention: (data as any)[`${day}_retention`] || 0,
            completedRetention:
              (data as any)[`${day}_completed_retention`] || 0,
            users: (data as any)[`${day}_users`] || 0,
            // Add exercise breakdown only for day1
            exerciseBreakdown:
              day === "day1" ? data.day1_exercise_completion : undefined,
          };
        });

        setChartData(points);
      } catch (err) {
        console.error("Failed to fetch retention data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUserType, timeRange, startDate, endDate]);

  return (
    <Card className="@container/card">
      <CardHeader className="gap-2 flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <CardTitle className="flex items-center gap-2">
          User Retention
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <p>
                  <strong>How retention is calculated:</strong>
                </p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>
                    <strong>Eligible Users:</strong> Users who created their
                    account at least N days ago. Only eligible users are counted
                    for retention.
                  </li>
                  <li>
                    <strong>Active Users:</strong> Eligible users who had
                    progress recorded on that specific day.
                  </li>
                  <li>
                    <strong>Completed Exercises:</strong> Eligible users who
                    completed <em>all exercises</em>
                    on that day.
                  </li>
                  <li>
                    <strong>Active Users Retention %:</strong> (Active Users ÷
                    Eligible Users) × 100.
                  </li>
                  <li>
                    <strong>Completed Retention %:</strong> (Users with all
                    exercises completed ÷ Eligible Users) × 100.
                  </li>
                  <li>
                    <strong>Day 1 Exercise Breakdown:</strong> Shows completion
                    percentage for each of the 4 exercises.
                    <ul className="list-disc ml-4 space-y-1 mt-1">
                      <li>
                        Each exercise percentage = (Users completed exercise ÷
                        Eligible users with that exercise) × 100
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Data Filtering by Mode:</strong>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>
                        <strong>Lifetime Mode:</strong> All users are included
                        regardless of creation date.{" "}
                      </li>
                      <li>
                        <strong>Relative Range Mode (e.g., 7d, 30d):</strong>{" "}
                        Only users created within the last N days are included.
                        Users must be old enough to be eligible for each
                        retention day.{" "}
                      </li>
                      <li>
                        <strong>Custom Date Range Mode:</strong> Users created
                        between the selected start date and today are included.{" "}
                      </li>
                    </ul>
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>

        <CardDescription>
          {showCustomRange && startDate
            ? `Retention from ${startDate} to today`
            : `Percentage of users retained over ${getTimeRangeLabel(
                timeRange
              )}`}
        </CardDescription>

        <CardAction className="flex items-center gap-2">
          <Select
            value={selectedUserType}
            onValueChange={(value) => setSelectedUserType(value)}
          >
            <SelectTrigger className="flex w-44" size="sm">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {userTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {USER_TYPE_LABELS[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`relative p-2 rounded-md transition-colors ${
                  timeRange !== "lifetime" || showCustomRange
                    ? "bg-primary/20 hover:bg-primary/30"
                    : "hover:bg-accent"
                }`}
              >
                <MoreVertical className="size-4" />
                {(timeRange !== "lifetime" || showCustomRange) && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRangeDialog(true)}>
                Select Time Range
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>

        {/* Range Selection Dialog */}
        <Dialog open={showRangeDialog} onOpenChange={setShowRangeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Time Range</DialogTitle>
              <DialogDescription>
                Choose a predefined range or set a custom date range
              </DialogDescription>
            </DialogHeader>

            {/* Toggle between Predefined and Custom Ranges */}
            <div className="flex gap-2 border rounded-md p-1 bg-muted">
              <button
                onClick={() => setRangeMode("predefined")}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  rangeMode === "predefined"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Predefined
              </button>
              <button
                onClick={() => setRangeMode("custom")}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  rangeMode === "custom"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </div>

            <div className="space-y-6">
              {/* Predefined Ranges */}
              {rangeMode === "predefined" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "7d", label: "Last 7 days" },
                      { value: "30d", label: "Last month" },
                      { value: "60d", label: "Last 60 days" },
                      { value: "90d", label: "Last 90 days" },
                      { value: "lifetime", label: "Lifetime" },
                    ].map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setTimeRange(range.value);
                          setStartDate(null);
                          setShowCustomRange(false);
                          setShowRangeDialog(false);
                        }}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          timeRange === range.value && !showCustomRange
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-accent"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Range Section */}
              {rangeMode === "custom" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">
                      Starting From:
                    </label>
                    <DatePicker
                      value={startDate || ""}
                      onValueChange={(value) => setStartDate(value)}
                      placeholder="Pick a start date"
                    />
                  </div>
                  {/* End Date is hidden, always set to today */}

                  {/* Confirm Button */}
                  <button
                    onClick={() => {
                      if (startDate) {
                        setShowCustomRange(true);
                        setShowRangeDialog(false);
                      }
                    }}
                    disabled={!startDate}
                    className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-56">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex gap-6 mb-2 items-center">
              {Object.entries(chartConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  {/* Line sample for legend */}
                  <div
                    style={{
                      width: "24px",
                      height: "2px",
                      backgroundColor:
                        key === "completedRetention"
                          ? "transparent"
                          : config.color,
                      borderTop:
                        key === "completedRetention"
                          ? `2px dashed ${config.color}`
                          : undefined,
                    }}
                  />
                  <span className="text-sm">{config.label}</span>
                </div>
              ))}
            </div>

            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload as ChartPoint;
                      const isDay1 = data.day === "Day 1";

                      return (
                        <div className="border z-50 bg-white dark:bg-accent rounded-lg p-3 shadow-lg max-w-sm">
                          {/* Header */}
                          <div className="font-semibold text-xs mb-2">
                            {data.day}
                          </div>

                          {/* Main metrics */}
                          <div className="space-y-1 mb-3 text-xs">
                            <div className="flex justify-between gap-1">
                              <span className="text-muted-foreground">
                                Active Users:
                              </span>
                              <span className="font-medium">
                                {data.retention}%
                              </span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="text-muted-foreground">
                                Completed:
                              </span>
                              <span className="font-medium">
                                {data.completedRetention}%
                              </span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="text-muted-foreground">
                                Eligible Users:
                              </span>
                              <span className="font-medium">{data.users}</span>
                            </div>
                          </div>

                          {/* Day 1 Exercise Breakdown */}
                          {isDay1 && data.exerciseBreakdown && (
                            <>
                              <div className="border-t pt-2 mt-2">
                                {/* Progress bars for each exercise */}
                                <div className="space-y-2">
                                  {data.exerciseBreakdown.map((exercise) => (
                                    <div key={exercise.exercise_index}>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium">
                                          Exercise{" "}
                                          {exercise.exercise_index}
                                        </span>
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                          {exercise.exercise_completion_percentage}%
                                        </span>
                                      </div>

                                      {/* Progress bar */}
                                      <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                                          style={{
                                            width: `${exercise.exercise_completion_percentage}%`,
                                          }}
                                        />
                                      </div>

                                      {/* Count info */}
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {exercise.users_completed_exercise} /{" "}
                                        {
                                          exercise.eligible_users_with_exercise
                                        }{" "}
                                        users
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Drop-off insight */}
                                {data.exerciseBreakdown.length > 1 && (
                                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                    <div className="font-semibold text-orange-600 dark:text-orange-400">
                                      📊 Drop-off:
                                    </div>
                                    <div>
                                      {(
                                        data.exerciseBreakdown[0]
                                          .exercise_completion_percentage -
                                        data.exerciseBreakdown[
                                          data.exerciseBreakdown.length - 1
                                        ].exercise_completion_percentage
                                      ).toFixed(1)}
                                      % from first to last
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {Object.entries(chartConfig).map(([key, config]) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray={
                      key === "completedRetention" ? "5 5" : undefined
                    }
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
