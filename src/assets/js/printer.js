import { showSuccess, showError, showPrintStarted, confirmAction } from './notifications.js';

export async function printInvoice(content) {
    try {
        const { isConfirmed } = await confirmAction(
            'Print Invoice',
            'Are you sure you want to print this invoice?',
            'question'
        );

        if (!isConfirmed) return;

        showPrintStarted();

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Invoice</title>
                    <meta charset="UTF-8">
                    <style>
                        @media print {
                            @page {
                                size: A4;
                                margin: 1.5cm;
                            }
                            
                            body {
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                                margin: 0;
                                padding: 0;
                                font-size: 12pt;
                                line-height: 1.4;
                            }

                            .no-print {
                                display: none !important;
                            }

                            /* Ensure crisp text and images */
                            * {
                                -webkit-font-smoothing: antialiased;
                                -moz-osx-font-smoothing: grayscale;
                            }

                            /* Page break control */
                            .invoice-header,
                            .company-details,
                            .client-details,
                            .items-table thead,
                            .invoice-totals,
                            .invoice-notes,
                            .invoice-footer {
                                page-break-inside: avoid;
                            }

                            .items-table tr {
                                page-break-inside: avoid;
                            }

                            .items-table {
                                page-break-before: auto;
                            }
                        }

                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            padding: 20px;
                            background: white;
                        }
                        
                        .invoice-content {
                            max-width: 21cm;
                            margin: 0 auto;
                            background: white;
                        }
                        
                        .invoice-header {
                            display: grid;
                            grid-template-columns: 2fr 1fr;
                            gap: 2cm;
                            border-bottom: 2px solid #294B9B;
                            padding-bottom: 1cm;
                            margin-bottom: 1cm;
                        }

                        .company-logo {
                            max-height: 70px;
                            width: auto;
                        }
                        
                        .invoice-header h1 {
                            color: #294B9B;
                            margin: 0;
                            font-size: 2.5em;
                            text-transform: uppercase;
                        }

                        .invoice-info {
                            text-align: right;
                            font-size: 0.9em;
                        }

                        .invoice-info div {
                            margin: 0.3cm 0;
                        }
                        
                        .company-details,
                        .client-details {
                            margin-bottom: 1cm;
                        }

                        .company-details h2,
                        .client-details h2 {
                            color: #294B9B;
                            font-size: 1.2em;
                            margin: 0 0 0.5cm;
                            padding-bottom: 0.2cm;
                            border-bottom: 1px solid #eee;
                        }

                        .details-content {
                            font-size: 0.9em;
                            line-height: 1.5;
                        }

                        .details-content strong {
                            display: block;
                            margin-bottom: 0.2cm;
                        }
                        
                        .items-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 1cm 0;
                        }
                        
                        .items-table th {
                            background-color: #294B9B !important;
                            color: white !important;
                            padding: 0.3cm;
                            text-align: left;
                            font-size: 0.9em;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .items-table td {
                            padding: 0.3cm;
                            border-bottom: 1px solid #eee;
                            font-size: 0.9em;
                        }

                        .items-table tr:nth-child(even) {
                            background-color: #f9f9f9;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .invoice-totals {
                            margin-left: auto;
                            width: 8cm;
                            margin-top: 1cm;
                        }
                        
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 0.2cm 0;
                            font-size: 0.9em;
                        }
                        
                        .total-row.total {
                            font-weight: bold;
                            color: #294B9B;
                            font-size: 1.1em;
                            border-top: 2px solid #294B9B;
                            margin-top: 0.3cm;
                            padding-top: 0.3cm;
                        }
                        
                        .invoice-notes {
                            margin-top: 1cm;
                            padding-top: 0.5cm;
                            border-top: 1px solid #eee;
                            font-size: 0.9em;
                            color: #666;
                        }

                        .invoice-notes h2 {
                            color: #294B9B;
                            font-size: 1.1em;
                            margin: 0 0 0.3cm;
                        }

                        .invoice-footer {
                            margin-top: 2cm;
                            text-align: center;
                            font-size: 0.8em;
                            color: #666;
                            padding-top: 0.5cm;
                            border-top: 1px solid #eee;
                        }

                        .footer-content p {
                            margin: 0.2cm 0;
                        }

                        .print-header {
                            padding: 15px;
                            background: #f8f9fa;
                            margin-bottom: 20px;
                            text-align: center;
                            border-radius: 8px;
                        }

                        .print-header button {
                            padding: 10px 20px;
                            background: #294B9B;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 0 10px;
                            font-size: 14px;
                            transition: background 0.2s;
                        }

                        .print-header button:hover {
                            background: #1a3366;
                        }

                        @media print {
                            .print-header {
                                display: none;
                            }

                            /* Ensure white background */
                            body, .invoice-content {
                                background: white !important;
                            }

                            /* Improve table header contrast */
                            .items-table th {
                                background-color: #294B9B !important;
                                color: white !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header no-print">
                        <button onclick="window.print()">Print Invoice</button>
                        <button onclick="window.close()">Close</button>
                    </div>
                    ${content}
                </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for resources to load
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
                showSuccess('Print job sent successfully');
            } catch (error) {
                console.error('Print error:', error);
                showError('Failed to print. Please try again.');
            }
        }, 500);

    } catch (error) {
        console.error('Print setup error:', error);
        showError(error.message || 'Failed to setup print. Please try again.');
    }
}