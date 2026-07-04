let graficaProyectos = null;
let graficaAcciones = null;

const token = localStorage.getItem('token');

if (!token) {

    window.location.href =
    '/login.html';

}

async function cargarResumen() {

    const response =
    await fetch(
        '/api/dashboard/resumen',
        {
            headers:{
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const data =
    await response.json();

    document.getElementById(
        'usuarios'
    ).textContent =
    data.usuarios;

    document.getElementById(
        'areas'
    ).textContent =
    data.areas;

    document.getElementById(
        'proyectos'
    ).textContent =
    data.proyectos;

    document.getElementById(
        'reuniones'
    ).textContent =
    data.reuniones;
}

function formatearFecha(fecha) {
    if (!fecha) return '-';

    const partesFecha = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const date = partesFecha
        ? new Date(partesFecha[1], partesFecha[2] - 1, partesFecha[3])
        : new Date(fecha);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace('.', '');
}


document.getElementById('fechaActual').textContent =
    new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

async function cargarProyectosRecientes() {
    const response = await fetch('/api/dashboard/proyectos-recientes', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const proyectos = await response.json();

    const tabla = document.getElementById('tablaProyectosRecientes');

    tabla.innerHTML = '';

    proyectos.forEach(p => {
        tabla.innerHTML += `
            <tr
                class="project-row-clickable"
                onclick="window.location.href = 'proyecto-detalle.html?id=${p.id}'"
                role="button"
                tabindex="0"
                onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.location.href = 'proyecto-detalle.html?id=${p.id}'; }"
            >
                <td>${p.nombre}</td>
                <td>${p.area}</td>
                <td>${p.responsable || 'Sin asignar'}</td>
                <td>${formatearFecha(p.fecha_objetivo)}</td>
            </tr>
        `;
    });
}

async function cargarResumenSeguimiento() {
    const response = await fetch('/api/dashboard/seguimiento-resumen', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();
    renderGraficaProyectos(data);
}

async function cargarResumenAcciones() {
    const response = await fetch('/api/dashboard/acciones-resumen', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    renderGraficaAcciones(data);
}

async function cargarAvanceGlobal() {
    const response = await fetch('/api/dashboard/avance-global', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    const avance = data.avance_global || 0;

    document.getElementById('avanceGlobalTexto').textContent = `${avance}%`;
    actualizarBarraProgreso(
        document.getElementById('barraAvanceGlobal'),
        avance,
        { mostrarTexto: true }
    );
}

async function cargarInfoReuniones() {

    const response = await fetch(
        '/api/dashboard/info-reuniones',
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    document.getElementById('infoReuniones').innerHTML = `
        <p>
            <strong>Última reunión:</strong>
            #${data.ultima?.numero_reunion || '-'}
            (${formatearFecha(data.ultima?.fecha_reunion)})
        </p>

        <p>
            <strong>Próxima reunión:</strong>
            #${data.proxima?.numero_reunion || '-'}
            (${formatearFecha(data.proxima?.fecha_proxima_reunion)}
            ${data.proxima?.hora_proxima_reunion || ''})
        </p>
    `;
    }

async function cargarAccionesVencidas() {

    const response = await fetch(
        '/api/dashboard/acciones-vencidas',
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const acciones = await response.json();

    const contenedor =
        document.getElementById('accionesVencidas');

    contenedor.innerHTML = '';

    acciones.forEach(a => {

        contenedor.innerHTML += `
            <div class="mb-2">
                ⚠ ${a.descripcion}
                <br>
                <small>${formatearFecha(a.fecha_compromiso)}</small>
            </div>
        `;

    });
}

async function cargarProximasAcciones() {

    const response = await fetch(
        '/api/dashboard/proximas-acciones',
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const acciones = await response.json();

    const contenedor =
        document.getElementById('proximasAcciones');

    contenedor.innerHTML = '';

    acciones.forEach(a => {

        contenedor.innerHTML += `
            <div class="mb-2">
                📌 ${a.descripcion}
                <br>
                <small>
                    ${formatearFecha(a.fecha_compromiso)}
                </small>
            </div>
        `;

    });
}

function renderGraficaProyectos(data) {
    const ctx = document.getElementById('graficaProyectos');

    if (graficaProyectos) {
        graficaProyectos.destroy();
    }

    graficaProyectos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                'En tiempo',
                'En riesgo',
                'Atrasado',
                'Completado'
            ],
            datasets: [{
                data: [
                    data.en_tiempo,
                    data.en_riesgo,
                    data.atrasado,
                    data.completado
                ],
                backgroundColor: [
                    '#198754',
                    '#ffc107',
                    '#dc3545',
                    '#0d6efd'
                ]
            }]
        }
    });
}

function renderGraficaAcciones(data) {
    const ctx = document.getElementById('graficaAcciones');

    if (graficaAcciones) {
        graficaAcciones.destroy();
    }

    graficaAcciones = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                'Pendiente',
                'En proceso',
                'Terminada',
                'Vencida'
            ],
            datasets: [{
                data: [
                    data.pendiente,
                    data.en_proceso,
                    data.terminada,
                    data.vencida
                ],
                backgroundColor: [
                    '#6c757d',
                    '#ffc107',
                    '#198754',
                    '#dc3545'
                ]
            }]
        }
    });
}

async function cargarResumenKpis(){

    const res = await fetch(
        '/api/dashboard/kpis-resumen',
        {
            headers: auth.headers()
        }
    );

    const data = await res.json();

    document.getElementById('kpisCumple').textContent =
        data.cumple || 0;

    document.getElementById('kpisNoCumple').textContent =
        data.no_cumple || 0;

}

cargarResumen();
cargarAvanceGlobal();
cargarResumenSeguimiento();
cargarProyectosRecientes();
cargarResumenAcciones();
cargarInfoReuniones();
cargarAccionesVencidas();
cargarProximasAcciones();
cargarResumenKpis();
