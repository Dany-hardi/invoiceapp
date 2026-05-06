// =============================================================================
// lib/pdf/invoice-pdf.tsx
// @react-pdf/renderer — Branded invoice PDF document.
// This component is server-only. Never import in client components.
// =============================================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoicePDFData {
  // Invoice core
  invoiceNumber: string;
  issueDate:     string;
  dueDate:       string;
  status:        string;
  currency:      string;
  notes?:        string | null;

  // Financials (raw numbers, already in dollars/euros — divided from cents)
  subtotal:     number;
  taxRate:      number;   // 0–100 (percent)
  taxAmount:    number;
  total:        number;

  // Line items
  lineItems: {
    description: string;
    quantity:    number;
    unitPrice:   number;
    total:       number;
  }[];

  // Customer
  customer: {
    name:     string;
    email:    string;
    company?: string | null;
    address?: string | null;
    city?:    string | null;
    country?: string | null;
  };

  // Freelancer / business
  business: {
    name:     string;
    email:    string;
    address?: string | null;
    city?:    string | null;
    country?: string | null;
    taxId?:   string | null;
    phone?:   string | null;
  };

  // Public portal link
  portalUrl: string;
}

// ---------------------------------------------------------------------------
// Design tokens — matching the app's design system
// ---------------------------------------------------------------------------

const BLACK  = "#0A0A0A";
const WHITE  = "#FFFFFF";
const BLUE   = "#3B82F6";
const GRAY_1 = "#F8F9FA";   // lightest bg
const GRAY_2 = "#E9ECEF";   // border / divider
const GRAY_3 = "#6C757D";   // muted text
const GRAY_4 = "#343A40";   // body text
const GREEN  = "#22C55E";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style:                 "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "#F59E0B",
  SENT:      BLUE,
  VIEWED:    "#8B5CF6",
  PAID:      GREEN,
  OVERDUE:   "#EF4444",
  CANCELLED: GRAY_3,
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    backgroundColor: WHITE,
    paddingBottom:   40,
  },

  // ── Header band ───────────────────────────────────────────────
  header: {
    backgroundColor: BLACK,
    paddingHorizontal: 40,
    paddingVertical:   32,
  },
  headerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
  },
  logoBox: {
    width:           28,
    height:          28,
    backgroundColor: BLUE,
    borderRadius:    6,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    8,
  },
  logoText: {
    color:      WHITE,
    fontSize:   14,
    fontFamily: "Helvetica-Bold",
  },
  bizName: {
    color:       WHITE,
    fontSize:    13,
    fontFamily:  "Helvetica-Bold",
    letterSpacing: -0.3,
  },
  bizSub: {
    color:     GRAY_3,
    fontSize:  8,
    marginTop: 2,
  },
  invLabelCol: {
    alignItems: "flex-end",
  },
  invWord: {
    color:         GRAY_3,
    fontSize:      7,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  invNumber: {
    color:       WHITE,
    fontSize:    16,
    fontFamily:  "Helvetica-Bold",
    letterSpacing: -0.5,
    marginTop:   3,
  },
  invDateRow: {
    flexDirection:  "row",
    justifyContent: "flex-end",
    alignItems:     "center",
    marginTop:      3,
    gap:            12,
  },
  invDateKey: {
    color:    GRAY_3,
    fontSize: 7,
    width:    28,
  },
  invDateVal: {
    color:       "#CCCCCC",
    fontSize:    8,
    fontFamily:  "Helvetica-Bold",
    width:       90,
    textAlign:   "right",
  },
  statusPill: {
    borderRadius:    99,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop:       10,
    alignSelf:       "flex-end",
  },
  statusText: {
    fontSize:      7,
    fontFamily:    "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Bill to / From ────────────────────────────────────────────
  billRow: {
    flexDirection:   "row",
    backgroundColor: GRAY_1,
    paddingHorizontal: 40,
    paddingVertical:   20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_2,
  },
  billCol: {
    flex: 1,
  },
  billKey: {
    fontSize:      6.5,
    fontFamily:    "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color:         GRAY_3,
    marginBottom:  6,
  },
  billName: {
    fontSize:   11,
    fontFamily: "Helvetica-Bold",
    color:      GRAY_4,
  },
  billSub: {
    fontSize:  8.5,
    color:     GRAY_3,
    marginTop: 2,
  },
  billRight: {
    alignItems: "flex-end",
  },

  // ── Line items table ──────────────────────────────────────────
  tableSection: {
    paddingHorizontal: 40,
    paddingTop:        24,
    paddingBottom:     16,
  },
  tableHead: {
    flexDirection:     "row",
    borderBottomWidth: 1.5,
    borderBottomColor: BLACK,
    paddingBottom:     7,
    marginBottom:      4,
  },
  thDesc:  { flex: 5, fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY_4, letterSpacing: 0.8, textTransform: "uppercase" },
  thQty:   { flex: 1, fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY_4, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" },
  thPrice: { flex: 2, fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY_4, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" },
  thTotal: { flex: 2, fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY_4, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" },

  tableRow: {
    flexDirection:     "row",
    paddingVertical:   8,
    borderBottomWidth: 0.75,
    borderBottomColor: GRAY_2,
    alignItems:        "flex-start",
  },
  tdDesc:  { flex: 5, fontSize: 9, color: GRAY_4, lineHeight: 1.5, paddingRight: 8 },
  tdQty:   { flex: 1, fontSize: 9, color: GRAY_3, textAlign: "right", fontFamily: "Helvetica" },
  tdPrice: { flex: 2, fontSize: 9, color: GRAY_3, textAlign: "right", fontFamily: "Helvetica" },
  tdTotal: { flex: 2, fontSize: 9, color: GRAY_4, textAlign: "right", fontFamily: "Helvetica-Bold" },

  // ── Totals block ──────────────────────────────────────────────
  totalsSection: {
    paddingHorizontal: 40,
    alignItems:        "flex-end",
    paddingBottom:     24,
  },
  totalsBox: {
    width:           200,
  },
  totalsRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   5,
  },
  totalsKey: {
    fontSize: 9,
    color:    GRAY_3,
  },
  totalsVal: {
    fontSize:   9,
    color:      GRAY_4,
    fontFamily: "Helvetica",
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: GRAY_2,
    marginVertical: 6,
  },
  grandKey: {
    fontSize:   11,
    fontFamily: "Helvetica-Bold",
    color:      GRAY_4,
  },
  grandVal: {
    fontSize:   12,
    fontFamily: "Helvetica-Bold",
    color:      BLACK,
  },

  // ── Notes ─────────────────────────────────────────────────────
  notesSection: {
    marginHorizontal: 40,
    marginBottom:     24,
    backgroundColor:  GRAY_1,
    borderRadius:     8,
    padding:          16,
    borderLeftWidth:  3,
    borderLeftColor:  BLUE,
  },
  notesKey: {
    fontSize:      6.5,
    fontFamily:    "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color:         GRAY_3,
    marginBottom:  6,
  },
  notesVal: {
    fontSize:   8.5,
    color:      GRAY_3,
    lineHeight: 1.6,
  },

  // ── Portal CTA ────────────────────────────────────────────────
  portalSection: {
    marginHorizontal: 40,
    marginBottom:     24,
    backgroundColor:  "#EFF6FF",
    borderRadius:     8,
    padding:          14,
    flexDirection:    "row",
    alignItems:       "center",
    justifyContent:   "space-between",
  },
  portalText: {
    fontSize:  8.5,
    color:     "#1D4ED8",
    flex:      1,
    lineHeight: 1.4,
  },
  portalBold: {
    fontFamily: "Helvetica-Bold",
    fontSize:   8.5,
    color:      "#1D4ED8",
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    backgroundColor: BLACK,
    paddingHorizontal: 40,
    paddingVertical:   16,
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "center",
  },
  footerLeft: {
    color:    GRAY_3,
    fontSize: 7.5,
  },
  footerRight: {
    color:    GRAY_3,
    fontSize: 7.5,
  },
});

// ---------------------------------------------------------------------------
// PDF Document
// ---------------------------------------------------------------------------

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const statusColor = STATUS_COLORS[data.status] ?? GRAY_3;

  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author={data.business.name}
      subject={`Invoice to ${data.customer.name}`}
      keywords="invoice, payment"
    >
      <Page size="A4" style={S.page}>

        {/* ================================================================ */}
        {/* HEADER                                                            */}
        {/* ================================================================ */}
        <View style={S.header}>
          <View style={S.headerRow}>
            {/* Left — business */}
            <View>
              <View style={S.logoBox}>
                <Text style={S.logoText}>
                  {data.business.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={S.bizName}>{data.business.name}</Text>
              <Text style={S.bizSub}>{data.business.email}</Text>
              {data.business.phone && (
                <Text style={S.bizSub}>{data.business.phone}</Text>
              )}
              {(data.business.city || data.business.country) && (
                <Text style={S.bizSub}>
                  {[data.business.city, data.business.country]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              )}
              {data.business.taxId && (
                <Text style={S.bizSub}>Tax ID: {data.business.taxId}</Text>
              )}
            </View>

            {/* Right — invoice number + dates */}
            <View style={S.invLabelCol}>
              <Text style={S.invWord}>Invoice</Text>
              <Text style={S.invNumber}>{data.invoiceNumber}</Text>

              <View style={{ marginTop: 10 }}>
                <View style={S.invDateRow}>
                  <Text style={S.invDateKey}>Issued</Text>
                  <Text style={S.invDateVal}>{fmtDate(data.issueDate)}</Text>
                </View>
                <View style={S.invDateRow}>
                  <Text style={S.invDateKey}>Due</Text>
                  <Text style={S.invDateVal}>{fmtDate(data.dueDate)}</Text>
                </View>
              </View>

              {/* Status pill */}
              <View
                style={[
                  S.statusPill,
                  {
                    backgroundColor: `${statusColor}18`,
                    borderWidth:     1,
                    borderColor:     `${statusColor}40`,
                  },
                ]}
              >
                <Text style={[S.statusText, { color: statusColor }]}>
                  {data.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================ */}
        {/* BILL TO / FROM                                                    */}
        {/* ================================================================ */}
        <View style={S.billRow}>
          {/* Bill To */}
          <View style={S.billCol}>
            <Text style={S.billKey}>Bill To</Text>
            <Text style={S.billName}>{data.customer.name}</Text>
            {data.customer.company && (
              <Text style={S.billSub}>{data.customer.company}</Text>
            )}
            <Text style={S.billSub}>{data.customer.email}</Text>
            {data.customer.address && (
              <Text style={S.billSub}>{data.customer.address}</Text>
            )}
            {(data.customer.city || data.customer.country) && (
              <Text style={S.billSub}>
                {[data.customer.city, data.customer.country]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </View>

          {/* From */}
          <View style={[S.billCol, S.billRight]}>
            <Text style={S.billKey}>From</Text>
            <Text style={S.billName}>{data.business.name}</Text>
            {data.business.address && (
              <Text style={S.billSub}>{data.business.address}</Text>
            )}
            {(data.business.city || data.business.country) && (
              <Text style={S.billSub}>
                {[data.business.city, data.business.country]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </View>
        </View>

        {/* ================================================================ */}
        {/* LINE ITEMS TABLE                                                  */}
        {/* ================================================================ */}
        <View style={S.tableSection}>
          {/* Header */}
          <View style={S.tableHead}>
            <Text style={S.thDesc}>Description</Text>
            <Text style={S.thQty}>Qty</Text>
            <Text style={S.thPrice}>Unit Price</Text>
            <Text style={S.thTotal}>Total</Text>
          </View>

          {/* Rows */}
          {data.lineItems.map((item, i) => (
            <View key={i} style={S.tableRow} wrap={false}>
              <Text style={S.tdDesc}>{item.description}</Text>
              <Text style={S.tdQty}>{item.quantity}</Text>
              <Text style={S.tdPrice}>{fmt(item.unitPrice, data.currency)}</Text>
              <Text style={S.tdTotal}>{fmt(item.total, data.currency)}</Text>
            </View>
          ))}
        </View>

        {/* ================================================================ */}
        {/* TOTALS                                                            */}
        {/* ================================================================ */}
        <View style={S.totalsSection}>
          <View style={S.totalsBox}>
            <View style={S.totalsRow}>
              <Text style={S.totalsKey}>Subtotal</Text>
              <Text style={S.totalsVal}>{fmt(data.subtotal, data.currency)}</Text>
            </View>

            {data.taxRate > 0 && (
              <View style={S.totalsRow}>
                <Text style={S.totalsKey}>
                  Tax ({data.taxRate.toFixed(2)}%)
                </Text>
                <Text style={S.totalsVal}>
                  {fmt(data.taxAmount, data.currency)}
                </Text>
              </View>
            )}

            <View style={S.totalsDivider} />

            <View style={S.totalsRow}>
              <Text style={S.grandKey}>Total Due</Text>
              <Text style={S.grandVal}>{fmt(data.total, data.currency)}</Text>
            </View>
          </View>
        </View>

        {/* ================================================================ */}
        {/* NOTES                                                             */}
        {/* ================================================================ */}
        {data.notes && (
          <View style={S.notesSection}>
            <Text style={S.notesKey}>Notes & Payment Instructions</Text>
            <Text style={S.notesVal}>{data.notes}</Text>
          </View>
        )}

        {/* ================================================================ */}
        {/* PORTAL CTA                                                        */}
        {/* ================================================================ */}
        <View style={S.portalSection}>
          <View style={{ flex: 1 }}>
            <Text style={S.portalBold}>Pay online</Text>
            <Text style={[S.portalText, { marginTop: 3 }]}>
              View and pay this invoice securely at:{"\n"}
              <Text style={{ color: "#2563EB" }}>{data.portalUrl}</Text>
            </Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* FOOTER                                                            */}
        {/* ================================================================ */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>
            {data.invoiceNumber} · {data.business.name}
          </Text>
          <Text style={S.footerRight}>Thank you for your business.</Text>
        </View>

      </Page>
    </Document>
  );
}
