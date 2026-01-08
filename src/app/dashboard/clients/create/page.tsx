"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "./actions";

export default function CreateClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Form state
  const [clientType, setClientType] = React.useState<"PARTICULIER" | "PROFESSIONNEL">("PARTICULIER");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [country, setCountry] = React.useState("Tunisie");
  const [taxNumber, setTaxNumber] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [defaultCurrency, setDefaultCurrency] = React.useState<"TND" | "EUR" | "USD">("TND");
  const [defaultInvoiceType, setDefaultInvoiceType] = React.useState<"LOCAL" | "EXPORTATION" | "SUSPENSION">("LOCAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!name.trim()) {
        throw new Error("Le nom du client est obligatoire");
      }
      if (!address.trim()) {
        throw new Error("L'adresse est obligatoire");
      }
      if (clientType === "PROFESSIONNEL" && !taxNumber.trim()) {
        throw new Error("Le matricule fiscal est obligatoire pour un client professionnel");
      }

      const result = await createClient({
        type: clientType,
        name: name.trim(),
        address: address.trim(),
        country: country.trim(),
        taxNumber: taxNumber.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        defaultCurrency,
        defaultInvoiceType,
      });

      if (result.success) {
        router.push("/dashboard/clients");
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau client</h1>
          <p className="text-muted-foreground">
            Créer un nouveau client dans votre base de données
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Client Type */}
            <div className="space-y-2">
              <Label htmlFor="clientType">Type de client *</Label>
              <Select value={clientType} onValueChange={(value) => setClientType(value as "PARTICULIER" | "PROFESSIONNEL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTICULIER">Particulier</SelectItem>
                  <SelectItem value="PROFESSIONNEL">Professionnel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {clientType === "PROFESSIONNEL" 
                  ? "Client assujetti à la TVA avec matricule fiscal" 
                  : "Client particulier sans matricule fiscal"}
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {clientType === "PROFESSIONNEL" ? "Raison sociale" : "Nom complet"} *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={clientType === "PROFESSIONNEL" ? "Ex: Société ABC SARL" : "Ex: Ahmed Ben Ali"}
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse, code postal, ville"
                rows={3}
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ex: Tunisie"
                required
              />
            </div>

            {/* Tax Number - Only for PROFESSIONNEL */}
            {clientType === "PROFESSIONNEL" && (
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Matricule fiscal *</Label>
                <Input
                  id="taxNumber"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="Ex: 1234567/A/M/000"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: XXXXXXX/Y/Z/NNN
                </p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@exemple.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 XX XXX XXX"
              />
            </div>

            {/* Default Currency */}
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Devise par défaut</Label>
              <Select value={defaultCurrency} onValueChange={(value) => setDefaultCurrency(value as "TND" | "EUR" | "USD")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND - Dinar Tunisien</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar Américain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Invoice Type */}
            <div className="space-y-2">
              <Label htmlFor="defaultInvoiceType">Type de facture par défaut</Label>
              <Select value={defaultInvoiceType} onValueChange={(value) => setDefaultInvoiceType(value as "LOCAL" | "EXPORTATION" | "SUSPENSION")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Facture locale</SelectItem>
                  <SelectItem value="EXPORTATION">Facture exportation</SelectItem>
                  <SelectItem value="SUSPENSION">Facture en suspension de TVA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer le client"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
