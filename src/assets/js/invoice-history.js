import { showSuccess, showError, showDeleteConfirmation } from './notifications.js';
import { generatePDF } from './pdfGenerator.js';
import { printInvoice } from './printer.js';

class InvoiceHistory {
    constructor() {
        this.invoices = [];
        this.currentFilter = 'all';
        this.modal = document.getElementById('previewModal');
        this.modalContent = document.getElementById('previewModalContent');
        this.currentZoom = 100;
        this.init();
    }

    async init() {
        this.loadInvoices();
        this.setupEventListeners();
        this.setupModalEvents();
        this.renderInvoices();
    }

    loadInvoices() {
        try {
            this.invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            // Sort invoices by date descending
            this.invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.invoices = [];
            showError('Failed to load invoices');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterInvoices(e.target.value));
        }

        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.closest('[data-filter]').dataset.filter;
                this.setFilter(filter);
            });
        });

        // Bulk actions
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.invoice-checkbox');
            checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
        });
    }

    setupModalEvents() {
        // Close modal when clicking the close button
        document.getElementById('closePreviewModal').addEventListener('click', () => {
            this.closePreviewModal();
        });

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closePreviewModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closePreviewModal();
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderInvoices();
    }

    filterInvoices(searchTerm) {
        if (!searchTerm) {
            this.renderInvoices();
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = this.invoices.filter(invoice => 
            invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
            invoice.client.name.toLowerCase().includes(searchLower) ||
            invoice.client.email.toLowerCase().includes(searchLower) ||
            invoice.total.toString().includes(searchLower)
        );

        this.renderInvoiceList(filtered);
    }

    getFilteredInvoices() {
        if (this.currentFilter === 'all') return this.invoices;
        return this.invoices.filter(invoice => invoice.status === this.currentFilter);
    }

    renderInvoices() {
        const filteredInvoices = this.getFilteredInvoices();
        this.renderInvoiceList(filteredInvoices);
        this.updateInvoiceCount(filteredInvoices.length);
    }

    renderInvoiceList(invoices) {
        const container = document.getElementById('invoiceList');
        if (!container) return;

        if (invoices.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        container.innerHTML = invoices.map((invoice, index) => 
            this.getInvoiceItemHTML(invoice, index)
        ).join('');

        this.attachInvoiceEventListeners();
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-file-invoice"></i>
                <h3>No invoices found</h3>
                <p>Create your first invoice to see it here</p>
                <button class="btn btn-primary" onclick="window.location.href='invoice.html'">
                    Create Invoice
                </button>
            </div>
        `;
    }

    getInvoiceItemHTML(invoice, index) {
        const date = new Date(invoice.date).toLocaleDateString();
        const total = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(invoice.total);

        return `
            <div class="invoice-item" data-id="${invoice.id}" style="--animation-order: ${index}">
                <div class="invoice-details">
                    <div class="invoice-header">
                        <h3>Invoice #${invoice.invoiceNumber}</h3>
                        <span class="status-badge ${invoice.status}">${invoice.status}</span>
                    </div>
                    <div class="invoice-info">
                        <p><i class="fas fa-user"></i> ${invoice.client.name}</p>
                        <p><i class="fas fa-dollar-sign"></i> ${total}</p>
                        <p><i class="fas fa-calendar"></i> ${date}</p>
                    </div>
                </div>
                <div class="invoice-actions">
                    <button class="btn-icon view-btn" title="View Invoice">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon download-btn" title="Download PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon print-btn" title="Print Invoice">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn-icon delete-btn" title="Delete Invoice">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachInvoiceEventListeners() {
        document.querySelectorAll('.invoice-item').forEach(item => {
            const id = item.dataset.id;
            const invoice = this.invoices.find(inv => inv.id === id);
            if (!invoice) return;

            item.querySelector('.view-btn')?.addEventListener('click', () => {
                this.viewInvoice(invoice);
            });

            item.querySelector('.download-btn')?.addEventListener('click', () => {
                this.downloadInvoice(invoice);
            });

            item.querySelector('.print-btn')?.addEventListener('click', () => {
                this.printInvoice(invoice);
            });

            item.querySelector('.delete-btn')?.addEventListener('click', () => {
                this.deleteInvoice(invoice);
            });
        });
    }

    viewInvoice(invoice) {
        const content = this.generateInvoiceHTML(invoice);
        this.modalContent.innerHTML = content;
        this.modal.classList.add('show');
        
        // Attach event listeners for preview actions
        const downloadBtn = this.modalContent.querySelector('.download-btn');
        const editBtn = this.modalContent.querySelector('.edit-btn');
        
        downloadBtn?.addEventListener('click', () => this.downloadInvoice(invoice));
        editBtn?.addEventListener('click', () => {
            window.location.href = `invoice.html?id=${invoice.id}&mode=edit`;
        });

        // Store current invoice for zoom functionality
        this.currentInvoice = invoice;
    }

    async downloadInvoice(invoice) {
        try {
            await generatePDF(invoice);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            showError('Failed to download invoice');
        }
    }

    async printInvoice(invoice) {
        try {
            const content = this.generateInvoiceHTML(invoice);
            await printInvoice(content);
        } catch (error) {
            console.error('Error printing invoice:', error);
            showError('Failed to print invoice');
        }
    }

    async deleteInvoice(invoice) {
        const { isConfirmed } = await showDeleteConfirmation(invoice.invoiceNumber);
        
        if (!isConfirmed) return;

        try {
            this.invoices = this.invoices.filter(inv => inv.id !== invoice.id);
            localStorage.setItem('invoices', JSON.stringify(this.invoices));
            showSuccess('Invoice deleted successfully');
            this.renderInvoices();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            showError('Failed to delete invoice');
        }
    }

    closePreviewModal() {
        this.modal.classList.remove('show');
    }

    updateInvoiceCount(count) {
        const countElement = document.querySelector('.invoice-count');
        if (countElement) {
            countElement.textContent = `${count} invoice${count !== 1 ? 's' : ''}`;
        }
    }

    generateInvoiceHTML(invoice) {
        const date = new Date(invoice.date).toLocaleDateString();
        const status = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
        
        return `
            <div class="invoice-preview" style="transform: scale(${this.currentZoom / 100})">
                <div class="invoice-preview-header">
                    <span class="preview-watermark">${status}</span>
                    <h1 class="invoice-title">INVOICE</h1>
                    <div class="invoice-meta">
                        <div class="invoice-meta-item">
                            <h4>Invoice Number</h4>
                            <p>#${invoice.invoiceNumber}</p>
                        </div>
                        <div class="invoice-meta-item">
                            <h4>Date</h4>
                            <p>${date}</p>
                        </div>
                        <div class="invoice-meta-item">
                            <h4>Status</h4>
                            <p><span class="status-badge ${invoice.status}">${status}</span></p>
                        </div>
                    </div>
                </div>

                <div class="invoice-preview-content">
                    <div class="invoice-parties">
                        <div class="party-details">
                            <h3>From</h3>
                            <p>${invoice.company.name}</p>
                            <p>${invoice.company.email}</p>
                            <p>${invoice.company.address}</p>
                        </div>
                        <div class="party-details">
                            <h3>Bill To</h3>
                            <p>${invoice.client.name}</p>
                            <p>${invoice.client.email}</p>
                            <p>${invoice.client.address}</p>
                        </div>
                    </div>

                    <table class="invoice-items-table">
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
                                    <td>$${item.price.toFixed(2)}</td>
                                    <td>$${item.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="invoice-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>$${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax:</span>
                            <span>$${invoice.tax.toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>$${invoice.total.toFixed(2)}</span>
                        </div>
                    </div>

                    ${invoice.notes ? `
                        <div class="invoice-notes">
                            <h3>Notes</h3>
                            <p>${invoice.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="preview-actions">
                <button class="btn btn-outline" onclick="window.print()">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-outline download-btn">
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <button class="btn btn-primary edit-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>

            <div class="zoom-controls">
                <button class="zoom-btn" onclick="window.invoiceHistory.zoom('out')">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="zoom-level">${this.currentZoom}%</span>
                <button class="zoom-btn" onclick="window.invoiceHistory.zoom('in')">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    }

    zoom(direction) {
        const MIN_ZOOM = 50;
        const MAX_ZOOM = 200;
        const STEP = 25;

        if (direction === 'in' && this.currentZoom < MAX_ZOOM) {
            this.currentZoom += STEP;
        } else if (direction === 'out' && this.currentZoom > MIN_ZOOM) {
            this.currentZoom -= STEP;
        }

        // Update zoom level display
        const zoomLevel = this.modalContent.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${this.currentZoom}%`;
        }

        // Update preview scale
        const preview = this.modalContent.querySelector('.invoice-preview');
        if (preview) {
            preview.style.transform = `scale(${this.currentZoom / 100})`;
        }
    }
}

// Make instance available globally for zoom controls
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceHistory = new InvoiceHistory();
});