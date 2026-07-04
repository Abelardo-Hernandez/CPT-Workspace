auth.verificarSesion();

const params = new URLSearchParams(window.location.search);
const reunionId = params.get('id');

if (!reunionId) {
    alert('No se recibió ID de reunión');
    window.location.href = '/reuniones.html';
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarTab('acciones');
    cargarDetalleReunion();
    cargarAccionesReunion();
    cargarKpisReunion();
});

function mostrarTab(tab) {
    const tabs = ['acciones', 'kpis'];

    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).style.display =
            t === tab ? 'block' : 'none';
    });

    document.querySelectorAll('.ptc-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    const botonActivo = document.querySelector(
        `.ptc-tab[data-tab="${tab}"]`
    );

    if (botonActivo) {
        botonActivo.classList.add('active');
    }
}

async function cargarDetalleReunion() {
    try {
        const res = await fetch(`/api/reuniones/${reunionId}`, {
            headers: auth.headers()
        });

        const data = await res.json();

        document.getElementById('tituloReunion').textContent =
            `Reunión #${data.numero_reunion}`;

        document.getElementById('subtituloReunion').textContent =
            `Fecha: ${formatearFecha(data.fecha_reunion)}`;

        document.getElementById('fechaReunion').textContent =
            formatearFecha(data.fecha_reunion);

        document.getElementById('temaReunion').textContent =
            data.tema_habilidad_blanda || '-';

        document.getElementById('proximaReunion').textContent =
            `${formatearFecha(data.fecha_proxima_reunion)} ${data.hora_proxima_reunion || ''}`;

        document.getElementById('estatusReunion').textContent =
            data.estatus || 'abierta';

    } catch (error) {
        console.error(error);
        alert('Error al cargar el detalle de la reunión');
    }
}

function claseAccion(estatus) {
    const clases = {
        pendiente: 'accion-pendiente',
        en_proceso: 'accion-proceso',
        terminada: 'accion-terminada',
        vencida: 'accion-vencida'
    };

    return clases[estatus] || 'accion-pendiente';
}

function textoAccion(estatus) {
    const textos = {
        pendiente: 'Pendiente',
        en_proceso: 'En proceso',
        terminada: 'Terminada',
        vencida: 'Vencida'
    };

    return textos[estatus] || estatus || 'Pendiente';
}

async function cargarAccionesReunion() {
    try {
        const res = await fetch(`/api/acciones/reunion/${reunionId}`, {
            headers: auth.headers()
        });

        const acciones = await res.json();

        document.getElementById('totalAcciones').textContent = acciones.length;

        const contenedor = document.getElementById('contenedorAcciones');

        if (!acciones.length) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    No hay acciones registradas para esta reunión.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = '<div class="acciones-grid"></div>';

        const grid = contenedor.querySelector('.acciones-grid');

        acciones.forEach(a => {
            grid.innerHTML += `
                <div class="accion-card ${claseAccion(a.estatus)}">
                    <div class="accion-header">
                        <span class="accion-status">${textoAccion(a.estatus)}</span>
                        <span class="accion-priority">${a.prioridad || 'media'}</span>
                    </div>

                    <p class="accion-description">${a.descripcion || '-'}</p>

                    <div class="accion-meta">
                        <div class="accion-meta-item">
                            <small>Responsable</small>
                            <b>${a.responsable || '-'}</b>
                        </div>

                        <div class="accion-meta-item">
                            <small>Compromiso</small>
                            <b>${formatearFecha(a.fecha_compromiso)}</b>
                        </div>
                    </div>

                    <div class="accion-footer">
                        <i class="bi bi-folder2-open"></i>
                        ${a.proyecto || 'Sin proyecto'}
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        alert('Error al cargar las acciones de la reunión');
    }
}

function claseKpi(resultado) {
    const clases = {
        cumple: 'kpi-cumple',
        riesgo: 'kpi-riesgo',
        no_cumple: 'kpi-no-cumple'
    };

    return clases[resultado] || 'kpi-riesgo';
}

function iconoTendencia(tendencia) {
    if (tendencia === 'sube') return '⬆️';
    if (tendencia === 'baja') return '⬇️';
    return '➡️';
}

async function cargarKpisReunion() {
    try {
        const res = await fetch(`/api/kpis/resultados/reunion/${reunionId}`, {
            headers: auth.headers()
        });

        const kpis = await res.json();

        document.getElementById('totalKpis').textContent = kpis.length;

        const contenedor = document.getElementById('contenedorKpis');

        if (!kpis.length) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    No hay KPI's registrados para esta reunión.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = '<div class="kpi-grid"></div>';

        const grid = contenedor.querySelector('.kpi-grid');

        kpis.forEach(k => {
            grid.innerHTML += `
                <div class="kpi-card ${claseKpi(k.resultado)}">
                    <div class="kpi-header">
                        <strong>${k.kpi || '-'}</strong>
                        <span>${textoEstatus(k.resultado)}</span>
                    </div>

                    <div class="kpi-value">
                        ${k.actual} ${k.unidad || ''}
                    </div>

                    <div class="kpi-meta">
                        Meta: <strong>${k.meta} ${k.unidad || ''}</strong>
                    </div>

                    <div class="kpi-trend">
                        Tendencia: ${iconoTendencia(k.tendencia)} ${k.tendencia || '-'}
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        alert('Error al cargar los KPI de la reunión');
    }
}
