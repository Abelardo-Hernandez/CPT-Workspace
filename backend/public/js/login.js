async function login() {
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('loginError');

    errorBox.textContent = '';

    if (!usuario || !password) {
        errorBox.textContent = 'Ingresa usuario y contraseña';
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorBox.textContent = data.message || 'Usuario o contraseña incorrectos';
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('rol', data.usuario.rol);
        localStorage.setItem('nombre', data.usuario.nombre);

        window.location.href = '/dashboard.html';

    } catch (error) {
        console.error(error);
        errorBox.textContent = 'Error de conexión con el servidor';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ['usuario', 'password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    });
});