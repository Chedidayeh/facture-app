import { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import {
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Copy,
  FileText,
  DollarSign,
  Receipt,
  FileX,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  InvoiceTableData,
  generateInvoicePDF,
  duplicateInvoice,
  deleteInvoice,
  markAsPaid,
  validateInvoice,
} from "../actions";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { InvoiceDetailsSheet } from "./invoice-details-sheet";
import { CreditNoteDialog } from "./credit-note-dialog";
import { MarkAsPaidDialog } from "./mark-as-paid-dialog";
import { toast } from "sonner";

export const dashboardColumns: ColumnDef<InvoiceTableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="N° Facture" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm font-semibold">
        {row.original.invoiceNumber}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {format(new Date(row.original.date), "d MMMM yyyy à HH:mm", {
            locale: fr,
          })}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium text-sm">{row.original.clientName}</div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "documentType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Document" />
    ),
    cell: ({ row }) => {
      const documentType = row.original.documentType;
      const isRectificative = row.original.rectifiesInvoiceId !== null;
      const rectifiesInvoiceNumber = row.original.rectifiesInvoiceNumber;
      const parentInvoiceNumber = row.original.parentInvoiceNumber;
      const variant = documentType === "AVOIR" ? "destructive" : "default";
      const label = documentType === "AVOIR" ? "Avoir" : "Facture";

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Badge variant={variant}>{label}</Badge>
            {isRectificative && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-600 border-blue-300 text-xs"
              >
                Rectificative
              </Badge>
            )}
          </div>
          {/* Afficher la facture source pour les avoirs */}
          {documentType === "AVOIR" && parentInvoiceNumber && (
            <span className="text-xs text-muted-foreground">
              De:{" "}
              <span className="font-mono font-medium">
                {parentInvoiceNumber}
              </span>
            </span>
          )}
          {/* Afficher la facture source pour les rectificatives */}
          {isRectificative && rectifiesInvoiceNumber && (
            <span className="text-xs text-muted-foreground">
              Rectifie:{" "}
              <span className="font-mono font-medium">
                {rectifiesInvoiceNumber}
              </span>
            </span>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const variant = row.original.type === "Local" ? "secondary" : "default";
      return <Badge variant={variant}>{row.original.type}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "currency",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Devise" />
    ),
    cell: ({ row }) => <Badge variant="outline">{row.original.currency}</Badge>,
    enableSorting: false,
  },
  {
    accessorKey: "totalTTC",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-right"
        column={column}
        title="Total TTC"
      />
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <Badge variant="secondary" className="font-mono text-sm font-semibold">
          {row.original.totalTTC.toFixed(2)} {row.original.currency}
        </Badge>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "payment",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Paiement" />
    ),
    cell: ({ row }) => {
      const paymentStatus = row.original.paymentStatus;
      if (paymentStatus === "PAYÉ") {
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-500">
            Payée
          </Badge>
        );
      } else if (paymentStatus === "NON_PAYÉ") {
        return (
          <Badge
            variant="outline"
            className="border-orange-400 text-orange-400"
          >
            Non payée
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Brouillon
          </Badge>
        );
      }
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Statut" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColor = status === "VALIDÉ" ? "default" : "secondary";
      const statusLabel = status === "VALIDÉ" ? "Validée" : "Brouillon";

      return <Badge variant={statusColor}>{statusLabel}</Badge>;
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter();
      const status = row.original.status;
      const documentType = row.original.documentType;
      const hasRectificatives = row.original.hasRectificatives;
      const totalCreditNotesAmount = row.original.totalCreditNotesAmount;
      const totalTTC = row.original.totalTTC;
      const isFullyCredited =
        Math.abs(totalCreditNotesAmount) >= Math.abs(totalTTC);

      const [detailsOpen, setDetailsOpen] = React.useState(false);
      const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
      const [isDuplicating, setIsDuplicating] = React.useState(false);
      const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
      const [isDeleting, setIsDeleting] = React.useState(false);
      const [validateDialogOpen, setValidateDialogOpen] = React.useState(false);
      const [isValidating, setIsValidating] = React.useState(false);
      const [paidDialogOpen, setPaidDialogOpen] = React.useState(false);
      const [rectificativeWarningOpen, setRectificativeWarningOpen] =
        React.useState(false);
      const [creditNoteDialogOpen, setCreditNoteDialogOpen] =
        React.useState(false);

      const handleGeneratePDF = async () => {
        setIsGeneratingPDF(true);
        try {
          const result = await generateInvoicePDF(row.original.id);

          if (result.success && result.pdfData && result.filename) {
            // Convert base64 to blob
            const byteCharacters = atob(result.pdfData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("PDF généré avec succès", {
              description: `Le fichier ${result.filename} a été téléchargé.`,
            });
          } else {
            toast.error("Erreur", {
              description: result.error || "Impossible de générer le PDF",
            });
          }
        } catch (error) {
          console.error("PDF generation error:", error);
          toast.error("Erreur", {
            description: "Une erreur est survenue lors de la génération du PDF",
          });
        } finally {
          setIsGeneratingPDF(false);
        }
      };

      const handleDuplicate = async () => {
        setIsDuplicating(true);
        try {
          const result = await duplicateInvoice(row.original.id);

          if (result.success) {
            toast.success("Facture dupliquée avec succès", {
              description: "Une nouvelle facture brouillon a été créée.",
            });
            // Refresh the page to show the new invoice
            window.location.reload();
          } else {
            toast.error("Erreur", {
              description: result.error || "Impossible de dupliquer la facture",
            });
          }
        } catch (error) {
          console.error("Duplication error:", error);
          toast.error("Erreur", {
            description: "Une erreur est survenue lors de la duplication",
          });
        } finally {
          setIsDuplicating(false);
        }
      };

      const handleDelete = async () => {
        setIsDeleting(true);
        try {
          const result = await deleteInvoice(row.original.id);

          if (result.success) {
            toast.success("Facture supprimée avec succès", {
              description: "La facture brouillon a été supprimée.",
            });
            // Refresh the page to update the list
            window.location.reload();
          } else {
            toast.error("Erreur", {
              description: result.error || "Impossible de supprimer la facture",
            });
          }
        } catch (error) {
          console.error("Delete error:", error);
          toast.error("Erreur", {
            description: "Une erreur est survenue lors de la suppression",
          });
        } finally {
          setIsDeleting(false);
          setDeleteDialogOpen(false);
        }
      };

      const handleMarkAsPaidClick = () => {
        // Si la facture a des rectificatives, afficher un avertissement
        if (hasRectificatives) {
          setRectificativeWarningOpen(true);
        } else {
          setPaidDialogOpen(true);
        }
      };

      const handleRectificativeWarningConfirm = () => {
        setRectificativeWarningOpen(false);
        setPaidDialogOpen(true);
      };

      const handleValidate = async () => {
        setIsValidating(true);
        try {
          const result = await validateInvoice(row.original.id);

          if (result.success) {
            toast.success("Facture validée avec succès", {
              description:
                "La facture est maintenant validée et prête à être émise.",
            });
            // Refresh the page to update the list
            window.location.reload();
          } else {
            toast.error("Erreur", {
              description: result.error || "Impossible de valider la facture",
            });
          }
        } catch (error) {
          console.error("Validation error:", error);
          toast.error("Erreur", {
            description: "Une erreur est survenue lors de la validation",
          });
        } finally {
          setIsValidating(false);
          setValidateDialogOpen(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <EllipsisVertical className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
                <Eye className="mr-2 size-4" />
                Voir Détails
              </DropdownMenuItem>

              {/* BROUILLON actions */}
              {status === "BROUILLON" && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/invoices/edit/${row.original.id}`)
                    }
                  >
                    <Pencil className="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setValidateDialogOpen(true)}>
                    <CheckCircle className="mr-2 size-4" />
                    Valider
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                  >
                    <Copy className="mr-2 size-4" />
                    {isDuplicating ? "Duplication..." : "Dupliquer"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}

              {/* VALIDÉ actions */}
              {status === "VALIDÉ" && (
                <>
                  <DropdownMenuItem
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                  >
                    <FileText className="mr-2 size-4" />
                    {isGeneratingPDF ? "Génération..." : "Générer PDF"}
                  </DropdownMenuItem>
                  {/* Ne pas permettre de marquer comme payée si facture complètement annulée par avoirs */}
                  {!isFullyCredited && (
                    <DropdownMenuItem onClick={handleMarkAsPaidClick}>
                      <DollarSign className="mr-2 size-4" />
                      Marquer comme Payée
                      {totalCreditNotesAmount > 0 && (
                        <span className="ml-2 text-xs text-orange-600">
                          ({(totalTTC - totalCreditNotesAmount).toFixed(2)})
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}
                  {/* Actions spécifiques aux FACTURES uniquement */}
                  {documentType === "FACTURE" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setCreditNoteDialogOpen(true)}
                      >
                        <FileX className="mr-2 size-4" />
                        Créer Avoir
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/dashboard/invoices/rectify/${row.original.id}`
                          )
                        }
                      >
                        <Receipt className="mr-2 size-4" />
                        Facture Rectificative
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}

              {/* PAYÉ actions - Show actions for paid invoices */}
              {row.original.paymentStatus === "PAYÉ" && (
                <>
                  <DropdownMenuItem
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                  >
                    <FileText className="mr-2 size-4" />
                    {isGeneratingPDF ? "Génération..." : "Générer PDF"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Receipt className="mr-2 size-4" />
                    Historique Paiements
                  </DropdownMenuItem>
                  {/* Créer Avoir uniquement pour les FACTURES payées */}
                  {documentType === "FACTURE" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setCreditNoteDialogOpen(true)}
                      >
                        <FileX className="mr-2 size-4" />
                        Créer Avoir
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <InvoiceDetailsSheet
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            invoiceId={row.original.id}
          />

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La facture{" "}
                  {row.original.invoiceNumber} sera définitivement supprimée de
                  la base de données.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={validateDialogOpen}
            onOpenChange={setValidateDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Valider la facture</AlertDialogTitle>
                <AlertDialogDescription>
                  Voulez-vous valider la facture {row.original.invoiceNumber} ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isValidating}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleValidate}
                  disabled={isValidating}
                  className=""
                >
                  {isValidating ? "Validation..." : "Valider"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={paidDialogOpen} onOpenChange={setPaidDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Avertissement - Factures Rectificatives
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette facture ({row.original.invoiceNumber}) possède des
                  factures rectificatives. Assurez-vous de payer le montant
                  correct indiqué dans la dernière facture rectificative, et non
                  le montant de la facture originale.
                  <span className="block mt-3 font-medium text-blue-700">
                    Voulez-vous continuer et marquer cette facture comme payée ?
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleRectificativeWarningConfirm}>
                  Continuer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <MarkAsPaidDialog
            open={paidDialogOpen}
            onOpenChange={setPaidDialogOpen}
            invoiceId={row.original.id}
            invoiceNumber={row.original.invoiceNumber}
            amount={totalTTC - totalCreditNotesAmount}
            currency={row.original.currency}
          />

          <AlertDialog
            open={rectificativeWarningOpen}
            onOpenChange={setRectificativeWarningOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Avertissement - Factures Rectificatives
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette facture ({row.original.invoiceNumber}) possède des
                  factures rectificatives. Assurez-vous de payer le montant
                  correct indiqué dans la dernière facture rectificative, et non
                  le montant de la facture originale.
                  <span className="block mt-3 font-medium text-blue-700">
                    Voulez-vous continuer et marquer cette facture comme payée ?
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRectificativeWarningConfirm}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continuer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <CreditNoteDialog
            open={creditNoteDialogOpen}
            onOpenChange={setCreditNoteDialogOpen}
            invoiceId={row.original.id}
            invoiceNumber={row.original.invoiceNumber}
          />
        </>
      );
    },
    enableSorting: false,
  },
];
