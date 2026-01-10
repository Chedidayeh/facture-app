"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "./actions";
import { ClientType, Currency, InvoiceType } from "@prisma/client";

// Zod schema
const clientSchema = z.object({
  type: z.enum(ClientType),
  name: z.string().min(1, "Le nom du client est obligatoire").trim(),
  address: z.string().min(1, "L'adresse est obligatoire").trim(),
  country: z.string().min(1, "Le pays est obligatoire").trim(),
  taxPart1: z.string().optional(), // 7 digits
  taxPart2: z.string().optional(), // 1 letter
  taxPart3: z.string().optional(), // 1 letter
  cin: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  defaultCurrency: z.enum(["TND", "EUR", "USD"]),
  defaultInvoiceType: z.enum(InvoiceType),
}).refine((data) => {
  if (data.type === ClientType.PROFESSIONNEL) {
    if (!data.taxPart1 || data.taxPart1.length !== 7) {
      return false;
    }
    if (!data.taxPart2 || data.taxPart2.length !== 1) {
      return false;
    }
    if (!data.taxPart3 || data.taxPart3.length !== 1) {
      return false;
    }
  }
  return true;
}, {
  message: "Le matricule fiscal est incomplet",
  path: ["taxPart1"]
}).refine((data) => {
  if (data.type === ClientType.PARTICULIER) {
    if (!data.cin || data.cin.length !== 8) {
      return false;
    }
  }
  return true;
}, {
  message: "Le CIN doit contenir exactement 8 chiffres",
  path: ["cin"]
}).refine((data) => {
  // Validate phone format if provided: must be exactly 8 digits
  if (data.phone && data.phone.length > 0) {
    const phoneDigits = data.phone.replace(/\s/g, "");
    if (phoneDigits.length !== 8 || !/^\d{8}$/.test(phoneDigits)) {
      return false;
    }
  }
  return true;
}, {
  message: "Le téléphone doit contenir 8 chiffres (format: XX XXX XXX)",
  path: ["phone"]
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function CreateClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: ClientType.PARTICULIER,
      name: "",
      address: "",
      country: "Tunisie",
      taxPart1: "",
      taxPart2: "",
      taxPart3: "",
      cin: "",
      email: "",
      phone: "",
      defaultCurrency: "TND",
      defaultInvoiceType: "LOCAL",
    } as ClientFormData,
  });

  const clientType = watch("type");
  const taxPart1 = watch("taxPart1");
  const taxPart2 = watch("taxPart2");
  const taxPart3 = watch("taxPart3");
  const phone = watch("phone");
  
  const taxPart1Ref = React.useRef<HTMLInputElement>(null);
  const taxPart2Ref = React.useRef<HTMLInputElement>(null);
  const taxPart3Ref = React.useRef<HTMLInputElement>(null);

  // Handle tax part 1: 7 digits only
  const handleTaxPart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 7) {
      setValue("taxPart1", value);
      // Auto-focus next field when complete
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
      // Auto-focus next field when complete
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

  // Format CIN: 8 digits only
  const handleCinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 8) {
      setValue("cin", value);
    }
  };

  // Handle phone: format XX XXX XXX (8 digits total)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 8) {
      // Format as: XX XXX XXX
      let formatted = value;
      if (value.length > 5) {
        formatted = `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`;
      } else if (value.length > 2) {
        formatted = `${value.slice(0, 2)} ${value.slice(2)}`;
      }
      setValue("phone", formatted);
    }
  };

  // Build full phone number for display in real-time
  const fullPhoneNumber = React.useMemo(() => {
    const digits = phone?.replace(/\s/g, "") || "";
    const formatted = digits.padEnd(8, "_");
    const part1 = formatted.slice(0, 2);
    const part2 = formatted.slice(2, 5);
    const part3 = formatted.slice(5, 8);
    return `+216 ${part1} ${part2} ${part3}`;
  }, [phone]);

  const onSubmit = async (data: ClientFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      // Combine tax parts for PROFESSIONNEL, CIN for PARTICULIER, null for PASSAGER
      let taxNumber: string | null = null;
      if (data.type === ClientType.PROFESSIONNEL) {
        taxNumber = `${data.taxPart1}${data.taxPart2}/${data.taxPart3}/000`;
      } else if (data.type === ClientType.PARTICULIER) {
        taxNumber = data.cin || null;
      }
      // PASSAGER: taxNumber remains null

      const result = await createClient({
        type: data.type,
        name: data.name,
        address: data.address,
        country: data.country,
        taxNumber: taxNumber,
        email: data.email || null,
        phone: data.phone || null,
        defaultCurrency: data.defaultCurrency,
        defaultInvoiceType: data.defaultInvoiceType,
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
    <div className="container max-w-4xl pb-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau client</h1>
          <p className="text-muted-foreground text-sm">
            Créer un nouveau client.
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Client Type */}
            <div className="space-y-2">
              <Label htmlFor="clientType">Type de client *</Label>
              <Select 
                value={clientType} 
                onValueChange={(value) => setValue("type", value as ClientType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ClientType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {clientType === ClientType.PROFESSIONNEL 
                  ? "Client assujetti à la TVA avec matricule fiscal"
                  : clientType === ClientType.PASSAGER
                  ? "Client passager (sans documents requis)"
                  : "Client particulier sans matricule fiscal"}
              </p>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {clientType === ClientType.PROFESSIONNEL ? "Raison sociale" : clientType === ClientType.PASSAGER ? "Nom du passager" : "Nom complet"} *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder={clientType === ClientType.PROFESSIONNEL ? "Ex: Société ABC SARL" : clientType === ClientType.PASSAGER ? "Ex: Jean Dupont" : "Ex: Ahmed Ben Ali"}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Adresse, code postal, ville"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                {...register("country")}
                placeholder="Ex: Tunisie"
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>

            {/* Tax Number - Only for PROFESSIONNEL */}
            {clientType === ClientType.PROFESSIONNEL && (
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
                {/* Always show the full tax number in real-time */}
                <div className="rounded-md bg-muted px-3 py-2">
                  <p className="text-sm">
                    <span className="font-medium">Matricule fiscal: </span>
                    <span className="font-mono text-base">{fullTaxNumber}</span>
                  </p>
                </div>
                {(errors.taxPart1 || errors.taxPart2 || errors.taxPart3) && (
                  <p className="text-sm text-destructive">
                    {errors.taxPart1?.message || errors.taxPart2?.message || errors.taxPart3?.message}
                  </p>
                )}
              </div>
            )}

            {/* CIN - Only for PARTICULIER */}
            {clientType === ClientType.PARTICULIER && (
              <div className="space-y-2">
                <Label htmlFor="cin">CIN (Carte d'identité nationale) *</Label>
                <Input
                  id="cin"
                  value={watch("cin")}
                  onChange={handleCinChange}
                  placeholder="Ex: 12345678"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  8 chiffres uniquement
                </p>
                {errors.cin && (
                  <p className="text-sm text-destructive">{errors.cin.message}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contact@exemple.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="flex items-center gap-2">
                <Input
                  value="+216"
                  readOnly
                  disabled
                  className="w-20 bg-muted"
                />
                <Input
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="56 257 027"
                  maxLength={10}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: XX XXX XXX (8 chiffres)
              </p>
          
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Default Currency */}
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Devise par défaut</Label>
              <Select 
                value={watch("defaultCurrency")} 
                onValueChange={(value) => setValue("defaultCurrency", value as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND - Dinar Tunisien</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar Américain</SelectItem>
                </SelectContent>
              </Select>
              {errors.defaultCurrency && (
                <p className="text-sm text-destructive">{errors.defaultCurrency.message}</p>
              )}
            </div>

            {/* Default Invoice Type */}
            <div className="space-y-2">
              <Label htmlFor="defaultInvoiceType">Type de facture par défaut</Label>
              <Select 
                value={watch("defaultInvoiceType")} 
                onValueChange={(value) => setValue("defaultInvoiceType", value as InvoiceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Facture locale</SelectItem>
                  <SelectItem value="EXPORTATION">Facture exportation</SelectItem>
                  <SelectItem value="SUSPENSION">Facture en suspension de TVA</SelectItem>
                </SelectContent>
              </Select>
              {errors.defaultInvoiceType && (
                <p className="text-sm text-destructive">{errors.defaultInvoiceType.message}</p>
              )}
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
