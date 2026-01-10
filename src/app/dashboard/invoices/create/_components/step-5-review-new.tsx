"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { InvoiceState } from "./invoice-form-new";

interface Step5ReviewProps {
  invoiceState: InvoiceState;
  onBack: () => void;
  onValidate: () => void;
  onSaveAsDraft: () => void;
  isLoading?: boolean;
  isValidating?: boolean;
}

export function Step5Review({
  invoiceState,
  onBack,
  onValidate,
  onSaveAsDraft,
  isLoading,
  isValidating,
}: Step5ReviewProps) {
  // Calculate totals
  const totalHT = invoiceState.lines.reduce(
    (sum, line) => sum + line.lineTotalHT,
    0
  );
  const totalTVA = invoiceState.lines.reduce(
    (sum, line) => sum + line.lineTVA,
    0
  );
  // Corrected stamp duty logic: 0 for EXPORTATION, 0 if not TND, 1 for LOCAL and SUSPENSION
  const stampDuty =
    invoiceState.invoiceType === "EXPORTATION"
      ? 0
      : invoiceState.currency !== "TND"
      ? 0
      : 1;
  const totalTTC = totalHT + totalTVA + stampDuty;

  // Validate calculation formula
  const calculationValid =
    Math.abs(totalHT * (1 + totalTVA / totalHT) + stampDuty - totalTTC) < 0.01;

  // Convert currency code to French currency name
  const getCurrencyName = (currency: string): string => {
    const currencyMap: { [key: string]: string } = {
      TND: "dinars",
      EUR: "euros",
      USD: "dollars",
      GBP: "livres sterling",
      CAD: "dollars canadiens",
      CHF: "francs suisses",
      JPY: "yens",
      CNY: "yuans",
    };
    return currencyMap[currency] || currency;
  };

  // Convert number to words in French
  const numberToWords = (num: number): string => {
    const units = [
      "",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
    ];
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ];
    const scales = ["", "mille", "million", "milliard"];

    const convertGroup = (n: number): string => {
      if (n === 0) return "";

      const parts: string[] = [];
      const scaleIndex = 0;

      const groupValue = n;
      let groupText = "";
      const hundreds = Math.floor(groupValue / 100);
      const remainder = groupValue % 100;

      if (hundreds > 0) {
        groupText = units[hundreds] + " cent";
        if (remainder === 0 && hundreds > 1) groupText += "s";
      }

      if (remainder > 0) {
        if (hundreds > 0) groupText += " ";
        if (remainder < 10) {
          groupText += units[remainder];
        } else if (remainder < 20) {
          groupText += [
            "dix",
            "onze",
            "douze",
            "treize",
            "quatorze",
            "quinze",
            "seize",
            "dix-sept",
            "dix-huit",
            "dix-neuf",
          ][remainder - 10];
        } else {
          const ten = Math.floor(remainder / 10);
          const unit = remainder % 10;
          groupText += tens[ten];
          if (unit > 0) {
            groupText += "-" + units[unit];
          }
        }
      }

      return groupText;
    };

    const convertToWords = (n: number): string => {
      if (n === 0) return "zéro";

      const parts: string[] = [];
      let scaleIndex = 0;

      while (n > 0 && scaleIndex < scales.length) {
        const groupValue = n % 1000;
        if (groupValue !== 0) {
          let groupText = convertGroup(groupValue);

          if (scaleIndex > 0) {
            groupText += " " + scales[scaleIndex];
            if (groupValue > 1 && scaleIndex === 1) groupText += "s";
          }

          parts.unshift(groupText);
        }
        n = Math.floor(n / 1000);
        scaleIndex++;
      }

      return parts.join(" ").trim();
    };

    // Split into whole and decimal parts
    const wholePart = Math.floor(num);
    const decimalPart = Math.round((num - wholePart) * 100);

    let result = convertToWords(wholePart);
    result += decimalPart > 0 ? ` et ${convertToWords(decimalPart)}` : "";

    return result;
  };

  // Format the total with currency name properly positioned
  const wholePart = Math.floor(totalTTC);
  const decimalPart = Math.round((totalTTC - wholePart) * 100);
  const wholePartWords = numberToWords(wholePart);
  const decimalPartWords = decimalPart > 0 ? numberToWords(decimalPart) : "";
  
  const totalTTCDisplay = decimalPartWords 
    ? `${wholePartWords} ${getCurrencyName(invoiceState.currency)} et ${decimalPartWords}`
    : `${wholePartWords} ${getCurrencyName(invoiceState.currency)}`;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Résumé et validation</h2>
            <p className="text-muted-foreground text-sm">
              Vérifiez toutes les informations avant de valider la facture
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={onValidate}
              disabled={isValidating || isLoading}
            >
              {isValidating ? (
                "Validation en cours..."
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Valider la facture
                </>
              )}
            </Button>

            <Button
              disabled={isLoading || isValidating}
              variant="outline"
              size="lg"
              onClick={onSaveAsDraft}
            >
              <FileText className="mr-2 h-4 w-4" />
              Enregistrer en brouillon
            </Button>
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-start">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isLoading || isValidating}
          >
            ← Retour aux modifications
          </Button>
        </div>

        {/* Calculation validation alert */}
        {/* {calculationValid ? (
          <Alert className="bg-green-500">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <AlertDescription className="text-white">
              Tous les contrôles de cohérence mathématique sont validés
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              ⚠️ Erreur dans les calculs. Veuillez revérifier les montants.
            </AlertDescription>
          </Alert>
        )} */}

        {/* Invoice Preview */}
        <div className="overflow-hidden  border bg-white p-8 shadow-lg">
          {/* Black Header with Logo and INVOICE */}
          <div className="flex items-center justify-between bg-black px-8 py-6 text-white">
            {/* Logo */}
            {invoiceState.companyLogo ? (
              <div className="shrink-0">
                <img
                  src={invoiceState.companyLogo}
                  alt="Company Logo"
                  className="h-16 w-auto object-contain bg-white p-2 rounded"
                />
              </div>
            ) : (
              <div className="text-xl font-bold">
                {invoiceState.company.name}
              </div>
            )}

            {/* INVOICE Title */}
            <h1 className="text-3xl font-bold tracking-wider">FACTURE</h1>
          </div>

          {/* Main Content */}
          <div className="p-8 text-black">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left text-sm">
                <p className="font-semibold">
                  Address:{" "}
                  <span className="font-normal">
                    {invoiceState.company.address}
                  </span>
                </p>
                <p className="font-semibold">
                  Téléphone:{" "}
                  <span className="font-normal">
                    {invoiceState.company.phone}
                  </span>
                </p>
                <p className="font-semibold">
                  Email:{" "}
                  <span className="font-normal">
                    {invoiceState.company.email}
                  </span>
                </p>
                <p className="font-medium">
                  Matricule fiscal:{" "}
                  <span className="font-normal">
                    {invoiceState.company.fiscalMatricule}
                  </span>
                </p>
              </div>

              <div className="space-y-1 text-right text-sm mb-8">
                <p className="font-semibold">
                  Date:{" "}
                  <span className="font-normal">
                    {format(invoiceState.invoiceDate, "d MMMM yyyy")}
                  </span>
                </p>
                <p className="font-semibold">
                  Facture #:{" "}
                  <span className="font-normal">
                    {" "}
                    {invoiceState.invoiceNumber}
                  </span>
                </p>
                {invoiceState.showDueDate && (
                  <p className="font-semibold">
                    Date d'échéance:{" "}
                    <span className="font-normal">
                      {format(invoiceState.dueDate, "d MMMM yyyy")}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="mb-8 gap-8">
              <div className="space-y-1 text-right text-sm">
                <p className="font-semibold">
                  Client:{" "}
                  <span className="font-normal">
                    {invoiceState.client.name}
                  </span>
                </p>
                <p className="font-semibold">
                  Address:{" "}
                  <span className="font-normal">
                    {invoiceState.client.address}
                  </span>
                </p>
                <p className="font-semibold">
                  Pays:{" "}
                  <span className="font-normal">
                    {" "}
                    {invoiceState.client.country}{" "}
                  </span>
                </p>
                {invoiceState.client.type !== "PASSAGER" &&
                  invoiceState.client.fiscalMatricule && (
                    <p className="font-semibold">
                      {invoiceState.client.type === "PARTICULIER"
                        ? "Identifiant unique"
                        : "Identifiant unique"}
                      :{" "}
                      <span className="font-normal">
                        {invoiceState.client.fiscalMatricule}
                      </span>
                    </p>
                  )}
              </div>
            </div>

            {/* Bill To and Prepared By */}
            <div className="mb-8 grid text-right gap-8">
              {/* Left: Bill To */}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-black border  text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="px-4 py-3 text-left font-bold">
                      Description
                    </th>
                    <th className="w-20 px-4 py-3 text-center font-bold">
                      Qté
                    </th>
                    <th className="w-24 px-4 py-3 text-center font-bold">
                      Unité
                    </th>
                    <th className="w-32 px-4 py-3 text-right font-bold">
                      Prix Unit. HT
                    </th>
                    <th className="w-24 px-4 py-3 text-right font-bold">
                      Remise
                    </th>
                    <th className="w-32 px-4 py-3 text-right font-bold">
                      Total HT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceState.lines.map((line, index) => (
                    <tr key={line.id} className="border-b border-black">
                      <td className="border-r border-black px-4 py-3">
                        <div className="font-medium">{line.description}</div>
                      </td>
                      <td className="border-r border-black px-4 py-3 text-center">
                        {line.quantity}
                      </td>
                      <td className="border-r border-black px-4 py-3 text-center">
                        {line.unit}
                      </td>
                      <td className="border-r border-black px-4 py-3 text-right">
                        {line.unitPriceHT.toFixed(2)}
                      </td>
                      <td className="border-r border-black px-4 py-3 text-right">
                        {line.discount > 0 ? `${line.discount}%` : "0%"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {line.lineTotalHT.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

                        <div className="flex justify-between gap-8">
              {/* Left: TVA Details Table */}
              <div className="flex-1">
                <table className="w-full text-sm border border-black">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black">
                      <th className="px-4 py-2 text-left font-semibold">Détails TVA</th>
                      <th className="px-4 py-2 text-right font-semibold">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="px-4 py-2">Montant HT</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {totalHT.toFixed(2)} {invoiceState.currency}
                      </td>
                    </tr>
                    {invoiceState.invoiceType !== "EXPORTATION" && (
                      <>
                        {invoiceState.lines.map((line) => (
                          <tr key={`tax-${line.id}`} className="border-b border-gray-300">
                            <td className="px-4 py-2 text-sm">
                              TVA {(line.vatRate ).toFixed(0)}% ({line.description})
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-normal">
                              {line.lineTVA.toFixed(2)} {invoiceState.currency}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 border-t-2 border-black font-semibold">
                          <td className="px-4 py-2">Total Taxes</td>
                          <td className="px-4 py-2 text-right">
                            {totalTVA.toFixed(2)} {invoiceState.currency}
                          </td>
                        </tr>
                      </>
                    )}
                    {invoiceState.invoiceType === "EXPORTATION" && (
                      <tr className="bg-blue-50 border-t-2 border-black">
                        <td className="px-4 py-2 text-sm italic text-gray-600">Exportation (0% TVA)</td>
                        <td className="px-4 py-2 text-right text-sm font-normal">
                          0.00 {invoiceState.currency}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right: Totals Summary */}
              <div className="w-96 space-y-2 text-sm">

              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-between gap-8 mt-10">
              {/* Left: TVA Details Table */}
              <div className="flex-1">
          
              </div>

              {/* Right: Totals Summary */}
              <div className="w-96 space-y-2 text-sm">
                <div className="flex justify-between border-b py-2">
                  <span>Sous-total (HT)</span>
                  <span className="font-semibold">
                    {totalHT.toFixed(2)} {invoiceState.currency}
                  </span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span>Total TVA</span>
                  <span className="font-semibold">
                    {totalTVA.toFixed(2)} {invoiceState.currency}
                  </span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span>Droit de timbre</span>
                  <span className="font-semibold">
                    {stampDuty.toFixed(2)} {invoiceState.currency}
                  </span>
                </div>
                <div className="mt-2 flex justify-between bg-black px-4 py-2 text-base font-bold text-white">
                  <span>TTC</span>
                  <span>
                    {totalTTC.toFixed(2)} {invoiceState.currency}
                  </span>
                </div>
                <div className="bg-gray-100 px-4 py-2 text-xs font-normal text-gray-700">
                  <p><strong>le montant TTC de la facture est {totalTTCDisplay}</strong></p>
                </div>
              </div>
            </div>

            {/* Suspension Mention if applicable */}
            {invoiceState.invoiceType === "SUSPENSION" && (
              <div className="mt-20 rounded bg-yellow-50/60 p-4">
                <p className="mb-2 text-sm font-bold text-black">
                  SUSPENSION DE TVA:
                </p>
                <p className="text-sm text-black leading-relaxed">
                  « Vente en suspension de TVA suivant autorisation d'achat en
                  suspension N°{" "}
                  <strong className="font-bold">
                    {invoiceState.suspensionAuthNumber}
                  </strong>{" "}
                  valable jusqu'au{" "}
                  <strong className="font-bold">
                    {invoiceState.suspensionValidUntil
                      ? format(
                          invoiceState.suspensionValidUntil,
                          "d MMMM yyyy à HH:mm"
                        )
                      : "N/A"}
                  </strong>{" "}
                  et suivant Bon de commande N°{" "}
                  <strong className="font-bold">
                    {invoiceState.suspensionPurchaseOrderNumber}
                  </strong>{" "}
                  »
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Compliance checklist */}
        {/* <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-3 text-sm font-medium text-blue-800">✓ Contrôles de conformité effectués:</p>
          <div className="grid gap-2 text-xs text-blue-700 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Numérotation chronologique validée</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Mentions obligatoires présentes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Calculs fiscaux vérifiés</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Type de facture appliqué</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Informations client complètes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              <span>Droit de timbre conforme</span>
            </div>
          </div>
        </div> */}

        {/* <div className="rounded-md border bg-slate-50 p-4">
          <p className="text-muted-foreground text-sm">
            <strong>Note:</strong> Veuillez vérifier attentivement toutes les informations ci-dessus avant de valider la
            facture. Une fois validée, la facture sera enregistrée avec un numéro définitif et ne pourra plus être
            supprimée. Seules des factures rectificatives ou des avoirs seront possibles pour correction.
          </p>
        </div> */}
      </div>
    </Card>
  );
}
