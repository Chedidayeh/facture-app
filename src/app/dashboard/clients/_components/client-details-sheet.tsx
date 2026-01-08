"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, CreditCard, Globe, FileText, TrendingUp, Pencil } from "lucide-react";
import { getClientDetails, ClientDetails } from "../actions";
import { EditClientDialog } from "./edit-client-dialog";

interface ClientDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
}

export function ClientDetailsSheet({
  open,
  onOpenChange,
  clientId,
}: ClientDetailsSheetProps) {
  const [clientDetails, setClientDetails] = React.useState<ClientDetails | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (open && clientId) {
      fetchClientDetails(clientId);
    }
  }, [open, clientId]);

  async function fetchClientDetails(id: string) {
    setLoading(true);
    try {
      const data = await getClientDetails(id);
      setClientDetails(data);
    } catch (error) {
      console.error("Error fetching client details:", error);
      setClientDetails(null);
    } finally {
      setLoading(false);
    }
  }

  function handleEditSuccess() {
    // Refresh client details after successful update
    if (clientId) {
      fetchClientDetails(clientId);
    }
  }

  const getTypeLabel = (type: string) => {
    return type === "PROFESSIONNEL" ? "Professionnel" : "Particulier";
  };

  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case "LOCAL":
        return "Local";
      case "EXPORTATION":
        return "Exportation";
      case "SUSPENSION":
        return "En suspension de TVA";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actif";
      case "INACTIVE":
        return "Inactif";
      case "ARCHIVED":
        return "Archivé";
      default:
        return status;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <SheetHeader>
              <SheetTitle className="text-xl">Détails du Client</SheetTitle>
              <SheetDescription>
                Informations complètes du client et statistiques
              </SheetDescription>
            </SheetHeader>
            {clientDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="shrink-0"
              >
                <Pencil className="size-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          )}

          {!loading && clientDetails && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-bold tracking-tight">{clientDetails.name}</h3>
                  <Badge 
                    variant={clientDetails.status === "ACTIVE" ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {getStatusLabel(clientDetails.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-semibold text-muted-foreground">{clientDetails.clientCode}</span>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant={clientDetails.type === "PROFESSIONNEL" ? "default" : "secondary"}>
                    {getTypeLabel(clientDetails.type)}
                  </Badge>
                </div>
              </div>

              {/* Statistics - Moved to top for prominence */}
              <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Statistiques
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-background p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Nombre de Factures</p>
                    <p className="text-3xl font-bold">{clientDetails.numberOfInvoices}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Total HT</p>
                    <p className="text-2xl font-bold tabular-nums">{clientDetails.totalHT.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">TND</span></p>
                  </div>
                  <div className="rounded-lg border bg-background p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Total TVA</p>
                    <p className="text-2xl font-bold tabular-nums">{clientDetails.totalTVA.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">TND</span></p>
                  </div>
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Total TTC</p>
                    <p className="text-2xl font-bold text-primary tabular-nums">{clientDetails.totalTTC.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">TND</span></p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-5">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <Building2 className="size-5" />
                  Informations de Contact
                </h4>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 rounded-lg border p-4 bg-muted/20">
                    <div className="rounded-full bg-background p-2 border">
                      <MapPin className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Adresse</p>
                      <p className="font-medium wrap-break-word">{clientDetails.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border p-4 bg-muted/20">
                    <div className="rounded-full bg-background p-2 border">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                      <p className="font-medium break-all">{clientDetails.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/20">
                      <div className="rounded-full bg-background p-2 border">
                        <Phone className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Téléphone</p>
                        <p className="font-medium font-mono text-sm">{clientDetails.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/20">
                      <div className="rounded-full bg-background p-2 border">
                        <Globe className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Pays</p>
                        <p className="font-medium">{clientDetails.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tax & Business Information */}
              <div className="space-y-5">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <CreditCard className="size-5" />
                  Informations Fiscales
                </h4>
                <div className="grid gap-4">
                  {clientDetails.taxNumber && (
                    <div className="flex items-start gap-4 rounded-lg border p-4 bg-muted/20">
                      <div className="rounded-full bg-background p-2 border">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Matricule Fiscal</p>
                        <p className="font-mono font-semibold">{clientDetails.taxNumber}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/20">
                      <div className="rounded-full bg-background p-2 border text-xl">
                        💱
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Devise par Défaut</p>
                        <Badge variant="outline" className="font-semibold">{clientDetails.defaultCurrency}</Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/20">
                      <div className="rounded-full bg-background p-2 border">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Type de Facture</p>
                        <p className="font-medium text-sm leading-tight">{getInvoiceTypeLabel(clientDetails.defaultInvoiceType)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Créé le</span>
                  <span className="font-mono">{format(new Date(clientDetails.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dernière modification</span>
                  <span className="font-mono">{format(new Date(clientDetails.updatedAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</span>
                </div>
              </div>
            </div>
          )}

          {!loading && !clientDetails && clientId && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Building2 className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Impossible de charger les détails du client</p>
              <p className="text-sm text-muted-foreground mt-1">Veuillez réessayer plus tard</p>
            </div>
          )}
        </div>
      </SheetContent>

      {/* Edit Dialog */}
      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={clientDetails}
        onSuccess={handleEditSuccess}
      />
    </Sheet>
  );
}
