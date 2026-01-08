"use client";

import * as React from "react";
import { CreateInvoices } from "./_components/create-invoices";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Créer une nouvelle facture</h1>
        <p className="text-muted-foreground text-sm">Suivez les étapes pour créer une facture légalement conforme.</p>
      </div>
      <CreateInvoices />
    </div>
  );
}
