import { showSuccess, showError, confirmAction, showLoading, closeLoading } from './notifications.js';

// Initialize dashboard state
const state = {
    invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
    settings: JSON.parse(localStorage.getItem('settings') || '{}'),
    currentView: 'overview'
};

// View Management
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const historySection = document.getElementById('history-section');

function showView(viewId) {
    // First hide all content sections
    tabContents.forEach(content => content.classList.remove('active'));
    historySection.style.display = 'none';

    // Update button states
    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.tab === viewId) {
            button.classList.add('active');
        }
    });

    // Show the selected view
    if (viewId === 'history') {
        historySection.style.display = 'block';
        loadInvoiceHistory();
        showSuccess('Showing invoice history');
    } else {
        const targetContent = document.getElementById(viewId);
        if (targetContent) {
            targetContent.classList.add('active');
            if (viewId === 'settings') {
                loadSettings();
                showSuccess('Settings loaded');
            }
        }
    }

    state.currentView = viewId;
}

// Tab click handlers
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        showView(button.dataset.tab);
    });
});

// Handle sidebar navigation
document.querySelector('.sidebar-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem && navItem.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const viewId = navItem.getAttribute('href').substring(1);
        showView(viewId);
    }
});

// History Tab Functions
function loadInvoiceHistory() {
    const historyContainer = document.getElementById('invoiceHistory');
    historyContainer.innerHTML = '';

    if (state.invoices.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice"></i>
                <h3>No Invoices Yet</h3>
                <p>Create your first invoice to see it here</p>
                <button class="btn btn-primary" onclick="window.location.href='invoice.html'">
                    Create Invoice
                </button>
            </div>
        `;
        return;
    }

    state.invoices.forEach(invoice => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>${invoice.invoiceNumber}</div>
            <div>${invoice.client.name}</div>
            <div>$${invoice.total.toFixed(2)}</div>
            <div>${new Date(invoice.date).toLocaleDateString()}</div>
            <div class="actions">
                <button class="btn-icon preview-btn" data-id="${invoice.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon edit-btn" data-id="${invoice.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-btn" data-id="${invoice.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        historyContainer.appendChild(historyItem);
    });

    // Add event listeners for actions
    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', () => previewInvoice(btn.dataset.id));
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editInvoice(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteInvoice(btn.dataset.id));
    });
}

// Invoice Actions
function previewInvoice(id) {
    const invoice = state.invoices.find(inv => inv.id === id);
    if (!invoice) return;

    window.location.href = `invoice.html?id=${id}&mode=preview`;
}

function editInvoice(id) {
    window.location.href = `invoice.html?id=${id}&mode=edit`;
}

async function deleteInvoice(id) {
    const { isConfirmed } = await confirmAction(
        'Delete Invoice',
        'Are you sure you want to delete this invoice?',
        'warning'
    );

    if (!isConfirmed) return;

    try {
        state.invoices = state.invoices.filter(inv => inv.id !== id);
        localStorage.setItem('invoices', JSON.stringify(state.invoices));
        loadInvoiceHistory();
        updateDashboardStats();
        showSuccess('Invoice deleted successfully');
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showError('Failed to delete invoice');
    }
}

// Settings Management
const settingsForm = {
    businessName: document.getElementById('businessName'),
    businessAddress: document.getElementById('businessAddress'),
    businessEmail: document.getElementById('businessEmail'),
    currency: document.getElementById('currency'),
    taxRate: document.getElementById('taxRate'),
    theme: document.getElementById('theme')
};

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    Object.entries(settings).forEach(([key, value]) => {
        if (settingsForm[key]) {
            settingsForm[key].value = value;
        }
    });
}

async function saveSettings() {
    try {
        const settings = {};
        Object.entries(settingsForm).forEach(([key, input]) => {
            settings[key] = input.value;
        });
        
        localStorage.setItem('settings', JSON.stringify(settings));
        showSuccess('Settings saved successfully');
    } catch (error) {
        console.error('Settings save error:', error);
        showError('Failed to save settings');
    }
}

document.getElementById('saveSettings').addEventListener('click', saveSettings);

// Dashboard Stats
function updateDashboardStats() {
    const totalInvoices = state.invoices.length;
    const totalAmount = state.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const pendingInvoices = state.invoices.filter(inv => inv.status === 'pending').length;

    document.getElementById('totalInvoices').textContent = totalInvoices;
    document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;
    document.getElementById('pendingInvoices').textContent = pendingInvoices;
}

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
}

// Initialize
function loadDashboard() {
    showLoading('Loading dashboard...');
    
    try {
        // Check if there's a hash in the URL
        const hash = window.location.hash.substring(1);
        const initialView = hash || 'overview';
        
        setTimeout(() => {
            loadSettings();
            updateDashboardStats();
            showView(initialView);
            closeLoading();
        }, 1000);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard');
        closeLoading();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);

// Handle URL hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showView(hash);
    }
});