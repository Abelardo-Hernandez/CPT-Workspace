const token = localStorage.getItem('token');
let usuariosCache = [];

if (!token) {
    window.location.href = '/login.html';
}

document.getElementById('fechaActual').textContent =
    new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

async function cargarAreas() {
    const res = await fetch('/api/areas', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const areas = await res.json();

    const selects = [
        document.getElementById('area_id'),
        document.getElementById('editar_area_id')
    ].filter(Boolean);

    selects.forEach(select => {
        select.innerHTML = '<option value="">Sin area</option>';
    });

    areas.forEach(area => {
        selects.forEach(select => {
            select.innerHTML += `
                <option value="${area.id}">
                    ${area.nombre}
                </option>
            `;
        });
    });
}

function abrirModalEditarUsuario(id) {
    const usuario = usuariosCache.find(u => Number(u.id) === Number(id));

    if (!usuario) {
        alert('Usuario no encontrado');
        return;
    }

    document.getElementById('editar_id').value = usuario.id;
    document.getElementById('editar_nombre').value = usuario.nombre || '';
    document.getElementById('editar_usuario').value = usuario.usuario || '';
    document.getElementById('editar_password').value = '';
    document.getElementById('editar_rol').value = usuario.rol || 'colaborador';
    document.getElementById('editar_area_id').value = usuario.area_id || '';
    document.getElementById('editar_activo').value = usuario.activo ? '1' : '0';

    const modal = document.getElementById('modalEditarUsuario');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalEditarUsuario() {
    const modal = document.getElementById('modalEditarUsuario');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

async function cargarUsuarios() {
    const res = await fetch('/api/usuarios', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const usuarios = await res.json();
    usuariosCache = usuarios;

    const tabla = document.getElementById('tablaUsuarios');
    tabla.innerHTML = '';

    if (!usuarios.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No hay usuarios registrados.
                </td>
            </tr>
        `;
        return;
    }

    usuarios.forEach(u => {
        tabla.innerHTML += `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.usuario}</td>
                <td>${textoRol(u.rol)}</td>
                <td>${u.area || '-'}</td>
                <td>${u.activo ? 'Si' : 'No'}</td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-primary btn-sm"
                        type="button"
                        onclick="abrirModalEditarUsuario(${u.id})">
                        <i class="bi bi-pencil-square"></i>
                        Editar
                    </button>
                </td>
            </tr>
        `;
    });
}

function textoRol(rol) {
    const textos = {
        administrador: 'Administrador',
        colaborador: 'Colaborador',
        consulta: 'Consulta'
    };

    return textos[rol] || rol;
}

function limpiarFormularioNuevo() {
    document.getElementById('nombre').value = '';
    document.getElementById('usuario').value = '';
    document.getElementById('password').value = '';
}

async function crearUsuario() {
    const body = {
        nombre: document.getElementById('nombre').value,
        usuario: document.getElementById('usuario').value,
        password: document.getElementById('password').value,
        rol: document.getElementById('rol').value,
        area_id: document.getElementById('area_id').value || null
    };

    const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    alert('Usuario creado');

    limpiarFormularioNuevo();
    cargarUsuarios();
}

async function actualizarUsuario() {
    const id = document.getElementById('editar_id').value;

    const body = {
        nombre: document.getElementById('editar_nombre').value,
        usuario: document.getElementById('editar_usuario').value,
        password: document.getElementById('editar_password').value,
        rol: document.getElementById('editar_rol').value,
        area_id: document.getElementById('editar_area_id').value || null,
        activo: document.getElementById('editar_activo').value === '1'
    };

    const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    alert('Usuario actualizado');
    cerrarModalEditarUsuario();
    cargarUsuarios();
}

async function eliminarUsuario() {
    const id = document.getElementById('editar_id').value;
    const nombre = document.getElementById('editar_nombre').value;

    const confirmado = confirm(`Eliminar el usuario "${nombre}"? El usuario quedara inactivo.`);

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    alert('Usuario eliminado');
    cerrarModalEditarUsuario();
    cargarUsuarios();
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        cerrarModalEditarUsuario();
    }
});

cargarAreas();
cargarUsuarios();
