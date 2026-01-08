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
            {/* Company Address and Invoice Details */}
            <div className="mb-8 grid grid-cols-2 gap-8">
              {/* Left: Company Address */}
              <div>
                <h3 className="mb-3 text-sm font-bold">
                  Adresse de l'entreprise
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{invoiceState.company.name}</p>
                  <p>{invoiceState.company.address}</p>
                  <p>Téléphone: {invoiceState.company.phone}</p>
                  <p>Email: {invoiceState.company.email}</p>
                  <p className="font-medium">
                    Matricule fiscal: {invoiceState.company.fiscalMatricule}
                  </p>
                  {/* {invoiceState.invoiceType && (
                    <p className="mt-2 text-xs text-gray-600">
                      Type:{" "}
                      {invoiceState.invoiceType === "LOCAL"
                        ? "Facture locale"
                        : invoiceState.invoiceType === "EXPORTATION"
                          ? "Facture exportation"
                          : "Facture en suspension de TVA"}
                    </p>
                  )} */}
                </div>
              </div>

              {/* Right: Invoice Details */}
              <div className="space-y-1 text-right text-sm">
                <p>Date: {format(invoiceState.invoiceDate, "dd/MM/yyyy")}</p>
                <p>Facture #: {invoiceState.invoiceNumber}</p>
                <p>
                  Client ID:{" "}
                  {invoiceState.client.fiscalMatricule || "Particulier"}
                </p>
                {invoiceState.currency !== "TND" && (
                  <p className="mt-1 text-xs text-gray-600">
                    Devise: {invoiceState.currency} • Taux:{" "}
                    {invoiceState.exchangeRate.toFixed(4)} TND
                  </p>
                )}
              </div>
            </div>

            {/* Bill To and Prepared By */}
            <div className="mb-8 grid grid-cols-2 gap-8">
              {/* Left: Bill To */}
              <div>
                <h3 className="mb-3 text-sm font-bold">Facturer à</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{invoiceState.client.name}</p>
                  <p>{invoiceState.client.address}</p>
                  <p className="">{invoiceState.client.country}</p>
                  {invoiceState.client.fiscalMatricule && (
                    <p>
                      Matricule fiscal: {invoiceState.client.fiscalMatricule}
                    </p>
                  )}
                  <p className="">
                    {invoiceState.client.isProfessional
                      ? "Client professionnel"
                      : "Client particulier"}
                  </p>
                </div>
                <p className="mt-4 text-sm">
                  Date d'échéance:{" "}
                  {format(
                    new Date(
                      invoiceState.invoiceDate.getTime() +
                        30 * 24 * 60 * 60 * 1000
                    ),
                    "dd/MM/yyyy"
                  )}
                </p>
              </div>

              {/* Right: Can be used for additional info if needed */}
              <div className="text-right">
                {/* Optional: Add prepared by or other info */}
              </div>
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

            {/* Totals Section */}
            <div className="flex justify-end">
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
                  <span>TOTAL</span>
                  <span>
                    {totalTTC.toFixed(2)} {invoiceState.currency}
                  </span>
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
                      ? format(invoiceState.suspensionValidUntil, "dd/MM/yyyy")
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
