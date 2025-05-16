import { initializeNavigation } from './navigation.js';
import { showSuccess, showError } from './notifications.js';
import { themeManager } from './themeManager.js';

export class SettingsManager {
    constructor() {
        this.currentSection = 'business';
        this.hasUnsavedChanges = false;
        this.initializeSettings();
        this.setupEventListeners();
        this.loadSavedSettings();
    }

    initializeSettings() {
        // Navigation elements
        this.settingsNav = document.querySelectorAll('.settings-nav-item');
        this.settingsSections = document.querySelectorAll('.settings-section');
        
        // Business profile elements
        this.saveButton = document.getElementById('saveSettings');
        this.uploadLogoButton = document.getElementById('uploadLogo');
        this.logoPreview = document.getElementById('logoPreview');
        this.businessLogoInput = document.getElementById('businessLogo');
        
        // Theme elements
        this.themeOptions = document.querySelectorAll('input[name="theme"]');
        this.accentColorPicker = document.getElementById('accentColor');
        this.colorPresets = document.querySelectorAll('.color-preset');
        this.fontSizeButtons = document.querySelectorAll('.font-size-selector button');
        
        // Payment terms elements
        this.paymentTermsSelect = document.getElementById('paymentTerms');
        this.customTermsGroup = document.getElementById('customTermsGroup');
        
        // Backup elements
        this.backupButton = document.getElementById('backupData');
        this.restoreButton = document.getElementById('restoreData');
        this.restoreFile = document.getElementById('restoreFile');
        
        // Modal elements
        this.unsavedChangesModal = document.getElementById('unsavedChangesModal');
        this.discardButton = document.getElementById('discardChanges');
        this.saveChangesButton = document.getElementById('saveChanges');
        this.closeModalButton = document.querySelector('.close-modal');

        // Set initial theme and font size
        const currentTheme = localStorage.getItem('theme') || 'system';
        const fontSize = localStorage.getItem('fontSize') || 'medium';
        
        document.querySelector(`input[name="theme"][value="${currentTheme}"]`)?.checked = true;
        document.querySelector(`.font-size-selector button[data-size="${fontSize}"]`)?.classList.add('active');
        document.documentElement.setAttribute('data-font-size', fontSize);
    }

    setupEventListeners() {
        // Section navigation with smooth transitions
        this.settingsNav.forEach(navItem => {
            navItem.addEventListener('click', (e) => {
                const sectionId = navItem.dataset.section;
                if (sectionId) {
                    this.switchSection(sectionId);
                }
            });
        });

        // Save settings with visual feedback
        if (this.saveButton) {
            this.saveButton.addEventListener('click', async () => {
                const originalText = this.saveButton.innerHTML;
                this.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                this.saveButton.disabled = true;

                try {
                    await this.saveSettings();
                    this.saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
                    setTimeout(() => {
                        this.saveButton.innerHTML = originalText;
                        this.saveButton.disabled = false;
                    }, 2000);
                } catch (error) {
                    this.saveButton.innerHTML = originalText;
                    this.saveButton.disabled = false;
                }
            });
        }

        // Logo upload with preview
        if (this.uploadLogoButton && this.businessLogoInput) {
            this.logoPreview?.addEventListener('click', () => this.businessLogoInput.click());
            this.uploadLogoButton.addEventListener('click', () => this.businessLogoInput.click());
            this.businessLogoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
        }

        // Theme changes with instant preview
        this.themeOptions.forEach(option => {
            option.addEventListener('change', () => {
                const theme = option.value;
                themeManager.setTheme(theme);
                this.hasUnsavedChanges = true;
            });
        });

        // Color presets
        this.colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                if (this.accentColorPicker) {
                    this.accentColorPicker.value = color;
                    themeManager.setAccentColor(color);
                    this.hasUnsavedChanges = true;
                }
                this.colorPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            });
        });

        // Font size selection
        this.fontSizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const size = button.dataset.size;
                this.fontSizeButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                document.documentElement.setAttribute('data-font-size', size);
                localStorage.setItem('fontSize', size);
                this.hasUnsavedChanges = true;
            });
        });

        // Payment terms handling
        if (this.paymentTermsSelect) {
            this.paymentTermsSelect.addEventListener('change', () => {
                this.customTermsGroup.style.display = 
                    this.paymentTermsSelect.value === 'custom' ? 'block' : 'none';
                this.hasUnsavedChanges = true;
            });
        }

        // Backup and restore functionality
        if (this.backupButton) {
            this.backupButton.addEventListener('click', () => this.handleBackup());
        }

        if (this.restoreButton && this.restoreFile) {
            this.restoreButton.addEventListener('click', () => this.restoreFile.click());
            this.restoreFile.addEventListener('change', (e) => this.handleRestore(e));
        }

        // Track changes
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('change', () => {
                this.hasUnsavedChanges = true;
            });
        });

        // Handle page navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Modal handling
        if (this.closeModalButton) {
            this.closeModalButton.addEventListener('click', () => {
                this.unsavedChangesModal.classList.remove('show');
            });
        }

        if (this.discardButton) {
            this.discardButton.addEventListener('click', () => {
                this.hasUnsavedChanges = false;
                this.unsavedChangesModal.classList.remove('show');
                this.loadSavedSettings();
            });
        }

        if (this.saveChangesButton) {
            this.saveChangesButton.addEventListener('click', async () => {
                await this.saveSettings();
                this.unsavedChangesModal.classList.remove('show');
            });
        }
    }

    switchSection(sectionId) {
        if (!sectionId) return;

        // Remove active class from all nav items and sections
        this.settingsNav.forEach(item => item.classList.remove('active'));
        this.settingsSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Add active class to selected nav item and section
        const selectedNav = document.querySelector(`.settings-nav-item[data-section="${sectionId}"]`);
        const selectedSection = document.getElementById(`${sectionId}-section`);

        if (selectedNav && selectedSection) {
            selectedNav.classList.add('active');
            selectedSection.style.display = 'block';
            // Trigger reflow
            selectedSection.offsetHeight;
            selectedSection.classList.add('active');
            this.currentSection = sectionId;

            // Scroll to top of section on mobile
            if (window.innerWidth <= 768) {
                selectedSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    async saveSettings() {
        try {
            const settings = {
                business: {
                    name: document.getElementById('businessName')?.value || '',
                    email: document.getElementById('businessEmail')?.value || '',
                    phone: document.getElementById('businessPhone')?.value || '',
                    address: document.getElementById('businessAddress')?.value || '',
                    logo: this.logoPreview?.src || ''
                },
                invoice: {
                    currency: document.getElementById('currency')?.value || 'USD',
                    taxRate: document.getElementById('taxRate')?.value || '0',
                    prefix: document.getElementById('invoicePrefix')?.value || '',
                    nextNumber: document.getElementById('nextInvoiceNumber')?.value || '1',
                    paymentTerms: this.paymentTermsSelect?.value === 'custom' 
                        ? document.getElementById('customTerms')?.value 
                        : this.paymentTermsSelect?.value || '30'
                },
                appearance: {
                    theme: document.querySelector('input[name="theme"]:checked')?.value || 'system',
                    accentColor: this.accentColorPicker?.value || '#2563eb',
                    fontSize: document.querySelector('.font-size-selector .active')?.dataset.size || 'medium'
                },
                notifications: {
                    email: document.getElementById('emailNotifications')?.checked || false,
                    reminders: document.getElementById('reminderNotifications')?.checked || false,
                    desktop: document.getElementById('desktopNotifications')?.checked || false,
                    reminderDays: Array.from(document.getElementById('reminderDays')?.selectedOptions || [])
                        .map(option => option.value)
                },
                backup: {
                    auto: document.getElementById('autoBackup')?.checked || false,
                    lastBackup: new Date().toISOString()
                }
            };

            localStorage.setItem('settings', JSON.stringify(settings));
            this.hasUnsavedChanges = false;
            showSuccess('Settings saved successfully');
        } catch (error) {
            console.error('Settings save error:', error);
            showError('Failed to save settings');
            throw error;
        }
    }

    loadSavedSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            
            // Business settings
            if (settings.business) {
                Object.entries(settings.business).forEach(([key, value]) => {
                    if (key === 'logo' && value && this.logoPreview) {
                        this.logoPreview.src = value;
                    } else {
                        const element = document.getElementById(`business${key.charAt(0).toUpperCase() + key.slice(1)}`);
                        if (element) element.value = value;
                    }
                });
            }

            // Invoice settings
            if (settings.invoice) {
                Object.entries(settings.invoice).forEach(([key, value]) => {
                    if (key === 'paymentTerms' && value === 'custom') {
                        this.paymentTermsSelect.value = 'custom';
                        this.customTermsGroup.style.display = 'block';
                        document.getElementById('customTerms').value = value;
                    } else {
                        const element = document.getElementById(key === 'nextNumber' ? 'nextInvoiceNumber' : key);
                        if (element) element.value = value;
                    }
                });
            }

            // Appearance settings
            if (settings.appearance) {
                if (settings.appearance.theme) {
                    const themeInput = document.querySelector(`input[name="theme"][value="${settings.appearance.theme}"]`);
                    if (themeInput) {
                        themeInput.checked = true;
                        themeManager.setTheme(settings.appearance.theme);
                    }
                }
                if (settings.appearance.accentColor && this.accentColorPicker) {
                    this.accentColorPicker.value = settings.appearance.accentColor;
                    themeManager.setAccentColor(settings.appearance.accentColor);
                    
                    // Update color preset selection
                    this.colorPresets.forEach(preset => {
                        preset.classList.toggle('active', 
                            preset.dataset.color === settings.appearance.accentColor);
                    });
                }
                if (settings.appearance.fontSize) {
                    this.fontSizeButtons.forEach(button => {
                        button.classList.toggle('active', 
                            button.dataset.size === settings.appearance.fontSize);
                    });
                    document.documentElement.setAttribute('data-font-size', settings.appearance.fontSize);
                }
            }

            // Notification settings
            if (settings.notifications) {
                const emailNotifs = document.getElementById('emailNotifications');
                const reminderNotifs = document.getElementById('reminderNotifications');
                const desktopNotifs = document.getElementById('desktopNotifications');
                const reminderDays = document.getElementById('reminderDays');
                
                if (emailNotifs) emailNotifs.checked = settings.notifications.email;
                if (reminderNotifs) reminderNotifs.checked = settings.notifications.reminders;
                if (desktopNotifs) desktopNotifs.checked = settings.notifications.desktop;
                
                if (reminderDays && settings.notifications.reminderDays) {
                    settings.notifications.reminderDays.forEach(day => {
                        const option = reminderDays.querySelector(`option[value="${day}"]`);
                        if (option) option.selected = true;
                    });
                }
            }

            // Backup settings
            if (settings.backup) {
                const autoBackup = document.getElementById('autoBackup');
                if (autoBackup) autoBackup.checked = settings.backup.auto;
            }

            this.hasUnsavedChanges = false;
        } catch (error) {
            console.error('Error loading settings:', error);
            showError('Failed to load settings');
        }
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showError('Image size should be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.logoPreview) {
                this.logoPreview.src = e.target.result;
                this.hasUnsavedChanges = true;
            }
        };
        reader.onerror = () => {
            showError('Error reading the image file');
        };
        reader.readAsDataURL(file);
    }

    handleBackup() {
        try {
            const settings = localStorage.getItem('settings');
            if (!settings) {
                showError('No settings to backup');
                return;
            }

            const blob = new Blob([settings], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showSuccess('Backup created successfully');
        } catch (error) {
            console.error('Backup error:', error);
            showError('Failed to create backup');
        }
    }

    async handleRestore(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const settings = JSON.parse(content);
            
            // Validate settings structure
            if (!settings.business || !settings.invoice || !settings.appearance) {
                throw new Error('Invalid settings file');
            }

            localStorage.setItem('settings', JSON.stringify(settings));
            this.loadSavedSettings();
            showSuccess('Settings restored successfully');
        } catch (error) {
            console.error('Restore error:', error);
            showError('Failed to restore settings: Invalid file format');
        }
    }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});