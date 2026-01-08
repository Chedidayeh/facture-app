"use client";

import * as React from "react";
import { AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InvoiceState } from "./invoice-form-new";

interface Step4SuspensionProps {
  suspensionData: {
    suspensionAuthNumber: string;
    suspensionValidUntil: Date | null;
    suspensionPurchaseOrderNumber: string;
  };
  onBack: () => void;
  onNext: (data: Partial<InvoiceState>) => void;
  isLoading?: boolean;
}

export function Step4Suspension({ suspensionData, onBack, onNext, isLoading }: Step4SuspensionProps) {
  const [authNumber, setAuthNumber] = React.useState(suspensionData.suspensionAuthNumber);
  const [validUntil, setValidUntil] = React.useState<Date | null>(suspensionData.suspensionValidUntil);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = React.useState(suspensionData.suspensionPurchaseOrderNumber);

  const handleNext = () => {
    onNext({
      suspensionAuthNumber: authNumber,
      suspensionValidUntil: validUntil,
      suspensionPurchaseOrderNumber: purchaseOrderNumber,
    });
  };

  const isValid = authNumber.trim() !== "" && validUntil !== null && purchaseOrderNumber.trim() !== "";

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Informations de suspension de TVA</h2>
          <p className="text-sm text-muted-foreground">
            Ces informations sont obligatoires pour les factures en suspension de TVA
          </p>
        </div>

        {/* Alert */}
          <Alert className=" bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-black!" />
            <AlertDescription className="text-black">
            <p className="font-medium mb-2">
              Mention obligatoire qui sera imprimée sur la facture:
            </p>
            <p className="text-sm italic">
              "Vente en suspension de TVA suivant autorisation d'achat en suspension N° <strong>[{authNumber || "___"}]</strong> valable jusqu'au <strong>[{validUntil ? format(validUntil, "dd/MM/yyyy") : "___"}]</strong> et suivant Bon de commande N° <strong>[{purchaseOrderNumber || "___"}]</strong>"
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Numéro d'autorisation */}
          <div className="space-y-2">
            <Label htmlFor="authNumber">Numéro d'autorisation d'achat en suspension *</Label>
            <Input
              id="authNumber"
              value={authNumber}
              onChange={(e) => setAuthNumber(e.target.value)}
              placeholder="Ex: AUT/2026/1234"
              className={!authNumber.trim() ? "border-red-300" : ""}
            />
            {!authNumber.trim() && (
              <p className="text-xs text-red-600">Ce champ est obligatoire</p>
            )}
            <p className="text-xs text-muted-foreground">
              Numéro de l'autorisation délivrée par l'administration fiscale
            </p>
          </div>

          {/* Date de validité */}
          <div className="space-y-2">
            <Label htmlFor="validUntil">Date de validité de l'autorisation *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !validUntil ? "border-red-300 text-muted-foreground" : ""
                  }`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {validUntil ? (
                    format(validUntil, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner la date de validité</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={validUntil || undefined}
                  onSelect={(date) => setValidUntil(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {!validUntil && (
              <p className="text-xs text-red-600">Ce champ est obligatoire</p>
            )}
            <p className="text-xs text-muted-foreground">
              Date jusqu'à laquelle l'autorisation est valable
            </p>
          </div>

          {/* Numéro de bon de commande */}
          <div className="space-y-2">
            <Label htmlFor="purchaseOrderNumber">Numéro de bon de commande *</Label>
            <Input
              id="purchaseOrderNumber"
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              placeholder="Ex: BC-2026-001"
              className={!purchaseOrderNumber.trim() ? "border-red-300" : ""}
            />
            {!purchaseOrderNumber.trim() && (
              <p className="text-xs text-red-600">Ce champ est obligatoire</p>
            )}
            <p className="text-xs text-muted-foreground">
              Référence du bon de commande associé à cette vente
            </p>
          </div>
        </div>

        {/* Info box */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            ℹ️ Réglementation
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>La TVA est suspendue (0%) mais le droit de timbre reste applicable</li>
            <li>Tous les champs ci-dessus sont obligatoires</li>
            <li>La mention légale sera automatiquement ajoutée à la facture</li>
            <li>Conservez une copie de l'autorisation dans vos archives</li>
          </ul>
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            ← Retour
          </Button>
          <Button 
            onClick={handleNext} 
            size="lg" 
            disabled={isLoading || !isValid}
          >
            Suivant →
          </Button>
        </div>
      </div>
    </Card>
  );
}
