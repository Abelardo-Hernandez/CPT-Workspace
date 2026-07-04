const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/login.html';
}

let graficaProyectos = null;
let graficaAcciones = null;

function actualizarHora() {
    const ahora = new Date();

    document.getElementById('horaTV').textContent =
        ahora.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

    document.getElementById('fechaTV').textContent =
        ahora.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
}

async function fetchJSON(url) {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return await res.json();
}

async function cargarResumen() {
    const data = await fetchJSON('/api/dashboard/resumen');

    document.getElementById('usuarios').textContent = data.usuarios;
    document.getElementById('areas').textContent = data.areas;
    document.getElementById('proyectos').textContent = data.proyectos;
    document.getElementById('reuniones').textContent = data.reuniones;
}

async function cargarAvanceGlobal() {
    const data = await fetchJSON('/api/dashboard/avance-global');

    const avance = data.avance_global || 0;

    document.getElementById('avanceGlobal').textContent = `${avance}%`;
    document.getElementById('avanceGlobalMini').textContent = `${avance}%`;
    actualizarBarraProgreso(
        document.getElementById('barraGlobal'),
        avance
    );
}

async function cargarProximaReunion() {
    const data = await fetchJSON('/api/dashboard/info-reuniones');

    document.getElementById('proximaReunion').innerHTML = `
        <h3>#${data.proxima?.numero_reunion || '-'}</h3>
        <p>${formatearFecha(data.proxima?.fecha_proxima_reunion)}</p>
        <p>${data.proxima?.hora_proxima_reunion || ''}</p>
    `;
}

async function cargarProximasAcciones() {
    const acciones = await fetchJSON('/api/dashboard/proximas-acciones');

    const contenedor = document.getElementById('proximasAccionesTV');
    contenedor.innerHTML = '';

    if (!acciones.length) {
        contenedor.innerHTML = '<div class="empty">Sin acciones próximas</div>';
        return;
    }

    acciones.slice(0, 6).forEach(a => {
        contenedor.innerHTML += `
            <div class="list-item">
                <strong>${a.descripcion}</strong>
                <span>${formatearFecha(a.fecha_compromiso)} · ${a.estatus}</span>
            </div>
        `;
    });
}

async function cargarAccionesVencidas() {
    const acciones = await fetchJSON('/api/dashboard/acciones-vencidas');

    const contenedor = document.getElementById('accionesVencidasTV');
    contenedor.innerHTML = '';

    if (!acciones.length) {
        contenedor.innerHTML = '<div class="empty">Sin acciones vencidas</div>';
        return;
    }

    acciones.slice(0, 4).forEach(a => {
        contenedor.innerHTML += `
            <div class="list-item">
                <strong>${a.descripcion}</strong>
                <span>Venció: ${formatearFecha(a.fecha_compromiso)}</span>
            </div>
        `;
    });
}

async function cargarGraficaProyectos() {
    const data = await fetchJSON('/api/dashboard/seguimiento-resumen');

    const ctx = document.getElementById('graficaTVProyectos');

    if (graficaProyectos) {
        graficaProyectos.destroy();
    }

    graficaProyectos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['En tiempo', 'En riesgo', 'Atrasado', 'Completado'],
            datasets: [{
                data: [
                    data.en_tiempo,
                    data.en_riesgo,
                    data.atrasado,
                    data.completado
                ],
                backgroundColor: [
                    '#22c55e',
                    '#facc15',
                    '#ef4444',
                    '#38bdf8'
                ],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        boxWidth: 12,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

async function cargarGraficaAcciones() {
    const data = await fetchJSON('/api/dashboard/acciones-resumen');

    const ctx = document.getElementById('graficaTVAcciones');

    if (graficaAcciones) {
        graficaAcciones.destroy();
    }

    graficaAcciones = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendiente', 'En proceso', 'Terminada', 'Vencida'],
            datasets: [{
                data: [
                    data.pendiente,
                    data.en_proceso,
                    data.terminada,
                    data.vencida
                ],
                backgroundColor: [
                    '#94a3b8',
                    '#facc15',
                    '#22c55e',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        boxWidth: 12,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

async function cargarVistaTV() {
    await Promise.all([
        cargarResumen(),
        cargarAvanceGlobal(),
        cargarProximaReunion(),
        cargarProximasAcciones(),
        cargarAccionesVencidas(),
        cargarGraficaProyectos(),
        cargarGraficaAcciones()
    ]);

    document.getElementById('ultimaActualizacion').textContent =
        new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
}

function salirTV(){

    if(confirm('¿Salir de la Vista TV?')){

        window.location.href='dashboard.html';

    }

}

function pantallaCompleta(){

    if(!document.fullscreenElement){

        document.documentElement.requestFullscreen();

    }else{

        document.exitFullscreen();

    }

}

actualizarHora();
setInterval(actualizarHora, 1000);

cargarVistaTV();
setInterval(cargarVistaTV, 30000);
