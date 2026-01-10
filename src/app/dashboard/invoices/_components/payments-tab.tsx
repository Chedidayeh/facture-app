import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string | Date;
  description?: string | null;
  createdAt: string | Date;
}

interface PaymentsTabProps {
  invoiceId: string;
  currency: string;
  payments: Payment[];
}

const getPaymentMethodColor = (method: string): string => {
  const methodLower = method.toLowerCase();
  switch (methodLower) {
    case "espèces":
      return "bg-green-100 text-green-800";
    case "chèque":
      return "bg-blue-100 text-blue-800";
    case "virement":
      return "bg-purple-100 text-purple-800";
    case "carte":
      return "bg-red-100 text-red-800";
    case "traite":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function PaymentsTab({ invoiceId, currency, payments }: PaymentsTabProps) {

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-4">

      {/* Payments List */}
      <div className="space-y-3">
        {payments.map((payment) => (
          <Card key={payment.id} className="border">
            <CardContent className="pt-">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                      {payment.paymentMethod}
                    </Badge>
                  </div>

                  {payment.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {payment.description}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Enregistré le{" "}
                    {format(new Date(payment.createdAt), "d MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {payment.amount.toLocaleString("fr-FR", {
                      style: "currency",
                      currency,
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
