"use client";
"use no memo";

import { withDndColumn } from "@/components/data-table/table-utils";
import * as React from "react";
import { dashboardColumns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTable as DataTableNew } from "@/components/data-table/data-table";
import { ClientTableData } from "../actions";
import { Badge } from "@/components/ui/badge";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { ClientStatus } from "@/lib/types";

export function DataTable({ data: initialData }: { data: ClientTableData[] }) {
  const [data, setData] = React.useState(() => initialData);
  const [activeTab, setActiveTab] = React.useState("all");
  console.log("Initial Data:", initialData);
  
  const activeClients = React.useMemo(() => 
    initialData.filter(client => client.statut === ClientStatus.ACTIVE),
    [initialData]
  );
  
  const filteredData = React.useMemo(() => {
    if (activeTab === "active") {
      return activeClients;
    }
    return data;
  }, [activeTab, data, activeClients]);

  const columns = withDndColumn(dashboardColumns);
  const table = useDataTableInstance({ 
    data: filteredData, 
    columns, 
    getRowId: (row) => row.id.toString() 
  });

  return (
    <Tabs 
      defaultValue="all" 
      className="w-full flex-col justify-start gap-6"
      onValueChange={setActiveTab}
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="all" onValueChange={setActiveTab}>
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">
            Tous les Clients
            <Badge variant="outline" className="ml-1">
              {initialData.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">Active
            <Badge variant="outline" className="ml-1">
              {activeClients.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <TabsContent value="all" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      <TabsContent value="active" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
    </Tabs>
  );
}
