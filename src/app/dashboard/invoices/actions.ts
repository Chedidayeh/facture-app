"use server";

import { prisma } from "@/db";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDFTemplate } from "./_components/invoice-pdf-template";
import React from "react";
import { revalidatePath } from "next/cache";

export interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  showDueDate: boolean;
  exerciseYear: number;
  documentType: string;
  type: string;
  status: string;
  paymentStatus: string;
  currency: string;
  exchangeRate: number | null;
  totalHT: number;
  totalTVA: number;
  stampDuty: number;
  totalTTC: number;
  suspensionAuthNumber: string | null;
  suspensionValidUntil: Date | null;
  purchaseOrderNumber: string | null;
  parentInvoice: {
    id: string;
    invoiceNumber: string;
    date: Date;
  } | null;
  creditNotes: Array<{
    id: string;
    invoiceNumber: string;
    date: Date;
    totalTTC: number;
    status: string;
  }>;
  rectifiesInvoice: {
    id: string;
    invoiceNumber: string;
    date: Date;
  } | null;
  rectificativeInvoices: Array<{
    id: string;
    invoiceNumber: string;
    date: Date;
    totalTTC: number;
    status: string;
  }>;
  client: {
    id: string;
    name: string;
    address: string;
    taxNumber: string | null;
    country: string;
    type : string;
  };
  company: {
    name: string;
    address: string;
    taxNumber: string;
    phone: string | null;
    email: string | null;
    logo: string | null;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPriceHT: number;
    discount: number;
    vatRate: number;
    lineTotalHT: number;
    lineTVA: number;
    lineTotalTTC: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  validatedAt: Date | null;
}

export async function getInvoiceDetails(
  invoiceId: string
): Promise<InvoiceDetails | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        client: true,
        company: true,
        items: {
          orderBy: {
            id: "asc",
          },
        },
        parentInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
          },
        },
        creditNotes: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
            totalTTC: true,
            status: true,
          },
          orderBy: {
            date: "desc",
          },
        },
        rectifiesInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
          },
        },
        rectificativeInvoices: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
            totalTTC: true,
            status: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      dueDate: invoice.dueDate,
      showDueDate: invoice.showDueDate,
      exerciseYear: invoice.exerciseYear,
      documentType: invoice.documentType,
      type: invoice.type,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
      totalHT: Number(invoice.totalHT),
      totalTVA: Number(invoice.totalTVA),
      stampDuty: Number(invoice.stampDuty),
      totalTTC: Number(invoice.totalTTC),
      suspensionAuthNumber: invoice.suspensionAuthNumber,
      suspensionValidUntil: invoice.suspensionValidUntil,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
      parentInvoice: invoice.parentInvoice,
      creditNotes: invoice.creditNotes.map((cn) => ({
        ...cn,
        totalTTC: Number(cn.totalTTC),
      })),
      rectifiesInvoice: invoice.rectifiesInvoice,
      rectificativeInvoices: invoice.rectificativeInvoices.map((ri) => ({
        ...ri,
        totalTTC: Number(ri.totalTTC),
      })),
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        address: invoice.client.address,
        taxNumber: invoice.client.taxNumber,
        country: invoice.client.country,
        type : invoice.client.type,
      },
      company: {
        name: invoice.company.name,
        address: invoice.company.address,
        taxNumber: invoice.company.taxNumber,
        phone: invoice.company.phone,
        email: invoice.company.email,
        logo: invoice.company.logo,
      },
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPriceHT: Number(item.unitPriceHT),
        discount: Number(item.discount),
        vatRate: Number(item.vatRate),
        lineTotalHT: Number(item.lineTotalHT),
        lineTVA: Number(item.lineTVA),
        lineTotalTTC: Number(item.lineTotalTTC),
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      validatedAt: invoice.validatedAt,
    };
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return null;
  }
}

export interface InvoiceTableData {
  id: string;
  invoiceNumber: string;
  date: Date;
  clientName: string;
  documentType: string;
  type: string;
  status: string;
  paymentStatus: string;
  currency: string;
  totalTTC: number;
  exerciseYear: number;
  rectifiesInvoiceId: string | null;
  rectifiesInvoiceNumber: string | null;
  parentInvoiceNumber: string | null;
  hasRectificatives: boolean;
  totalCreditNotesAmount: number;
}

export async function getInvoices(): Promise<InvoiceTableData[]> {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id";

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        rectificativeInvoices: {
          select: {
            id: true,
          },
        },
        creditNotes: {
          select: {
            totalTTC: true,
          },
        },
        parentInvoice: {
          select: {
            invoiceNumber: true,
          },
        },
        rectifiesInvoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Transform data to match the DataTable structure
    const transformedData: InvoiceTableData[] = invoices.map((invoice) => {
      // Map invoice type
      let typeLabel = "";
      switch (invoice.type) {
        case "LOCAL":
          typeLabel = "Local";
          break;
        case "EXPORTATION":
          typeLabel = "Exportation";
          break;
        case "SUSPENSION":
          typeLabel = "Suspension";
          break;
      }

      // Map status
      let statusLabel = "";
      switch (invoice.status) {
        case "BROUILLON":
          statusLabel = "BROUILLON";
          break;
        case "VALIDÉ":
          statusLabel = "VALIDÉ";
          break;
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        clientName: invoice.client.name,
        documentType: invoice.documentType,
        type: typeLabel,
        status: statusLabel,
        paymentStatus: invoice.paymentStatus,
        currency: invoice.currency,
        totalTTC: Number(invoice.totalTTC),
        exerciseYear: invoice.exerciseYear,
        rectifiesInvoiceId: invoice.rectifiesInvoiceId,
        rectifiesInvoiceNumber: invoice.rectifiesInvoice?.invoiceNumber || null,
        parentInvoiceNumber: invoice.parentInvoice?.invoiceNumber || null,
        hasRectificatives: invoice.rectificativeInvoices.length > 0,
        totalCreditNotesAmount: invoice.creditNotes.reduce(
          (sum, cn) => sum + Math.abs(Number(cn.totalTTC)),
          0
        ),
      };
    });

    return transformedData;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function generateInvoicePDF(
  invoiceId: string
): Promise<{
  success: boolean;
  pdfData?: string;
  filename?: string;
  error?: string;
}> {
  try {
    // Fetch invoice details
    const invoice = await getInvoiceDetails(invoiceId);

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Generate PDF using the template
    const element = React.createElement(InvoicePDFTemplate, { invoice });
    // @ts-expect-error - Type mismatch between InvoicePDFTemplate and DocumentProps is expected, works at runtime
    const blob = await pdf(element).toBlob();

    // Convert blob to buffer then to base64
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // Generate filename
    const filename = `facture-${invoice.invoiceNumber}.pdf`;

    return {
      success: true,
      pdfData: base64,
      filename,
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return {
      success: false,
      error: "Erreur lors de la génération du PDF",
    };
  }
}

export async function duplicateInvoice(
  invoiceId: string
): Promise<{ success: boolean; newInvoiceId?: string; error?: string }> {
  try {
    // Fetch the original invoice with all its items
    const originalInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        items: true,
      },
    });

    if (!originalInvoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Check if the invoice is a draft
    if (originalInvoice.status !== "BROUILLON") {
      return {
        success: false,
        error: "Seules les factures brouillon peuvent être dupliquées",
      };
    }

    // Get the next invoice number for the current year
    const currentYear = new Date().getFullYear();
    const sequence = await prisma.invoiceSequence.upsert({
      where: {
        companyId_year: {
          companyId: originalInvoice.companyId,
          year: currentYear,
        },
      },
      update: {
        lastNumber: {
          increment: 1,
        },
      },
      create: {
        companyId: originalInvoice.companyId,
        year: currentYear,
        lastNumber: 1,
      },
    });

    const newInvoiceNumber = `FAC-${currentYear}-${String(
      sequence.lastNumber
    ).padStart(5, "0")}`;

    // Create the duplicate invoice with its items
    const duplicatedInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: newInvoiceNumber,
        date: new Date(), // Use current date for the duplicate
        dueDate: originalInvoice.dueDate,
        showDueDate: originalInvoice.showDueDate,
        exerciseYear: currentYear,
        type: originalInvoice.type,
        status: "BROUILLON",
        currency: originalInvoice.currency,
        exchangeRate: originalInvoice.exchangeRate,
        totalHT: originalInvoice.totalHT,
        totalTVA: originalInvoice.totalTVA,
        stampDuty: originalInvoice.stampDuty,
        totalTTC: originalInvoice.totalTTC,
        suspensionAuthNumber: originalInvoice.suspensionAuthNumber,
        suspensionValidUntil: originalInvoice.suspensionValidUntil,
        purchaseOrderNumber: originalInvoice.purchaseOrderNumber,
        clientId: originalInvoice.clientId,
        companyId: originalInvoice.companyId,
        exerciseId: originalInvoice.exerciseId,
        items: {
          create: originalInvoice.items.map((item) => ({
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
        },
      },
    });

    return {
      success: true,
      newInvoiceId: duplicatedInvoice.id,
    };
  } catch (error) {
    console.error("Error duplicating invoice:", error);
    return {
      success: false,
      error: "Erreur lors de la duplication de la facture",
    };
  }
}

export async function deleteInvoice(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the invoice first
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Check if the invoice is a draft
    if (invoice.status !== "BROUILLON") {
      return {
        success: false,
        error: "Seules les factures brouillon peuvent être supprimées",
      };
    }

    // Delete the invoice (items will be deleted automatically due to cascade)
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression de la facture",
    };
  }
}

export async function validateInvoice(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the invoice first
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Check if the invoice is in draft status
    if (invoice.status !== "BROUILLON") {
      return {
        success: false,
        error: "Seules les factures brouillon peuvent être validées",
      };
    }

    // Update the invoice status to VALIDÉ and set validatedAt timestamp
    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        status: "VALIDÉ",
        validatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/invoices");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error validating invoice:", error);
    return {
      success: false,
      error: "Erreur lors de la validation de la facture",
    };
  }
}

export async function markAsPaid(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the invoice first
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Check if the invoice is validated
    if (invoice.status !== "VALIDÉ") {
      return {
        success: false,
        error:
          "Seules les factures validées peuvent être marquées comme payées",
      };
    }

    // Update the invoice status to PAYÉ
    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        paymentStatus: "PAYÉ",
      },
    });

    revalidatePath("/dashboard/invoices");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du statut de la facture",
    };
  }
}

export async function createCreditNote(
  invoiceId: string,
  type: "TOTAL" | "PARTIAL",
  items?: Array<{ itemId: string; quantity: number }>
): Promise<{
  success: boolean;
  creditNoteId?: string;
  creditNoteNumber?: string;
  error?: string;
}> {
  try {
    // Fetch the original invoice with all its items
    const originalInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        items: true,
      },
    });

    if (!originalInvoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Check if the invoice is validated or paid
    if (
      originalInvoice.status !== "VALIDÉ" &&
      originalInvoice.paymentStatus !== "PAYÉ"
    ) {
      return {
        success: false,
        error: "Seules les factures validées ou payées peuvent avoir un avoir",
      };
    }

    // Check if it's already a credit note
    if (originalInvoice.documentType === "AVOIR") {
      return {
        success: false,
        error: "Impossible de créer un avoir pour un avoir",
      };
    }

    const currentYear = new Date().getFullYear();

    // Get or create credit note sequence
    const sequence = await prisma.invoiceSequence.upsert({
      where: {
        companyId_year: {
          companyId: originalInvoice.companyId,
          year: currentYear,
        },
      },
      update: {
        lastNumber: {
          increment: 1,
        },
      },
      create: {
        companyId: originalInvoice.companyId,
        year: currentYear,
        lastNumber: 1,
      },
    });

    const creditNoteNumber = `AV-${currentYear}-${String(
      sequence.lastNumber
    ).padStart(5, "0")}`;

    // Prepare credit note items
    let creditNoteItems;
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    if (type === "TOTAL") {
      // Create credit note for all items with negative amounts
      creditNoteItems = originalInvoice.items.map((item) => {
        const lineHT = Number(item.lineTotalHT) * -1;
        const lineTVA = Number(item.lineTVA) * -1;
        const lineTTC = Number(item.lineTotalTTC) * -1;

        totalHT += lineHT;
        totalTVA += lineTVA;
        totalTTC += lineTTC;

        return {
          description: item.description,
          quantity: Number(item.quantity) * -1,
          unit: item.unit,
          unitPriceHT: item.unitPriceHT,
          discount: item.discount,
          vatRate: item.vatRate,
          lineTotalHT: lineHT,
          lineTVA: lineTVA,
          lineTotalTTC: lineTTC,
        };
      });
    } else {
      // Partial credit note
      if (!items || items.length === 0) {
        return {
          success: false,
          error:
            "Vous devez sélectionner au moins un article pour un avoir partiel",
        };
      }

      creditNoteItems = items.map((selectedItem) => {
        const originalItem = originalInvoice.items.find(
          (i) => i.id === selectedItem.itemId
        );
        if (!originalItem) {
          throw new Error(`Article introuvable: ${selectedItem.itemId}`);
        }

        // Validate quantity
        if (
          selectedItem.quantity <= 0 ||
          selectedItem.quantity > Number(originalItem.quantity)
        ) {
          throw new Error(
            `Quantité invalide pour l'article ${originalItem.description}`
          );
        }

        // Calculate proportional amounts
        const ratio = selectedItem.quantity / Number(originalItem.quantity);
        const lineHT = Number(originalItem.lineTotalHT) * ratio * -1;
        const lineTVA = Number(originalItem.lineTVA) * ratio * -1;
        const lineTTC = Number(originalItem.lineTotalTTC) * ratio * -1;

        totalHT += lineHT;
        totalTVA += lineTVA;
        totalTTC += lineTTC;

        return {
          description: originalItem.description,
          quantity: selectedItem.quantity * -1,
          unit: originalItem.unit,
          unitPriceHT: originalItem.unitPriceHT,
          discount: originalItem.discount,
          vatRate: originalItem.vatRate,
          lineTotalHT: lineHT,
          lineTVA: lineTVA,
          lineTotalTTC: lineTTC,
        };
      });
    }

    // Calculate stamp duty (negative if original had stamp duty)
    const stampDuty =
      Number(originalInvoice.stampDuty) > 0 && type === "TOTAL"
        ? Number(originalInvoice.stampDuty) * -1
        : 0;

    // Create the credit note
    // For credit notes, dueDate should match original invoice's dueDate pattern
    // but showDueDate is always false since credit notes don't require due date display
    const creditNoteDueDate = new Date(
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000
    ); // +7 days default like invoices

    const creditNote = await prisma.invoice.create({
      data: {
        invoiceNumber: creditNoteNumber,
        date: new Date(),
        dueDate: creditNoteDueDate, // Follow same pattern as invoices (+7 days)
        showDueDate: false, // Credit notes never show due date
        exerciseYear: currentYear,
        documentType: "AVOIR",
        type: originalInvoice.type,
        status: "VALIDÉ", // Credit notes are automatically validated
        currency: originalInvoice.currency,
        exchangeRate: originalInvoice.exchangeRate,
        totalHT: totalHT,
        totalTVA: totalTVA,
        stampDuty: stampDuty,
        totalTTC: totalTTC + stampDuty,
        parentInvoiceId: originalInvoice.id,
        clientId: originalInvoice.clientId,
        companyId: originalInvoice.companyId,
        exerciseId: originalInvoice.exerciseId,
        validatedAt: new Date(),
        items: {
          create: creditNoteItems,
        },
      },
    });

    return {
      success: true,
      creditNoteId: creditNote.id,
      creditNoteNumber: creditNote.invoiceNumber,
    };
  } catch (error: any) {
    console.error("Error creating credit note:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de la création de l'avoir",
    };
  }
}

export async function markAsPaidWithPayment(
  paymentData: {
    invoiceId: string;
    paymentMethod: string;
    paymentDate: Date;
    description: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the invoice first
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: paymentData.invoiceId,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Check if the invoice is validated
    if (invoice.status !== "VALIDÉ") {
      return {
        success: false,
        error: "Seules les factures validées peuvent être marquées comme payées",
      };
    }

    // Use transaction to update invoice and create payment record
    await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          invoiceId: paymentData.invoiceId,
          amount: invoice.totalTTC,
          paymentMethod: paymentData.paymentMethod,
          paymentDate: paymentData.paymentDate,
          description: paymentData.description,
        },
      });

      // Update invoice paymentStatus to PAYÉ
      await tx.invoice.update({
        where: {
          id: paymentData.invoiceId,
        },
        data: {
          paymentStatus: "PAYÉ",
        },
      });
    });

    revalidatePath("/dashboard/invoices");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error marking invoice as paid:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de l'enregistrement du paiement",
    };
  }
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  description: string | null;
  createdAt: Date;
}

export async function getInvoicePayments(
  invoiceId: string
): Promise<{ success: boolean; payments?: PaymentRecord[]; error?: string }> {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        invoiceId: invoiceId,
      },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        paymentDate: true,
        description: true,
        createdAt: true,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    const transformedPayments: PaymentRecord[] = payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      description: payment.description,
      createdAt: payment.createdAt,
    }));

    return {
      success: true,
      payments: transformedPayments,
    };
  } catch (error: any) {
    console.error("Error fetching invoice payments:", error);
    return {
      success: false,
      error: error.message || "Erreur lors de la récupération des paiements",
    };
  }
}
