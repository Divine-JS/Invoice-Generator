// Import required libraries
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { showSuccess, showError, showLoading, closeLoading, showDownloadStarted } from './notifications.js';

export async function generatePDF(invoiceData) {
    try {
        showLoading('Generating PDF...');
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        // Add company logo if available
        // if (invoiceData.company.logo) {
        //     doc.addImage(invoiceData.company.logo, 'PNG', margin, margin, 40, 40);
        // }
        
        // Header section
        doc.setFontSize(24);
        doc.setTextColor(41, 71, 155);
        doc.text('INVOICE', pageWidth - margin, 30, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - margin, 40, { align: 'right' });
        doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`, pageWidth - margin, 45, { align: 'right' });
        
        // Company information
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('From:', margin, 30);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const companyInfo = [
            invoiceData.company.name,
            invoiceData.company.email,
            invoiceData.company.address
        ];
        doc.text(companyInfo, margin, 40);
        
        // Client information
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Bill To:', margin, 70);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const clientInfo = [
            invoiceData.client.name,
            invoiceData.client.email,
            invoiceData.client.address
        ];
        doc.text(clientInfo, margin, 80);

        // Items table
        const tableStartY = 110;
        doc.autoTable({
            startY: tableStartY,
            head: [['Description', 'Quantity', 'Price', 'Total']],
            body: invoiceData.items.map(item => [
                item.description,
                item.quantity.toString(),
                formatCurrency(item.price),
                formatCurrency(item.total)
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 5
            },
            headStyles: {
                fillColor: [41, 71, 155],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'center' },
                2: { cellWidth: 40, halign: 'right' },
                3: { cellWidth: 40, halign: 'right' }
            },
            margin: { top: 20, right: margin, bottom: 20, left: margin }
        });

        // Calculate final Y position after table
        const finalY = doc.previousAutoTable.finalY || tableStartY;

        // Add totals
        const totalsX = pageWidth - 80;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        doc.text('Subtotal:', totalsX, finalY + 15);
        doc.text(formatCurrency(invoiceData.subtotal), pageWidth - margin, finalY + 15, { align: 'right' });
        
        doc.text('Tax:', totalsX, finalY + 25);
        doc.text(formatCurrency(invoiceData.tax), pageWidth - margin, finalY + 25, { align: 'right' });
        
        doc.setFontSize(12);
        doc.setTextColor(41, 71, 155);
        doc.text('Total:', totalsX, finalY + 35);
        doc.text(formatCurrency(invoiceData.total), pageWidth - margin, finalY + 35, { align: 'right' });

        // Add notes if present
        if (invoiceData.notes) {
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text('Notes:', margin, finalY + 50);
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            const splitNotes = doc.splitTextToSize(invoiceData.notes, pageWidth - (2 * margin));
            doc.text(splitNotes, margin, finalY + 60);
        }

        // Add footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' });

        showDownloadStarted();
        await doc.save(`invoice_${invoiceData.invoiceNumber}.pdf`);
        showSuccess('PDF downloaded successfully');
        
        return doc;
    } catch (error) {
        console.error('Error generating PDF:', error);
        showError('Failed to generate PDF. Please try again.');
        throw error;
    } finally {
        closeLoading();
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}