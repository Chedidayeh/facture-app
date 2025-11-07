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
  customRangeDays?: number;
  isCustomRange?: boolean;
};

type ChartPoint = {
  day: string;
  retention: number;
  completedRetention: number;
  users: number;
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
    "lifetime": "lifetime"
  };
  return rangeLabels[range] || range;
};

const chartConfig = {
  retention: { label: "Active Users %", color: "var(--chart-1)" },
  completedRetention: { label: "Completed Exercises %", color: "#808080" }, // changed to gray
} satisfies ChartConfig;

export function ChartLineRetention() {
  const [chartData, setChartData] = React.useState<ChartPoint[]>([]);
  const [userTypes, setUserTypes] = React.useState<string[]>([]);
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
  // 🧩 Fetch user types
  React.useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const res = await fetch("/api/user-types");
        const data = await res.json();
        setUserTypes(["all", ...data.map((item: any) => item.user_type)]);
      } catch (err) {
        console.error("Failed to fetch user types:", err);
      }
    };
    fetchUserTypes();
  }, []);

  // 📊 Fetch retention data based on selected user type and time range
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        let url = `/api/retention?user_type=${selectedUserType}&range=${timeRange}`;
        
        // Add custom date range if provided
        if (startDate && endDate) {
          url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        const res = await fetch(url);
        const data: RetentionApiResponse = await res.json();

        // Determine which days to display
        let selectedDays: string[];
        
        if (data.isCustomRange && data.customRangeDays) {
          // For custom ranges, dynamically calculate eligible days
          selectedDays = getEligibleDays(data.customRangeDays);
        } else {
          // For predefined ranges, use dayMap
          selectedDays = dayMap[timeRange] || dayMap["lifetime"];
        }

        // Dynamically build chart points based on selected days
        const points: ChartPoint[] = selectedDays.map((day) => {
          const dayNum = day.replace("day", "");
          return {
            day: `Day ${dayNum}`,
            retention: (data as any)[`${day}_retention`] || 0,
            completedRetention:
              (data as any)[`${day}_completed_retention`] || 0,
            users: (data as any)[`${day}_users`] || 0,
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
      <strong>Eligible Users:</strong> Users who created their account at least N days ago. Only eligible users are counted for retention.
    </li>
    <li>
      <strong>Active Users:</strong> Eligible users who had progress recorded on that specific day.
    </li>
    <li>
      <strong>Completed Exercises:</strong> Eligible users who completed <em>all exercises</em> 
      on that day.
    </li>
    <li>
      <strong>Active Users Retention %:</strong> (Active Users ÷ Eligible Users) × 100.
    </li>
    <li>
      <strong>Completed Retention %:</strong> (Users with all exercises completed ÷ Eligible Users) × 100.
    </li>
    <li>
      <strong>Data Filtering by Mode:</strong>
      <ul className="list-disc ml-4 space-y-1">
        <li>
          <strong>Lifetime Mode:</strong> All users are included regardless of creation date.User type filter can be applied.
        </li>
        <li>
          <strong>Relative Range Mode (e.g., 7d, 30d):</strong> Only users created within the last N days 
          are included. Users must be old enough to be eligible for each retention day.
        </li>
        <li>
          <strong>Custom Date Range Mode:</strong> Users created between the selected start date and today are included. 
          All user types are counted.
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
            : `Percentage of users retained over ${getTimeRangeLabel(timeRange)}`}
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
                  {type === "all" ? "All Users" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`relative p-2 rounded-md transition-colors ${
                timeRange !== "lifetime" || showCustomRange
                  ? "bg-primary/20 hover:bg-primary/30"
                  : "hover:bg-accent"
              }`}>
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
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Starting From:</label>
                    <input
                      type="date"
                      value={startDate || ""}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setStartDate(value);
                      }}
                      className="px-3 py-2 border rounded-md text-sm"
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
                      return (
                        <div className="border bg-white dark:bg-black rounded p-2 shadow">
                          <div className="font-medium">{data.day}</div>
                          <div>Active Users: {data.retention}%</div>
                          <div>Completed: {data.completedRetention}%</div>
                          <div>Users: {data.users}</div>
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
                    } // dashed for completedRetention
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
