"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getInvoiceDetails } from "../../actions";
import { RectifyInvoiceForm } from "./_components/rectify-invoice-form";
import { Loader2 } from "lucide-react";

export default function RectifyInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [invoiceData, setInvoiceData] = React.useState<any>(null);

  React.useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        const invoice = await getInvoiceDetails(invoiceId);
        
        if (!invoice) {
          toast.error("Facture introuvable");
          router.push("/dashboard/invoices");
          return;
        }

        // Check if invoice is validated or PAYÉ
        if (invoice.status !== "VALIDÉ" && invoice.status !== "PAYÉ") {
          toast.error("Seules les factures validées ou payées peuvent être rectifiées");
          router.push("/dashboard/invoices");
          return;
        }

        setInvoiceData(invoice);
      } catch (error) {
        console.error("Error loading invoice:", error);
        toast.error("Erreur lors du chargement de la facture");
        router.push("/dashboard/invoices");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [invoiceId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoiceData) {
    return null;
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Créer une facture rectificative</h1>
        <p className="text-muted-foreground text-sm">
          Correction de la facture {invoiceData.invoiceNumber}. Modifiez les informations erronées.
        </p>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Info :</strong> La facture originale restera inchangée pour la traçabilité fiscale. 
            Une nouvelle facture sera créée avec les informations corrigées.
          </p>
        </div>
      </div>
      <RectifyInvoiceForm originalInvoice={invoiceData} />
    </div>
  );
}
