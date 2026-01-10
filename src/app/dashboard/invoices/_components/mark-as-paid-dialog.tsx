"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { markAsPaidWithPayment } from "../actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Zod schema for payment form
const paymentSchema = z.object({
  paymentMethod: z.string().min(1, "La modalité de paiement est obligatoire"),
  paymentDate: z.date({ message: "La date de paiement est obligatoire" }),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
}

export function MarkAsPaidDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  amount,
  currency,
}: MarkAsPaidDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "",
      paymentDate: new Date(),
      description: "",
    },
  });

  const paymentDate = watch("paymentDate");
  const paymentMethod = watch("paymentMethod");

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      const result = await markAsPaidWithPayment({
        invoiceId,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        description: data.description || null,
      });

      if (result.success) {
        toast.success("Facture marquée comme payée", {
          description: `Paiement de ${amount.toFixed(2)} ${currency} enregistré le ${format(data.paymentDate, "d MMMM yyyy à HH:mm")}`,
        });
        onOpenChange(false);
        // Refresh page to update invoice status
        window.location.reload();
      } else {
        toast.error("Erreur", {
          description: result.error || "Impossible de marquer la facture comme payée",
        });
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Enregistrer le paiement</AlertDialogTitle>
          <AlertDialogDescription>
            Facture: <span className="font-mono font-semibold">{invoiceNumber}</span>
            <br />
            Montant: <span className="font-semibold">{amount.toFixed(2)} {currency}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Modalité de paiement *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setValue("paymentMethod", value)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Sélectionner une modalité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESPECES">Espèces</SelectItem>
                <SelectItem value="CHEQUE">Chèque</SelectItem>
                <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                <SelectItem value="CARTE">Carte bancaire</SelectItem>
                <SelectItem value="TRAITE">Traite</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Date de paiement *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue("paymentDate", date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.paymentDate && (
              <p className="text-sm text-destructive">{errors.paymentDate.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes/Description</Label>
            <Textarea
              id="description"
              placeholder="Ex: Chèque n° 12345, Référence virement..."
              maxLength={200}
              rows={2}
              value={watch("description") || ""}
              onChange={(e) => setValue("description", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {watch("description")?.length || 0}/200 caractères
            </p>
          </div>

          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer le paiement"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
