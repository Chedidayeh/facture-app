"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical, Eye } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ClientTableData } from "../actions";
import { ClientDetailsSheet } from "./client-details-sheet";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const dashboardColumns: ColumnDef<ClientTableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clientCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code Client" />,
    cell: ({ row }) => (
      <div className="font-mono text-sm font-semibold">{row.original.clientCode}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nom",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nom / Raison Sociale" />,
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.nom}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "typeClient",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type Client" />,
    cell: ({ row }) => (
      <Badge variant={row.original.typeClient === "Particulier" ? "secondary" : "default"}>
        {row.original.typeClient}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "matriculeFiscal",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Matricule Fiscal" />,
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.matriculeFiscal}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "pays",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pays" />,
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.pays}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "deviseParDefaut",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Devise" />,
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.deviseParDefaut}</Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nombreFactures",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Nb Factures" />,
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.original.nombreFactures}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "totalFactureHT",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Total HT" />,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm">
        {row.original.totalFactureHT.toFixed(2)} TND
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "totalTVA",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Total TVA" />,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm">
        {row.original.totalTVA.toFixed(2)} TND
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "totalTTC",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Total TTC" />,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm font-semibold">
        {row.original.totalTTC.toFixed(2)} TND
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "statut",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => (
      <Badge variant={row.original.statut === "Actif" ? "default" : "outline"}>
        {row.original.statut}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const [detailsOpen, setDetailsOpen] = React.useState(false);
      
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
                <EllipsisVertical className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
                <Eye className="mr-2 size-4" />
                Voir Détails
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ClientDetailsSheet
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            clientId={row.original.id}
          />
        </>
      );
    },
    enableSorting: false,
  },
];
