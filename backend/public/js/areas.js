const token = localStorage.getItem('token');

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
    const response = await fetch('/api/areas', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const areas = await response.json();

    const tabla = document.getElementById('tablaAreas');
    tabla.innerHTML = '';

    if (!areas.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-4">
                    No hay areas registradas.
                </td>
            </tr>
        `;
        return;
    }

    areas.forEach(area => {
        tabla.innerHTML += `
            <tr>
                <td>${area.id}</td>
                <td>${area.nombre}</td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-danger btn-sm"
                        type="button"
                        onclick="eliminarArea(${area.id}, '${area.nombre.replace(/'/g, "\\'")}')">
                        <i class="bi bi-trash3"></i>
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

async function crearArea() {
    const nombre = document.getElementById('nombreArea').value;

    const res = await fetch('/api/areas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nombre })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    document.getElementById('nombreArea').value = '';
    cargarAreas();
}

async function eliminarArea(id, nombre) {
    const confirmado = await confirmar(`Eliminar el area "${nombre}"?`);

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/areas/${id}`, {
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

    alert('Area eliminada');
    cargarAreas();
}

cargarAreas();
