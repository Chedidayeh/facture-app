"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Step1Context } from "./step-1-context-new";
import { Step2Client } from "./step-2-client-new";
import { Step3Lines } from "./step-3-lines-new";
import { Step4Suspension } from "./step-4-suspension-new";
import { Step5Review } from "./step-5-review-new";
import { saveInvoice, SaveInvoiceData, getCompanyInfo, getNextInvoiceNumber } from "../actions";
import { Currency, InvoiceType } from "@prisma/client";


export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceHT: number;
  discount: number;
  vatRate: number;
  lineTotalHT: number;
  lineTVA: number;
  lineTotalTTC: number;
}

export interface ClientInfo {
  name: string;
  address: string;
  country: string;
  fiscalMatricule: string;
  isProfessional: boolean;
}

export interface CompanyInfo {
  name: string;
  address: string;
  fiscalMatricule: string;
  phone: string;
  email: string;
}

interface InvoiceFormProps {
  companyId: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

export interface InvoiceState {
  // Step 1: Context
  invoiceDate: Date;
  invoiceType: InvoiceType;
  currency: Currency;
  exchangeRate: number;
  companyLogo: string | null;
  company: CompanyInfo;

  // Step 2: Client
  client: ClientInfo;
  clientId: string; // Add clientId for database reference

  // Step 3: Lines
  lines: LineItem[];

  // Step 4: Suspension
  suspensionAuthNumber: string;
  suspensionValidUntil: Date | null;
  suspensionPurchaseOrderNumber: string;

  // Metadata
  invoiceNumber: string;
  exerciseYear: number;
}

export function InvoiceForm({ companyId }: InvoiceFormProps) {
  const router = useRouter();
  
  // Step state
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [isLoadingCompany, setIsLoadingCompany] = React.useState(true);

  // Unified invoice state
  const [invoiceState, setInvoiceState] = React.useState<InvoiceState>({
    invoiceDate: new Date(),
    invoiceType: "LOCAL",
    currency: "TND",
    exchangeRate: 1,
    companyLogo: null,
    company: {
      name: "",
      address: "",
      fiscalMatricule: "",
      phone: "",
      email: "",
    },
    client: {
      name: "",
      address: "",
      fiscalMatricule: "",
      isProfessional: false,
      country: "",
    },
    clientId: "",
    lines: [],
    suspensionAuthNumber: "",
    suspensionValidUntil: null,
    suspensionPurchaseOrderNumber: "",
    invoiceNumber: `FAC-${new Date().getFullYear()}-00001`,
    exerciseYear: new Date().getFullYear(),
  });

  // Load company info on mount
  React.useEffect(() => {
    const loadCompanyInfo = async () => {
      setIsLoadingCompany(true);
      const companyData = await getCompanyInfo();
      if (companyData) {
        setInvoiceState(prev => ({
          ...prev,
          companyLogo: companyData.logo,
          company: {
            name: companyData.name,
            address: companyData.address,
            fiscalMatricule: companyData.taxNumber,
            phone: companyData.phone || "",
            email: companyData.email || "",
          },
        }));
      }
      
      // Also fetch the next invoice number
      const nextInvoiceNumber = await getNextInvoiceNumber();
      setInvoiceState(prev => ({
        ...prev,
        invoiceNumber: nextInvoiceNumber,
      }));
      
      setIsLoadingCompany(false);
    };
    loadCompanyInfo();
  }, []);

  // Loading states
  const [isSaving, setIsSaving] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  // Handle Step 1 completion: Setup context first
  const handleStep1Complete = (data: Partial<InvoiceState>) => {
    console.log("Step 1 - Context Data:", data);
    setInvoiceState((prev) => ({ ...prev, ...data }));
    setErrors([]);
    setCurrentStep(2);
  };

  // Handle Step 2 completion: Client selection
  const handleStep2Complete = (client: ClientInfo, clientId: string) => {
    console.log("Step 2 - Client Data:", client, "Client ID:", clientId);
    
    // Validate client data
    const clientErrors: string[] = [];
    if (!client.name) clientErrors.push("Le nom du client est obligatoire");
    if (!client.address) clientErrors.push("L'adresse du client est obligatoire");
    if (client.isProfessional && !client.fiscalMatricule) {
      clientErrors.push("Le matricule fiscal est obligatoire pour un client professionnel");
    }
    if (!clientId) clientErrors.push("Veuillez sélectionner un client");
    
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }
    
    setInvoiceState((prev) => ({ ...prev, client, clientId }));
    setErrors([]);
    setCurrentStep(3);
  };

  // Handle Step 2 back: Return to step 1
  const handleStep2Back = () => {
    setErrors([]);
    setCurrentStep(1);
  };

  // Handle Step 3 completion: Lines
  const handleStep3Complete = (lines: LineItem[]) => {
    console.log("Step 3 - Lines Data:", lines);
    
    // Validate lines
    if (lines.length === 0) {
      setErrors(["Vous devez ajouter au moins une ligne à la facture"]);
      return;
    }
    
    setInvoiceState((prev) => ({ ...prev, lines }));
    setErrors([]);
    
    // If suspension type, go to step 4, otherwise go to step 5 (review)
    if (invoiceState.invoiceType === "SUSPENSION") {
      setCurrentStep(4);
    } else {
      setCurrentStep(5);
    }
  };

  // Handle Step 4 completion: Suspension data
  const handleStep4Complete = (data: Partial<InvoiceState>) => {
    console.log("Step 4 - Suspension Data:", data);
    
    // Validate suspension data
    const suspensionErrors: string[] = [];
    if (!data.suspensionAuthNumber) {
      suspensionErrors.push("Le numéro d'autorisation est obligatoire");
    }
    if (!data.suspensionValidUntil) {
      suspensionErrors.push("La date de validité est obligatoire");
    }
    if (!data.suspensionPurchaseOrderNumber) {
      suspensionErrors.push("Le numéro de bon de commande est obligatoire");
    }
    
    if (suspensionErrors.length > 0) {
      setErrors(suspensionErrors);
      return;
    }
    
    setInvoiceState((prev) => ({ ...prev, ...data }));
    setErrors([]);
    setCurrentStep(5);
  };

  // Handle final validation
  const handleFinalValidation = async () => {
    setIsValidating(true);
    
    try {
      // Calculate totals
      const totalHT = invoiceState.lines.reduce((sum, line) => sum + line.lineTotalHT, 0);
      const totalTVA = invoiceState.lines.reduce((sum, line) => sum + line.lineTVA, 0);
      const stampDuty = 
        invoiceState.invoiceType === "EXPORTATION" ? 0 :
        invoiceState.currency !== "TND" ? 0 :
        1;
      const totalTTC = totalHT + totalTVA + stampDuty;

      // Prepare data for saving
      const saveData: SaveInvoiceData = {
        invoiceDate: invoiceState.invoiceDate,
        invoiceType: invoiceState.invoiceType as any,
        currency: invoiceState.currency as any,
        exchangeRate: invoiceState.currency === "TND" ? undefined : invoiceState.exchangeRate,
        company: invoiceState.company,
        companyLogo: invoiceState.companyLogo,
        clientId: invoiceState.clientId,
        lines: invoiceState.lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceHT: line.unitPriceHT,
          discount: line.discount,
          vatRate: line.vatRate,
          lineTotalHT: line.lineTotalHT,
          lineTVA: line.lineTVA,
          lineTotalTTC: line.lineTotalTTC,
        })),
        totalHT,
        totalTVA,
        stampDuty,
        totalTTC,
        suspensionAuthNumber: invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionAuthNumber : undefined,
        suspensionValidUntil: invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionValidUntil || undefined : undefined,
        purchaseOrderNumber: invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionPurchaseOrderNumber : undefined,
        status: "VALIDATED",
      };

      const result = await saveInvoice(saveData);

      if (result.success) {
        toast.success(
          `Facture ${result.invoiceNumber} validée avec succès!`,
          {
            description: "La facture a été enregistrée et validée.",
          }
        );
        
        // Redirect to invoices list or invoice detail
        router.push("/dashboard/invoices");
      } else {
        toast.error("Erreur lors de la validation", {
          description: result.error || "Une erreur est survenue",
        });
        setErrors([result.error || "Erreur lors de la validation"]);
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue est survenue",
      });
      setErrors(["Une erreur inattendue est survenue"]);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    setIsSaving(true);
    
    try {
      // Calculate totals
      const totalHT = invoiceState.lines.reduce((sum, line) => sum + line.lineTotalHT, 0);
      const totalTVA = invoiceState.lines.reduce((sum, line) => sum + line.lineTVA, 0);
      const stampDuty = 
        invoiceState.invoiceType === "EXPORTATION" ? 0 :
        invoiceState.currency !== "TND" ? 0 :
        1;
      const totalTTC = totalHT + totalTVA + stampDuty;

      // Prepare data for saving
      const saveData: SaveInvoiceData = {
        invoiceDate: invoiceState.invoiceDate,
        invoiceType: invoiceState.invoiceType as any,
        currency: invoiceState.currency as any,
        exchangeRate: invoiceState.currency === "TND" ? undefined : invoiceState.exchangeRate,
        company: invoiceState.company,
        companyLogo: invoiceState.companyLogo,
        clientId: invoiceState.clientId,
        lines: invoiceState.lines.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceHT: line.unitPriceHT,
          discount: line.discount,
          vatRate: line.vatRate,
          lineTotalHT: line.lineTotalHT,
          lineTVA: line.lineTVA,
          lineTotalTTC: line.lineTotalTTC,
        })),
        totalHT,
        totalTVA,
        stampDuty,
        totalTTC,
        suspensionAuthNumber: invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionAuthNumber : undefined,
        suspensionValidUntil: invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionValidUntil || undefined : undefined,
        purchaseOrderNumber: invoiceState.invoiceType === "SUSPENSION" ? invoiceState.suspensionPurchaseOrderNumber : undefined,
        status: "DRAFT",
      };

      const result = await saveInvoice(saveData);

      if (result.success) {
        toast.success(
          `Brouillon ${result.invoiceNumber} enregistré!`,
          {
            description: "Vous pourrez le modifier et le valider plus tard.",
          }
        );
        
        // Redirect to invoices list
        router.push("/dashboard/invoices");
      } else {
        toast.error("Erreur lors de l'enregistrement", {
          description: result.error || "Une erreur est survenue",
        });
      }
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue est survenue",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Step labels for progress indicator
  const stepLabels = [
    "Contexte",
    "Client",
    "Lignes",
    invoiceState.invoiceType === "SUSPENSION" ? "Suspension" : null,
    "Revue",
  ].filter((label): label is string => label !== null);
  
  const visibleStep = currentStep <= 3 ? currentStep : 
    invoiceState.invoiceType === "SUSPENSION" ? currentStep : currentStep + 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto py-4">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === visibleStep;
            const isCompleted = stepNum < visibleStep;

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-full font-semibold text-sm transition-all duration-500 ease-in-out transform ${
                      isCompleted
                        ? "bg-primary text-primary-foreground scale-100"
                        : isActive
                          ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/30 ring-offset-2 shadow-lg"
                          : "border-2 scale-95"
                    }`}
                  >
                    {isCompleted ? (
                      <span className="animate-in fade-in duration-300">✓</span>
                    ) : (
                      <span className={isActive ? "animate-in zoom-in duration-300" : ""}>
                        {stepNum}
                      </span>
                    )}
                  </div>
                  {/* <span 
                    className={`text-xs font-medium transition-all duration-300 ${
                      isActive 
                        ? "text-primary font-semibold" 
                        : isCompleted 
                          ? "text-slate-700" 
                          : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span> */}
                </div>
                {index < stepLabels.length - 1 && (
                  <div
                    className={`h-0.5 w-12 md:w-20 transition-all duration-500 ease-in-out ${
                      isCompleted 
                        ? "bg-primary" 
                        : "bg-slate-300"
                    }`}
                    style={{
                      transform: isCompleted ? "scaleX(1)" : "scaleX(0.95)",
                      transformOrigin: "left"
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <ul className="list-disc list-inside space-y-1 mt-2">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <Step1Context
            invoiceState={invoiceState}
            onNext={handleStep1Complete}
            isLoading={isSaving}
          />
        )}

        {currentStep === 2 && (
          <Step2Client
            client={invoiceState.client}
            clientId={invoiceState.clientId}
            onBack={handleStep2Back}
            onNext={handleStep2Complete}
            isLoading={isSaving}
          />
        )}

        {currentStep === 3 && (
          <Step3Lines
            lines={invoiceState.lines}
            invoiceType={invoiceState.invoiceType}
            onBack={() => setCurrentStep(2)}
            onNext={handleStep3Complete}
            isLoading={isSaving}
          />
        )}

        {invoiceState.invoiceType === "SUSPENSION" && currentStep === 4 && (
          <Step4Suspension
            suspensionData={{
              suspensionAuthNumber: invoiceState.suspensionAuthNumber,
              suspensionValidUntil: invoiceState.suspensionValidUntil,
              suspensionPurchaseOrderNumber: invoiceState.suspensionPurchaseOrderNumber,
            }}
            onBack={() => setCurrentStep(3)}
            onNext={handleStep4Complete}
            isLoading={isSaving}
          />
        )}

        {currentStep === 5 && (
          <Step5Review
            invoiceState={invoiceState}
            onBack={() => {
              if (invoiceState.invoiceType === "SUSPENSION") {
                setCurrentStep(4);
              } else {
                setCurrentStep(3);
              }
            }}
            onValidate={handleFinalValidation}
            onSaveAsDraft={handleSaveAsDraft}
            isLoading={isSaving}
            isValidating={isValidating}
          />
        )}
      </div>
    </div>
  );
}
