"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInfo } from "./invoice-form-new";
import { Search, Loader2 } from "lucide-react";
import { getActiveClients, ActiveClientData } from "../actions";
import { ClientType } from "@prisma/client";

interface Step2ClientProps {
  client: ClientInfo;
  clientId: string;
  onBack: () => void;
  onNext: (client: ClientInfo, clientId: string) => void;
  isLoading?: boolean;
}

export function Step2Client({ client, clientId: initialClientId, onBack, onNext, isLoading }: Step2ClientProps) {
  const [selectedClientId, setSelectedClientId] = React.useState<string>(initialClientId || "");
  const [name, setName] = React.useState(client.name);
  const [address, setAddress] = React.useState(client.address);
  const [country, setCountry] = React.useState(client.country);
  const [fiscalMatricule, setFiscalMatricule] = React.useState(client.fiscalMatricule);
  const [clientType, setClientType] = React.useState<string>(client.type);
  const [activeClients, setActiveClients] = React.useState<ActiveClientData[]>([]);
  const [loadingClients, setLoadingClients] = React.useState(true);

  // Fetch active clients from database
  React.useEffect(() => {
    async function fetchClients() {
      setLoadingClients(true);
      try {
        const clients = await getActiveClients();
        setActiveClients(clients);
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setLoadingClients(false);
      }
    }
    
    fetchClients();
  }, []);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = activeClients.find(c => c.id === clientId);
    
    if (selectedClient) {
      setName(selectedClient.nom);
      setAddress(selectedClient.address);
      setCountry(selectedClient.pays);
      setClientType(selectedClient.typeClient);
      setFiscalMatricule(selectedClient.matriculeFiscal === "-" ? "" : selectedClient.matriculeFiscal);
    }
  };

  const handleNext = () => {
    onNext(
      {
        name,
        address,
        country,
        fiscalMatricule,
        type: clientType,
      },
      selectedClientId
    );
  };

  const isValid = selectedClientId !== "" && name.trim() !== "" && address.trim() !== "" && (!(clientType === ClientType.PROFESSIONNEL) || fiscalMatricule.trim() !== "");

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Informations du client</h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un client actif dans votre base de données
          </p>
        </div>

        <div className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientSelect">Sélectionner un client *</Label>
            <Select 
              value={selectedClientId} 
              onValueChange={handleClientSelect}
              disabled={loadingClients}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingClients ? "Chargement des clients..." : "Choisir un client..."}>
                  {loadingClients ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Chargement...</span>
                    </div>
                  ) : selectedClientId ? (
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span>{name}</span>
                      {clientType === ClientType.PROFESSIONNEL && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Professionnel
                        </span>
                      )}
                    </div>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {activeClients.length === 0 && !loadingClients ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucun client actif disponible
                  </div>
                ) : (
                  activeClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex flex-col">
                          <span className="font-medium">{client.nom}</span>
                          <span className="text-xs text-muted-foreground">
                            {client.clientCode} • {client.typeClient}
                            {client.matriculeFiscal !== "-" && ` • ${client.matriculeFiscal}`}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {loadingClients 
                ? "Chargement..." 
                : `${activeClients.length} client(s) actif(s) disponible(s)`}
            </p>
          </div>

          {/* Show client details when selected */}
          {selectedClientId && (
            <>

              {/* Nom / Raison sociale (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {clientType === ClientType.PROFESSIONNEL ? "Raison sociale" : "Nom complet"}
                </Label>
                <Input
                  id="name"
                  value={name}
                  disabled
                  className="bg-slate-50"
                />
              </div>

              {/* Matricule fiscal (Read-only) */}
              {clientType === ClientType.PROFESSIONNEL && (
                <div className="space-y-2">
                  <Label htmlFor="fiscalMatricule">Matricule fiscal</Label>
                  <Input
                    id="fiscalMatricule"
                    value={fiscalMatricule}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              )}

              {/* Adresse (Editable - not in mock data) */}
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Modifier ou vérifier l'adresse du client"
                  rows={3}
                  className={!address.trim() ? "border-red-300" : ""}
                />
                {!address.trim() ? (
                  <p className="text-xs text-red-600">L'adresse est obligatoire pour la facture</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    L'adresse sera affichée sur la facture
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Info box */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            ℹ️ Mentions obligatoires (Article 18 Code TVA)
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Nom ou raison sociale du client : <strong>Obligatoire</strong></li>
            <li>Adresse complète : <strong>Obligatoire</strong></li>
            <li>Matricule fiscal : <strong>Obligatoire si professionnel</strong></li>
          </ul>
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            ← Retour
          </Button>
          <Button 
            onClick={handleNext} 
            size="lg" 
            disabled={isLoading || !isValid}
          >
            Suivant →
          </Button>
        </div>
      </div>
    </Card>
  );
}
