class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        if (this.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
            // Update SweetAlert2 theme
            document.querySelector('head').insertAdjacentHTML('beforeend', `
                <style id="swal2-dark-theme">
                    .swal2-popup {
                        background: var(--light-background) !important;
                        color: var(--text-color) !important;
                    }
                </style>
            `);
        }
        this.addThemeToggle();
    }

    addThemeToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `<i class="fas fa-${this.theme === 'light' ? 'moon' : 'sun'}"></i>`;
        
        toggle.addEventListener('click', () => this.toggleTheme());
        document.body.appendChild(toggle);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        
        const darkStyle = document.getElementById('swal2-dark-theme');
        
        if (this.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
            if (!darkStyle) {
                document.querySelector('head').insertAdjacentHTML('beforeend', `
                    <style id="swal2-dark-theme">
                        .swal2-popup {
                            background: var(--light-background) !important;
                            color: var(--text-color) !important;
                        }
                    </style>
                `);
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.classList.remove('dark');
            if (darkStyle) {
                darkStyle.remove();
            }
        }

        // Update toggle icon
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.innerHTML = `<i class="fas fa-${this.theme === 'light' ? 'moon' : 'sun'}"></i>`;
        }
    }

    getCurrentTheme() {
        return this.theme;
    }
}

export const themeManager = new ThemeManager();