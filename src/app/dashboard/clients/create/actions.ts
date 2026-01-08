"use server";

import { prisma } from "@/db";
import { revalidatePath } from "next/cache";

interface CreateClientInput {
  type: "PARTICULIER" | "PROFESSIONNEL";
  name: string;
  address: string;
  country: string;
  taxNumber: string | null;
  email: string | null;
  phone: string | null;
  defaultCurrency: "TND" | "EUR" | "USD";
  defaultInvoiceType: "LOCAL" | "EXPORTATION" | "SUSPENSION";
}

export async function createClient(input: CreateClientInput) {
  try {
    // TODO: Get actual companyId from session/auth
    const companyId = "temp-company-id"; // Replace with actual company ID from auth

    // Generate client code using transaction
    const client = await prisma.$transaction(async (tx) => {
      // Get or create client sequence
      let sequence = await tx.clientSequence.findUnique({
        where: {
          companyId: companyId,
        },
      });

      if (!sequence) {
        sequence = await tx.clientSequence.create({
          data: {
            companyId: companyId,
            lastNumber: 0,
          },
        });
      }

      // Increment sequence
      const newNumber = sequence.lastNumber + 1;
      await tx.clientSequence.update({
        where: {
          id: sequence.id,
        },
        data: {
          lastNumber: newNumber,
        },
      });

      // Generate client code: CLI-001, CLI-002, etc.
      const codeClient = `CLI-${newNumber.toString().padStart(3, "0")}`;

      // Create client
      const newClient = await tx.client.create({
        data: {
          codeClient,
          type: input.type,
          name: input.name,
          address: input.address,
          country: input.country,
          taxNumber: input.taxNumber,
          email: input.email,
          phone: input.phone,
          defaultCurrency: input.defaultCurrency,
          defaultInvoiceType: input.defaultInvoiceType,
          companyId: companyId,
          status: "ACTIVE",
        },
      });

      return newClient;
    });

    // Revalidate the clients page
    revalidatePath("/dashboard/clients");

    return {
      success: true,
      client,
    };
  } catch (error: any) {
    console.error("Error creating client:", error);
    
    // Handle unique constraint violations
    if (error.code === "P2002") {
      return {
        success: false,
        error: "Un client avec ces informations existe déjà",
      };
    }

    return {
      success: false,
      error: error.message || "Erreur lors de la création du client",
    };
  }
}


export async function getClients() {
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
    const transformedData = clients.map((client) => {
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
        typeClient: client.type === "PROFESSIONNEL" ? "Professionnel" : "Particulier",
        matriculeFiscal: client.taxNumber || "-",
        pays: client.country,
        deviseParDefaut: client.defaultCurrency,
        nombreFactures,
        totalFactureHT,
        totalTVA,
        totalTTC,
        statut: client.status === "ACTIVE" ? "Actif" : "Archivé",
      };
    });

    return transformedData;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

