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
          {/* Company and Invoice Details Row */}
          <View style={styles.row}>
            {/* Left: Company Address */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Adresse de l'entreprise</Text>
              <Text style={styles.textBold}>{invoice.company.name}</Text>
              <Text style={styles.text}>{invoice.company.address}</Text>
              {invoice.company.phone && (
                <Text style={styles.text}>
                  Téléphone: {invoice.company.phone}
                </Text>
              )}
              {invoice.company.email && (
                <Text style={styles.text}>Email: {invoice.company.email}</Text>
              )}
              <Text style={[styles.textBold]}>
                Matricule fiscal: {invoice.company.taxNumber}
              </Text>
              {/* <View style={styles.badge}>
                <Text>{getTypeLabel(invoice.type)}</Text>
              </View> */}
            </View>

            {/* Right: Invoice Details */}
            <View style={[styles.column, { alignItems: "flex-end" }]}>
              <Text style={styles.text}>Date: {formatDate(invoice.date)}</Text>
              <Text style={styles.text}>
                Facture #: {invoice.invoiceNumber}
              </Text>
              <Text style={styles.text}>
                Client ID: {invoice.client.taxNumber || "Particulier"}
              </Text>
              {invoice.currency !== "TND" && invoice.exchangeRate && (
                <Text style={styles.textSmall}>
                  Devise: {invoice.currency} • Taux:{" "}
                  {invoice.exchangeRate.toFixed(4)} TND
                </Text>
              )}
            </View>
          </View>

          {/* Client and Due Date Row */}
          <View style={styles.row}>
            {/* Left: Bill To */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Facturer à</Text>
              <Text style={styles.textBold}>{invoice.client.name}</Text>
              <Text style={styles.text}>{invoice.client.address}</Text>
              <Text style={styles.text}>{invoice.client.country}</Text>

              {invoice.client.taxNumber && (
                <Text style={styles.text}>
                  Matricule fiscal: {invoice.client.taxNumber}
                </Text>
              )}
              <Text style={styles.text}>
                {invoice.client.isProfessional
                  ? "Client professionnel"
                  : "Client particulier"}
              </Text>
              <Text style={[styles.text, { marginTop: 12 }]}>
                Date d'échéance:{" "}
                {formatDate(
                  new Date(
                    new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000
                  )
                )}
              </Text>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableColHeader, styles.col1]}>
                Description
              </Text>
              <Text style={[styles.tableColHeader, styles.col2]}>Qté</Text>
              <Text style={[styles.tableColHeader, styles.col3]}>Unité</Text>
              <Text style={[styles.tableColHeader, styles.col4]}>
                Prix Unit. HT
              </Text>
              <Text style={[styles.tableColHeader, styles.col5]}>Remise</Text>
              <Text style={[styles.tableColHeader, styles.col6]}>Total HT</Text>
            </View>

            {/* Table Rows */}
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.col1]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCol, styles.col2]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCol, styles.col3]}>{item.unit}</Text>
                <Text style={[styles.tableCol, styles.col4]}>
                  {item.unitPriceHT.toFixed(2)}
                </Text>
                <Text style={[styles.tableCol, styles.col5]}>
                  {item.discount}%
                </Text>
                <Text
                  style={[styles.tableCol, styles.col6, { fontWeight: "bold" }]}
                >
                  {item.lineTotalHT.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals Section */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total (HT)</Text>
              <Text style={styles.totalValue}>
                {invoice.totalHT.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total TVA</Text>
              <Text style={styles.totalValue}>
                {invoice.totalTVA.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Droit de timbre</Text>
              <Text style={styles.totalValue}>
                {invoice.stampDuty.toFixed(2)} {invoice.currency}
              </Text>
            </View>
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {invoice.totalTTC.toFixed(2)} {invoice.currency}
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
