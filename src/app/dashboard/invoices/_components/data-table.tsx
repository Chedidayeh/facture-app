"use client";
"use no memo";

import { withDndColumn } from "@/components/data-table/table-utils";
import * as React from "react";
import { dashboardColumns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTable as DataTableNew } from "@/components/data-table/data-table";
import { InvoiceTableData } from "../actions";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";


export function DataTable({ data: initialData }: { data: InvoiceTableData[] }) {
  const [activeTab, setActiveTab] = React.useState("all");
  const [data, setData] = React.useState(() => initialData);
  const columns = withDndColumn(dashboardColumns);

  const filteredData = React.useMemo(() => {
    if (activeTab === "all") return data;
    return data.filter((item) => item.status === activeTab);
  }, [data, activeTab]);

  const table = useDataTableInstance({ data: filteredData, columns, getRowId: (row) => row.id.toString() });

  const getStatusCount = (status: string) => {
    return data.filter((item) => item.status === status).length;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les Factures ({data.length})</SelectItem>
            <SelectItem value="DRAFT">Brouillon ({getStatusCount("DRAFT")})</SelectItem>
            <SelectItem value="VALIDATED">Validée ({getStatusCount("VALIDATED")})</SelectItem>
            <SelectItem value="PAID">Payée ({getStatusCount("PAID")})</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all" className="gap-2">
            Toutes les Factures
            <Badge variant="outline" className="ml-1">{data.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="DRAFT" className="gap-2">
            Brouillon
            <Badge variant="outline" className="ml-1">{getStatusCount("DRAFT")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="VALIDATED" className="gap-2">
            Validée
            <Badge variant="outline" className="ml-1">{getStatusCount("VALIDATED")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="PAID" className="gap-2">
            Payée
            <Badge variant="outline" className="ml-1">{getStatusCount("PAID")}</Badge>
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
      <TabsContent value="DRAFT" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      <TabsContent value="VALIDATED" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      <TabsContent value="PAID" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
    </Tabs>
  );
}
