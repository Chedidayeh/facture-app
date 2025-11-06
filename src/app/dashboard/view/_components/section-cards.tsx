/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client";

import { useEffect, useState } from "react";

import { TrendingUp, TrendingDown, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type GroupedUser = {
  user_type: string;
  user_count: number;
};

type Stats = {
  todayUsers: number;
  totalUsers: number;
  freev2StartedUsers: number
  last7DaysUsers: number;
  activeUsers: number;
  groupedUsers: GroupedUser[];
  inactiveUsers7Days: number;
  inactiveUsersPercent7Days: number;
};

export function SectionCards() {
  const [stats, setStats] = useState<Stats>({
    todayUsers: 0,
    totalUsers: 0,
    freev2StartedUsers: 0,
    last7DaysUsers: 0,
    activeUsers: 0,
    groupedUsers: [],
    inactiveUsers7Days: 0,
    inactiveUsersPercent7Days: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/user-stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || "Failed to fetch stats");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);



  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 1️⃣ Users who started today */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Users Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.todayUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 cursor-pointer text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                This shows the number of users who **started their treatment today**.
                <ul className="list-disc ml-4 space-y-1">
                  <li>Only includes users whose `start_date` is today.</li>
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  This helps track how many fresh users joined today and are starting their treatment journey.
                </p>
              </TooltipContent>

            </Tooltip>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Started today <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Fresh users joined today</div>
        </CardFooter>
      </Card>

      {/* 2️⃣ Total Users */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 ml-1 cursor-pointer text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                This shows the **total number of registered users** in the system.
                <ul className="list-disc ml-4 space-y-1">
                  <li>Represents all-time users who have registered and are active in the system.</li>
                  <li>Includes users grouped by type</li>
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  This metric helps you understand the overall user base size for reporting and analytics purposes.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex gap-2 font-medium">
              Total started freev2 users
            </div>
            <div>
              <Badge>
                {loading ? "-" : stats.freev2StartedUsers.toLocaleString()}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 font-medium">
            Overall registered users
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-2">
            {loading
              ? "Loading..."
              : stats.groupedUsers.map((group) => (
                <Badge key={group.user_type} variant="secondary">
                  {group.user_type}: {group.user_count.toLocaleString()}
                </Badge>
              ))}
          </div>
        </CardFooter>
      </Card>


      {/* 3️⃣ Users started in last 7 days */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Users (Last 7 Days)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.last7DaysUsers.toLocaleString()} <br />
            {/* percent  {stats.inactiveUsersPercent7Days.toLocaleString()}% <br />
            number {stats.inactiveUsers7Days.toLocaleString()} */}
          </CardTitle>
          <CardAction>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 ml-1 cursor-pointer text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                This shows the number of users who **started their treatment in the last 7 days**.
                <ul className="list-disc ml-4 space-y-1">
                  <li>Includes users with a valid `start_date` within the last 7 days (including today).</li>
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  This metric helps track **recent user growth** and weekly engagement trends.
                </p>
              </TooltipContent>

            </Tooltip>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Recent growth <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Users started in the past week</div>
        </CardFooter>
      </Card>

      {/* 4️⃣ Active Users (Last 7 Days) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Users (Last 7 Days)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.activeUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 ml-1 cursor-pointer text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-sm">
                <p>
                  This number shows how many users have been <strong>active during the last 7 days</strong>.
                </p>

                <ul className="list-disc ml-4 space-y-1 mt-1">
                  <li>
                    Each user’s activity is tracked daily when they make progress or complete tasks.
                  </li>
                  <li>
                    The system looks at all users and checks who had any activity within the past week.
                  </li>
                  <li>
                    Only users who actually did any progress.
                  </li>
                </ul>

                <p className="mt-2 text-xs text-muted-foreground">
                  In simple terms, this total reflects how many people have used the platform recently and stayed engaged over the past 7 days.
                </p>
              </TooltipContent>


            </Tooltip>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Engaged users <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Activity recorded in the last 7 days</div>
        </CardFooter>
      </Card>


    </div>
  );
}
