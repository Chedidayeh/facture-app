"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientDetails, updateClient } from "../actions";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientDetails | null;
  onSuccess?: () => void;
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: EditClientDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    type: "PARTICULIER",
    taxNumber: "",
    address: "",
    email: "",
    phone: "",
    country: "",
    defaultCurrency: "TND",
    defaultInvoiceType: "LOCAL",
    status: "ACTIVE",
  });

  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        type: client.type,
        taxNumber: client.taxNumber || "",
        address: client.address,
        email: client.email,
        phone: client.phone,
        country: client.country,
        defaultCurrency: client.defaultCurrency,
        defaultInvoiceType: client.defaultInvoiceType,
        status: client.status,
      });
    }
  }, [client]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;

    setLoading(true);
    try {
      const result = await updateClient(client.id, formData);
      
      if (result.success) {
        toast.success("Client mis à jour avec succès");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du client");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le Client</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informations de Base</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom / Raison Sociale *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de Client *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARTICULIER">Particulier</SelectItem>
                      <SelectItem value="PROFESSIONNEL">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "PROFESSIONNEL" && (
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Matricule Fiscal</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                      placeholder="0000000X/Y/Z/000"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="INACTIVE">Inactif</SelectItem>
                      <SelectItem value="ARCHIVED">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informations de Contact</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Preferences */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Préférences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Devise par Défaut *</Label>
                <Select
                  value={formData.defaultCurrency}
                  onValueChange={(value) => setFormData({ ...formData, defaultCurrency: value })}
                >
                  <SelectTrigger id="defaultCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TND">TND - Dinar Tunisien</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="USD">USD - Dollar US</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultInvoiceType">Type de Facture par Défaut *</Label>
                <Select
                  value={formData.defaultInvoiceType}
                  onValueChange={(value) => setFormData({ ...formData, defaultInvoiceType: value })}
                >
                  <SelectTrigger id="defaultInvoiceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOCAL">Local</SelectItem>
                    <SelectItem value="EXPORTATION">Exportation</SelectItem>
                    <SelectItem value="SUSPENSION">En suspension de TVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
