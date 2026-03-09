import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

const COMPANY_NAME = 'Echo Digitals';
const COMPANY_TAGLINE = 'Digital Solutions & Services';
const COMPANY_EMAIL = 'contact@echodigitals.com';
const COMPANY_WEBSITE = 'www.echodigitals.com';

// ── Color Palette ────────────────────────────────────────
const COLORS = {
    primary: [30, 64, 175],       // blue-800
    primaryDark: [23, 37, 84],    // blue-950
    primaryLight: [219, 234, 254], // blue-100
    accent: [14, 165, 233],       // sky-500
    dark: [15, 23, 42],           // slate-900
    text: [51, 65, 85],           // slate-600
    textLight: [100, 116, 139],   // slate-400
    muted: [148, 163, 184],       // slate-300
    border: [226, 232, 240],      // slate-200
    bgLight: [248, 250, 252],     // slate-50
    white: [255, 255, 255],
    green: [22, 163, 74],         // green-600
    red: [220, 38, 38],           // red-600
    amber: [217, 119, 6],         // amber-600
};

const fmt = (v) => {
    const value = typeof v === 'number' ? v : parseFloat(v || 0);
    return 'RS ' + value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getStatusColor = (status) => {
    switch (status) {
        case 'paid': return COLORS.green;
        case 'overdue': case 'cancelled': return COLORS.red;
        case 'sent': case 'partially_paid': return COLORS.amber;
        default: return COLORS.textLight;
    }
};

// ── Helper: Draw rounded rect ────────────────────────────
const drawRoundedRect = (doc, x, y, w, h, r, fillColor) => {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, w, h, r, r, 'F');
};

// ── Helper: Draw status badge ────────────────────────────
const drawStatusBadge = (doc, status, x, y) => {
    const statusText = (status || 'draft').replace(/_/g, ' ').toUpperCase();
    const color = getStatusColor(status);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(statusText);
    const badgeW = textWidth + 8;
    const badgeH = 6;

    // Badge background (lighter version)
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setGState(new doc.GState({ opacity: 0.12 }));
    doc.roundedRect(x, y - 4.5, badgeW, badgeH, 1.5, 1.5, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));

    // Badge text
    doc.setTextColor(...color);
    doc.text(statusText, x + 4, y);
};

/**
 * Export a single invoice as a professionally designed PDF.
 */
export function exportSingleInvoicePdf(invoice, clientName, projectName) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // ── Top accent bar ───────────────────────────────────
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // ── Header Section ───────────────────────────────────
    let y = 18;

    // Company name
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(COMPANY_NAME, margin, y);

    // Tagline
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text(COMPANY_TAGLINE, margin, y + 6);

    // INVOICE label (right)
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });

    // Invoice UID under INVOICE label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(invoice.invoice_uid || `INV-${invoice.id}`, pageWidth - margin, y + 7, { align: 'right' });

    y += 16;

    // Divider line
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // ── Two-column info section ──────────────────────────
    const colLeftX = margin;
    const colRightX = pageWidth / 2 + 10;

    // Left: Bill To
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textLight);
    doc.text('BILL TO', colLeftX, y);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(clientName || '—', colLeftX, y + 7);

    if (projectName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        doc.text(`Project: ${projectName}`, colLeftX, y + 13);
    }

    // Right: Invoice details in a card
    const cardX = colRightX;
    const cardW = pageWidth - margin - colRightX;
    const cardH = 30;
    drawRoundedRect(doc, cardX, y - 4, cardW, cardH, 3, COLORS.bgLight);

    // Draw card border
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, y - 4, cardW, cardH, 3, 3, 'S');

    const detailRows = [
        ['Issue Date', invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
        ['Due Date', invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
        ['Status', (invoice.status || 'draft')],
    ];

    detailRows.forEach(([label, value], i) => {
        const rowY = y + 2 + i * 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(label, cardX + 5, rowY);

        if (label === 'Status') {
            drawStatusBadge(doc, value, cardX + cardW / 2 + 2, rowY);
        } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.dark);
            doc.text(value, cardX + cardW / 2 + 2, rowY);
        }
    });

    y += 38;

    // ── Items Table ──────────────────────────────────────
    const items = invoice.items || [];
    const tableBody = items.map((item, i) => [
        String(i + 1),
        item.description || '',
        String(item.quantity || 0),
        fmt(item.unit_price),
        fmt(item.amount),
    ]);

    doc.autoTable({
        startY: y,
        head: [['#', 'Description', 'Qty', 'Unit Price', 'Amount']],
        body: tableBody.length > 0 ? tableBody : [['', 'No items', '', '', '']],
        theme: 'plain',
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
        },
        bodyStyles: {
            fontSize: 9,
            textColor: COLORS.text,
            cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
            lineColor: COLORS.border,
            lineWidth: 0.2,
        },
        alternateRowStyles: {
            fillColor: COLORS.bgLight,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 14 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'right', cellWidth: 32 },
            4: { halign: 'right', cellWidth: 32 },
        },
        margin: { left: margin, right: margin },
        tableLineColor: COLORS.border,
        tableLineWidth: 0.2,
    });

    // ── Totals Section ───────────────────────────────────
    y = doc.lastAutoTable.finalY + 8;
    const totalsBlockW = 85;
    const totalsX = pageWidth - margin - totalsBlockW;
    const totalsValX = pageWidth - margin;

    // Background card for totals
    const totalsRows = [
        ['Subtotal', fmt(invoice.subtotal)],
        [`Tax (${invoice.tax_rate || 0}%)`, fmt(invoice.tax_amount)],
        [`Discount (${invoice.discount_rate || 0}%)`, `- ${fmt(invoice.discount_amount)}`],
    ];

    drawRoundedRect(doc, totalsX - 5, y - 4, totalsBlockW + 5, totalsRows.length * 8 + 18, 3, COLORS.bgLight);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    totalsRows.forEach(([label, value], i) => {
        const rowY = y + i * 8;
        doc.text(label, totalsX, rowY);
        doc.setFont('helvetica', 'bold');
        doc.text(value, totalsValX, rowY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
    });

    // Total amount - prominent
    const totalY = y + totalsRows.length * 8 + 2;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.4);
    doc.line(totalsX - 2, totalY - 4, totalsValX, totalY - 4);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Total Amount', totalsX, totalY + 2);
    doc.text(fmt(invoice.total_amount || invoice.amount), totalsValX, totalY + 2, { align: 'right' });

    y = totalY + 14;

    // ── Notes Section ────────────────────────────────────
    if (invoice.notes) {
        // Notes card
        drawRoundedRect(doc, margin, y, contentWidth, 6, 2, COLORS.primaryLight);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.primaryDark);
        doc.text('Notes / Terms', margin + 5, y + 4);

        y += 10;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.text);
        const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 10);
        doc.text(noteLines, margin + 5, y);
        y += noteLines.length * 4 + 4;
    }

    // ── Footer ───────────────────────────────────────────
    // Bottom accent bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.white);
    doc.text(`${COMPANY_NAME}  |  ${COMPANY_EMAIL}  |  ${COMPANY_WEBSITE}`, pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Thank you message above footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 22, { align: 'center' });

    // Save
    const filename = `${invoice.invoice_uid || `Invoice_${invoice.id}`}.pdf`;
    doc.save(filename);
}

/**
 * Export a summary report of all invoices as a professionally designed PDF.
 */
export function exportAllInvoicesPdf(invoices, clients) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // ── Top accent bar ───────────────────────────────────
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // ── Header ───────────────────────────────────────────
    let y = 18;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(COMPANY_NAME, margin, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text(COMPANY_TAGLINE, margin, y + 6);

    // Report title (right)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('INVOICE REPORT', pageWidth - margin, y, { align: 'right' });

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin, y + 7, { align: 'right' });

    y += 16;

    // Divider
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // ── Summary Cards ────────────────────────────────────
    const totalAmount = invoices.reduce((s, inv) => s + parseFloat(inv.total_amount || inv.amount || 0), 0);
    const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, inv) => s + parseFloat(inv.total_amount || inv.amount || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    const summaryCards = [
        { label: 'Total Invoices', value: String(invoices.length), color: COLORS.primary },
        { label: 'Total Value', value: fmt(totalAmount), color: COLORS.dark },
        { label: 'Paid', value: fmt(paidAmount), color: COLORS.green },
        { label: 'Outstanding', value: fmt(pendingAmount), color: COLORS.red },
    ];

    const cardGap = 4;
    const cardW = (contentWidth - cardGap * 3) / 4;
    const cardH = 20;

    summaryCards.forEach((card, i) => {
        const cx = margin + i * (cardW + cardGap);

        // Card background
        drawRoundedRect(doc, cx, y, cardW, cardH, 3, COLORS.bgLight);

        // Card left accent stripe
        doc.setFillColor(...card.color);
        doc.roundedRect(cx, y, 2.5, cardH, 1.5, 1.5, 'F');

        // Label
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(card.label.toUpperCase(), cx + 7, y + 6);

        // Value
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...card.color);
        doc.text(card.value, cx + 7, y + 14);
    });

    y += cardH + 10;

    // ── Invoice Table ────────────────────────────────────
    const tableBody = invoices.map((inv) => {
        const client = clients.find(c => c.id === inv.client_id);
        return [
            inv.invoice_uid || `INV-${inv.id}`,
            client?.company_name || '—',
            fmt(inv.total_amount || inv.amount),
            (inv.status || 'draft').replace(/_/g, ' ').toUpperCase(),
            inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        ];
    });

    doc.autoTable({
        startY: y,
        head: [['Invoice ID', 'Client', 'Amount', 'Status', 'Issue Date', 'Due Date']],
        body: tableBody.length > 0 ? tableBody : [['No invoices found', '', '', '', '', '']],
        theme: 'plain',
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: COLORS.text,
            cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
            lineColor: COLORS.border,
            lineWidth: 0.2,
        },
        alternateRowStyles: {
            fillColor: COLORS.bgLight,
        },
        columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' },
            1: { cellWidth: 'auto' },
            2: { halign: 'right', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 28 },
            4: { halign: 'center', cellWidth: 28 },
            5: { halign: 'center', cellWidth: 28 },
        },
        margin: { left: margin, right: margin },
        tableLineColor: COLORS.border,
        tableLineWidth: 0.2,
        didParseCell: (data) => {
            // Color-code status cells
            if (data.section === 'body' && data.column.index === 3) {
                const statusRaw = invoices[data.row.index]?.status;
                const color = getStatusColor(statusRaw);
                data.cell.styles.textColor = color;
                data.cell.styles.fontStyle = 'bold';
            }
        },
    });

    // ── Status breakdown (below table) ───────────────────
    y = doc.lastAutoTable.finalY + 10;

    const statuses = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'];
    const statusCounts = statuses.map(s => ({
        status: s,
        count: invoices.filter(inv => inv.status === s).length,
    })).filter(s => s.count > 0);

    if (statusCounts.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.textLight);
        doc.text('STATUS BREAKDOWN:', margin, y);

        doc.setFont('helvetica', 'normal');
        const breakdownText = statusCounts.map(s =>
            `${s.status.replace(/_/g, ' ').toUpperCase()}: ${s.count}`
        ).join('    |    ');

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.text);
        doc.text(breakdownText, margin, y + 6);
    }

    // ── Footer ───────────────────────────────────────────
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.white);
    doc.text(`${COMPANY_NAME}  |  ${COMPANY_EMAIL}  |  ${COMPANY_WEBSITE}`, pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Page numbers for multi-page tables
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
    }

    const today = new Date().toISOString().split('T')[0];
    doc.save(`Invoices_Report_${today}.pdf`);
}
