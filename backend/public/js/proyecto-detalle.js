auth.verificarSesion();

const params = new URLSearchParams(window.location.search);
const proyectoId = params.get('id');
let proyectoCache = null;
let accionesProyectoCache = [];
let kpisProyectoCache = [];
let timelineProyectoCache = [];
let graficaKpisProyecto = null;

if (!proyectoId) {
    alert('No se recibió ID de proyecto');
    window.location.href = '/proyectos.html';
}

function mostrarTabProyecto(tab) {
    document.querySelectorAll('[data-project-tab-panel]').forEach(panel => {
        panel.style.display =
            panel.dataset.projectTabPanel === tab ? '' : 'none';
    });

    document.querySelectorAll('.ptc-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    const botonActivo = document.querySelector(`.ptc-tab[data-tab="${tab}"]`);

    if (botonActivo) {
        botonActivo.classList.add('active');
    }
}

function textoEstatus(estatus) {
    const map = {
        en_tiempo: 'En tiempo',
        en_riesgo: 'En riesgo',
        atrasado: 'Atrasado',
        completado: 'Completado',
        sin_seguimiento: 'Sin seguimiento',
        pendiente: 'Pendiente',
        en_proceso: 'En proceso',
        terminada: 'Terminada',
        vencida: 'Vencida',
        cumple: 'Cumple',
        riesgo: 'Riesgo',
        no_cumple: 'No cumple'
    };

    if (map[estatus]) {
        return map[estatus];
    }

    if (!estatus) {
        return '-';
    }

    return String(estatus)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letra => letra.toUpperCase());
}

function claseBadge(estatus) {
    const map = {
        en_tiempo: 'green',
        en_riesgo: 'yellow',
        atrasado: 'red',
        completado: 'blue',
        sin_seguimiento: 'blue'
    };

    return map[estatus] || 'blue';
}

function badgePrioridad(prioridad) {
    return badgeBootstrap(
        textoPrioridad(prioridad),
        colorPrioridad(prioridad)
    );
}

function badgeEstatusAccion(estatus) {
    return badgeBootstrap(
        textoEstatus(estatus),
        colorEstatus(estatus)
    );
}

function abrirModalAccion() {
    const modal = document.getElementById('modalAccion');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalAccion() {
    const modal = document.getElementById('modalAccion');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

async function abrirModalEditarAccion(id) {
    const accion = accionesProyectoCache.find(a => Number(a.id) === Number(id));

    if (!accion) {
        alert('Accion no encontrada');
        return;
    }

    await Promise.all([
        cargarReuniones(),
        cargarUsuarios()
    ]);

    document.getElementById('editar_accion_id').value = accion.id;
    document.getElementById('editar_reunion_id').value = accion.reunion_id || '';
    document.getElementById('editar_responsable_usuario_id').value = accion.responsable_usuario_id || '';
    document.getElementById('editar_fecha_compromiso').value = valorFechaInput(accion.fecha_compromiso);
    document.getElementById('editar_prioridad').value = accion.prioridad || 'media';
    document.getElementById('editar_estatus').value = accion.estatus || 'pendiente';
    document.getElementById('editar_descripcion').value = accion.descripcion || '';

    const modal = document.getElementById('modalEditarAccion');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalEditarAccion() {
    const modal = document.getElementById('modalEditarAccion');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function abrirModalKpiProyecto() {
    const fechaInput = document.getElementById('kpi_fecha_medicion');

    if (fechaInput && !fechaInput.value) {
        fechaInput.value = fechaHoyInput();
    }

    const modal = document.getElementById('modalKpiProyecto');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalKpiProyecto() {
    const modal = document.getElementById('modalKpiProyecto');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function abrirModalNuevoKpiCatalogo() {
    const modal = document.getElementById('modalNuevoKpiCatalogo');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalNuevoKpiCatalogo() {
    const modal = document.getElementById('modalNuevoKpiCatalogo');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function abrirModalEditarKpiProyecto(id) {
    const registro = kpisProyectoCache.find(k => Number(k.id) === Number(id));

    if (!registro) {
        alert('KPI no encontrado');
        return;
    }

    document.getElementById('editar_kpi_resultado_id').value = registro.id;
    document.getElementById('editar_kpi_id').value = registro.kpi_id || '';
    document.getElementById('editar_kpi_meta').value = registro.meta ?? '';
    document.getElementById('editar_kpi_actual').value = registro.actual ?? '';
    document.getElementById('editar_kpi_fecha_medicion').value = fechaHoyInput();
    document.getElementById('editar_kpi_tendencia').value = registro.tendencia || 'igual';

    const modal = document.getElementById('modalEditarKpiProyecto');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalEditarKpiProyecto() {
    const modal = document.getElementById('modalEditarKpiProyecto');
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

function fechaHoyInput() {
    return new Date().toISOString().slice(0, 10);
}

async function cargarProyecto() {
    const res = await fetch(`/api/proyectos/${proyectoId}`, {
        headers: auth.headers()
    });

    const p = await res.json();
    proyectoCache = p;

    document.getElementById('nombreProyecto').textContent = p.nombre;
    document.getElementById('objetivoProyecto').textContent = p.objetivo || 'Detalle ejecutivo del proyecto';

    document.getElementById('areaProyecto').textContent = p.area || '-';
    document.getElementById('responsableProyecto').textContent = p.responsable || '-';
    document.getElementById('fechaInicio').textContent = formatearFecha(p.fecha_inicio);
    document.getElementById('fechaObjetivo').textContent = formatearFecha(p.fecha_objetivo);

    const badge = document.getElementById('estatusProyecto');
    badge.textContent = textoEstatus(p.estatus);
    badge.className = `ptc-badge ${claseBadge(p.estatus)}`;

    document.getElementById('ultimaActualizacion').textContent = formatearFechaHora(p.ultima_actualizacion);

    document.getElementById('avanceTexto').textContent = `${p.avance}%`;
    document.getElementById('avanceMini').textContent = `${p.avance}%`;
    actualizarBarraProgreso(
        document.getElementById('barraAvance'),
        p.avance
    );

    document.getElementById('ultimoComentario').textContent = p.ultimo_comentario || 'Sin comentarios';

    document.getElementById('totalReuniones').textContent = p.total_reuniones || 0;
    document.getElementById('totalAcciones').textContent = p.total_acciones || 0;
}

async function cargarReuniones() {
    const res = await fetch('/api/reuniones?seleccionables=1', {
        headers: auth.headers()
    });

    const reuniones = await res.json();

    const selects = [
        document.getElementById('reunion_id'),
        document.getElementById('editar_reunion_id')
    ].filter(Boolean);

    selects.forEach(select => {
        select.innerHTML = '<option value="">Selecciona reunion</option>';
    });

    reuniones.forEach(r => {
        selects.forEach(select => {
            select.innerHTML += `
                <option value="${r.id}">
                    Reunion #${r.numero_reunion}
                </option>
            `;
        });
    });
}

async function cargarUsuarios() {
    const res = await fetch('/api/usuarios', {
        headers: auth.headers()
    });

    const usuarios = await res.json();

    const selects = [
        document.getElementById('responsable_usuario_id'),
        document.getElementById('editar_responsable_usuario_id')
    ].filter(Boolean);

    selects.forEach(select => {
        select.innerHTML = '<option value="">Selecciona responsable</option>';
    });

    usuarios.forEach(u => {
        selects.forEach(select => {
            select.innerHTML += `
                <option value="${u.id}">
                    ${u.nombre}
                </option>
            `;
        });
    });
}

async function cargarKpisCatalogo() {
    const res = await fetch('/api/kpis', {
        headers: auth.headers()
    });

    const kpis = await res.json();

    const selects = [
        document.getElementById('kpi_id'),
        document.getElementById('editar_kpi_id')
    ].filter(Boolean);

    selects.forEach(select => {
        select.innerHTML = '<option value="">Selecciona KPI</option>';
    });

    kpis.forEach(k => {
        selects.forEach(select => {
            select.innerHTML += `
                <option value="${k.id}">
                    ${k.nombre} (${k.unidad || ''})
                </option>
            `;
        });
    });

    return kpis;
}

async function cargarAccionesProyecto() {
    const res = await fetch(`/api/acciones/proyecto/${proyectoId}`, {
        headers: auth.headers()
    });

    const acciones = await res.json();
    accionesProyectoCache = acciones;

    const tabla = document.getElementById('tablaAccionesProyecto');
    tabla.innerHTML = '';

    document.getElementById('totalAcciones').textContent = acciones.length;

    if (!acciones.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        Este proyecto aún no tiene acciones registradas.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    acciones.forEach(a => {
        tabla.innerHTML += `
            <tr>
                <td>${a.descripcion || '-'}</td>
                <td>#${a.numero_reunion || '-'}</td>
                <td>${a.responsable || '-'}</td>
                <td>${formatearFecha(a.fecha_compromiso)}</td>
                <td>${badgePrioridad(a.prioridad)}</td>
                <td>
                    <select
                        class="form-select form-select-sm"
                        onchange="actualizarEstatusAccion(${a.id}, this.value)">
                        <option value="pendiente" ${a.estatus === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="en_proceso" ${a.estatus === 'en_proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="terminada" ${a.estatus === 'terminada' ? 'selected' : ''}>Terminada</option>
                        <option value="vencida" ${a.estatus === 'vencida' ? 'selected' : ''}>Vencida</option>
                    </select>
                </td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-primary btn-sm"
                        type="button"
                        onclick="abrirModalEditarAccion(${a.id})">
                        <i class="bi bi-pencil-square"></i>
                        Editar
                    </button>
                </td>
            </tr>
        `;
    });
}

function textoTendencia(tendencia) {
    const textos = {
        sube: 'Sube',
        baja: 'Baja',
        igual: 'Igual'
    };

    return textos[tendencia] || tendencia || '-';
}

function badgeResultadoKpi(resultado) {
    return badgeBootstrap(
        textoEstatus(resultado),
        colorEstatus(resultado)
    );
}

function ultimosKpisPorIndicador(kpis) {
    const ordenados = [...kpis].sort((a, b) => {
        const fechaB = timestampKpi(b) || 0;
        const fechaA = timestampKpi(a) || 0;

        return fechaB - fechaA || Number(b.id || 0) - Number(a.id || 0);
    });

    const ultimos = new Map();

    ordenados.forEach(kpi => {
        const clave = kpi.kpi_id || kpi.kpi || kpi.id;

        if (!ultimos.has(clave)) {
            ultimos.set(clave, kpi);
        }
    });

    return [...ultimos.values()].sort((a, b) =>
        String(a.kpi || '').localeCompare(String(b.kpi || ''), 'es')
    );
}

function porcentajeKpi(kpi) {
    const meta = Number(kpi.meta);
    const actual = Number(kpi.actual);

    if (!Number.isFinite(meta) || !Number.isFinite(actual) || meta <= 0) {
        return null;
    }

    if (kpi.tipo_meta === 'menor_es_mejor') {
        if (actual <= meta) {
            return 100;
        }

        return (meta / actual) * 100;
    }

    return (actual / meta) * 100;
}

function fechaKpi(kpi) {
    return kpi.fecha_medicion || kpi.fecha_reunion || kpi.fecha_registro || null;
}

function timestampKpi(kpi) {
    const fecha = fechaKpi(kpi);

    if (!fecha) {
        return null;
    }

    const partesFecha = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (partesFecha) {
        return new Date(
            Number(partesFecha[1]),
            Number(partesFecha[2]) - 1,
            Number(partesFecha[3])
        ).getTime();
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function etiquetaTiempoKpi(kpi) {
    const fecha = fechaKpi(kpi);

    if (fecha) {
        return formatearFecha(fecha);
    }

    return 'Sin fecha';
}

function formatearFechaGrafica(timestamp) {
    if (!Number.isFinite(timestamp)) {
        return '';
    }

    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short'
    }).format(new Date(timestamp));
}

function colorGraficaKpi(indice) {
    const colores = [
        '#0d6efd',
        '#198754',
        '#dc3545',
        '#f59e0b',
        '#7c3aed',
        '#0f766e',
        '#db2777',
        '#475569'
    ];

    return colores[indice % colores.length];
}

function renderGraficaKpisProyecto(kpis) {
    const canvas = document.getElementById('graficaKpisProyecto');
    const estadoVacio = document.getElementById('graficaKpisProyectoVacia');

    if (!canvas || !estadoVacio) {
        return;
    }

    if (graficaKpisProyecto) {
        graficaKpisProyecto.destroy();
        graficaKpisProyecto = null;
    }

    const puntos = kpis
        .map((kpi, indice) => ({
            ...kpi,
            indice,
            porcentaje: porcentajeKpi(kpi),
            timestamp: timestampKpi(kpi)
        }))
        .filter(kpi => kpi.porcentaje !== null && kpi.timestamp !== null)
        .sort((a, b) => a.timestamp - b.timestamp || a.id - b.id);

    estadoVacio.style.display = puntos.length ? 'none' : 'flex';

    if (!puntos.length || typeof Chart === 'undefined') {
        return;
    }

    const kpisUnicos = [...new Set(puntos.map(kpi => kpi.kpi || 'KPI'))];
    const maximoPorcentaje = Math.max(100, ...puntos.map(kpi => kpi.porcentaje));
    const maximoEjeY = Math.min(160, Math.ceil(maximoPorcentaje / 20) * 20);
    const diaMs = 24 * 60 * 60 * 1000;
    const minTiempo = Math.min(...puntos.map(kpi => kpi.timestamp));
    const maxTiempo = Math.max(...puntos.map(kpi => kpi.timestamp));
    const rangoMin = minTiempo === maxTiempo ? minTiempo - diaMs : minTiempo;
    const rangoMax = minTiempo === maxTiempo ? maxTiempo + diaMs : maxTiempo;

    const datasets = kpisUnicos.map((nombreKpi, indiceKpi) => {
        const color = colorGraficaKpi(indiceKpi);

        return {
            label: nombreKpi,
            data: puntos
                .map((kpi, indicePunto) => ({ kpi, indicePunto }))
                .filter(item => (item.kpi.kpi || 'KPI') === nombreKpi)
                .map(item => ({
                    x: item.kpi.timestamp,
                    y: Number(item.kpi.porcentaje.toFixed(2)),
                    etiquetaTiempo: etiquetaTiempoKpi(item.kpi),
                    meta: item.kpi.meta,
                    actual: item.kpi.actual,
                    unidad: item.kpi.unidad || '',
                    resultado: item.kpi.resultado
                })),
            backgroundColor: color,
            borderColor: color,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 1.8,
            tension: 0.25,
            fill: false,
            showLine: true
        };
    });

    graficaKpisProyecto = new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        font: {
                            weight: '700'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title(items) {
                            return items[0]?.raw?.etiquetaTiempo || 'Tiempo';
                        },
                        label(item) {
                            const raw = item.raw;
                            const unidad = raw.unidad ? ` ${raw.unidad}` : '';
                            return `${item.dataset.label}: ${raw.y}% | Actual ${raw.actual}${unidad} / Meta ${raw.meta}${unidad}`;
                        },
                        afterLabel(item) {
                            return `Resultado: ${textoEstatus(item.raw.resultado)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: rangoMin,
                    max: rangoMax,
                    title: {
                        display: true,
                        text: 'Tiempo',
                        font: {
                            weight: '800'
                        }
                    },
                    ticks: {
                        callback(value) {
                            return formatearFechaGrafica(Number(value));
                        },
                        maxRotation: 0,
                        autoSkip: true
                    },
                    grid: {
                        color: '#e2e8f0'
                    }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: maximoEjeY,
                    title: {
                        display: true,
                        text: 'Porcentaje del KPI',
                        font: {
                            weight: '800'
                        }
                    },
                    ticks: {
                        callback(value) {
                            return `${value}%`;
                        }
                    },
                    grid: {
                        color: context => context.tick.value === 100 ? '#16a34a' : '#e2e8f0',
                        lineWidth: context => context.tick.value === 100 ? 2 : 1
                    }
                }
            }
        }
    });
}

async function cargarKpisProyecto() {
    const res = await fetch(`/api/kpis/resultados/proyecto/${proyectoId}`, {
        headers: auth.headers()
    });

    const kpis = await res.json();
    kpisProyectoCache = kpis;
    renderGraficaKpisProyecto(kpis);

    const tabla = document.getElementById('tablaKpisProyecto');
    tabla.innerHTML = '';

    const ultimosKpis = ultimosKpisPorIndicador(kpis);

    if (!ultimosKpis.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        Este proyecto aun no tiene KPIs asignados.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    ultimosKpis.forEach(k => {
        tabla.innerHTML += `
            <tr>
                <td>
                    <strong>${k.kpi}</strong>
                    <div class="text-muted small">
                        ${k.tipo_meta === 'menor_es_mejor' ? 'Menor es mejor' : 'Mayor es mejor'}
                    </div>
                </td>
                <td>${k.meta} ${k.unidad || ''}</td>
                <td>${k.actual} ${k.unidad || ''}</td>
                <td>${formatearFecha(fechaKpi(k))}</td>
                <td>${badgeResultadoKpi(k.resultado)}</td>
                <td>${textoTendencia(k.tendencia)}</td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-primary btn-sm"
                        type="button"
                        onclick="abrirModalEditarKpiProyecto(${k.id})">
                        <i class="bi bi-graph-up-arrow"></i>
                        Medir
                    </button>
                </td>
            </tr>
        `;
    });
}

async function crearAccionProyecto() {
    const body = {
        reunion_id: document.getElementById('reunion_id').value,
        proyecto_id: proyectoId,
        responsable_usuario_id: document.getElementById('responsable_usuario_id').value,
        fecha_compromiso: document.getElementById('fecha_compromiso').value,
        prioridad: document.getElementById('prioridad').value,
        estatus: document.getElementById('estatus').value,
        descripcion: document.getElementById('descripcion').value
    };

    const res = await fetch('/api/acciones', {
        method: 'POST',
        headers: {
            ...auth.headers(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    document.getElementById('descripcion').value = '';
    document.getElementById('fecha_compromiso').value = '';
    document.getElementById('prioridad').value = 'media';
    document.getElementById('estatus').value = 'pendiente';

    cerrarModalAccion();

    await cargarProyecto();
    await cargarAccionesProyecto();
    await cargarTimeline();
}

async function actualizarEstatusAccion(id, estatus) {
    const res = await fetch(`/api/acciones/${id}/estatus`, {
        method: 'PUT',
        headers: {
            ...auth.headers(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estatus })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    await cargarProyecto();
    await cargarAccionesProyecto();
    await cargarTimeline();
}

async function actualizarAccionProyecto() {
    const id = document.getElementById('editar_accion_id').value;

    const body = {
        reunion_id: document.getElementById('editar_reunion_id').value,
        proyecto_id: proyectoId,
        responsable_usuario_id: document.getElementById('editar_responsable_usuario_id').value,
        fecha_compromiso: document.getElementById('editar_fecha_compromiso').value,
        prioridad: document.getElementById('editar_prioridad').value,
        estatus: document.getElementById('editar_estatus').value,
        descripcion: document.getElementById('editar_descripcion').value
    };

    const res = await fetch(`/api/acciones/${id}`, {
        method: 'PUT',
        headers: {
            ...auth.headers(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    alert('Accion actualizada');
    cerrarModalEditarAccion();

    await cargarProyecto();
    await cargarAccionesProyecto();
    await cargarTimeline();
}

async function eliminarAccionProyecto() {
    const id = document.getElementById('editar_accion_id').value;
    const descripcion = document.getElementById('editar_descripcion').value || 'esta accion';

    const confirmado = confirm(`Eliminar "${descripcion}"? Esta accion no se puede deshacer desde esta pantalla.`);

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/acciones/${id}`, {
        method: 'DELETE',
        headers: auth.headers()
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    alert('Accion eliminada');
    cerrarModalEditarAccion();

    await cargarProyecto();
    await cargarAccionesProyecto();
    await cargarTimeline();
}

async function crearKpiProyecto() {
    const body = {
        proyecto_id: proyectoId,
        kpi_id: document.getElementById('kpi_id').value,
        meta: document.getElementById('kpi_meta').value,
        actual: document.getElementById('kpi_actual').value,
        fecha_medicion: document.getElementById('kpi_fecha_medicion').value,
        tendencia: document.getElementById('kpi_tendencia').value
    };

    const res = await fetch('/api/kpis/resultados', {
        method: 'POST',
        headers: auth.headersJson(),
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    document.getElementById('kpi_id').value = '';
    document.getElementById('kpi_meta').value = '';
    document.getElementById('kpi_actual').value = '';
    document.getElementById('kpi_fecha_medicion').value = fechaHoyInput();
    document.getElementById('kpi_tendencia').value = 'igual';

    cerrarModalKpiProyecto();
    await cargarKpisProyecto();
}

async function crearKpiCatalogoProyecto() {
    const body = {
        nombre: document.getElementById('nuevo_kpi_nombre').value,
        unidad: document.getElementById('nuevo_kpi_unidad').value || '%',
        tipo_meta: document.getElementById('nuevo_kpi_tipo_meta').value
    };

    const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: auth.headersJson(),
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    document.getElementById('nuevo_kpi_nombre').value = '';
    document.getElementById('nuevo_kpi_unidad').value = '';
    document.getElementById('nuevo_kpi_tipo_meta').value = 'mayor_es_mejor';

    cerrarModalNuevoKpiCatalogo();
    const kpis = await cargarKpisCatalogo();
    const kpiCreado = kpis.find(kpi =>
        String(kpi.nombre || '').trim().toLowerCase() === body.nombre.trim().toLowerCase()
    );

    document.getElementById('kpi_id').value = kpiCreado?.id || '';
    abrirModalKpiProyecto();
}

async function actualizarKpiProyecto() {
    const id = document.getElementById('editar_kpi_resultado_id').value;

    const body = {
        kpi_id: document.getElementById('editar_kpi_id').value,
        meta: document.getElementById('editar_kpi_meta').value,
        actual: document.getElementById('editar_kpi_actual').value,
        fecha_medicion: document.getElementById('editar_kpi_fecha_medicion').value,
        tendencia: document.getElementById('editar_kpi_tendencia').value
    };

    const res = await fetch(`/api/kpis/resultados/${id}`, {
        method: 'PUT',
        headers: auth.headersJson(),
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    cerrarModalEditarKpiProyecto();
    await cargarKpisProyecto();
}

async function eliminarKpiProyecto() {
    const id = document.getElementById('editar_kpi_resultado_id').value;
    const confirmado = confirm('Eliminar esta medicion del KPI? Si existen mediciones anteriores, volveran a mostrarse como valor actual.');

    if (!confirmado) {
        return;
    }

    const res = await fetch(`/api/kpis/resultados/${id}`, {
        method: 'DELETE',
        headers: auth.headers()
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    cerrarModalEditarKpiProyecto();
    await cargarKpisProyecto();
}

function iconoTimeline(tipo) {
    if (tipo === 'seguimiento') return 'bi-clipboard-check';
    if (tipo === 'accion') return 'bi-check2-square';
    return 'bi-circle-fill';
}

async function cargarTimeline() {
    const res = await fetch(`/api/proyectos/${proyectoId}/timeline`, {
        headers: auth.headers()
    });

    const eventos = await res.json();
    timelineProyectoCache = eventos;

    const contenedor = document.getElementById('timelineProyecto');

    if (!eventos.length) {
        contenedor.innerHTML = `
            <div class="empty-state">
                Este proyecto aún no tiene actividad registrada.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = '';

    eventos.forEach(e => {
        contenedor.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-dot">
                    <i class="bi ${iconoTimeline(e.tipo)} text-white small"></i>
                </div>

                <div class="timeline-content">
                    <div class="timeline-header">
                        <strong>${e.titulo}</strong>
                        <span>${e.estado}</span>
                    </div>

                    <div class="timeline-meta">
                        ${formatearFechaHora(e.fecha)}
                    </div>

                    <p>${e.descripcion || 'Sin descripción'}</p>
                </div>
            </div>
        `;
    });
}

async function obtenerJsonExportacion(url) {
    const res = await fetch(url, {
        headers: auth.headers()
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo obtener informacion para exportar');
    }

    return res.json();
}

function textoPlanoHtml(valor) {
    const div = document.createElement('div');
    div.innerHTML = String(valor ?? '');
    return div.textContent || div.innerText || '';
}

function escaparXml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function nombreArchivoSeguro(valor) {
    return String(valor || 'proyecto')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'proyecto';
}

function celdaExcel(valor, estilo = '') {
    const esNumero = typeof valor === 'number' && Number.isFinite(valor);
    const tipo = esNumero ? 'Number' : 'String';
    const contenido = esNumero ? valor : escaparXml(valor);
    const estiloAttr = estilo ? ` ss:StyleID="${estilo}"` : '';

    return `<Cell${estiloAttr}><Data ss:Type="${tipo}">${contenido}</Data></Cell>`;
}

function filaExcel(celdas, estilo = '') {
    return `<Row>${celdas.map(celda => celdaExcel(celda, estilo)).join('')}</Row>`;
}

function hojaExcel(nombre, encabezados, filas) {
    const columnas = encabezados
        .map(() => '<Column ss:AutoFitWidth="1" ss:Width="150"/>')
        .join('');

    const filasXml = [
        filaExcel(encabezados, 'Header'),
        ...filas.map(fila => filaExcel(fila))
    ].join('');

    return `
        <Worksheet ss:Name="${escaparXml(nombre)}">
            <Table>
                ${columnas}
                ${filasXml}
            </Table>
        </Worksheet>
    `;
}

function hojaResumenExcel(proyecto, acciones, kpisActuales, kpisHistorial, eventos) {
    const filas = [
        ['Nombre', proyecto.nombre || '-'],
        ['Objetivo', proyecto.objetivo || '-'],
        ['Area', proyecto.area || '-'],
        ['Responsable', proyecto.responsable || '-'],
        ['Fecha inicio', formatearFecha(proyecto.fecha_inicio)],
        ['Fecha objetivo', formatearFecha(proyecto.fecha_objetivo)],
        ['Estatus', textoEstatus(proyecto.estatus)],
        ['Ultima actualizacion', formatearFechaHora(proyecto.ultima_actualizacion)],
        ['Avance actual', `${proyecto.avance || 0}%`],
        ['Reuniones asociadas', proyecto.total_reuniones || 0],
        ['Acciones registradas', acciones.length],
        ['KPIs actuales', kpisActuales.length],
        ['Mediciones KPI historicas', kpisHistorial.length],
        ['Eventos en timeline', eventos.length],
        ['Ultimo comentario', proyecto.ultimo_comentario || 'Sin comentarios']
    ];

    return hojaExcel('Resumen', ['Campo', 'Valor'], filas);
}

function construirLibroProyectoExcel(proyecto, acciones, kpis, eventos) {
    const kpisActuales = ultimosKpisPorIndicador(kpis);
    const kpisHistorial = [...kpis].sort((a, b) => {
        const nombre = String(a.kpi || '').localeCompare(String(b.kpi || ''), 'es');

        if (nombre !== 0) {
            return nombre;
        }

        return (timestampKpi(a) || 0) - (timestampKpi(b) || 0) ||
            Number(a.id || 0) - Number(b.id || 0);
    });

    const accionesFilas = acciones.map(accion => [
        accion.descripcion || '-',
        accion.numero_reunion ? `#${accion.numero_reunion}` : '-',
        accion.responsable || '-',
        formatearFecha(accion.fecha_compromiso),
        textoPrioridad(accion.prioridad),
        textoEstatus(accion.estatus)
    ]);

    const kpisActualesFilas = kpisActuales.map(kpi => [
        kpi.kpi || '-',
        `${kpi.meta ?? '-'} ${kpi.unidad || ''}`.trim(),
        `${kpi.actual ?? '-'} ${kpi.unidad || ''}`.trim(),
        formatearFecha(fechaKpi(kpi)),
        textoEstatus(kpi.resultado),
        textoTendencia(kpi.tendencia),
        kpi.tipo_meta === 'menor_es_mejor' ? 'Menor es mejor' : 'Mayor es mejor'
    ]);

    const kpisHistorialFilas = kpisHistorial.map(kpi => [
        kpi.kpi || '-',
        formatearFecha(fechaKpi(kpi)),
        `${kpi.meta ?? '-'} ${kpi.unidad || ''}`.trim(),
        `${kpi.actual ?? '-'} ${kpi.unidad || ''}`.trim(),
        textoEstatus(kpi.resultado),
        textoTendencia(kpi.tendencia),
        kpi.tipo_meta === 'menor_es_mejor' ? 'Menor es mejor' : 'Mayor es mejor'
    ]);

    const timelineFilas = eventos.map(evento => [
        evento.tipo || '-',
        evento.titulo || '-',
        evento.estado || '-',
        formatearFechaHora(evento.fecha),
        textoPlanoHtml(evento.descripcion || '-')
    ]);

    return `<?xml version="1.0"?>
        <?mso-application progid="Excel.Sheet"?>
        <Workbook
            xmlns="urn:schemas-microsoft-com:office:spreadsheet"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
            <Styles>
                <Style ss:ID="Header">
                    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
                    <Interior ss:Color="#198754" ss:Pattern="Solid"/>
                </Style>
            </Styles>
            ${hojaResumenExcel(proyecto, acciones, kpisActuales, kpisHistorial, eventos)}
            ${hojaExcel('Acciones', ['Accion', 'Reunion', 'Responsable', 'Compromiso', 'Prioridad', 'Estatus'], accionesFilas)}
            ${hojaExcel('KPIs actuales', ['KPI', 'Meta', 'Actual', 'Ultima fecha', 'Resultado', 'Tendencia', 'Tipo meta'], kpisActualesFilas)}
            ${hojaExcel('Historial KPI', ['KPI', 'Fecha', 'Meta', 'Actual', 'Resultado', 'Tendencia', 'Tipo meta'], kpisHistorialFilas)}
            ${hojaExcel('Timeline', ['Tipo', 'Titulo', 'Estado', 'Fecha', 'Descripcion'], timelineFilas)}
        </Workbook>`;
}

async function exportarProyectoExcel() {
    try {
        const [proyecto, acciones, kpis, eventos] = await Promise.all([
            obtenerJsonExportacion(`/api/proyectos/${proyectoId}`),
            obtenerJsonExportacion(`/api/acciones/proyecto/${proyectoId}`),
            obtenerJsonExportacion(`/api/kpis/resultados/proyecto/${proyectoId}`),
            obtenerJsonExportacion(`/api/proyectos/${proyectoId}/timeline`)
        ]);

        proyectoCache = proyecto;
        accionesProyectoCache = acciones;
        kpisProyectoCache = kpis;
        timelineProyectoCache = eventos;

        const libro = construirLibroProyectoExcel(proyecto, acciones, kpis, eventos);
        const blob = new Blob([libro], {
            type: 'application/vnd.ms-excel;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fecha = fechaHoyInput();

        link.href = url;
        link.download = `${nombreArchivoSeguro(proyecto.nombre)}-${fecha}.xls`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert(error.message || 'No se pudo exportar el proyecto');
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        cerrarModalAccion();
        cerrarModalEditarAccion();
        cerrarModalKpiProyecto();
        cerrarModalNuevoKpiCatalogo();
        cerrarModalEditarKpiProyecto();
    }
});

mostrarTabProyecto('timeline');
cargarProyecto();
cargarReuniones();
cargarUsuarios();
cargarKpisCatalogo();
cargarAccionesProyecto();
cargarKpisProyecto();
cargarTimeline();

