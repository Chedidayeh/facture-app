"use client";

import * as React from "react";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineItem, InvoiceType } from "./invoice-form-new";

interface Step3LinesProps {
  lines: LineItem[];
  invoiceType: InvoiceType;
  onBack: () => void;
  onNext: (lines: LineItem[]) => void;
  isLoading?: boolean;
}

export function Step3Lines({ lines, invoiceType, onBack, onNext, isLoading }: Step3LinesProps) {
  const [localLines, setLocalLines] = React.useState<LineItem[]>(lines);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingLine, setEditingLine] = React.useState<LineItem | null>(null);
  
  // Form state
  const [description, setDescription] = React.useState("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [unit, setUnit] = React.useState("Unité");
  const [unitPriceHT, setUnitPriceHT] = React.useState<number>(0);
  const [discount, setDiscount] = React.useState<number>(0);
  const [vatRate, setVatRate] = React.useState<number>(19);
  
  // Calculate line totals
  const calculateLineTotals = (qty: number, price: number, disc: number, vat: number) => {
    const lineTotalBeforeDiscount = qty * price;
    const discountAmount = lineTotalBeforeDiscount * (disc / 100);
    const lineTotalHT = lineTotalBeforeDiscount - discountAmount;
    const lineTVA = lineTotalHT * (vat / 100);
    const lineTotalTTC = lineTotalHT + lineTVA;
    
    return {
      lineTotalHT: Number(lineTotalHT.toFixed(3)),
      lineTVA: Number(lineTVA.toFixed(3)),
      lineTotalTTC: Number(lineTotalTTC.toFixed(3)),
    };
  };

  const openAddDialog = () => {
    setEditingLine(null);
    setDescription("");
    setQuantity(1);
    setUnit("Unité");
    setUnitPriceHT(0);
    setDiscount(0);
    
    // Set VAT rate based on invoice type
    if (invoiceType === "EXPORTATION" || invoiceType === "SUSPENSION") {
      setVatRate(0);
    } else {
      setVatRate(19);
    }
    
    setIsDialogOpen(true);
  };

  const openEditDialog = (line: LineItem) => {
    setEditingLine(line);
    setDescription(line.description);
    setQuantity(line.quantity);
    setUnit(line.unit);
    setUnitPriceHT(line.unitPriceHT);
    setDiscount(line.discount);
    setVatRate(line.vatRate);
    setIsDialogOpen(true);
  };

  const handleSaveLine = () => {
    // Validation
    if (!description.trim()) {
      alert("La description est obligatoire");
      return;
    }
    if (quantity <= 0) {
      alert("La quantité doit être supérieure à 0");
      return;
    }
    if (unitPriceHT <= 0) {
      alert("Le prix unitaire doit être supérieur à 0");
      return;
    }

    const { lineTotalHT, lineTVA, lineTotalTTC } = calculateLineTotals(
      quantity,
      unitPriceHT,
      discount,
      vatRate
    );

    const newLine: LineItem = {
      id: editingLine?.id || `line-${Date.now()}`,
      description,
      quantity,
      unit,
      unitPriceHT,
      discount,
      vatRate,
      lineTotalHT,
      lineTVA,
      lineTotalTTC,
    };

    if (editingLine) {
      // Update existing line
      setLocalLines(localLines.map((l) => (l.id === editingLine.id ? newLine : l)));
    } else {
      // Add new line
      setLocalLines([...localLines, newLine]);
    }

    setIsDialogOpen(false);
  };

  const handleDeleteLine = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) {
      setLocalLines(localLines.filter((l) => l.id !== id));
    }
  };

  const handleNext = () => {
    onNext(localLines);
  };

  // Calculate totals
  const totalHT = localLines.reduce((sum, line) => sum + line.lineTotalHT, 0);
  const totalTVA = localLines.reduce((sum, line) => sum + line.lineTVA, 0);

  // Determine if VAT input should be disabled
  const isVATDisabled = invoiceType === "EXPORTATION" || invoiceType === "SUSPENSION";

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Lignes de facture</h2>
            <p className="text-sm text-muted-foreground">
              Ajoutez les articles ou services. Les calculs se font automatiquement.
            </p>
          </div>
          <Button onClick={openAddDialog} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        {/* Alert for export/suspension */}
        {isVATDisabled && (
          <Alert className=" bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-black!" />
            <AlertDescription className="text-black">
              {invoiceType === "EXPORTATION"
                ? "Facture d'exportation : TVA automatiquement à 0%"
                : "Facture en suspension : TVA automatiquement à 0%"}
            </AlertDescription>
          </Alert>
        )}

        {/* Lines Table */}
        {localLines.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="text-right">PU HT</TableHead>
                  <TableHead className="text-right">Remise</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.description}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell>{line.unit}</TableCell>
                    <TableCell className="text-right">{line.unitPriceHT.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{line.discount}%</TableCell>
                    <TableCell className="text-right font-medium">{line.lineTotalHT.toFixed(3)}</TableCell>
                    <TableCell className="text-right">{line.lineTVA.toFixed(3)} ({line.vatRate}%)</TableCell>
                    <TableCell className="text-right font-bold">{line.lineTotalTTC.toFixed(3)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(line)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLine(line.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="p-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total HT:</span>
                <span className="font-bold">{totalHT.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total TVA:</span>
                <span className="font-bold">{totalTVA.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-bold">Total TTC:</span>
                <span className="font-bold">{(totalHT + totalTVA).toFixed(3)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aucune ligne ajoutée. Cliquez sur "Ajouter une ligne" pour commencer.
            </p>
            <Button onClick={openAddDialog} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première ligne
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            ← Retour
          </Button>
          <Button
            onClick={handleNext}
            size="lg"
            disabled={isLoading || localLines.length === 0}
          >
            Suivant →
          </Button>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLine ? "Modifier la ligne" : "Ajouter une ligne"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de la ligne de facture
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du produit ou service"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Unit */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="unit">Unité de mesure *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unité">Unité</SelectItem>
                    <SelectItem value="Heure">Heure</SelectItem>
                    <SelectItem value="Jour">Jour</SelectItem>
                    <SelectItem value="Kg">Kilogramme (Kg)</SelectItem>
                    <SelectItem value="Litre">Litre</SelectItem>
                    <SelectItem value="m²">Mètre carré (m²)</SelectItem>
                    <SelectItem value="m³">Mètre cube (m³)</SelectItem>
                    <SelectItem value="Forfait">Forfait</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit Price HT */}
              <div className="space-y-2">
                <Label htmlFor="unitPriceHT">Prix unitaire HT *</Label>
                <Input
                  id="unitPriceHT"
                  type="number"
                  min="0"
                  step="0.001"
                  value={unitPriceHT}
                  onChange={(e) => setUnitPriceHT(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Remise (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* VAT Rate */}
            <div className="space-y-2">
              <Label htmlFor="vatRate">Taux de TVA *</Label>
              <Select
                value={vatRate.toString()}
                onValueChange={(value) => setVatRate(parseFloat(value))}
                disabled={isVATDisabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% - Exonéré</SelectItem>
                  <SelectItem value="7">7%</SelectItem>
                  <SelectItem value="13">13%</SelectItem>
                  <SelectItem value="19">19% - Taux normal</SelectItem>
                </SelectContent>
              </Select>
              {isVATDisabled && (
                <p className="text-xs text-yellow-600">
                  TVA fixée à 0% pour ce type de facture
                </p>
              )}
            </div>

            {/* Preview Calculations */}
            {quantity > 0 && unitPriceHT > 0 && (
              <div className=" p-4 rounded-lg space-y-1">
                <p className="text-sm font-medium mb-2">Aperçu des calculs:</p>
                {(() => {
                  const { lineTotalHT, lineTVA, lineTotalTTC } = calculateLineTotals(
                    quantity,
                    unitPriceHT,
                    discount,
                    vatRate
                  );
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Total HT:</span>
                        <span className="font-medium">{lineTotalHT.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>TVA ({vatRate}%):</span>
                        <span className="font-medium">{lineTVA.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-1">
                        <span className="font-bold">Total TTC:</span>
                        <span className="font-bold">{lineTotalTTC.toFixed(3)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveLine}>
              {editingLine ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
