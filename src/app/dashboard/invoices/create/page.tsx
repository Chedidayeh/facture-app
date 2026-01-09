"use client";

import * as React from "react";
import { CreateInvoices } from "./_components/create-invoices";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <CreateInvoices />
    </div>
  );
}
