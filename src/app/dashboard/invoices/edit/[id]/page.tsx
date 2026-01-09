"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { InvoiceForm } from "../../create/_components/invoice-form-new";

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <InvoiceForm 
        companyId="temp-company-id" 
        invoiceId={invoiceId}
        mode="edit"
      />
    </div>
  );
}
