"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Currency, InvoiceType } from "@prisma/client";
import { InvoiceDetails } from "../../../actions";
import { InvoiceState } from "../../../create/_components/invoice-form-new";
import { saveInvoice, SaveInvoiceData } from "../../../create/actions";
import { Step1Context } from "../../../create/_components/step-1-context-new";
import { Step2Client } from "../../../create/_components/step-2-client-new";
import { Step3Lines } from "../../../create/_components/step-3-lines-new";
import { Step4Suspension } from "../../../create/_components/step-4-suspension-new";
import { Step5Review } from "../../../create/_components/step-5-review-new";

interface RectifyInvoiceFormProps {
  originalInvoice: InvoiceDetails;
}

type Step = 1 | 2 | 3 | 4 | 5;

export function RectifyInvoiceForm({ originalInvoice }: RectifyInvoiceFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<Step>(1);

  // Initialize state from original invoice
  const [invoiceState, setInvoiceState] = React.useState<InvoiceState>(() => ({
    invoiceDate: new Date(), // New date for rectificative invoice
    invoiceType: originalInvoice.type as InvoiceType,
    currency: originalInvoice.currency as Currency,
    exchangeRate: originalInvoice.exchangeRate || 1,
    companyLogo: originalInvoice.company.logo,
    company: {
      name: originalInvoice.company.name,
      address: originalInvoice.company.address,
      fiscalMatricule: originalInvoice.company.taxNumber,
      phone: originalInvoice.company.phone || "",
      email: originalInvoice.company.email || "",
    },
    client: {
      name: originalInvoice.client.name,
      address: originalInvoice.client.address,
      country: originalInvoice.client.country,
      fiscalMatricule: originalInvoice.client.taxNumber || "",
      isProfessional: originalInvoice.client.isProfessional,
    },
    clientId: originalInvoice.client.id,
    lines: originalInvoice.items.map((item, index) => ({
      id: `line-${index + 1}`,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPriceHT: item.unitPriceHT,
      discount: item.discount,
      vatRate: item.vatRate,
      lineTotalHT: item.lineTotalHT,
      lineTVA: item.lineTVA,
      lineTotalTTC: item.lineTotalTTC,
    })),
    suspensionAuthNumber: originalInvoice.suspensionAuthNumber || "",
    suspensionValidUntil: originalInvoice.suspensionValidUntil || null,
    suspensionPurchaseOrderNumber: originalInvoice.purchaseOrderNumber || "",
    invoiceNumber: "Sera généré automatiquement",
    exerciseYear: new Date().getFullYear(),
  }));

  const handleNext = (stepData: Partial<InvoiceState>) => {
    setInvoiceState((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((prev) => Math.min(prev + 1, 5) as Step);
  };

  const handleClientNext = (client: { name: string; address: string; country: string; fiscalMatricule: string; isProfessional: boolean }, clientId: string) => {
    setInvoiceState((prev) => ({ ...prev, client, clientId }));
    setCurrentStep((prev) => Math.min(prev + 1, 5) as Step);
  };

  const handleLinesNext = (lines: Array<{ id: string; description: string; quantity: number; unit: string; unitPriceHT: number; discount: number; vatRate: number; lineTotalHT: number; lineTVA: number; lineTotalTTC: number }>) => {
    setInvoiceState((prev) => ({ ...prev, lines }));
    setCurrentStep((prev) => Math.min(prev + 1, 5) as Step);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSave = async (status: "BROUILLON" | "VALIDÉ") => {
    try {
      // Calculate totals
      let totalHT = 0;
      let totalTVA = 0;
      let totalTTC = 0;

      invoiceState.lines.forEach((line) => {
        totalHT += line.lineTotalHT;
        totalTVA += line.lineTVA;
        totalTTC += line.lineTotalTTC;
      });

      // Calculate stamp duty
      let stampDuty = 0;
      if (invoiceState.currency === "TND" && invoiceState.invoiceType === "LOCAL") {
        stampDuty = 1.0;
      }

      const totalWithStamp = totalTTC + stampDuty;

      const saveData: SaveInvoiceData = {
        invoiceDate: invoiceState.invoiceDate,
        invoiceType: invoiceState.invoiceType,
        currency: invoiceState.currency,
        exchangeRate: invoiceState.currency !== "TND" ? invoiceState.exchangeRate : undefined,
        company: invoiceState.company,
        companyLogo: invoiceState.companyLogo,
        clientId: invoiceState.clientId,
        lines: invoiceState.lines,
        totalHT,
        totalTVA,
        stampDuty,
        totalTTC: totalWithStamp,
        suspensionAuthNumber:
          invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionAuthNumber : undefined,
        suspensionValidUntil:
          invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionValidUntil || undefined : undefined,
        purchaseOrderNumber:
          invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionPurchaseOrderNumber : undefined,
        status,
        rectifiesInvoiceId: originalInvoice.id, // Link to original invoice
      };

      const result = await saveInvoice(saveData);

      if (result.success) {
        toast.success("Facture rectificative créée avec succès", {
          description: `La facture ${result.invoiceNumber} a été créée.`,
        });
        router.push("/dashboard/invoices");
      } else {
        toast.error("Erreur", {
          description: result.error || "Impossible de créer la facture rectificative",
        });
      }
    } catch (error) {
      console.error("Error saving rectificative invoice:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la création de la facture rectificative",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm font-medium text-yellow-900">
          Facture rectificative de : {originalInvoice.invoiceNumber}
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          Modifiez les informations erronées. L'ancienne facture sera conservée pour la traçabilité fiscale.
        </p>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Step1Context
          invoiceState={invoiceState}
          onNext={handleNext}
        />
      )}
      {currentStep === 2 && (
        <Step2Client
          client={invoiceState.client}
          clientId={invoiceState.clientId}
          onNext={handleClientNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && (
        <Step3Lines
          lines={invoiceState.lines}
          invoiceType={invoiceState.invoiceType}
          onNext={handleLinesNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 4 && invoiceState.invoiceType === "SUSPENSION" && (
        <Step4Suspension
          suspensionData={{
            suspensionAuthNumber: invoiceState.suspensionAuthNumber,
            suspensionValidUntil: invoiceState.suspensionValidUntil,
            suspensionPurchaseOrderNumber: invoiceState.suspensionPurchaseOrderNumber,
          }}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {((currentStep === 4 && invoiceState.invoiceType !== "SUSPENSION") || currentStep === 5) && (
        <Step5Review
          invoiceState={invoiceState}
          onBack={handleBack}
          onValidate={() => handleSave("VALIDÉ")}
          onSaveAsDraft={() => handleSave("BROUILLON")}
        />
      )}
    </div>
  );
}