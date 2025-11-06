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
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
};

type ChartPoint = {
  day: string;
  retention: number;
  completedRetention: number;
  users: number;
};

// Update chartConfig with red and blue
// const chartConfig = {
//   retention: { label: "Retention %", color: "#007bff" },         // Blue
//   completedRetention: { label: "Completed Exercises %", color: "#ff4d4f" }, // Red
// } satisfies ChartConfig;

const chartConfig = {
  retention: { label: "Active Users %", color: "var(--chart-1)" },
  completedRetention: { label: "Completed Exercises %", color: "#808080" }, // changed to gray
} satisfies ChartConfig;

export function ChartLineRetention() {
  const [chartData, setChartData] = React.useState<ChartPoint[]>([]);
  const [userTypes, setUserTypes] = React.useState<string[]>([]);
  const [selectedUserType, setSelectedUserType] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = React.useState("90d"); // default to 90 days
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
        const res = await fetch(
          `/api/retention?user_type=${selectedUserType}&range=${timeRange}`
        );
        const data: RetentionApiResponse = await res.json();

        // Define which days to include for each range (must match route.ts dayMap)
        const dayMap: Record<string, string[]> = {
          "3d": ["day1", "day3"],
          "7d": ["day1", "day3", "day7"],
          "15d": ["day1", "day3", "day7", "day15"],
          "30d": ["day1", "day3", "day7", "day15", "day30"],
          "60d": ["day1", "day3", "day7", "day15", "day30", "day60"],
          "90d": ["day1", "day3", "day7", "day15", "day30", "day60", "day90"],
        };

        const selectedDays = dayMap[timeRange] || dayMap["90d"];

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
  }, [selectedUserType, timeRange]);

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
                    account at least N days ago.
                  </li>
                  <li>
                    <strong>Active Users:</strong> Users who were active on that
                    day (had any progress recorded).
                  </li>
                  <li>
                    <strong>Completed Exercises:</strong> Users who completed{" "}
                    <em>all exercises</em> for that day.
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
                    <strong>Intervals:</strong> Calculated for day1, day3, day7,
                    day15, day30, day60, and day90.
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>

        <CardDescription>
          Percentage of users retained over time
        </CardDescription>

        <CardAction className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="3d">Last 3 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last month</ToggleGroupItem>
            <ToggleGroupItem value="60d">Last 60 days</ToggleGroupItem>
            <ToggleGroupItem value="90d">Overall</ToggleGroupItem>
          </ToggleGroup>
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
        </CardAction>
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
