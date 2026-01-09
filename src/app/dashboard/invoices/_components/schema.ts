import { z } from "zod";

export const sectionSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  date: z.string().datetime(),
  exerciseYear: z.number().int(),
  type: z.enum(["LOCAL", "EXPORT", "SUSPENSION"]),
  status: z.enum(["BROUILLON", "VALIDÉ", "PAYÉ"]),
  currency: z.enum(["TND", "EUR", "USD"]),
  exchangeRate: z.number().positive().optional(),
  totalHT: z.number().nonnegative(),
  totalTVA: z.number().nonnegative(),
  stampDuty: z.number().nonnegative(),
  totalTTC: z.number().nonnegative(),
  suspensionAuthNumber: z.string().optional(),
  suspensionValidUntil: z.string().datetime().optional(),
  purchaseOrderNumber: z.string().optional(),
  clientId: z.string().uuid(),
  companyId: z.string().uuid(),
  validatedById: z.string().uuid().optional(),
});
