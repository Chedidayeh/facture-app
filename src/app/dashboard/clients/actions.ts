"use server";

import { prisma } from "@/db";
import { ClientStatus, ClientType, Currency, InvoiceType } from "@prisma/client";

export interface ClientTableData {
  id: string;
  clientCode: string;
  nom: string;
  typeClient: string;
  matriculeFiscal: string;
  pays: string;
  deviseParDefaut: string;
  nombreFactures: number;
  totalFactureHT: number;
  totalTVA: number;
  totalTTC: number;
  statut: string;
}

export async function getClients(): Promise<ClientTableData[]> {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id"; // Replace with actual company ID from auth

    const clients = await prisma.client.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        invoices: {
          select: {
            totalHT: true,
            totalTVA: true,
            totalTTC: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to match the DataTable structure
    const transformedData: ClientTableData[] = clients.map((client) => {
      // Calculate totals from invoices
      const nombreFactures = client.invoices.length;
      const totalFactureHT = client.invoices.reduce(
        (sum, inv) => sum + Number(inv.totalHT),
        0
      );
      const totalTVA = client.invoices.reduce(
        (sum, inv) => sum + Number(inv.totalTVA),
        0
      );
      const totalTTC = client.invoices.reduce(
        (sum, inv) => sum + Number(inv.totalTTC),
        0
      );

      return {
        id: client.id,
        clientCode: client.codeClient,
        nom: client.name,
        typeClient: client.type,
        matriculeFiscal: client.taxNumber || "-",
        pays: client.country,
        deviseParDefaut: client.defaultCurrency,
        nombreFactures,
        totalFactureHT,
        totalTVA,
        totalTTC,
        statut: client.status,
      };
    });

    return transformedData;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export interface ClientDetails {
  id: string;
  clientCode: string;
  name: string;
  type: string;
  taxNumber: string | null;
  address: string;
  email: string | null;
  phone: string | null;
  country: string;
  defaultCurrency: string;
  defaultInvoiceType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  numberOfInvoices: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export async function getClientDetails(clientId: string): Promise<ClientDetails | null> {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
      include: {
        invoices: {
          select: {
            totalHT: true,
            totalTVA: true,
            totalTTC: true,
          },
        },
      },
    });

    if (!client) {
      return null;
    }

    // Calculate statistics
    const numberOfInvoices = client.invoices.length;
    const totalHT = client.invoices.reduce(
      (sum, inv) => sum + Number(inv.totalHT),
      0
    );
    const totalTVA = client.invoices.reduce(
      (sum, inv) => sum + Number(inv.totalTVA),
      0
    );
    const totalTTC = client.invoices.reduce(
      (sum, inv) => sum + Number(inv.totalTTC),
      0
    );

    return {
      id: client.id,
      clientCode: client.codeClient,
      name: client.name,
      type: client.type,
      taxNumber: client.taxNumber,
      address: client.address,
      email: client.email,
      phone: client.phone ,
      country: client.country,
      defaultCurrency: client.defaultCurrency,
      defaultInvoiceType: client.defaultInvoiceType,
      status: client.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      numberOfInvoices,
      totalHT,
      totalTVA,
      totalTTC,
    };
  } catch (error) {
    console.error("Error fetching client details:", error);
    return null;
  }
}

export interface UpdateClientData {
  name: string;
  type: string;
  taxNumber: string | null;
  address: string;
  email: string | null;
  phone: string | null;
  country: string;
  defaultCurrency: string;
  defaultInvoiceType: string;
  status: string;
}

export async function updateClient(
  clientId: string,
  data: UpdateClientData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate required fields
    if (!data.name || !data.address || !data.country) {
      return { success: false, error: "Tous les champs obligatoires doivent être remplis" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      return { success: false, error: "Format d'email invalide" };
    }

    // If type is PROFESSIONNEL and taxNumber is required
    if (data.type === ClientType.PROFESSIONNEL && data.taxNumber) {
      // Check if tax number is unique (excluding current client)
      const existingClient = await prisma.client.findFirst({
        where: {
          taxNumber: data.taxNumber,
          id: { not: clientId },
        },
      });

      if (existingClient) {
        return { success: false, error: "Ce matricule fiscal est déjà utilisé par un autre client" };
      }
    }

    // Update the client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        type: data.type as ClientType,
        taxNumber: data.taxNumber,
        address: data.address,
        email: data.email,
        phone: data.phone,
        country: data.country,
        defaultCurrency: data.defaultCurrency as Currency,
        defaultInvoiceType: data.defaultInvoiceType as InvoiceType,
        status: data.status as ClientStatus,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Erreur lors de la mise à jour du client" };
  }
}
