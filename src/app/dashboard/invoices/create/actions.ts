"use server";

import { prisma } from "@/db";
import { Currency, InvoiceStatus, InvoiceType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CompanyData {
  id: string;
  name: string;
  address: string;
  taxNumber: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

export async function getCompanyInfo(): Promise<CompanyData | null> {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id";

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      return null;
    }

    return {
      id: company.id,
      name: company.name,
      address: company.address,
      taxNumber: company.taxNumber,
      phone: company.phone,
      email: company.email,
      logo: company.logo,
    };
  } catch (error) {
    console.error("Error fetching company info:", error);
    return null;
  }
}

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
      typeClient: client.type,
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

export async function getNextInvoiceNumber(): Promise<string> {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id";
    const year = new Date().getFullYear();

    const sequence = await prisma.invoiceSequence.findUnique({
      where: {
        companyId_year: {
          companyId: companyId,
          year: year,
        },
      },
    });

    const nextNumber = sequence ? sequence.lastNumber + 1 : 1;
    return `FAC-${year}-${String(nextNumber).padStart(5, "0")}`;
  } catch (error) {
    console.error("Error fetching next invoice number:", error);
    const year = new Date().getFullYear();
    return `FAC-${year}-00001`;
  }
}

export interface SaveInvoiceData {
  // Context
  invoiceDate: Date;
  dueDate: Date;
  showDueDate: boolean;
  invoiceType: InvoiceType;
  currency: Currency;
  exchangeRate?: number;
  
  // Company info
  company: {
    name: string;
    address: string;
    fiscalMatricule: string;
    phone: string;
    email: string;
  };
  companyLogo?: string | null;
  
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
  
  // Rectificative invoice (optional)
  rectifiesInvoiceId?: string;
  
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
      // 1. Update or create company with the provided information
      const company = await tx.company.upsert({
        where: {
          id: companyId,
        },
        create: {
          id: companyId,
          name: data.company.name,
          address: data.company.address,
          taxNumber: data.company.fiscalMatricule,
          phone: data.company.phone,
          email: data.company.email,
          logo: data.companyLogo || null,
        },
        update: {
          name: data.company.name,
          address: data.company.address,
          taxNumber: data.company.fiscalMatricule,
          phone: data.company.phone,
          email: data.company.email,
          logo: data.companyLogo || null,
        },
      });

      // 2. Find or create exercise for this year
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
      if (!exercise.isOpen && data.status === "VALIDÉ") {
        throw new Error(`L'exercice ${exerciseYear} est fermé. Impossible de valider la facture.`);
      }

      // 3. Get or create invoice sequence for this year
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
          dueDate: data.dueDate,
          showDueDate: data.showDueDate,
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
          rectifiesInvoiceId: data.rectifiesInvoiceId || null,
          clientId: data.clientId,
          companyId: companyId,
          exerciseId: exercise.id,
          validatedAt: data.status === "VALIDÉ" ? new Date() : null,
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

export async function updateInvoice(
  invoiceId: string,
  data: SaveInvoiceData
): Promise<{ success: boolean; error?: string; invoiceNumber?: string }> {
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

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if invoice exists and is draft
      const existingInvoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!existingInvoice) {
        throw new Error("Facture introuvable");
      }

      if (existingInvoice.status !== "BROUILLON") {
        throw new Error("Seules les factures brouillon peuvent être modifiées");
      }

      // Update company
      await tx.company.update({
        where: { id: companyId },
        data: {
          name: data.company.name,
          address: data.company.address,
          taxNumber: data.company.fiscalMatricule,
          phone: data.company.phone,
          email: data.company.email,
          logo: data.companyLogo || null,
        },
      });

      // Delete existing invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoiceId },
      });

      // Update invoice
      const invoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          date: data.invoiceDate,
          dueDate: data.dueDate,
          showDueDate: data.showDueDate,
          type: data.invoiceType,
          currency: data.currency,
          exchangeRate: data.currency === "TND" ? null : data.exchangeRate,
          clientId: data.clientId,
          companyId: companyId,
          totalHT: data.totalHT,
          totalTVA: data.totalTVA,
          stampDuty: data.stampDuty,
          totalTTC: data.totalTTC,
          suspensionAuthNumber: data.suspensionAuthNumber || null,
          suspensionValidUntil: data.suspensionValidUntil || null,
          purchaseOrderNumber: data.purchaseOrderNumber || null,
          status: data.status,
          validatedAt: data.status === "VALIDÉ" ? new Date() : null,
        },
      });

      // Create new invoice items
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
        invoiceNumber: invoice.invoiceNumber,
      };
    });

    // Revalidate the invoices list page
    revalidatePath("/dashboard/invoices");

    return { 
      success: true, 
      invoiceNumber: result.invoiceNumber,
    };
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    return { 
      success: false, 
      error: error.message || "Erreur lors de la mise à jour de la facture" 
    };
  }
}

export interface InvoiceEditData {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  showDueDate: boolean;
  exerciseYear: number;
  documentType: string;
  type: InvoiceType;
  currency: Currency;
  exchangeRate: number;
  status: string;
  companyLogo: string | null;
  company: {
    name: string;
    address: string;
    fiscalMatricule: string;
    phone: string;
    email: string;
  };
  client: {
    id: string;
    name: string;
    address: string;
    fiscalMatricule: string;
    type: string;
    country: string;
  };
  lines: Array<{
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
  suspensionAuthNumber: string | null;
  suspensionValidUntil: Date | null;
  purchaseOrderNumber: string | null;
}

export async function getInvoiceForEdit(
  invoiceId: string
): Promise<{ success: boolean; data?: InvoiceEditData; error?: string }> {
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
      return {
        success: false,
        error: "Facture introuvable",
      };
    }

    // Only allow editing draft invoices
    if (invoice.status !== "BROUILLON") {
      return {
        success: false,
        error: "Seules les factures brouillon peuvent être modifiées",
      };
    }

    const editData: InvoiceEditData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.date,
      showDueDate: invoice.showDueDate,
      dueDate: invoice.dueDate,
      exerciseYear: invoice.exerciseYear,
      documentType: invoice.documentType,
      type: invoice.type,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : 1,
      status: invoice.status,
      companyLogo: invoice.company.logo,
      company: {
        name: invoice.company.name,
        address: invoice.company.address,
        fiscalMatricule: invoice.company.taxNumber,
        phone: invoice.company.phone || "",
        email: invoice.company.email || "",
      },
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        address: invoice.client.address,
        fiscalMatricule: invoice.client.taxNumber || "",
        type : invoice.client.type,
        country: invoice.client.country,
      },
      lines: invoice.items.map((item) => ({
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
      suspensionAuthNumber: invoice.suspensionAuthNumber,
      suspensionValidUntil: invoice.suspensionValidUntil,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
    };

    return {
      success: true,
      data: editData,
    };
  } catch (error) {
    console.error("Error fetching invoice for edit:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de la facture",
    };
  }
}