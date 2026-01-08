import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

import { sectionSchema } from "./schema";

const chartData = [
  { month: "Janvier", invoices: 450, total: 2400 },
  { month: "Février", invoices: 520, total: 2800 },
  { month: "Mars", invoices: 380, total: 2000 },
  { month: "Avril", invoices: 610, total: 3200 },
  { month: "Mai", invoices: 520, total: 2900 },
  { month: "Juin", invoices: 690, total: 3500 },
];

const chartConfig = {
  invoices: {
    label: "Factures",
    color: "var(--primary)",
  },
  total: {
    label: "Total HT",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function TableCellViewer({ item }: { item: z.infer<typeof sectionSchema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.invoiceNumber}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Détails Facture - {item.invoiceNumber}</DrawerTitle>
          <DrawerDescription>Informations de facturation et montants</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total HT</p>
                    <p className="text-lg font-semibold">{item.totalHT.toFixed(2)} {item.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total TVA</p>
                    <p className="text-lg font-semibold">{item.totalTVA.toFixed(2)} {item.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Droit Timbre</p>
                    <p className="text-lg font-semibold">{item.stampDuty.toFixed(2)} {item.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total TTC</p>
                    <p className="text-lg font-semibold text-green-600">{item.totalTTC.toFixed(2)} {item.currency}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="invoiceNumber">N° Facture</Label>
                <Input id="invoiceNumber" value={item.invoiceNumber} readOnly className="bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="date">Date</Label>
                <Input id="date" value={new Date(item.date).toLocaleDateString("fr-FR")} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={item.type === "LOCAL" ? "Local" : item.type === "SUSPENSION" ? "Suspension" : "Export"} readOnly className="bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Statut</Label>
                <Input id="status" value={item.status === "PAID" ? "Payée" : item.status === "VALIDATED" ? "Validée" : "Brouillon"} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="currency">Devise</Label>
                <Input id="currency" value={item.currency} readOnly className="bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="exerciseYear">Année Fiscale</Label>
                <Input id="exerciseYear" value={item.exerciseYear} readOnly className="bg-muted" />
              </div>
            </div>
            {item.exchangeRate && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="exchangeRate">Taux de Change</Label>
                <Input id="exchangeRate" value={item.exchangeRate.toFixed(4)} readOnly className="bg-muted" />
              </div>
            )}
            {item.suspensionAuthNumber && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="suspensionAuthNumber">N° Autorisation Suspension</Label>
                  <Input id="suspensionAuthNumber" value={item.suspensionAuthNumber} readOnly className="bg-muted" />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="suspensionValidUntil">Valide Jusqu'au</Label>
                  <Input id="suspensionValidUntil" value={item.suspensionValidUntil ? new Date(item.suspensionValidUntil).toLocaleDateString("fr-FR") : "-"} readOnly className="bg-muted" />
                </div>
              </div>
            )}
          </form>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Fermer</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
