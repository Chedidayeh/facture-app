"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  Building2,
  User,
  CreditCard,
  Eye,
  Receipt,
  X,
  AlertCircle,
  ArrowRight,
  FileCheck,
  Download,
} from "lucide-react";
import {
  getInvoiceDetails,
  InvoiceDetails,
  getInvoicePayments,
} from "../actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentsTab } from "./payments-tab";
import { generatePDFFromInvoice } from "@/lib/pdf-generator";

interface InvoiceDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

export function InvoiceDetailsSheet({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceDetailsSheetProps) {
  const [invoiceDetails, setInvoiceDetails] =
    React.useState<InvoiceDetails | null>(null);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [generatingPDF, setGeneratingPDF] = React.useState(false);

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

  React.useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails(invoiceId);
    }
  }, [open, invoiceId]);

  async function fetchInvoiceDetails(id: string) {
    setLoading(true);
    try {
      const [details, paymentsResult] = await Promise.all([
        getInvoiceDetails(id),
        getInvoicePayments(id),
      ]);
      setInvoiceDetails(details);
      if (paymentsResult.success && paymentsResult.payments) {
        setPayments(paymentsResult.payments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      setInvoiceDetails(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "LOCAL":
        return "Local";
      case "EXPORTATION":
        return "Exportation";
      case "SUSPENSION":
        return "En suspension de TVA";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "BROUILLON":
        return "Brouillon";
      case "VALIDÉ":
        return "Validée";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAYÉ":
        return "Payée";
      case "NON_PAYÉ":
        return "Non payée";
      default:
        return paymentStatus;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "VALIDÉ":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPaymentStatusVariant = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAYÉ":
        return "default";
      case "NON_PAYÉ":
        return "outline";
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case "FACTURE":
        return "Facture";
      case "AVOIR":
        return "Avoir";
      default:
        return documentType;
    }
  };

  const getDocumentTypeVariant = (
    documentType: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    switch (documentType) {
      case "FACTURE":
        return "default";
      case "AVOIR":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceDetails) return;
    
    try {
      setGeneratingPDF(true);
      await generatePDFFromInvoice(
        invoiceDetails,
        `Facture_${invoiceDetails.invoiceNumber}.pdf`
      );
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <SheetHeader>
              <SheetTitle className="text-xl">Détails de la Facture</SheetTitle>
              <SheetDescription>
                Informations complètes de la facture
              </SheetDescription>
            </SheetHeader>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
        </div>

        <div className="px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          )}

          {!loading && invoiceDetails && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList
                className={`grid w-full ${
                  payments.length > 0 ? "grid-cols-3" : "grid-cols-2"
                } mb-6`}
              >
                <TabsTrigger value="details" className="gap-2">
                  <Eye className="size-4" />
                  Vue Détails
                </TabsTrigger>
                {payments.length > 0 && (
                  <TabsTrigger value="payments" className="gap-2">
                    <CreditCard className="size-4" />
                    Paiements
                  </TabsTrigger>
                )}
                <TabsTrigger value="preview" className="gap-2">
                  <Receipt className="size-4" />
                  Aperçu Facture
                </TabsTrigger>
              </TabsList>

              {/* Details View */}
              <TabsContent value="details" className="space-y-8">
                {/* Header Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight font-mono">
                        {invoiceDetails.invoiceNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Exercice {invoiceDetails.exerciseYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={getStatusVariant(invoiceDetails.status)}>
                        {getStatusLabel(invoiceDetails.status)}
                      </Badge>
                      <Badge
                        variant={getPaymentStatusVariant(
                          invoiceDetails.paymentStatus
                        )}
                      >
                        {getPaymentStatusLabel(invoiceDetails.paymentStatus)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Key Info Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4" />
                      <p className="text-xs font-medium">Date</p>
                    </div>
                    <p className="text-lg font-semibold">
                      {format(
                        new Date(invoiceDetails.date),
                        "d MMMM yyyy à HH:mm",
                        {
                          locale: fr,
                        }
                      )}
                    </p>
                  </Card>
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="size-4" />
                      <p className="text-xs font-medium">Type</p>
                    </div>
                    <Badge variant="secondary">
                      {getTypeLabel(invoiceDetails.type)}
                    </Badge>
                  </Card>
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="size-4" />
                      <p className="text-xs font-medium">Devise</p>
                    </div>
                    <p className="text-lg font-semibold">
                      {invoiceDetails.currency}
                    </p>
                    {invoiceDetails.exchangeRate &&
                      invoiceDetails.exchangeRate !== 1 && (
                        <p className="text-xs text-muted-foreground">
                          Taux: {invoiceDetails.exchangeRate.toFixed(4)}
                        </p>
                      )}
                  </Card>
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck className="size-4" />
                      <p className="text-xs font-medium">Document</p>
                    </div>
                    <Badge
                      variant={getDocumentTypeVariant(
                        invoiceDetails.documentType
                      )}
                    >
                      {getDocumentTypeLabel(invoiceDetails.documentType)}
                    </Badge>
                  </Card>
                </div>

                {/* Totals Summary */}
                <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
                  <h4 className="font-semibold text-base">Résumé Financier</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg border bg-background p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Total HT
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        {invoiceDetails.totalHT.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {invoiceDetails.currency}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-background p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        TVA
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        {invoiceDetails.totalTVA.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {invoiceDetails.currency}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-background p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Timbre
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        {invoiceDetails.stampDuty.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {invoiceDetails.currency}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Total TTC
                      </p>
                      <p className="text-2xl font-bold text-primary tabular-nums">
                        {invoiceDetails.totalTTC.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {invoiceDetails.currency}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Relations */}
                {(invoiceDetails.parentInvoice ||
                  invoiceDetails.creditNotes.length > 0 ||
                  invoiceDetails.rectifiesInvoice ||
                  invoiceDetails.rectificativeInvoices.length > 0) && (
                  <>
                    <Separator />
                    <div className="space-y-5">
                      <h4 className="font-semibold text-base flex items-center gap-2">
                        <AlertCircle className="size-5" />
                        Relations de Document
                      </h4>

                      {/* Parent Invoice (for Credit Notes) */}
                      {invoiceDetails.parentInvoice && (
                        <Card className="p-4 border-orange-400">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-orange-100 p-2">
                              <FileText className="size-4 text-orange-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-orange-400 mb-1">
                                Avoir créé pour la facture
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono font-semibold">
                                  {invoiceDetails.parentInvoice.invoiceNumber}
                                </code>
                                <span className="text-xs text-muted-foreground">
                                  du{" "}
                                  {format(
                                    new Date(invoiceDetails.parentInvoice.date),
                                    "d MMMM yyyy à HH:mm",
                                    { locale: fr }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Credit Notes */}
                      {invoiceDetails.creditNotes.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            Avoirs créés ({invoiceDetails.creditNotes.length})
                          </p>
                          <div className="space-y-2">
                            {invoiceDetails.creditNotes.map((creditNote) => (
                              <Card
                                key={creditNote.id}
                                className="p-3 border-red-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="destructive"
                                      className="font-mono"
                                    >
                                      {creditNote.invoiceNumber}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(creditNote.date),
                                        "d MMMM yyyy à HH:mm",
                                        { locale: fr }
                                      )}
                                    </span>
                                    <Badge
                                      variant={getStatusVariant(
                                        creditNote.status
                                      )}
                                      className="text-xs"
                                    >
                                      {getStatusLabel(creditNote.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-semibold tabular-nums">
                                    {creditNote.totalTTC.toFixed(2)}{" "}
                                    {invoiceDetails.currency}
                                  </p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rectifies Invoice */}
                      {invoiceDetails.rectifiesInvoice && (
                        <Card className="p-4 border-blue-500">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-blue-100 p-2">
                              <FileText className="size-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-500 mb-1">
                                Facture rectificative de
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono font-semibold">
                                  {
                                    invoiceDetails.rectifiesInvoice
                                      .invoiceNumber
                                  }
                                </code>
                                <span className="text-xs text-muted-foreground">
                                  du{" "}
                                  {format(
                                    new Date(
                                      invoiceDetails.rectifiesInvoice.date
                                    ),
                                    "d MMMM yyyy à HH:mm",
                                    { locale: fr }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Rectificative Invoices */}
                      {invoiceDetails.rectificativeInvoices.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            Factures rectificatives créées (
                            {invoiceDetails.rectificativeInvoices.length})
                          </p>
                          <div className="space-y-2">
                            {invoiceDetails.rectificativeInvoices.map(
                              (rectificative) => (
                                <Card
                                  key={rectificative.id}
                                  className="p-3 border-blue-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Badge
                                        variant="secondary"
                                        className="font-mono"
                                      >
                                        {rectificative.invoiceNumber}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(
                                          new Date(rectificative.date),
                                          "d MMMM yyyy à HH:mm",
                                          { locale: fr }
                                        )}
                                      </span>
                                      <Badge
                                        variant={getStatusVariant(
                                          rectificative.status
                                        )}
                                        className="text-xs"
                                      >
                                        {getStatusLabel(rectificative.status)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-semibold tabular-nums">
                                      {rectificative.totalTTC.toFixed(2)}{" "}
                                      {invoiceDetails.currency}
                                    </p>
                                  </div>
                                </Card>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Client Information */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <User className="size-5" />
                    Informations Client
                  </h4>
                  <div className="grid gap-4">
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Nom
                      </p>
                      <p className="font-semibold">
                        {invoiceDetails.client.name}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Adresse
                      </p>
                      <p className="font-medium">
                        {invoiceDetails.client.address}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {invoiceDetails.client.taxNumber && (
                        <div className="rounded-lg border p-4 bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Matricule Fiscal
                          </p>
                          <p className="font-mono font-semibold">
                            {invoiceDetails.client.taxNumber}
                          </p>
                        </div>
                      )}
                      <div className="rounded-lg border p-4 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Pays
                        </p>
                        <p className="font-medium">
                          {invoiceDetails.client.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Company Information */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <Building2 className="size-5" />
                    Informations Entreprise
                  </h4>
                  <div className="grid gap-4">
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Nom
                      </p>
                      <p className="font-semibold">
                        {invoiceDetails.company.name}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Adresse
                      </p>
                      <p className="font-medium">
                        {invoiceDetails.company.address}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Matricule Fiscal
                        </p>
                        <p className="font-mono font-semibold text-sm">
                          {invoiceDetails.company.taxNumber}
                        </p>
                      </div>
                      {invoiceDetails.company.phone && (
                        <div className="rounded-lg border p-4 bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Téléphone
                          </p>
                          <p className="font-mono text-sm">
                            {invoiceDetails.company.phone}
                          </p>
                        </div>
                      )}
                      {invoiceDetails.company.email && (
                        <div className="rounded-lg border p-4 bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Email
                          </p>
                          <p className="text-sm break-all">
                            {invoiceDetails.company.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Invoice Items */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-base">Lignes de Facture</h4>
                  <div className="space-y-3">
                    {invoiceDetails.items.map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Ligne {index + 1}
                              </Badge>
                            </div>
                            <p className="font-medium">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Total TTC
                            </p>
                            <p className="text-lg font-bold">
                              {item.lineTotalTTC.toFixed(2)}{" "}
                              {invoiceDetails.currency}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Quantité
                            </p>
                            <p className="font-medium">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Prix Unit. HT
                            </p>
                            <p className="font-medium">
                              {item.unitPriceHT.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Remise
                            </p>
                            <p className="font-medium">{item.discount}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Taux TVA
                            </p>
                            <p className="font-medium">{item.vatRate}%</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Suspension Info */}
                {invoiceDetails.type === "SUSPENSION" &&
                  invoiceDetails.suspensionAuthNumber && (
                    <>
                      <Separator />
                      <div className="rounded-lg border border-yellow-200 p-4 space-y-2">
                        <h4 className="font-semibold text-sm">
                          Informations Suspension TVA
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              N° Autorisation
                            </p>
                            <p className="font-mono font-semibold">
                              {invoiceDetails.suspensionAuthNumber}
                            </p>
                          </div>
                          {invoiceDetails.suspensionValidUntil && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Valide jusqu'au
                              </p>
                              <p className="font-medium">
                                {format(
                                  new Date(invoiceDetails.suspensionValidUntil),
                                  "d MMMM yyyy à HH:mm"
                                )}
                              </p>
                            </div>
                          )}
                          {invoiceDetails.purchaseOrderNumber && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                N° Bon de Commande
                              </p>
                              <p className="font-mono font-semibold">
                                {invoiceDetails.purchaseOrderNumber}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                <Separator />

                {/* Metadata */}
                <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Créée le</span>
                    <span className="font-mono">
                      {format(
                        new Date(invoiceDetails.createdAt),
                        "dd/MM/yyyy 'à' HH:mm",
                        { locale: fr }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dernière modification</span>
                    <span className="font-mono">
                      {format(
                        new Date(invoiceDetails.updatedAt),
                        "dd/MM/yyyy 'à' HH:mm",
                        { locale: fr }
                      )}
                    </span>
                  </div>
                  {invoiceDetails.validatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Validée le</span>
                      <span className="font-mono">
                        {format(
                          new Date(invoiceDetails.validatedAt),
                          "dd/MM/yyyy 'à' HH:mm",
                          { locale: fr }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Payments View */}
              <TabsContent value="payments">
                <PaymentsTab
                  invoiceId={invoiceId || ""}
                  currency={invoiceDetails.currency}
                  payments={payments}
                />
              </TabsContent>

              {/* Preview View */}
              <TabsContent value="preview">
                <div className="space-y-4">
                  {/* Download Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={generatingPDF}
                      className="gap-2"
                    >
                      <Download className="size-4" />
                      {generatingPDF ? "Génération..." : "Télécharger PDF"}
                    </Button>
                  </div>

                  {/* Preview Container */}
                  <div className="overflow-hidden border bg-white p-8 shadow-lg rounded-lg">
                  {/* Black Header with Logo and INVOICE */}
                  <div className="flex items-center justify-between bg-black px-8 py-6 text-white">
                    {/* Logo */}
                    {invoiceDetails.company.logo ? (
                      <div className="shrink-0">
                        <img
                          src={invoiceDetails.company.logo}
                          alt="Company Logo"
                          className="h-16 w-auto object-contain bg-white p-2 rounded"
                        />
                      </div>
                    ) : (
                      <div className="text-xl font-bold">
                        {invoiceDetails.company.name}
                      </div>
                    )}

                    {/* INVOICE/AVOIR Title */}
                    <h1 className="text-3xl font-bold tracking-wider">
                      {invoiceDetails.documentType === "AVOIR"
                        ? "AVOIR"
                        : "FACTURE"}
                    </h1>
                  </div>

                  {/* Main Content */}
                  <div className="p-8 text-black mt-10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-left text-sm">
                        <p className="font-semibold">
                          Address:{" "}
                          <span className="font-normal">
                            {invoiceDetails.company.address}
                          </span>
                        </p>
                        <p className="font-semibold">
                          Téléphone:{" "}
                          <span className="font-normal">
                            {invoiceDetails.company.phone}
                          </span>
                        </p>
                        <p className="font-semibold">
                          Email:{" "}
                          <span className="font-normal">
                            {invoiceDetails.company.email}
                          </span>
                        </p>
                        <p className="font-medium">
                          Matricule fiscal:{" "}
                          <span className="font-normal">
                            {invoiceDetails.company.taxNumber}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-1 text-right text-sm mb-8">
                        <p className="font-semibold">
                          Date:{" "}
                          <span className="font-normal">
                            {format(new Date(invoiceDetails.date), "d MMMM yyyy")}
                          </span>
                        </p>
                        <p className="font-semibold">
                          Facture #:{" "}
                          <span className="font-normal">
                            {invoiceDetails.invoiceNumber}
                          </span>
                        </p>
                        {invoiceDetails.showDueDate && (
                          <p className="font-semibold">
                            Date d'échéance:{" "}
                            <span className="font-normal">
                              {format(new Date(invoiceDetails.dueDate), "d MMMM yyyy")}
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
                            {invoiceDetails.client.name}
                          </span>
                        </p>
                        <p className="font-semibold">
                          Address:{" "}
                          <span className="font-normal">
                            {invoiceDetails.client.address}
                          </span>
                        </p>
                        <p className="font-semibold">
                          Pays:{" "}
                          <span className="font-normal">
                            {invoiceDetails.client.country}
                          </span>
                        </p>
                        {invoiceDetails.client.type !== "PASSAGER" &&
                          invoiceDetails.client.taxNumber && (
                            <p className="font-semibold">
                              {invoiceDetails.client.type === "PARTICULIER"
                                ? "Identifiant unique"
                                : "Identifiant unique"}
                              :{" "}
                              <span className="font-normal">
                                {invoiceDetails.client.taxNumber}
                              </span>
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8 mt-20">
                      <table className="w-full border-black border text-sm">
                        <thead>
                          <tr className="bg-black text-white">
                            <th className="border-black border p-2 text-left">
                              Description
                            </th>
                            <th className="border-black border p-2 text-center">
                              Qté
                            </th>
                            <th className="border-black border p-2 text-center">
                              Unité
                            </th>
                            <th className="border-black border p-2 text-right">
                              Prix Unit. HT
                            </th>
                            <th className="border-black border p-2 text-right">
                              Remise
                            </th>
                            <th className="border-black border p-2 text-right">
                              Total HT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceDetails.items.map((item) => (
                            <tr key={item.id} className="border-b border-black">
                              <td className="border-black border p-2">
                                {item.description}
                              </td>
                              <td className="border-black border p-2 text-center">
                                {item.quantity}
                              </td>
                              <td className="border-black border p-2 text-center">
                                {item.unit}
                              </td>
                              <td className="border-black border p-2 text-right">
                                {item.unitPriceHT.toFixed(2)}
                              </td>
                              <td className="border-black border p-2 text-right">
                                {item.discount}%
                              </td>
                              <td className="border-black border p-2 text-right font-semibold">
                                {item.lineTotalHT.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Section */}
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
                                {invoiceDetails.totalHT.toFixed(2)} {invoiceDetails.currency}
                              </td>
                            </tr>
                            {invoiceDetails.type !== "EXPORTATION" && (
                              <>
                                {invoiceDetails.items.map((item) => (
                                  <tr key={`tax-${item.id}`} className="border-b border-gray-300">
                                    <td className="px-4 py-2 text-sm">
                                      TVA {(item.vatRate).toFixed(0)}% ({item.description})
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-normal">
                                      {item.lineTVA.toFixed(2)} {invoiceDetails.currency}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-100 border-t-2 border-black font-semibold">
                                  <td className="px-4 py-2">Total Taxes</td>
                                  <td className="px-4 py-2 text-right">
                                    {invoiceDetails.totalTVA.toFixed(2)} {invoiceDetails.currency}
                                  </td>
                                </tr>
                              </>
                            )}
                            {invoiceDetails.type === "EXPORTATION" && (
                              <tr className="bg-blue-50 border-t-2 border-black">
                                <td className="px-4 py-2 text-sm">Exportation (0% TVA)</td>
                                <td className="px-4 py-2 text-right text-sm font-normal">
                                  0.00 {invoiceDetails.currency}
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
                    <div className="flex justify-between mt-20 gap-8">
                      {/* Left: TVA Details Table */}
                      <div className="flex-1">

                      </div>

                      {/* Right: Totals Summary */}
                      <div className="w-96 space-y-2 text-sm">
                        <div className="flex justify-between border-b py-2">
                          <span>Sous-total (HT)</span>
                          <span className="font-semibold">
                            {invoiceDetails.totalHT.toFixed(2)}{" "}
                            {invoiceDetails.currency}
                          </span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span>Total TVA</span>
                          <span className="font-semibold">
                            {invoiceDetails.totalTVA.toFixed(2)}{" "}
                            {invoiceDetails.currency}
                          </span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span>Droit de timbre</span>
                          <span className="font-semibold">
                            {invoiceDetails.stampDuty.toFixed(2)}{" "}
                            {invoiceDetails.currency}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between bg-black px-4 py-2 text-base font-bold text-white">
                          <span>TTC</span>
                          <span>
                            {invoiceDetails.totalTTC.toFixed(2)}{" "}
                            {invoiceDetails.currency}
                          </span>
                        </div>
                        <div className="bg-gray-100 px-4 py-2 text-xs font-normal text-gray-700">
                          <p>
                            <strong>
                              le montant TTC de la facture est{" "}
                              {(() => {
                                const wholePart = Math.floor(invoiceDetails.totalTTC);
                                const decimalPart = Math.round(
                                  (invoiceDetails.totalTTC - wholePart) * 100
                                );
                                const wholePartWords = numberToWords(wholePart);
                                const decimalPartWords =
                                  decimalPart > 0 ? numberToWords(decimalPart) : "";
                                return decimalPartWords
                                  ? `${wholePartWords} ${getCurrencyName(
                                      invoiceDetails.currency
                                    )} et ${decimalPartWords}`
                                  : `${wholePartWords} ${getCurrencyName(
                                      invoiceDetails.currency
                                    )}`;
                              })()}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Suspension Mention */}
                    {invoiceDetails.type === "SUSPENSION" &&
                      invoiceDetails.suspensionAuthNumber && (
                        <div className="mt-20 rounded bg-yellow-50/60 p-4">
                          <p className="mb-2 text-sm font-bold text-black">
                            SUSPENSION DE TVA:
                          </p>
                          <p className="text-sm text-black leading-relaxed">
                            « Vente en suspension de TVA suivant autorisation
                            d'achat en suspension N°{" "}
                            <strong className="font-bold">
                              {invoiceDetails.suspensionAuthNumber}
                            </strong>
                            {invoiceDetails.suspensionValidUntil && (
                              <>
                                {" "}
                                valable jusqu'au{" "}
                                <strong>
                                  {format(
                                    new Date(
                                      invoiceDetails.suspensionValidUntil
                                    ),
                                    "d MMMM yyyy à HH:mm"
                                  )}
                                </strong>
                              </>
                            )}
                            {invoiceDetails.purchaseOrderNumber && (
                              <>
                                {" "}
                                et suivant Bon de commande N°
                                <strong>
                                  {invoiceDetails.purchaseOrderNumber}
                                </strong>
                              </>
                            )}{" "}
                            »
                          </p>
                        </div>
                      )}
                  </div>
                </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {!loading && !invoiceDetails && invoiceId && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Impossible de charger les détails de la facture
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Veuillez réessayer plus tard
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
