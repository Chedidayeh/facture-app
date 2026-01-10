"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { ClientStatus, ClientType, Currency, InvoiceType } from "@prisma/client";

// Zod schema
const clientSchema = z
  .object({
    name: z.string().min(1, "Le nom du client est obligatoire").trim(),
    type: z.enum(ClientType),
    taxPart1: z.string().optional(),
    taxPart2: z.string().optional(),
    taxPart3: z.string().optional(),
    cin: z.string().optional(),
    address: z.string().min(1, "L'adresse est obligatoire").trim(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().optional(),
    country: z.string().min(1, "Le pays est obligatoire").trim(),
    defaultCurrency: z.enum(["TND", "EUR", "USD"]),
    defaultInvoiceType: z.enum(InvoiceType),
    status: z.enum(ClientStatus),
  })
  .refine(
    (data) => {
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
    },
    {
      message: "Le matricule fiscal est incomplet",
      path: ["taxPart1"],
    }
  )
  .refine(
    (data) => {
      if (data.type === ClientType.PARTICULIER) {
        if (!data.cin || data.cin.length !== 8) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Le CIN doit contenir exactement 8 chiffres",
      path: ["cin"],
    }
  )
  .refine(
    (data) => {
      if (data.phone && data.phone.length > 0) {
        const phoneDigits = data.phone.replace(/\s/g, "");
        if (phoneDigits.length !== 8 || !/^\d{8}$/.test(phoneDigits)) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Le téléphone doit contenir 8 chiffres (format: XX XXX XXX)",
      path: ["phone"],
    }
  );

type ClientFormData = z.infer<typeof clientSchema>;

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

  const {
    watch,
    setValue,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      type: ClientType.PARTICULIER,
      taxPart1: "",
      taxPart2: "",
      taxPart3: "",
      cin: "",
      address: "",
      email: "",
      phone: "",
      country: "",
      defaultCurrency: "TND",
      defaultInvoiceType: "LOCAL",
      status: "ACTIVE",
    },
  });

  const clientType = watch("type");
  const taxPart1 = watch("taxPart1");
  const taxPart2 = watch("taxPart2");
  const taxPart3 = watch("taxPart3");
  const phone = watch("phone");

  const taxPart1Ref = React.useRef<HTMLInputElement>(null);
  const taxPart2Ref = React.useRef<HTMLInputElement>(null);
  const taxPart3Ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (client) {
      // Parse tax number if it exists
      let taxPart1 = "";
      let taxPart2 = "";
      let taxPart3 = "";
      let cin = "";

      if (client.taxNumber) {
        if (client.type === ClientType.PROFESSIONNEL) {
          // Parse format: 1234567A/B/000
          const match = client.taxNumber.match(
            /^(\d{7})([A-Z])\/([A-Z])\/000$/
          );
          if (match) {
            taxPart1 = match[1];
            taxPart2 = match[2];
            taxPart3 = match[3];
          }
        } else {
          // For PARTICULIER, taxNumber is the CIN
          cin = client.taxNumber;
        }
      }

      reset({
        name: client.name,
        type: client.type as ClientType,
        taxPart1,
        taxPart2,
        taxPart3,
        cin,
        address: client.address,
        email: client.email || "",
        phone: client.phone || "",
        country: client.country,
        defaultCurrency: client.defaultCurrency as Currency,
        defaultInvoiceType: client.defaultInvoiceType as InvoiceType,
        status: client.status as ClientStatus,
      });
    }
  }, [client, reset]);

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
      let formatted = value;
      if (value.length > 5) {
        formatted = `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(
          5
        )}`;
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
    if (!client) return;

    setLoading(true);
    try {
      // Combine tax parts for PROFESSIONNEL or use CIN for PARTICULIER
      const taxNumber =
        data.type === ClientType.PROFESSIONNEL
          ? `${data.taxPart1}${data.taxPart2}/${data.taxPart3}/000`
          : (data.cin || null);

      const result = await updateClient(client.id, {
        name: data.name,
        type: data.type,
        taxNumber: taxNumber,
        address: data.address,
        email: data.email || null,
        phone: data.phone || null,
        country: data.country,
        defaultCurrency: data.defaultCurrency,
        defaultInvoiceType: data.defaultInvoiceType,
        status: data.status,
      });

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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le Client</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informations de Base</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de Client *</Label>
                <Select
                  value={clientType}
                  onValueChange={(value) =>
                    setValue("type", value as ClientType)
                  }
                >
                  <SelectTrigger id="type">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {clientType === ClientType.PROFESSIONNEL
                    ? "Raison sociale"
                    : "Nom complet"}{" "}
                  *
                </Label>
                <Input
                  id="name"
                  value={watch("name")}
                  onChange={(e) => setValue("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) =>
                      setValue(
                        "status",
                        value as ClientStatus
                      )
                    }
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
                  <div className="rounded-md bg-muted px-3 py-2">
                    <p className="text-sm">
                      <span className="font-medium">Matricule fiscal: </span>
                      <span className="font-mono text-base">
                        {fullTaxNumber}
                      </span>
                    </p>
                  </div>
                  {(errors.taxPart1 || errors.taxPart2 || errors.taxPart3) && (
                    <p className="text-sm text-destructive">
                      {errors.taxPart1?.message ||
                        errors.taxPart2?.message ||
                        errors.taxPart3?.message}
                    </p>
                  )}
                </div>
              )}

              {/* CIN - Only for PARTICULIER */}
              {clientType === ClientType.PARTICULIER && (
                <div className="space-y-2">
                  <Label htmlFor="cin">
                    CIN (Carte d'identité nationale) *
                  </Label>
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
                    <p className="text-sm text-destructive">
                      {errors.cin.message}
                    </p>
                  )}
                </div>
              )}
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
                  value={watch("address")}
                  onChange={(e) => setValue("address", e.target.value)}
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={watch("email")}
                    onChange={(e) => setValue("email", e.target.value)}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays *</Label>
                  <Input
                    id="country"
                    value={watch("country")}
                    onChange={(e) => setValue("country", e.target.value)}
                  />
                  {errors.country && (
                    <p className="text-sm text-destructive">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>

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
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
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
                  value={watch("defaultCurrency")}
                  onValueChange={(value) =>
                    setValue("defaultCurrency", value as Currency)
                  }
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
                <Label htmlFor="defaultInvoiceType">
                  Type de Facture par Défaut *
                </Label>
                <Select
                  value={watch("defaultInvoiceType")}
                  onValueChange={(value) =>
                    setValue(
                      "defaultInvoiceType",
                      value as InvoiceType
                    )
                  }
                >
                  <SelectTrigger id="defaultInvoiceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOCAL">Local</SelectItem>
                    <SelectItem value="EXPORTATION">Exportation</SelectItem>
                    <SelectItem value="SUSPENSION">
                      En suspension de TVA
                    </SelectItem>
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
