import { generatePDF } from './pdfGenerator.js';
import { showSuccess, showError, showDeleteConfirmation, showFormValidationError, showInvoiceSaved, showUnsavedChanges } from './notifications.js';
import { printInvoice } from './printer.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let items = [];
    let nextInvoiceNumber = generateInvoiceNumber();
    let hasUnsavedChanges = false;

    // Initialize form elements
    const invoiceForm = document.getElementById('invoice-form');
    const addItemButton = document.getElementById('add-item');
    const itemsContainer = document.getElementById('items-container');
    const subtotalElement = document.getElementById('subtotal');
    const saveInvoiceButton = document.getElementById('save-invoice');
    const downloadPdfButton = document.getElementById('download-pdf');
    const printInvoiceButton = document.getElementById('print-invoice');
    const cancelButton = document.getElementById('cancel');
    const saveDraftButton = document.getElementById('save-draft');

    // Set initial values
    document.getElementById('invoice-number').value = nextInvoiceNumber;
    document.getElementById('invoice-date').valueAsDate = new Date();
    
    // Set default due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('due-date').valueAsDate = dueDate;

    // Track form changes
    invoiceForm.addEventListener('input', () => {
        hasUnsavedChanges = true;
    });

    // Create a new item row
    function createItemRow() {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <textarea class="item-description" placeholder="Enter item description" required></textarea>
            <input type="number" class="item-quantity" value="1" min="1" required>
            <input type="number" class="item-price" value="0.00" min="0" step="0.01" required>
            <span class="item-total">$0.00</span>
            <button type="button" class="btn-icon delete-item" title="Delete Item">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Add event listeners for the new row
        const quantityInput = row.querySelector('.item-quantity');
        const priceInput = row.querySelector('.item-price');
        const descriptionInput = row.querySelector('.item-description');

        // Auto-resize textarea
        descriptionInput.addEventListener('input', () => {
            descriptionInput.style.height = 'auto';
            descriptionInput.style.height = descriptionInput.scrollHeight + 'px';
        });

        // Handle keyboard navigation
        descriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                quantityInput.focus();
            }
        });

        quantityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                descriptionInput.focus();
            }
        });

        [quantityInput, priceInput, descriptionInput].forEach(input => {
            input.addEventListener('input', () => {
                hasUnsavedChanges = true;
                updateItemTotal(row);
                recalculateTotals();
            });
        });

        // Initialize textarea height
        setTimeout(() => {
            descriptionInput.style.height = 'auto';
            descriptionInput.style.height = descriptionInput.scrollHeight + 'px';
        }, 0);

        return row;
    }

    // Add Item button click handler
    addItemButton.addEventListener('click', () => {
        const itemRow = createItemRow();
        itemsContainer.appendChild(itemRow);
        updateItemRowAnimations();
        recalculateTotals();
        
        // Focus on the new item's description field
        const descriptionInput = itemRow.querySelector('.item-description');
        descriptionInput.focus();
        
        // Smooth scroll to new item
        itemRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
        
        hasUnsavedChanges = true;
    });

    // Handle item deletion
    itemsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.delete-item')) {
            const row = e.target.closest('.item-row');
            row.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                row.remove();
                updateItemRowAnimations();
                recalculateTotals();
                hasUnsavedChanges = true;
            }, 300);
        }
    });

    // Save Invoice
    saveInvoiceButton.addEventListener('click', async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            await showFormValidationError(validationErrors);
            return;
        }

        try {
            const invoiceData = collectFormData();
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            invoices.push(invoiceData);
            localStorage.setItem('invoices', JSON.stringify(invoices));
            
            const { isConfirmed } = await showInvoiceSaved(invoiceData.invoiceNumber);
            hasUnsavedChanges = false;

            if (isConfirmed) {
                window.location.href = `invoice-history.html`;
            } else {
                clearAllFields();
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            showError('Failed to save invoice. Please try again.');
        }
    });

    // Save as Draft
    saveDraftButton.addEventListener('click', async () => {
        try {
            const invoiceData = collectFormData();
            invoiceData.status = 'draft';
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            invoices.push(invoiceData);
            localStorage.setItem('invoices', JSON.stringify(invoices));
            
            showSuccess('Draft saved successfully');
            hasUnsavedChanges = false;
        } catch (error) {
            console.error('Error saving draft:', error);
            showError('Failed to save draft. Please try again.');
        }
    });

    // Download PDF
    downloadPdfButton.addEventListener('click', async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            await showFormValidationError(validationErrors);
            return;
        }

        try {
            const invoiceData = collectFormData();
            await generatePDF(invoiceData);
        } catch (error) {
            console.error('Error generating PDF:', error);
            showError('Failed to generate PDF. Please try again.');
        }
    });

    // Print Invoice
    printInvoiceButton.addEventListener('click', async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            await showFormValidationError(validationErrors);
            return;
        }

        const invoiceData = collectFormData();
        const invoiceContent = generateInvoiceHTML(invoiceData);
        await printInvoice(invoiceContent);
    });

    // Cancel button
    cancelButton.addEventListener('click', async () => {
        if (hasUnsavedChanges) {
            const result = await showUnsavedChanges();
            if (result.isConfirmed) {
                // Save changes
                await saveInvoiceButton.click();
            } else if (result.isDenied) {
                // Don't save changes
                window.location.href = 'dashboard.html';
            }
            // If cancelled, stay on page
        } else {
            window.location.href = 'dashboard.html';
        }
    });

    // Clear all fields
    function clearAllFields() {
        // Clear company info
        document.getElementById('company-name').value = '';
        document.getElementById('company-email').value = '';
        document.getElementById('company-address').value = '';
        
        // Clear client info
        document.getElementById('client-name').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-address').value = '';
        
        // Clear items
        itemsContainer.innerHTML = '';
        
        // Clear notes
        document.getElementById('notes').value = '';
        
        // Reset total
        subtotalElement.textContent = '$0.00';
        
        // Generate new invoice number
        nextInvoiceNumber = generateInvoiceNumber();
        document.getElementById('invoice-number').value = nextInvoiceNumber;
        
        // Reset dates
        document.getElementById('invoice-date').valueAsDate = new Date();
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 30);
        document.getElementById('due-date').valueAsDate = newDueDate;
        
        // Add one empty item row
        addItemButton.click();
        
        hasUnsavedChanges = false;
    }

    // Clear all button
    const clearAllButton = document.getElementById('clear-all');
    clearAllButton?.addEventListener('click', async () => {
        const { isConfirmed } = await showDeleteConfirmation('all fields');
        
        if (isConfirmed) {
            clearAllFields();
            showSuccess('All fields have been cleared');
        }
    });

    // Helper Functions
    function updateItemRowAnimations() {
        const itemRows = document.querySelectorAll('.item-row');
        itemRows.forEach((row, index) => {
            row.style.setProperty('--animation-order', index);
        });
    }

    function updateItemTotal(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        row.querySelector('.item-total').textContent = formatCurrency(total);
    }

    function recalculateTotals() {
        const itemRows = document.querySelectorAll('.item-row');
        let subtotal = 0;

        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            subtotal += quantity * price;
        });

        subtotalElement.textContent = formatCurrency(subtotal);
    }

    function validateForm() {
        const errors = [];
        
        // Check required fields
        const requiredFields = [
            { id: 'company-name', label: 'Company Name' },
            { id: 'company-email', label: 'Company Email' },
            { id: 'company-address', label: 'Company Address' },
            { id: 'client-name', label: 'Client Name' },
            { id: 'client-email', label: 'Client Email' },
            { id: 'client-address', label: 'Client Address' }
        ];
        
        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                errors.push(`${field.label} is required`);
            }
        }

        // Check items
        const items = document.querySelectorAll('.item-row');
        if (items.length === 0) {
            errors.push('At least one item is required');
        } else {
            items.forEach((item, index) => {
                const description = item.querySelector('.item-description').value;
                const quantity = item.querySelector('.item-quantity').value;
                const price = item.querySelector('.item-price').value;
                
                if (!description.trim()) {
                    errors.push(`Item ${index + 1} description is required`);
                }
                if (!quantity || quantity < 1) {
                    errors.push(`Item ${index + 1} quantity must be at least 1`);
                }
                if (!price || price < 0) {
                    errors.push(`Item ${index + 1} price must be greater than or equal to 0`);
                }
            });
        }

        return errors;
    }

    function collectFormData() {
        const invoiceData = {
            id: crypto.randomUUID(),
            invoiceNumber: nextInvoiceNumber,
            date: document.getElementById('invoice-date').value,
            dueDate: document.getElementById('due-date').value,
            status: 'pending',
            company: {
                name: document.getElementById('company-name').value,
                email: document.getElementById('company-email').value,
                address: document.getElementById('company-address').value
            },
            client: {
                name: document.getElementById('client-name').value,
                email: document.getElementById('client-email').value,
                address: document.getElementById('client-address').value
            },
            items: Array.from(document.querySelectorAll('.item-row')).map(row => ({
                description: row.querySelector('.item-description').value,
                quantity: parseFloat(row.querySelector('.item-quantity').value),
                price: parseFloat(row.querySelector('.item-price').value),
                total: parseFloat(row.querySelector('.item-total').textContent.replace(/[^0-9.-]+/g, ''))
            })),
            subtotal: parseFloat(subtotalElement.textContent.replace(/[^0-9.-]+/g, '')),
            total: parseFloat(subtotalElement.textContent.replace(/[^0-9.-]+/g, '')),
            notes: document.getElementById('notes').value
        };
        return invoiceData;
    }

    function generateInvoiceNumber() {
        const prefix = 'INV';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function generateInvoiceHTML(invoice) {
        const date = new Date(invoice.date).toLocaleDateString();
        const dueDate = new Date(invoice.dueDate).toLocaleDateString();
        
        return `
            <div class="invoice-content">
                <div class="invoice-header">
                    <h1>INVOICE</h1>
                    <div class="invoice-info">
                        <div>
                            <strong>Invoice #:</strong> ${invoice.invoiceNumber}
                        </div>
                        <div>
                            <strong>Date:</strong> ${date}
                        </div>
                        <div>
                            <strong>Due Date:</strong> ${dueDate}
                        </div>
                    </div>
                </div>

                <div class="company-details">
                    <h2>From</h2>
                    <div class="details-content">
                        <strong>${invoice.company.name}</strong>
                        <div>${invoice.company.email}</div>
                        <div>${invoice.company.address.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>

                <div class="client-details">
                    <h2>Bill To</h2>
                    <div class="details-content">
                        <strong>${invoice.client.name}</strong>
                        <div>${invoice.client.email}</div>
                        <div>${invoice.client.address.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>

                <div class="items-section">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.price)}</td>
                                    <td>${formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="invoice-totals">
                    <div class="total-row total">
                        <span>Total</span>
                        <span>${formatCurrency(invoice.subtotal)}</span>
                    </div>
                </div>

                ${invoice.notes ? `
                    <div class="invoice-notes">
                        <h2>Notes</h2>
                        <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
                    </div>
                ` : ''}

                <div class="invoice-footer">
                    <div class="footer-content">
                        <p>Thank you for your business!</p>
                        <small>This invoice was generated using Invoice Generator</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialize with one empty item row
    addItemButton.click();

    // Handle beforeunload event
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});