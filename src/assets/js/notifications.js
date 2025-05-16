import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

export function showSuccess(message) {
    Toast.fire({
        icon: 'success',
        title: message
    });
}

export function showError(message) {
    Toast.fire({
        icon: 'error',
        title: message
    });
}

export function showWarning(message) {
    Toast.fire({
        icon: 'warning',
        title: message
    });
}

export function showInfo(message) {
    Toast.fire({
        icon: 'info',
        title: message
    });
}

export function showLoading(message = 'Loading...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

export function closeLoading() {
    Swal.close();
}

export async function confirmAction(title, text, icon = 'warning') {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    });

    return { isConfirmed: result.isConfirmed };
}

export async function showInvoiceSaved(invoiceNumber) {
    const result = await Swal.fire({
        icon: 'success',
        title: 'Invoice Saved Successfully!',
        text: `Invoice #${invoiceNumber} has been saved.`,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'View Invoice',
        cancelButtonText: 'Create Another'
    });

    return { isConfirmed: result.isConfirmed };
}

export async function showDownloadStarted() {
    Toast.fire({
        icon: 'info',
        title: 'Starting download...',
        timer: 2000
    });
}

export async function showPrintStarted() {
    Toast.fire({
        icon: 'info',
        title: 'Preparing to print...',
        timer: 2000
    });
}

export async function showDeleteConfirmation(invoiceNumber) {
    const result = await Swal.fire({
        title: 'Delete Invoice?',
        text: `Are you sure you want to delete invoice #${invoiceNumber}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it'
    });

    return { isConfirmed: result.isConfirmed };
}

export async function showFormValidationError(errors) {
    const errorList = errors.map(error => `• ${error}`).join('\n');
    
    await Swal.fire({
        title: 'Form Validation Error',
        html: `<div style="text-align: left;">${errorList.replace(/\n/g, '<br>')}</div>`,
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
    });
}

export async function showUnsavedChanges() {
    const result = await Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Do you want to save them before leaving?',
        icon: 'warning',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Save',
        denyButtonText: 'Don\'t save',
        cancelButtonText: 'Cancel'
    });

    return {
        isConfirmed: result.isConfirmed,
        isDenied: result.isDenied
    };
}