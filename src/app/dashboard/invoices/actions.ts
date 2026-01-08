"use server";

import { prisma } from "@/db";


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
