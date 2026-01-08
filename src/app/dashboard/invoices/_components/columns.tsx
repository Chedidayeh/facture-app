import { ColumnDef } from "@tanstack/react-table";
import { 
  EllipsisVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  Copy, 
  FileText, 
  DollarSign, 
  Receipt,
  FileX
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { InvoiceTableData } from "../actions";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const dashboardColumns: ColumnDef<InvoiceTableData>[] = [
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
    accessorKey: "invoiceNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="N° Facture" />,
    cell: ({ row }) => (
      <div className="font-mono text-sm font-semibold">{row.original.invoiceNumber}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      return <div className="text-sm">{format(row.original.date, "dd/MM/yyyy", { locale: fr })}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => {
      return <div className="font-medium text-sm">{row.original.clientName}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const variant = row.original.type === "Local" ? "secondary" : "default";
      return <Badge variant={variant}>{row.original.type}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "currency",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Devise" />,
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.currency}</Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "totalHT",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Total HT" />,
    cell: ({ row }) => (
      <div className="text-right font-medium text-sm">
        {row.original.totalHT.toFixed(2)} {row.original.currency}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "totalTVA",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="TVA" />,
    cell: ({ row }) => (
      <div className="text-right font-medium text-sm">
        {row.original.totalTVA.toFixed(2)} {row.original.currency}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "stampDuty",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Droit Timbre" />,
    cell: ({ row }) => (
      <div className="text-right font-medium text-sm">
        {row.original.stampDuty.toFixed(2)} {row.original.currency}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "totalTTC",
    header: ({ column }) => <DataTableColumnHeader className="text-right" column={column} title="Total TTC" />,
    cell: ({ row }) => (
      <div className="text-right">
        <Badge variant="secondary" className="font-mono text-sm font-semibold">
          {row.original.totalTTC.toFixed(2)} {row.original.currency}
        </Badge>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const statusColor = 
        row.original.status === "PAID" ? "default" :
        row.original.status === "VALIDATED" ? "secondary" : "outline";
      return (
        <Badge variant={statusColor}>
          {row.original.status}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const status = row.original.status;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
              <EllipsisVertical className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem>
              <Eye className="mr-2 size-4" />
              Voir Détails
            </DropdownMenuItem>
            
            {/* DRAFT actions */}
            {status === "DRAFT" && (
              <>
                <DropdownMenuItem>
                  <Pencil className="mr-2 size-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle className="mr-2 size-4" />
                  Valider
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 size-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
            
            {/* VALIDATED actions */}
            {status === "VALIDATED" && (
              <>
                <DropdownMenuItem>
                  <FileText className="mr-2 size-4" />
                  Générer PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DollarSign className="mr-2 size-4" />
                  Marquer comme Payée
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileX className="mr-2 size-4" />
                  Créer Avoir
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Receipt className="mr-2 size-4" />
                  Facture Rectificative
                </DropdownMenuItem>
              </>
            )}
            
            {/* PAID actions */}
            {status === "PAID" && (
              <>
                <DropdownMenuItem>
                  <FileText className="mr-2 size-4" />
                  Générer PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Receipt className="mr-2 size-4" />
                  Historique Paiements
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileX className="mr-2 size-4" />
                  Créer Avoir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
