import { ClientType } from "@prisma/client";
import { z } from "zod";

export const sectionSchema = z.object({
  id: z.number(),
  clientCode: z.string(),
  nom: z.string(),
  typeClient: z.enum(ClientType),
  matriculeFiscal: z.string(),
  pays: z.string(),
  deviseParDefaut: z.string(),
  nombreFactures: z.number(),
  totalFactureHT: z.number(),
  totalTVA: z.number(),
  totalTTC: z.number(),
  statut: z.enum(["Actif", "Archivé"]),
});
