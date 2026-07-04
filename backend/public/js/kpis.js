const token = localStorage.getItem('token');
const rol = localStorage.getItem('rol');

if (!token) {
    window.location.href = '/login.html';
}

if (rol !== 'administrador') {
    window.location.href = '/dashboard.html';
}

async function cargarKpis() {
    const res = await fetch('/api/kpis', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const kpis = await res.json();

    const tabla = document.getElementById('tablaKpis');
    tabla.innerHTML = '';

    if (!kpis.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No hay KPI's registrados.
                </td>
            </tr>
        `;
        return;
    }

    kpis.forEach(kpi => {
        tabla.innerHTML += `
            <tr>
                <td>${kpi.nombre}</td>
                <td>${kpi.unidad || '-'}</td>
                <td>
                    ${
                        kpi.tipo_meta === 'mayor_es_mejor'
                        ? 'Mayor es mejor'
                        : 'Menor es mejor'
                    }
                </td>
                <td>${kpi.activo ? 'Si' : 'No'}</td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-danger btn-sm"
                        type="button"
                        onclick="eliminarKpi(${kpi.id}, '${kpi.nombre.replace(/'/g, "\\'")}')">
                        <i class="bi bi-trash3"></i>
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

async function crearKpi() {
    const body = {
        nombre: document.getElementById('nombre').value,
        unidad: document.getElementById('unidad').value || '%',
        tipo_meta: document.getElementById('tipo_meta').value
    };

    const res = await fetch('/api/kpis', {
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

    alert('KPI creado');

    document.getElementById('nombre').value = '';
    document.getElementById('unidad').value = '';

    cargarKpis();
}

async function eliminarKpi(id, nombre) {
    const confirmado = confirm(`Eliminar el KPI "${nombre}"?`);

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/kpis/${id}`, {
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

    alert('KPI eliminado');
    cargarKpis();
}

cargarKpis();
