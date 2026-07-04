auth.verificarSesion();

async function cargarProyectos() {
    const res = await fetch('/api/proyectos', {
        headers: auth.headers()
    });

    const proyectos = await res.json();

    const select = document.getElementById('proyecto_id');
    select.innerHTML = '<option value="">Selecciona proyecto</option>';

    proyectos.forEach(p => {
        select.innerHTML += `
            <option value="${p.id}">${p.nombre}</option>
        `;
    });
}

async function cargarKpis() {
    const res = await fetch('/api/kpis', {
        headers: auth.headers()
    });

    const kpis = await res.json();

    const select = document.getElementById('kpi_id');
    select.innerHTML = '<option value="">Selecciona KPI</option>';

    kpis.forEach(k => {
        select.innerHTML += `
            <option value="${k.id}">
                ${k.nombre} (${k.unidad || ''})
            </option>
        `;
    });
}

function badgeResultado(resultado) {
    if (resultado === 'cumple') {
        return '<span class="badge bg-success">Cumple</span>';
    }

    if (resultado === 'riesgo') {
        return '<span class="badge bg-warning text-dark">Riesgo</span>';
    }

    return '<span class="badge bg-danger">No cumple</span>';
}

function textoTendencia(tendencia) {
    if (tendencia === 'sube') return 'Sube';
    if (tendencia === 'baja') return 'Baja';
    return 'Igual';
}

async function cargarResultadosKpi() {
    const res = await fetch('/api/kpis/resultados', {
        headers: auth.headers()
    });

    const resultados = await res.json();

    const tabla = document.getElementById('tablaResultadosKpi');
    tabla.innerHTML = '';

    resultados.forEach(r => {
        tabla.innerHTML += `
            <tr>
                <td>${r.proyecto || '-'}</td>
                <td>${r.kpi}</td>
                <td>${r.meta} ${r.unidad || ''}</td>
                <td>${r.actual} ${r.unidad || ''}</td>
                <td>${badgeResultado(r.resultado)}</td>
                <td>${textoTendencia(r.tendencia)}</td>
            </tr>
        `;
    });
}

async function crearResultadoKpi() {
    const body = {
        proyecto_id: document.getElementById('proyecto_id').value,
        kpi_id: document.getElementById('kpi_id').value,
        meta: document.getElementById('meta').value,
        actual: document.getElementById('actual').value,
        tendencia: document.getElementById('tendencia').value
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

    alert('Resultado KPI registrado');

    document.getElementById('meta').value = '';
    document.getElementById('actual').value = '';

    cargarResultadosKpi();
}

cargarProyectos();
cargarKpis();
cargarResultadosKpi();
