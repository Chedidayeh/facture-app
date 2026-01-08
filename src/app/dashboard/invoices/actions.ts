"use server";

import { prisma } from "@/db";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDFTemplate } from "./_components/invoice-pdf-template";
import React from "react";

export interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  date: Date;
  exerciseYear: number;
  type: string;
  status: string;
  currency: string;
  exchangeRate: number | null;
  totalHT: number;
  totalTVA: number;
  stampDuty: number;
  totalTTC: number;
  suspensionAuthNumber: string | null;
  suspensionValidUntil: Date | null;
  purchaseOrderNumber: string | null;
  client: {
    id: string;
    name: string;
    address: string;
    taxNumber: string | null;
    country: string;
    isProfessional: boolean;
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

export async function getInvoiceDetails(invoiceId: string): Promise<InvoiceDetails | null> {
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
            id: 'asc',
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
      exerciseYear: invoice.exerciseYear,
      type: invoice.type,
      status: invoice.status,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
      totalHT: Number(invoice.totalHT),
      totalTVA: Number(invoice.totalTVA),
      stampDuty: Number(invoice.stampDuty),
      totalTTC: Number(invoice.totalTTC),
      suspensionAuthNumber: invoice.suspensionAuthNumber,
      suspensionValidUntil: invoice.suspensionValidUntil,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        address: invoice.client.address,
        taxNumber: invoice.client.taxNumber,
        country: invoice.client.country,
        isProfessional: invoice.client.type === "PROFESSIONNEL",
      },
      company: {
        name: invoice.company.name,
        address: invoice.company.address,
        taxNumber: invoice.company.taxNumber,
        phone: invoice.company.phone,
        email: invoice.company.email,
        logo: invoice.company.logo,
      },
      items: invoice.items.map(item => ({
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
  type: string;
  status: string;
  currency: string;
  totalHT: number;
  totalTVA: number;
  stampDuty: number;
  totalTTC: number;
  exerciseYear: number;
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
        case "DRAFT":
          statusLabel = "DRAFT";
          break;
        case "VALIDATED":
          statusLabel = "VALIDATED";
          break;
        case "PAID":
          statusLabel = "PAID";
          break;
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        clientName: invoice.client.name,
        type: typeLabel,
        status: statusLabel,
        currency: invoice.currency,
        totalHT: Number(invoice.totalHT),
        totalTVA: Number(invoice.totalTVA),
        stampDuty: Number(invoice.stampDuty),
        totalTTC: Number(invoice.totalTTC),
        exerciseYear: invoice.exerciseYear,
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
): Promise<{ success: boolean; pdfData?: string; filename?: string; error?: string }> {
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
