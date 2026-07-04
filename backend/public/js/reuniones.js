const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/login.html';
}

function textoEstatusReunion(estatus) {
    const textos = {
        programada: 'Programada',
        activa: 'Activa',
        finalizada: 'Finalizada',
        cancelada: 'Cancelada'
    };

    return textos[estatus] || estatus || '-';
}

function colorEstatusReunion(estatus) {
    const colores = {
        programada: 'primary',
        activa: 'success',
        finalizada: 'secondary',
        cancelada: 'danger'
    };

    return colores[estatus] || 'secondary';
}

function badgeEstatusReunion(estatus) {
    return `
        <span class="badge bg-${colorEstatusReunion(estatus)}">
            ${textoEstatusReunion(estatus)}
        </span>
    `;
}

function botonCancelarReunion(reunion) {
    if (['finalizada', 'cancelada'].includes(reunion.estatus)) {
        return '<span class="text-muted small">-</span>';
    }

    return `
        <button
            class="btn btn-outline-danger btn-sm"
            type="button"
            onclick="cancelarReunion(${reunion.id}, ${reunion.numero_reunion})">
            <i class="bi bi-x-circle"></i>
            Cancelar
        </button>
    `;
}

async function cargarReuniones() {
    const res = await fetch('/api/reuniones', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const reuniones = await res.json();

    const tabla = document.getElementById('tablaReuniones');
    tabla.innerHTML = '';

    reuniones.forEach(r => {
        tabla.innerHTML += `
            <tr>
                <td>#${r.numero_reunion}</td>
                <td>${formatearFecha(r.fecha_reunion)}</td>
                <td>${r.tema_habilidad_blanda || '-'}</td>
                <td>${formatearFecha(r.fecha_proxima_reunion)}</td>
                <td>${r.hora_proxima_reunion || '-'}</td>
                <td>
                    ${badgeEstatusReunion(r.estatus)}
                </td>
                <td>
                    <a
                        href="reunion-detalle.html?id=${r.id}"
                        class="btn btn-sm btn-primary"
                    >
                        Abrir
                    </a>
                </td>
                <td>
                    ${botonCancelarReunion(r)}
                </td>
            </tr>
        `;
    });
}

async function cancelarReunion(id, numeroReunion) {
    const confirmado = confirm(`Cancelar la reunion #${numeroReunion}?`);

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/reuniones/${id}/cancelar`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    alert('Reunion cancelada');
    cargarReuniones();
}


document.getElementById('fechaActual').textContent =
    new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
async function crearReunion() {
    const body = {
        numero_reunion: document.getElementById('numero_reunion').value,
        fecha_reunion: document.getElementById('fecha_reunion').value,
        tema_habilidad_blanda: document.getElementById('tema_habilidad_blanda').value,
        fecha_proxima_reunion: document.getElementById('fecha_proxima_reunion').value,
        hora_proxima_reunion: document.getElementById('hora_proxima_reunion').value
    };

    const res = await fetch('/api/reuniones', {
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

    alert('Reunión creada');

    cargarReuniones();
}

cargarReuniones();
