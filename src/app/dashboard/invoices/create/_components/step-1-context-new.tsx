"use client";

import * as React from "react";
import { Calendar, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InvoiceState } from "./invoice-form-new";
import { Currency, InvoiceType } from "@prisma/client";
import { UploadButton } from "@/lib/uploadthing";
import { getCompanyInfo } from "../actions";

interface Step1ContextProps {
  invoiceState: InvoiceState;
  onNext: (data: Partial<InvoiceState>) => void;
  isLoading?: boolean;
}

export function Step1Context({ invoiceState, onNext, isLoading }: Step1ContextProps) {
  const [invoiceDate, setInvoiceDate] = React.useState<Date>(invoiceState.invoiceDate);
  const [invoiceType, setInvoiceType] = React.useState<InvoiceType>(invoiceState.invoiceType);
  const [currency, setCurrency] = React.useState<Currency>(invoiceState.currency);
  const [exchangeRate, setExchangeRate] = React.useState<number>(invoiceState.exchangeRate);
  const [companyLogo, setCompanyLogo] = React.useState<string | null>(invoiceState.companyLogo);
  
  const [companyName, setCompanyName] = React.useState(invoiceState.company.name);
  const [companyAddress, setCompanyAddress] = React.useState(invoiceState.company.address);
  const [companyFiscalMatricule, setCompanyFiscalMatricule] = React.useState(invoiceState.company.fiscalMatricule);
  const [companyPhone, setCompanyPhone] = React.useState(invoiceState.company.phone);
  const [companyEmail, setCompanyEmail] = React.useState(invoiceState.company.email);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = React.useState(true);

  // Fetch company data on mount
  React.useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const companyData = await getCompanyInfo();
        if (companyData) {
          setCompanyName(companyData.name);
          setCompanyAddress(companyData.address);
          setCompanyFiscalMatricule(companyData.taxNumber);
          setCompanyPhone(companyData.phone || "");
          setCompanyEmail(companyData.email || "");
          setCompanyLogo(companyData.logo);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Fetch company data on mount
  React.useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const companyData = await getCompanyInfo();
        if (companyData) {
          setCompanyName(companyData.name);
          setCompanyAddress(companyData.address);
          setCompanyFiscalMatricule(companyData.taxNumber);
          setCompanyPhone(companyData.phone || "");
          setCompanyEmail(companyData.email || "");
          setCompanyLogo(companyData.logo);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
  };

  const handleNext = () => {
    if (!companyName.trim()) {
      alert("Le nom de l'entreprise est obligatoire");
      return;
    }
    if (!companyAddress.trim()) {
      alert("L'adresse de l'entreprise est obligatoire");
      return;
    }
    if (!companyFiscalMatricule.trim()) {
      alert("Le matricule fiscal de l'entreprise est obligatoire");
      return;
    }
    if (!companyPhone.trim()) {
      alert("Le numéro de téléphone est obligatoire");
      return;
    }
    if (!companyEmail.trim()) {
      alert("L'email de l'entreprise est obligatoire");
      return;
    }

    onNext({
      invoiceDate,
      invoiceType,
      currency,
      exchangeRate: currency === "TND" ? 1 : exchangeRate,
      companyLogo,
      company: {
        name: companyName,
        address: companyAddress,
        fiscalMatricule: companyFiscalMatricule,
        phone: companyPhone,
        email: companyEmail,
      },
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Contexte de la facture</h2>
          <p className="text-sm text-muted-foreground">
            Définissez les informations de base de la facture
          </p>
        </div>

        {/* Company Information Section */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold">Informations de l'entreprise (Vendeur) *</h3>
          <p className="text-xs text-muted-foreground">
            Conformément à l'Article 18 du Code de la TVA - Mentions obligatoires
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Dénomination sociale / Nom *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nom de votre entreprise"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyFiscalMatricule">Matricule fiscal *</Label>
              <Input
                id="companyFiscalMatricule"
                value={companyFiscalMatricule}
                onChange={(e) => setCompanyFiscalMatricule(e.target.value)}
                placeholder="Ex: 1234567/A/M/000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Adresse complète *</Label>
            <Textarea
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Adresse complète de l'entreprise"
              rows={2}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Téléphone *</Label>
              <Input
                id="companyPhone"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="Ex: +216 XX XXX XXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email *</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="contact@entreprise.com"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Date de facture */}
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Date de la facture *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {invoiceDate ? (
                    format(invoiceDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(date) => date && setInvoiceDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Numéro de facture (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Numéro de facture</Label>
            <Input
              id="invoiceNumber"
              value={invoiceState.invoiceNumber}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-muted-foreground">
              Numérotation automatique chronologique
            </p>
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="space-y-2">
          <Label>Logo de l'entreprise (optionnel)</Label>
          <div className="flex items-start gap-4">
            {companyLogo ? (
              <div className="relative">
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  className="h-24 w-24 object-contain border rounded-lg p-2"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {!companyLogo && (
                <>
                  <UploadButton
                  className="border rounded-2xl max-w-max p-2"
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setCompanyLogo(res[0].url);
                        setIsUploadingLogo(false);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`Erreur lors du téléchargement: ${error.message}`);
                      setIsUploadingLogo(false);
                    }}
                    onUploadBegin={() => {
                      setIsUploadingLogo(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: PNG, JPG. Taille max: 4 MB. Le logo apparaîtra en haut de la facture.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Type de facture */}
        <div className="space-y-3">
          <Label>Type de facture *</Label>
          <RadioGroup value={invoiceType} onValueChange={(value) => setInvoiceType(value as InvoiceType)}>
            <div 
              className={`flex items-center space-x-2 border p-3 rounded-lg transition-all cursor-pointer hover:border-primary hover:bg-accent/50 ${
                invoiceType === "LOCAL" ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setInvoiceType("LOCAL")}
            >
              <RadioGroupItem value="LOCAL" id="local" />
              <div className="flex-1">
                <Label htmlFor="local" className="cursor-pointer font-medium">
                  Facture locale
                </Label>
                <p className="text-xs text-muted-foreground">
                  TVA applicable selon le taux + Droit de timbre (1 DT)
                </p>
              </div>
            </div>
            <div 
              className={`flex items-center space-x-2 border p-3 rounded-lg transition-all cursor-pointer hover:border-primary hover:bg-accent/50 ${
                invoiceType === "EXPORTATION" ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setInvoiceType("EXPORTATION")}
            >
              <RadioGroupItem value="EXPORTATION" id="exportation" />
              <div className="flex-1">
                <Label htmlFor="exportation" className="cursor-pointer font-medium">
                  Facture exportation
                </Label>
                <p className="text-xs text-muted-foreground">
                  TVA = 0% automatiquement + Pas de droit de timbre
                </p>
              </div>
            </div>
            <div 
              className={`flex items-center space-x-2 border p-3 rounded-lg transition-all cursor-pointer hover:border-primary hover:bg-accent/50 ${
                invoiceType === "SUSPENSION" ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setInvoiceType("SUSPENSION")}
            >
              <RadioGroupItem value="SUSPENSION" id="suspension" />
              <div className="flex-1">
                <Label htmlFor="suspension" className="cursor-pointer font-medium">
                  Facture en suspension de TVA
                </Label>
                <p className="text-xs text-muted-foreground">
                  TVA = 0 + Droit de timbre applicable + Mention obligatoire
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Devise */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Devise de facturation *</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la devise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TND">TND - Dinar Tunisien</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="USD">USD - Dollar Américain</SelectItem>
              </SelectContent>
            </Select>
            {currency !== "TND" && (
              <p className="text-xs text-yellow-600">
                Droit de timbre = 0 pour les devises étrangères
              </p>
            )}
          </div>

          {/* Taux de change (si devise != TND) */}
          {/* {currency !== "TND" && (
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Taux de change (1 {currency} = X TND) *</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                placeholder="Ex: 3.2850"
              />
              <p className="text-xs text-muted-foreground">
                Taux de conversion pour référence
              </p>
            </div>
          )} */}
        </div>

        {/* Info boxes based on selection */}
        {invoiceType === "EXPORTATION" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
               Facture d'exportation
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>La TVA sera automatiquement mise à 0%</li>
              <li>Le droit de timbre sera automatiquement mis à 0</li>
              <li>Aucune TVA ne sera calculée sur les lignes</li>
            </ul>
          </div>
        )}

        {invoiceType === "SUSPENSION" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
               Facture en suspension de TVA
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>La TVA sera automatiquement mise à 0</li>
              <li>Le droit de timbre reste applicable</li>
              <li>Vous devrez saisir les informations d'autorisation (étape 4)</li>
              <li>Une mention légale sera ajoutée automatiquement</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={handleNext} size="lg" disabled={isLoading}>
            Suivant →
          </Button>
        </div>
      </div>
    </Card>
  );
}
