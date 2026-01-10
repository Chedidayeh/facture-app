import { pdf } from "@react-pdf/renderer";
import { InvoicePDFTemplate } from "@/app/dashboard/invoices/_components/invoice-pdf-template";
import { InvoiceDetails } from "@/app/dashboard/invoices/actions";
import React from "react";

export async function generatePDFFromInvoice(
  invoiceDetails: InvoiceDetails,
  fileName: string = "invoice.pdf"
) {
  try {
    // Create the PDF document using react-pdf
    const pdfDocument = React.createElement(InvoicePDFTemplate, {
      invoice: invoiceDetails,
    }) as any;

    // Generate the PDF blob
    const blob = await pdf(pdfDocument).toBlob();

    // Create a download link and trigger download
    const downloadLink = globalThis.document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = fileName;
    globalThis.document.body.appendChild(downloadLink);
    downloadLink.click();
    globalThis.document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
