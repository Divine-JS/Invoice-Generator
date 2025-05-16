import { showLoading, closeLoading } from './notifications.js';

const loadingManager = {
    show: function(message = 'Loading...') {
        showLoading(message);
    },

    hide: function() {
        closeLoading();
    },

    updateMessage: function(message) {
        const loadingPopup = document.querySelector('.swal2-container');
        if (loadingPopup) {
            const titleEl = loadingPopup.querySelector('.swal2-title');
            if (titleEl) {
                titleEl.textContent = message;
            }
        }
    }
};

export default loadingManager;