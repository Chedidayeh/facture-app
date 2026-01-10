"use client";

import * as React from "react";
import { Calendar, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InvoiceState } from "./invoice-form-new";
import { Currency, InvoiceType } from "@prisma/client";
import { UploadButton } from "@/lib/uploadthing";
import { getCompanyInfo } from "../actions";

// Zod schema for step 1
const step1Schema = z
  .object({
    companyName: z
      .string()
      .min(1, "Le nom de l'entreprise est obligatoire")
      .trim(),
    companyAddress: z.string().min(1, "L'adresse est obligatoire").trim(),
    taxPart1: z.string().optional(),
    taxPart2: z.string().optional(),
    taxPart3: z.string().optional(),
    companyPhone: z.string().min(1, "Le numéro de téléphone est obligatoire"),
    companyEmail: z
      .string()
      .min(1, "L'email est obligatoire")
      .email("Format d'email invalide"),
    invoiceDate: z.date(),
    dueDate: z.date(),
    showDueDate: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.taxPart1 || data.taxPart1.length !== 7) {
        return false;
      }
      if (!data.taxPart2 || data.taxPart2.length !== 1) {
        return false;
      }
      if (!data.taxPart3 || data.taxPart3.length !== 1) {
        return false;
      }
      return true;
    },
    {
      message:
        "Le matricule fiscal est incomplet (7 chiffres + 1 lettre + 1 lettre)",
      path: ["taxPart1"],
    }
  )
  .refine(
    (data) => {
      const phoneDigits = data.companyPhone.replace(/\s/g, "");
      if (phoneDigits.length !== 8 || !/^\d{8}$/.test(phoneDigits)) {
        return false;
      }
      return true;
    },
    {
      message: "Le téléphone doit contenir 8 chiffres (format: XX XXX XXX)",
      path: ["companyPhone"],
    }
  )
  .refine(
    (data) => {
      return data.dueDate > data.invoiceDate;
    },
    {
      message: "La date d'échéance doit être postérieure à la date de facture",
      path: ["dueDate"],
    }
  );

type Step1FormData = z.infer<typeof step1Schema>;

interface Step1ContextProps {
  invoiceState: InvoiceState;
  onNext: (data: Partial<InvoiceState>) => void;
  isLoading?: boolean;
}

export function Step1Context({
  invoiceState,
  onNext,
  isLoading,
}: Step1ContextProps) {
  const [invoiceType, setInvoiceType] = React.useState<InvoiceType>(
    invoiceState.invoiceType
  );
  const [currency, setCurrency] = React.useState<Currency>(
    invoiceState.currency
  );
  const [exchangeRate, setExchangeRate] = React.useState<number>(
    invoiceState.exchangeRate
  );
  const [companyLogo, setCompanyLogo] = React.useState<string | null>(
    invoiceState.companyLogo
  );
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = React.useState(true);

  const taxPart1Ref = React.useRef<HTMLInputElement>(null);
  const taxPart2Ref = React.useRef<HTMLInputElement>(null);
  const taxPart3Ref = React.useRef<HTMLInputElement>(null);

  const {
    watch,
    setValue,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: invoiceState.company.name,
      companyAddress: invoiceState.company.address,
      taxPart1: "",
      taxPart2: "",
      taxPart3: "",
      companyPhone: invoiceState.company.phone,
      companyEmail: invoiceState.company.email,
      invoiceDate: invoiceState.invoiceDate,
      dueDate: invoiceState.dueDate,
      showDueDate: invoiceState.showDueDate,
    },
  });

  const invoiceDate = watch("invoiceDate");
  const dueDate = watch("dueDate");
  const showDueDate = watch("showDueDate");
  const taxPart1 = watch("taxPart1");
  const taxPart2 = watch("taxPart2");
  const taxPart3 = watch("taxPart3");
  const companyPhone = watch("companyPhone");

  React.useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const companyData = await getCompanyInfo();
        if (companyData) {
          setValue("companyName", companyData.name);
          setValue("companyAddress", companyData.address);
          setValue("companyEmail", companyData.email || "");
          setValue("companyPhone", companyData.phone || "");
          setCompanyLogo(companyData.logo);

          // Parse matricule fiscal
          if (companyData.taxNumber) {
            const match = companyData.taxNumber.match(
              /^(\d{7})([A-Z])\/([A-Z])\/000$/
            );
            if (match) {
              setValue("taxPart1", match[1]);
              setValue("taxPart2", match[2]);
              setValue("taxPart3", match[3]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyData();
  }, [setValue]);

  // Update dueDate when invoiceDate changes (default +7 days)
  React.useEffect(() => {
    const newDueDate = new Date(
      invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    setValue("dueDate", newDueDate);
  }, [invoiceDate, setValue]);

  // Handle tax part 1: 7 digits only
  const handleTaxPart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 7) {
      setValue("taxPart1", value);
      if (value.length === 7 && taxPart2Ref.current) {
        taxPart2Ref.current.focus();
      }
    }
  };

  // Handle tax part 2: 1 letter only
  const handleTaxPart2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 1) {
      setValue("taxPart2", value);
      if (value.length === 1 && taxPart3Ref.current) {
        taxPart3Ref.current.focus();
      }
    }
  };

  // Handle tax part 3: 1 letter only
  const handleTaxPart3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 1) {
      setValue("taxPart3", value);
    }
  };

  // Build full tax number for display in real-time
  const fullTaxNumber = React.useMemo(() => {
    const part1 = taxPart1 || "_______";
    const part2 = taxPart2 || "_";
    const part3 = taxPart3 || "_";
    return `${part1}${part2}/${part3}/000`;
  }, [taxPart1, taxPart2, taxPart3]);

  // Handle phone: format XX XXX XXX (8 digits total)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 8) {
      let formatted = value;
      if (value.length > 5) {
        formatted = `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(
          5
        )}`;
      } else if (value.length > 2) {
        formatted = `${value.slice(0, 2)} ${value.slice(2)}`;
      }
      setValue("companyPhone", formatted);
    }
  };

  // Build full phone number for display in real-time
  const fullPhoneNumber = React.useMemo(() => {
    const digits = companyPhone?.replace(/\s/g, "") || "";
    const formatted = digits.padEnd(8, "_");
    const part1 = formatted.slice(0, 2);
    const part2 = formatted.slice(2, 5);
    const part3 = formatted.slice(5, 8);
    return `+216 ${part1} ${part2} ${part3}`;
  }, [companyPhone]);

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
  };

  const onSubmit = (data: Step1FormData) => {
    // Combine tax parts for saving
    const fullMatricule = `${data.taxPart1}${data.taxPart2}/${data.taxPart3}/000`;

    onNext({
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      showDueDate: data.showDueDate,
      invoiceType,
      currency,
      exchangeRate: currency === "TND" ? 1 : exchangeRate,
      companyLogo,
      company: {
        name: data.companyName,
        address: data.companyAddress,
        fiscalMatricule: fullMatricule,
        phone: data.companyPhone,
        email: data.companyEmail,
      },
    });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleFormSubmit(onSubmit)}>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Contexte de la facture</h2>
            <p className="text-sm text-muted-foreground">
              Définissez les informations de base de la facture
            </p>
          </div>

          {/* Company Information Section */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg font-semibold">
              Informations de l'entreprise (Vendeur) *
            </h3>
            <p className="text-xs text-muted-foreground">
              Conformément à l'Article 18 du Code de la TVA - Mentions
              obligatoires
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Dénomination sociale / Nom *
                </Label>
                <Input
                  id="companyName"
                  value={watch("companyName")}
                  onChange={(e) => setValue("companyName", e.target.value)}
                  placeholder="Nom de votre entreprise"
                  className={errors.companyName ? "border-red-500" : ""}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Matricule fiscal *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={taxPart1Ref}
                    value={taxPart1}
                    onChange={handleTaxPart1Change}
                    placeholder="1234567"
                    maxLength={7}
                    className="flex-1"
                  />
                  <Input
                    ref={taxPart2Ref}
                    value={taxPart2}
                    onChange={handleTaxPart2Change}
                    placeholder="A"
                    maxLength={1}
                    className="w-16"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    ref={taxPart3Ref}
                    value={taxPart3}
                    onChange={handleTaxPart3Change}
                    placeholder="B"
                    maxLength={1}
                    className="w-16"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    value="000"
                    readOnly
                    disabled
                    className="w-20 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  7 chiffres + 1 lettre / 1 lettre / 000
                </p>
                <p className="text-xs text-muted-foreground">
                  Matricule complet: {` ${fullTaxNumber}`}
                </p>
                {errors.taxPart1 && (
                  <p className="text-sm text-red-600">
                    {errors.taxPart1.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Adresse complète *</Label>
              <Textarea
                id="companyAddress"
                value={watch("companyAddress")}
                onChange={(e) => setValue("companyAddress", e.target.value)}
                placeholder="Adresse complète de l'entreprise"
                rows={2}
                className={errors.companyAddress ? "border-red-500" : ""}
              />
              {errors.companyAddress && (
                <p className="text-sm text-red-600">
                  {errors.companyAddress.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Téléphone *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value="+216"
                    readOnly
                    disabled
                    className="w-20 bg-muted"
                  />
                  <Input
                    id="companyPhone"
                    value={companyPhone}
                    onChange={handlePhoneChange}
                    placeholder="56 257 027"
                    maxLength={10}
                    className={`flex-1 ${
                      errors.companyPhone ? "border-red-500" : ""
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: XX XXX XXX (8 chiffres)
                </p>
                {errors.companyPhone && (
                  <p className="text-sm text-red-600">
                    {errors.companyPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={watch("companyEmail")}
                  onChange={(e) => setValue("companyEmail", e.target.value)}
                  placeholder="contact@entreprise.com"
                  className={errors.companyEmail ? "border-red-500" : ""}
                />
                {errors.companyEmail && (
                  <p className="text-sm text-red-600">
                    {errors.companyEmail.message}
                  </p>
                )}
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
                    onSelect={(date) => date && setValue("invoiceDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'échéance *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setValue("dueDate", date)}
                    disabled={(date) => date <= invoiceDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Par défaut: +7 jours après la date de facture
              </p>
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Toggle pour afficher la date d'échéance dans le PDF */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="showDueDate" className="text-base font-medium">
                Afficher la date d'échéance sur la facture
              </Label>
              <p className="text-sm text-muted-foreground">
                Active/désactive l'affichage de la date d'échéance dans le
                preview et le PDF
              </p>
            </div>
            <Switch
              id="showDueDate"
              checked={showDueDate}
              onCheckedChange={(checked) => setValue("showDueDate", checked)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
                        alert(
                          `Erreur lors du téléchargement: ${error.message}`
                        );
                        setIsUploadingLogo(false);
                      }}
                      onUploadBegin={() => {
                        setIsUploadingLogo(true);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: PNG, JPG. Taille max: 4 MB. Le logo apparaîtra en
                      haut de la facture.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Type de facture */}
          <div className="space-y-3">
            <Label>Type de facture *</Label>
            <RadioGroup
              value={invoiceType}
              onValueChange={(value) => setInvoiceType(value as InvoiceType)}
            >
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
                  invoiceType === "EXPORTATION"
                    ? "border-primary bg-accent"
                    : ""
                }`}
                onClick={() => setInvoiceType("EXPORTATION")}
              >
                <RadioGroupItem value="EXPORTATION" id="exportation" />
                <div className="flex-1">
                  <Label
                    htmlFor="exportation"
                    className="cursor-pointer font-medium"
                  >
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
                  <Label
                    htmlFor="suspension"
                    className="cursor-pointer font-medium"
                  >
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
              <Select
                value={currency}
                onValueChange={(value) => setCurrency(value as Currency)}
              >
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
                <li>
                  Vous devrez saisir les informations d'autorisation (étape 4)
                </li>
                <li>Une mention légale sera ajoutée automatiquement</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="submit" size="lg" disabled={isLoading}>
              Suivant →
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
