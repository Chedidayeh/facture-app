import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { InvoiceDetails } from "../actions";

// Register fonts if needed (optional - for better typography)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf',
// });

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  // Header with black background
  header: {
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
  },
  headerLogo: {
    width: 80,
    height: 60,
    objectFit: "contain",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  headerCompanyName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Main content area
  content: {
    padding: 20,
  },
  // Two column layout
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  column: {
    width: "48%",
  },
  // Section titles
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  // Text styles
  text: {
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  textBold: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  textSmall: {
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#F3F4F6",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  // Table styles
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 8,
  },
  tableCol: {
    fontSize: 8,
  },
  tableColHeader: {
    fontSize: 8,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  // Column widths for table
  col1: { width: "35%" }, // Description
  col2: { width: "10%", textAlign: "center" }, // Quantity
  col3: { width: "10%", textAlign: "center" }, // Unit
  col4: { width: "15%", textAlign: "right" }, // Unit Price
  col5: { width: "10%", textAlign: "right" }, // Discount
  col6: { width: "20%", textAlign: "right" }, // Total
  // Totals section
  totalsContainer: {
    marginTop: 20,
    marginLeft: "auto",
    width: "50%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 9,
  },
  totalValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    color: "#FFFFFF",
    padding: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Suspension box
  suspensionBox: {
    backgroundColor: "#FEF3C7",
    padding: 15,
    marginTop: 30,
    borderRadius: 4,
  },
  suspensionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 6,
  },
  suspensionText: {
    fontSize: 8,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 7,
    color: "#666666",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
});

interface InvoicePDFTemplateProps {
  invoice: InvoiceDetails;
}

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "LOCAL":
      return "Local";
    case "EXPORTATION":
      return "Exportation";
    case "SUSPENSION":
      return "En suspension de TVA";
    default:
      return type;
  }
};

export const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({
  invoice,
}) => {
  // Convert currency code to French currency name
  const getCurrencyName = (currency: string): string => {
    const currencyMap: { [key: string]: string } = {
      TND: "dinars",
      EUR: "euros",
      USD: "dollars",
      GBP: "livres sterling",
      CAD: "dollars canadiens",
      CHF: "francs suisses",
      JPY: "yens",
      CNY: "yuans",
    };
    return currencyMap[currency] || currency;
  };

  // Convert number to words in French
  const numberToWords = (num: number): string => {
    const units = [
      "",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
    ];
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ];
    const scales = ["", "mille", "million", "milliard"];

    const convertGroup = (n: number): string => {
      if (n === 0) return "";

      const groupValue = n;
      let groupText = "";
      const hundreds = Math.floor(groupValue / 100);
      const remainder = groupValue % 100;

      if (hundreds > 0) {
        groupText = units[hundreds] + " cent";
        if (remainder === 0 && hundreds > 1) groupText += "s";
      }

      if (remainder > 0) {
        if (hundreds > 0) groupText += " ";
        if (remainder < 10) {
          groupText += units[remainder];
        } else if (remainder < 20) {
          groupText += [
            "dix",
            "onze",
            "douze",
            "treize",
            "quatorze",
            "quinze",
            "seize",
            "dix-sept",
            "dix-huit",
            "dix-neuf",
          ][remainder - 10];
        } else {
          const ten = Math.floor(remainder / 10);
          const unit = remainder % 10;
          groupText += tens[ten];
          if (unit > 0) {
            groupText += "-" + units[unit];
          }
        }
      }

      return groupText;
    };

    const convertToWords = (n: number): string => {
      if (n === 0) return "zéro";

      const parts: string[] = [];
      let scaleIndex = 0;

      while (n > 0 && scaleIndex < scales.length) {
        const groupValue = n % 1000;
        if (groupValue !== 0) {
          let groupText = convertGroup(groupValue);

          if (scaleIndex > 0) {
            groupText += " " + scales[scaleIndex];
            if (groupValue > 1 && scaleIndex === 1) groupText += "s";
          }

          parts.unshift(groupText);
        }
        n = Math.floor(n / 1000);
        scaleIndex++;
      }

      return parts.join(" ").trim();
    };

    // Split into whole and decimal parts
    const wholePart = Math.floor(num);
    const decimalPart = Math.round((num - wholePart) * 100);

    let result = convertToWords(wholePart);
    result += decimalPart > 0 ? ` et ${convertToWords(decimalPart)}` : "";

    return result;
  };

  // Format the total with currency name properly positioned
  const wholePart = Math.floor(invoice.totalTTC);
  const decimalPart = Math.round((invoice.totalTTC - wholePart) * 100);
  const wholePartWords = numberToWords(wholePart);
  const decimalPartWords = decimalPart > 0 ? numberToWords(decimalPart) : "";

  const totalTTCDisplay = decimalPartWords
    ? `${wholePartWords} ${getCurrencyName(
        invoice.currency
      )} et ${decimalPartWords}`
    : `${wholePartWords} ${getCurrencyName(invoice.currency)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Black background with logo/company name and FACTURE */}
        <View style={styles.header}>
          {invoice.company.logo ? (
            <Image src={invoice.company.logo} style={styles.headerLogo} />
          ) : (
            <Text style={styles.headerCompanyName}>{invoice.company.name}</Text>
          )}
          <Text style={styles.headerTitle}>FACTURE</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Company Address and Invoice Details Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {/* Left: Company Info */}
            <View style={{ width: "48%", fontSize: 9, lineHeight: 1.4 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Address:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {invoice.company.address}
                </Text>
              </Text>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Téléphone:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {invoice.company.phone}
                </Text>
              </Text>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Email:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {invoice.company.email}
                </Text>
              </Text>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Matricule fiscal:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {invoice.company.taxNumber}
                </Text>
              </Text>
            </View>

            {/* Right: Invoice Details */}
            <View
              style={{
                width: "48%",
                fontSize: 9,
                lineHeight: 1.4,
                textAlign: "right",
              }}
            >
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Date:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {formatDate(invoice.date)}
                </Text>
              </Text>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Facture #:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {invoice.invoiceNumber}
                </Text>
              </Text>
              {invoice.showDueDate && (
                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                  Date d'échéance:{" "}
                  <Text style={{ fontWeight: "normal" }}>
                    {formatDate(invoice.dueDate)}
                  </Text>
                </Text>
              )}
            </View>
          </View>

          {/* Client Information */}
          <View
            style={{
              marginBottom: 20,
              fontSize: 9,
              lineHeight: 1.4,
              textAlign: "right",
            }}
          >
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Client:{" "}
              <Text style={{ fontWeight: "normal" }}>
                {invoice.client.name}
              </Text>
            </Text>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Address:{" "}
              <Text style={{ fontWeight: "normal" }}>
                {invoice.client.address}
              </Text>
            </Text>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Pays:{" "}
              <Text style={{ fontWeight: "normal" }}>
                {invoice.client.country}
              </Text>
            </Text>
            {invoice.client.type !== "PASSAGER" && invoice.client.taxNumber && (
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Identifiant unique:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {invoice.client.taxNumber}
                </Text>
              </Text>
            )}
          </View>

          {/* Items Table */}
          <View
            style={{
              marginTop: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#000000",
            }}
          >
            {/* Table Header */}
            <View style={{ flexDirection: "row", backgroundColor: "#000000" }}>
              <View
                style={{
                  width: "35%",
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                }}
              >
                <Text
                  style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}
                >
                  Description
                </Text>
              </View>
              <View
                style={{
                  width: "10%",
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                  textAlign: "center",
                }}
              >
                <Text
                  style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}
                >
                  Qté
                </Text>
              </View>
              <View
                style={{
                  width: "10%",
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                  textAlign: "center",
                }}
              >
                <Text
                  style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}
                >
                  Unité
                </Text>
              </View>
              <View
                style={{
                  width: "15%",
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                  textAlign: "right",
                }}
              >
                <Text
                  style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}
                >
                  Prix Unit. HT
                </Text>
              </View>
              <View
                style={{
                  width: "10%",
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                  textAlign: "right",
                }}
              >
                <Text
                  style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}
                >
                  Remise
                </Text>
              </View>
              <View style={{ width: "20%", padding: 8, textAlign: "right" }}>
                <Text
                  style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}
                >
                  Total HT
                </Text>
              </View>
            </View>

            {/* Table Rows */}
            {invoice.items.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderTopColor: "#000000",
                }}
              >
                <View
                  style={{
                    width: "35%",
                    borderRightWidth: 1,
                    borderRightColor: "#000000",
                    padding: 8,
                  }}
                >
                  <Text style={{ fontSize: 8 }}>{item.description}</Text>
                </View>
                <View
                  style={{
                    width: "10%",
                    borderRightWidth: 1,
                    borderRightColor: "#000000",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  <Text style={{ fontSize: 8 }}>{item.quantity}</Text>
                </View>
                <View
                  style={{
                    width: "10%",
                    borderRightWidth: 1,
                    borderRightColor: "#000000",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  <Text style={{ fontSize: 8 }}>{item.unit}</Text>
                </View>
                <View
                  style={{
                    width: "15%",
                    borderRightWidth: 1,
                    borderRightColor: "#000000",
                    padding: 8,
                    textAlign: "right",
                  }}
                >
                  <Text style={{ fontSize: 8 }}>
                    {item.unitPriceHT.toFixed(2)}
                  </Text>
                </View>
                <View
                  style={{
                    width: "10%",
                    borderRightWidth: 1,
                    borderRightColor: "#000000",
                    padding: 8,
                    textAlign: "right",
                  }}
                >
                  <Text style={{ fontSize: 8 }}>{item.discount}%</Text>
                </View>
                <View style={{ width: "20%", padding: 8, textAlign: "right" }}>
                  <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                    {item.lineTotalHT.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* TVA Details Table */}

          <View
            style={{
              width: "50%",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#000000",
            }}
          >
            {/* Table Header */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#F3F4F6",
                borderBottomWidth: 1,
                borderBottomColor: "#000000",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                  Détails TVA
                </Text>
              </View>
              <View style={{ width: "40%", padding: 8 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 8,
                    textAlign: "right",
                  }}
                >
                  Montant
                </Text>
              </View>
            </View>

            {/* Montant HT Row */}
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: "#000000",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRightWidth: 1,
                  borderRightColor: "#000000",
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 8 }}>Montant HT</Text>
              </View>
              <View style={{ width: "40%", padding: 8 }}>
                <Text
                  style={{
                    fontSize: 8,
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {invoice.totalHT.toFixed(2)} {invoice.currency}
                </Text>
              </View>
            </View>

            {/* TVA Breakdown by Line */}
            {invoice.type !== "EXPORTATION" ? (
              <>
                {invoice.items.map((item, index) => (
                  <View
                    key={`tax-${index}`}
                    style={{
                      flexDirection: "row",
                      borderBottomWidth: 1,
                      borderBottomColor: "#000000",
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRightWidth: 1,
                        borderRightColor: "#000000",
                        padding: 8,
                      }}
                    >
                      <Text style={{ fontSize: 7 }}>
                        TVA {(item.vatRate).toFixed(0)}% (
                        {item.description})
                      </Text>
                    </View>
                    <View style={{ width: "40%", padding: 8 }}>
                      <Text style={{ fontSize: 7, textAlign: "right" }}>
                        {item.lineTVA.toFixed(2)} {invoice.currency}
                      </Text>
                    </View>
                  </View>
                ))}
                {/* Total Taxes Row */}
                <View
                  style={{ flexDirection: "row", backgroundColor: "#F3F4F6" }}
                >
                  <View
                    style={{
                      flex: 1,
                      borderRightWidth: 1,
                      borderRightColor: "#000000",
                      padding: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                      Total Taxes
                    </Text>
                  </View>
                  <View style={{ width: "40%", padding: 8 }}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 8,
                        textAlign: "right",
                      }}
                    >
                      {invoice.totalTVA.toFixed(2)} {invoice.currency}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View
                style={{ flexDirection: "row", backgroundColor: "#F0F9FF" }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRightWidth: 1,
                    borderRightColor: "#000000",
                    padding: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontStyle: "italic",
                      color: "#1F2937",
                    }}
                  >
                    Exportation (0% TVA)
                  </Text>
                </View>
                <View style={{ width: "40%", padding: 8 }}>
                  <Text
                    style={{
                      fontSize: 8,
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    0.00 {invoice.currency}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Right: Totals Summary */}
          <View style={{ marginLeft: "auto", width: "50%", marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#000000",
                paddingVertical: 6,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 8 }}>Sous-total (HT)</Text>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                {invoice.totalHT.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#000000",
                paddingVertical: 6,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 8 }}>Total TVA</Text>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                {invoice.totalTVA.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: "#000000",
                paddingVertical: 6,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 8 }}>Droit de timbre</Text>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                {invoice.stampDuty.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                backgroundColor: "#000000",
                color: "#FFFFFF",
                padding: 10,
                marginTop: 8,
              }}
            >
              <Text
                style={{ fontSize: 9, fontWeight: "bold", color: "#FFFFFF" }}
              >
                TTC
              </Text>
              <Text
                style={{ fontSize: 9, fontWeight: "bold", color: "#FFFFFF" }}
              >
                {invoice.totalTTC.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            {/* French text display */}
            <View
              style={{
                backgroundColor: "#F3F4F6",
                padding: 10,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 7,
                }}
              >
                le montant TTC de la facture est {totalTTCDisplay}
              </Text>
            </View>
          </View>

          {/* Suspension Mention if applicable */}
          {invoice.type === "SUSPENSION" && invoice.suspensionAuthNumber && (
            <View style={styles.suspensionBox}>
              <Text style={styles.suspensionTitle}>SUSPENSION DE TVA:</Text>
              <Text style={styles.suspensionText}>
                « Vente en suspension de TVA suivant autorisation d'achat en
                suspension N° {invoice.suspensionAuthNumber}
                {invoice.suspensionValidUntil &&
                  ` valable jusqu'au ${formatDate(
                    invoice.suspensionValidUntil
                  )}`}
                {invoice.purchaseOrderNumber &&
                  ` et suivant Bon de commande N° ${invoice.purchaseOrderNumber}`}{" "}
                »
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        {/* <View style={styles.footer}>
          <Text>
            Document généré le {formatDate(new Date())} - {invoice.company.name}
          </Text>
        </View> */}
      </Page>
    </Document>
  );
};
