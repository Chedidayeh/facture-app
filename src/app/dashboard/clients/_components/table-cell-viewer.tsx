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
          {item.nom}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Détails Client - {item.clientCode}</DrawerTitle>
          <DrawerDescription>Informations et historique de facturation</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Facturé HT</p>
                    <p className="text-lg font-semibold">{item.totalFactureHT.toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total TVA</p>
                    <p className="text-lg font-semibold">{item.totalTVA.toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total TTC</p>
                    <p className="text-lg font-semibold text-green-600">{item.totalTTC.toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Nombre de Factures</p>
                    <p className="text-lg font-semibold">{item.nombreFactures}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-3">Évolution des Factures (6 derniers mois)</p>
                <ChartContainer config={chartConfig}>
                  <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      left: 0,
                      right: 10,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Area
                      dataKey="invoices"
                      type="natural"
                      fill="var(--color-invoices)"
                      fillOpacity={0.4}
                      stroke="var(--color-invoices)"
                      stackId="a"
                    />
                    <Area
                      dataKey="total"
                      type="natural"
                      fill="var(--color-total)"
                      fillOpacity={0.4}
                      stroke="var(--color-total)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="clientCode">Code Client</Label>
                <Input id="clientCode" value={item.clientCode} readOnly className="bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="typeClient">Type Client</Label>
                <Input id="typeClient" value={item.typeClient} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="nom">Nom / Raison Sociale</Label>
              <Input id="nom" value={item.nom} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="matriculeFiscal">Matricule Fiscal</Label>
                <Input id="matriculeFiscal" value={item.matriculeFiscal} readOnly className="bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="pays">Pays</Label>
                <Input id="pays" value={item.pays} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="devise">Devise Par Défaut</Label>
                <Input id="devise" value={item.deviseParDefaut} readOnly className="bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="statut">Statut</Label>
                <Select defaultValue={item.statut}>
                  <SelectTrigger id="statut" className="w-full">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Archivé">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Enregistrer les Modifications</Button>
          <DrawerClose asChild>
            <Button variant="outline">Fermer</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
