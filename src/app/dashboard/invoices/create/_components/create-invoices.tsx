"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvoiceForm } from "./invoice-form-new";

export function CreateInvoices() {
  // const { data: session, status } = useSession();

  // For now, we'll use a hardcoded company ID or get it from the session/context
  // In a real app, this should come from a user context or session
  const companyId = process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || "id";

  // const status = "loading"; // Uncomment when using session

  // if (status === "loading") {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <p className="text-muted-foreground">Chargement...</p>
  //     </div>
  //   );
  // }

  // if (!session) {
  //   return (
  //     <Alert className="border-red-200 bg-red-50 max-w-md mx-auto mt-20">
  //       <AlertCircle className="h-4 w-4 text-red-600" />
  //       <AlertDescription className="text-red-800">
  //         Vous devez être connecté pour créer une facture.
  //       </AlertDescription>
  //     </Alert>
  //   );
  // }

  return <InvoiceForm companyId={companyId} />;
}
