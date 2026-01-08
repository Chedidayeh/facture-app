"use server";

import { prisma } from "@/db";
import { Currency, InvoiceStatus, InvoiceType } from "@/lib/types";
import { revalidatePath } from "next/cache";

export interface ActiveClientData {
  id: string;
  clientCode: string;
  nom: string;
  typeClient: string;
  matriculeFiscal: string;
  pays: string;
  address: string;
  statut: string;
}

export async function getActiveClients(): Promise<ActiveClientData[]> {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id";

    const clients = await prisma.client.findMany({
      where: {
        companyId: companyId,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform data to match the invoice form structure
    const transformedData: ActiveClientData[] = clients.map((client) => ({
      id: client.id,
      clientCode: client.codeClient,
      nom: client.name,
      typeClient: client.type === "PROFESSIONNEL" ? "Professionnel" : "Particulier",
      matriculeFiscal: client.taxNumber || "-",
      pays: client.country,
      address: client.address,
      statut: "Actif",
    }));

    return transformedData;
  } catch (error) {
    console.error("Error fetching active clients:", error);
    return [];
  }
}

export interface SaveInvoiceData {
  // Context
  invoiceDate: Date;
  invoiceType: InvoiceType;
  currency: Currency;
  exchangeRate?: number;
  
  // Client
  clientId: string;
  
  // Lines
  lines: Array<{
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
  
  // Totals
  totalHT: number;
  totalTVA: number;
  stampDuty: number;
  totalTTC: number;
  
  // Suspension fields (optional)
  suspensionAuthNumber?: string;
  suspensionValidUntil?: Date;
  purchaseOrderNumber?: string;
  
  // Status
  status: InvoiceStatus;
}

export async function saveInvoice(
  data: SaveInvoiceData
): Promise<{ success: boolean; error?: string; invoiceId?: string; invoiceNumber?: string }> {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id";

    // Validate required fields
    if (!data.clientId) {
      return { success: false, error: "Client requis" };
    }

    if (data.lines.length === 0) {
      return { success: false, error: "Au moins une ligne est requise" };
    }

    // Validate suspension fields if type is SUSPENSION
    if (data.invoiceType === "SUSPENSION") {
      if (!data.suspensionAuthNumber || !data.suspensionValidUntil || !data.purchaseOrderNumber) {
        return { 
          success: false, 
          error: "Les informations de suspension sont obligatoires pour ce type de facture" 
        };
      }
    }

    // Validate exchange rate for non-TND currencies
    if (data.currency !== "TND" && (!data.exchangeRate || data.exchangeRate <= 0)) {
      return { 
        success: false, 
        error: "Le taux de change est obligatoire pour les devises autres que TND" 
      };
    }

    const exerciseYear = data.invoiceDate.getFullYear();

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create exercise for this year
      let exercise = await tx.exercise.findUnique({
        where: {
          companyId_year: {
            companyId: companyId,
            year: exerciseYear,
          },
        },
      });

      if (!exercise) {
        exercise = await tx.exercise.create({
          data: {
            companyId: companyId,
            year: exerciseYear,
            isOpen: true,
          },
        });
      }

      // Check if exercise is open
      if (!exercise.isOpen && data.status === "VALIDATED") {
        throw new Error(`L'exercice ${exerciseYear} est fermé. Impossible de valider la facture.`);
      }

      // 2. Get or create invoice sequence for this year
      let sequence = await tx.invoiceSequence.findUnique({
        where: {
          companyId_year: {
            companyId: companyId,
            year: exerciseYear,
          },
        },
      });

      if (!sequence) {
        sequence = await tx.invoiceSequence.create({
          data: {
            companyId: companyId,
            year: exerciseYear,
            lastNumber: 0,
          },
        });
      }

      // 3. Increment sequence and generate invoice number
      const newNumber = sequence.lastNumber + 1;
      const invoiceNumber = `FAC-${exerciseYear}-${String(newNumber).padStart(5, "0")}`;

      await tx.invoiceSequence.update({
        where: {
          companyId_year: {
            companyId: companyId,
            year: exerciseYear,
          },
        },
        data: {
          lastNumber: newNumber,
        },
      });

      // 4. Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: invoiceNumber,
          date: data.invoiceDate,
          exerciseYear: exerciseYear,
          type: data.invoiceType,
          status: data.status,
          currency: data.currency,
          exchangeRate: data.currency === "TND" ? null : data.exchangeRate,
          totalHT: data.totalHT,
          totalTVA: data.totalTVA,
          stampDuty: data.stampDuty,
          totalTTC: data.totalTTC,
          suspensionAuthNumber: data.suspensionAuthNumber || null,
          suspensionValidUntil: data.suspensionValidUntil || null,
          purchaseOrderNumber: data.purchaseOrderNumber || null,
          clientId: data.clientId,
          companyId: companyId,
          exerciseId: exercise.id,
          validatedAt: data.status === "VALIDATED" ? new Date() : null,
        },
      });

      // 5. Create invoice items
      await tx.invoiceItem.createMany({
        data: data.lines.map((line) => ({
          invoiceId: invoice.id,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceHT: line.unitPriceHT,
          discount: line.discount,
          vatRate: line.vatRate,
          lineTotalHT: line.lineTotalHT,
          lineTVA: line.lineTVA,
          lineTotalTTC: line.lineTotalTTC,
        })),
      });

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      };
    });

    // Revalidate the invoices list page
    revalidatePath("/dashboard/invoices");

    return { 
      success: true, 
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
    };
  } catch (error: any) {
    console.error("Error saving invoice:", error);
    return { 
      success: false, 
      error: error.message || "Erreur lors de l'enregistrement de la facture" 
    };
  }
}
