"use client";

import * as React from "react";
import { Minus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createCreditNote, InvoiceDetails, getInvoiceDetails } from "../actions";

interface CreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
}

interface PartialItem {
  itemId: string;
  description: string;
  originalQuantity: number;
  selectedQuantity: number;
  unit: string;
  unitPriceHT: number;
  lineTotalHT: number;
  lineTVA: number;
  lineTotalTTC: number;
  selected: boolean;
}

export function CreditNoteDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
}: CreditNoteDialogProps) {
  const [creditType, setCreditType] = React.useState<"TOTAL" | "PARTIAL">("TOTAL");
  const [isCreating, setIsCreating] = React.useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [invoiceDetails, setInvoiceDetails] = React.useState<InvoiceDetails | null>(null);
  const [partialItems, setPartialItems] = React.useState<PartialItem[]>([]);

  // Load invoice details when dialog opens
  React.useEffect(() => {
    if (open && !invoiceDetails) {
      loadInvoiceDetails();
    }
  }, [open, invoiceId]);

  const loadInvoiceDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const details = await getInvoiceDetails(invoiceId);
      if (details) {
        setInvoiceDetails(details);
        setPartialItems(
          details.items.map((item) => ({
            itemId: item.id,
            description: item.description,
            originalQuantity: item.quantity,
            selectedQuantity: item.quantity,
            unit: item.unit,
            unitPriceHT: item.unitPriceHT,
            lineTotalHT: item.lineTotalHT,
            lineTVA: item.lineTVA,
            lineTotalTTC: item.lineTotalTTC,
            selected: false,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading invoice details:", error);
      toast.error("Erreur lors du chargement des détails de la facture");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreateCreditNote = async () => {
    setIsCreating(true);
    try {
      let result;
      
      if (creditType === "TOTAL") {
        result = await createCreditNote(invoiceId, "TOTAL");
      } else {
        const selectedItems = partialItems
          .filter((item) => item.selected)
          .map((item) => ({
            itemId: item.itemId,
            quantity: item.selectedQuantity,
          }));

        if (selectedItems.length === 0) {
          toast.error("Veuillez sélectionner au moins un article");
          setIsCreating(false);
          return;
        }

        result = await createCreditNote(invoiceId, "PARTIAL", selectedItems);
      }

      if (result.success) {
        toast.success("Avoir créé avec succès", {
          description: `L'avoir ${result.creditNoteNumber} a été créé.`,
        });
        onOpenChange(false);
        // Refresh the page to show the new credit note
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error("Erreur", {
          description: result.error || "Impossible de créer l'avoir",
        });
      }
    } catch (error) {
      console.error("Credit note creation error:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la création de l'avoir",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseFloat(value) || 0;
    setPartialItems((items) =>
      items.map((item) =>
        item.itemId === itemId
          ? { ...item, selectedQuantity: Math.min(quantity, item.originalQuantity) }
          : item
      )
    );
  };

  const handleToggleItem = (itemId: string) => {
    setPartialItems((items) =>
      items.map((item) =>
        item.itemId === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const calculatePartialTotals = () => {
    const selectedItems = partialItems.filter((item) => item.selected);
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    selectedItems.forEach((item) => {
      const ratio = item.selectedQuantity / item.originalQuantity;
      totalHT += item.lineTotalHT * ratio;
      totalTVA += item.lineTVA * ratio;
      totalTTC += item.lineTotalTTC * ratio;
    });

    return { totalHT, totalTVA, totalTTC };
  };

  const partialTotals = creditType === "PARTIAL" ? calculatePartialTotals() : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-destructive" />
            Créer un avoir
          </DialogTitle>
          <DialogDescription>
            Annuler totalement ou partiellement la facture {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="py-8 text-center text-muted-foreground">
            Chargement des détails...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">📋 À propos des avoirs</p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Un avoir génère des montants négatifs</li>
                <li>Il réduit le chiffre d'affaires et la TVA collectée</li>
                <li>Le document est automatiquement validé</li>
                <li>Il reste lié à la facture d'origine</li>
              </ul>
            </div>

            {/* Type Selection */}
            <div className="space-y-3">
              <Label>Type d'avoir</Label>
              <RadioGroup value={creditType} onValueChange={(value) => setCreditType(value as "TOTAL" | "PARTIAL")}>
                <div
                  className={`flex items-center space-x-2 border p-3 rounded-lg transition-all cursor-pointer hover:border-primary hover:bg-accent/50 ${
                    creditType === "TOTAL" ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setCreditType("TOTAL")}
                >
                  <RadioGroupItem value="TOTAL" id="total" />
                  <div className="flex-1">
                    <Label htmlFor="total" className="cursor-pointer font-medium">
                      Avoir total
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Annule l'intégralité de la facture
                    </p>
                  </div>
                  {invoiceDetails && creditType === "TOTAL" && (
                    <Badge variant="destructive" className="ml-auto">
                      -{invoiceDetails.totalTTC.toFixed(2)} {invoiceDetails.currency}
                    </Badge>
                  )}
                </div>

                <div
                  className={`flex items-center space-x-2 border p-3 rounded-lg transition-all cursor-pointer hover:border-primary hover:bg-accent/50 ${
                    creditType === "PARTIAL" ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setCreditType("PARTIAL")}
                >
                  <RadioGroupItem value="PARTIAL" id="partial" />
                  <div className="flex-1">
                    <Label htmlFor="partial" className="cursor-pointer font-medium">
                      Avoir partiel
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Sélectionnez les articles à annuler
                    </p>
                  </div>
                  {partialTotals && (
                    <Badge variant="destructive" className="ml-auto">
                      -{partialTotals.totalTTC.toFixed(2)} {invoiceDetails?.currency}
                    </Badge>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Partial Items Selection */}
            {creditType === "PARTIAL" && invoiceDetails && (
              <div className="space-y-3">
                <Label>Sélectionnez les articles</Label>
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {partialItems.map((item) => (
                    <div
                      key={item.itemId}
                      className={`p-3 transition-colors ${
                        item.selected ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => handleToggleItem(item.itemId)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.unitPriceHT.toFixed(2)} {invoiceDetails.currency} × {item.originalQuantity} {item.unit}
                            </p>
                          </div>
                          
                          {item.selected && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Quantité à annuler:</Label>
                              <Input
                                type="number"
                                min="0"
                                max={item.originalQuantity}
                                step="0.001"
                                value={item.selectedQuantity}
                                onChange={(e) => handleQuantityChange(item.itemId, e.target.value)}
                                className="w-24 h-8"
                              />
                              <span className="text-xs text-muted-foreground">
                                / {item.originalQuantity} {item.unit}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {item.lineTotalTTC.toFixed(2)} {invoiceDetails.currency}
                          </p>
                          {item.selected && (
                            <p className="text-xs text-destructive font-medium">
                              -{((item.lineTotalTTC * item.selectedQuantity) / item.originalQuantity).toFixed(2)} {invoiceDetails.currency}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Partial Totals */}
                {partialTotals && (
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total HT:</span>
                      <span className="font-medium text-destructive">
                        -{partialTotals.totalHT.toFixed(2)} {invoiceDetails.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>TVA:</span>
                      <span className="font-medium text-destructive">
                        -{partialTotals.totalTVA.toFixed(2)} {invoiceDetails.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span>Total TTC:</span>
                      <span className="text-destructive">
                        -{partialTotals.totalTTC.toFixed(2)} {invoiceDetails.currency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Total Summary */}
            {creditType === "TOTAL" && invoiceDetails && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT:</span>
                  <span className="font-medium text-destructive">
                    -{invoiceDetails.totalHT.toFixed(2)} {invoiceDetails.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA:</span>
                  <span className="font-medium text-destructive">
                    -{invoiceDetails.totalTVA.toFixed(2)} {invoiceDetails.currency}
                  </span>
                </div>
                {invoiceDetails.stampDuty > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Droit de timbre:</span>
                    <span className="font-medium text-destructive">
                      -{invoiceDetails.stampDuty.toFixed(2)} {invoiceDetails.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span className="text-destructive">
                    -{invoiceDetails.totalTTC.toFixed(2)} {invoiceDetails.currency}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateCreditNote}
            disabled={isCreating || isLoadingDetails}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCreating ? "Création..." : "Créer l'avoir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
