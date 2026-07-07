const token = localStorage.getItem('token');
let proyectosCache = [];

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
        select.innerHTML = '<option value="">Selecciona area</option>';
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

async function cargarUsuarios() {
    const res = await fetch('/api/usuarios', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const usuarios = await res.json();

    const selects = [
        document.getElementById('responsable_usuario_id'),
        document.getElementById('editar_responsable_usuario_id')
    ].filter(Boolean);

    selects.forEach(select => {
        select.innerHTML = '<option value="">Responsable</option>';
    });

    usuarios.forEach(usuario => {
        selects.forEach(select => {
            select.innerHTML += `
                <option value="${usuario.id}">
                    ${usuario.nombre}
                </option>
            `;
        });
    });
}

function abrirModalProyecto() {
    const modal = document.getElementById('modalProyecto');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalProyecto() {
    const modal = document.getElementById('modalProyecto');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function abrirModalEditarProyecto(id) {
    const proyecto = proyectosCache.find(p => Number(p.id) === Number(id));

    if (!proyecto) {
        alert('Proyecto no encontrado');
        return;
    }

    document.getElementById('editar_id').value = proyecto.id;
    document.getElementById('editar_nombre').value = proyecto.nombre || '';
    document.getElementById('editar_area_id').value = proyecto.area_id || '';
    document.getElementById('editar_responsable_usuario_id').value = proyecto.responsable_usuario_id || '';
    document.getElementById('editar_objetivo').value = proyecto.objetivo || '';
    document.getElementById('editar_fecha_inicio').value = valorFechaInput(proyecto.fecha_inicio);
    document.getElementById('editar_fecha_objetivo').value = valorFechaInput(proyecto.fecha_objetivo);

    const modal = document.getElementById('modalEditarProyecto');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalEditarProyecto() {
    const modal = document.getElementById('modalEditarProyecto');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function valorFechaInput(fecha) {
    if (!fecha) return '';

    const partesFecha = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (partesFecha) {
        return `${partesFecha[1]}-${partesFecha[2]}-${partesFecha[3]}`;
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
}

function badgeProyecto(estatus) {
    return badgeBootstrap(
        textoEstatus(estatus),
        colorEstatus(estatus)
    );
}

async function cargarProyectos() {
    const res = await fetch('/api/proyectos', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const proyectos = await res.json();
    proyectosCache = proyectos;

    const tabla = document.getElementById('tablaProyectos');
    tabla.innerHTML = '';

    if (!proyectos.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    No hay proyectos registrados.
                </td>
            </tr>
        `;
        return;
    }

    proyectos.forEach(p => {
        tabla.innerHTML += `
            <tr>
                <td>
                    <strong>${p.nombre}</strong>
                </td>

                <td>${p.area}</td>

                <td>${p.responsable || 'Sin asignar'}</td>

                <td>${formatearFecha(p.fecha_inicio)}</td>

                <td>${formatearFecha(p.fecha_objetivo)}</td>

                <td>${badgeProyecto(p.estatus)}</td>

                <td class="text-center">
                    <button
                        class="btn btn-outline-primary btn-sm"
                        type="button"
                        onclick="abrirModalEditarProyecto(${p.id})">
                        <i class="bi bi-pencil-square"></i>
                        Editar
                    </button>
                </td>

                <td class="text-center">
                    <a
                        href="proyecto-detalle.html?id=${p.id}"
                        class="btn btn-primary btn-sm">
                        <i class="bi bi-box-arrow-up-right"></i>
                        Abrir
                    </a>
                </td>
            </tr>
        `;
    });
}

function limpiarFormularioNuevo() {
    document.getElementById('nombre').value = '';
    document.getElementById('objetivo').value = '';
    document.getElementById('fecha_inicio').value = '';
    document.getElementById('fecha_objetivo').value = '';
}

async function crearProyecto() {
    const body = {
        nombre: document.getElementById('nombre').value,
        area_id: document.getElementById('area_id').value,
        responsable_usuario_id: document.getElementById('responsable_usuario_id').value,
        objetivo: document.getElementById('objetivo').value,
        fecha_inicio: document.getElementById('fecha_inicio').value,
        fecha_objetivo: document.getElementById('fecha_objetivo').value
    };

    const res = await fetch('/api/proyectos', {
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

    alert('Proyecto creado');

    limpiarFormularioNuevo();
    cerrarModalProyecto();
    cargarProyectos();
}

async function actualizarProyecto() {
    const id = document.getElementById('editar_id').value;

    const body = {
        nombre: document.getElementById('editar_nombre').value,
        area_id: document.getElementById('editar_area_id').value,
        responsable_usuario_id: document.getElementById('editar_responsable_usuario_id').value,
        objetivo: document.getElementById('editar_objetivo').value,
        fecha_inicio: document.getElementById('editar_fecha_inicio').value,
        fecha_objetivo: document.getElementById('editar_fecha_objetivo').value
    };

    const res = await fetch(`/api/proyectos/${id}`, {
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

    alert('Proyecto actualizado');
    cerrarModalEditarProyecto();
    cargarProyectos();
}

async function eliminarProyecto() {
    const id = document.getElementById('editar_id').value;
    const nombre = document.getElementById('editar_nombre').value;

    const confirmado = await confirmar(`Eliminar el proyecto "${nombre}"? Esta accion no se puede deshacer desde esta pantalla.`);

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/proyectos/${id}`, {
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

    alert('Proyecto eliminado');
    cerrarModalEditarProyecto();
    cargarProyectos();
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        cerrarModalProyecto();
        cerrarModalEditarProyecto();
    }
});

cargarAreas();
cargarUsuarios();
cargarProyectos();
