const auth = {
    token: localStorage.getItem('token'),
    rol: localStorage.getItem('rol'),
    nombre: localStorage.getItem('nombre'),

    verificarSesion() {
        if (!this.token) {
            window.location.href = '/login.html';
        }
    },

    verificarRol(rolesPermitidos) {
        this.verificarSesion();

        if (!rolesPermitidos.includes(this.rol)) {
            window.location.href = '/dashboard.html';
        }
    },

    headers() {
        return {
            Authorization: `Bearer ${this.token}`
        };
    },

    headersJson() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
        };
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('nombre');

        window.location.href = '/login.html';
    }
};

function logout() {
    auth.logout();
}