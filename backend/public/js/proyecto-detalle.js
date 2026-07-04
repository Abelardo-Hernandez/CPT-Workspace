auth.verificarSesion();

const params = new URLSearchParams(window.location.search);
const proyectoId = params.get('id');
let accionesProyectoCache = [];
let kpisProyectoCache = [];

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

async function cargarProyecto() {
    const res = await fetch(`/api/proyectos/${proyectoId}`, {
        headers: auth.headers()
    });

    const p = await res.json();

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

async function cargarKpisProyecto() {
    const res = await fetch(`/api/kpis/resultados/proyecto/${proyectoId}`, {
        headers: auth.headers()
    });

    const kpis = await res.json();
    kpisProyectoCache = kpis;

    const tabla = document.getElementById('tablaKpisProyecto');
    tabla.innerHTML = '';

    if (!kpis.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        Este proyecto aun no tiene KPIs asignados.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    kpis.forEach(k => {
        tabla.innerHTML += `
            <tr>
                <td>
                    <strong>${k.kpi}</strong>
                    <div class="text-muted small">${k.tipo_meta === 'menor_es_mejor' ? 'Menor es mejor' : 'Mayor es mejor'}</div>
                </td>
                <td>${k.meta} ${k.unidad || ''}</td>
                <td>${k.actual} ${k.unidad || ''}</td>
                <td>${badgeResultadoKpi(k.resultado)}</td>
                <td>${textoTendencia(k.tendencia)}</td>
                <td class="text-center">
                    <button
                        class="btn btn-outline-primary btn-sm"
                        type="button"
                        onclick="abrirModalEditarKpiProyecto(${k.id})">
                        <i class="bi bi-pencil-square"></i>
                        Editar
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
    const confirmado = confirm('Eliminar este KPI del proyecto?');

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

