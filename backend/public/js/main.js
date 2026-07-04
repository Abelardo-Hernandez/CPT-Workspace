function logout() {
    if (typeof auth !== 'undefined') {
        auth.logout();
        return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');

    window.location.href = '/login.html';
}

function formatearFecha(fecha) {
    if (!fecha) return '-';

    const partesFecha = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);

    const date = partesFecha
        ? new Date(
            Number(partesFecha[1]),
            Number(partesFecha[2]) - 1,
            Number(partesFecha[3])
        )
        : new Date(fecha);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace('.', '');
}

function formatearFechaHora(fecha) {
    if (!fecha) return '-';

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return formatearFecha(fecha);
    }

    return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace('.', '');
}

function formatearPorcentaje(valor) {
    return `${Number(valor || 0).toFixed(0)}%`;
}

function normalizarPorcentaje(valor) {
    const numero = Number(valor || 0);

    if (Number.isNaN(numero)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numero)));
}

function claseColorAvance(valor) {
    const porcentaje = normalizarPorcentaje(valor);

    if (porcentaje >= 100) return 'progress-color-blue';
    if (porcentaje > 90) return 'progress-color-green';
    if (porcentaje >= 50) return 'progress-color-yellow';
    return 'progress-color-red';
}

function aplicarColorAvance(elemento, valor) {
    if (!elemento) return;

    elemento.classList.remove(
        'progress-color-red',
        'progress-color-yellow',
        'progress-color-green',
        'progress-color-blue',
        'bg-danger',
        'bg-warning',
        'bg-success',
        'bg-primary'
    );

    elemento.classList.add(claseColorAvance(valor));
}

function actualizarBarraProgreso(elemento, valor, opciones = {}) {
    if (!elemento) return;

    const porcentaje = normalizarPorcentaje(valor);

    elemento.style.width = `${porcentaje}%`;
    aplicarColorAvance(elemento, porcentaje);

    if (opciones.mostrarTexto) {
        elemento.textContent = `${porcentaje}%`;
    }
}

function textoEstatus(estatus) {
    const textos = {
        en_tiempo: 'En tiempo',
        en_riesgo: 'En riesgo',
        atrasado: 'Atrasado',
        completado: 'Completado',
        sin_seguimiento: 'Sin seguimiento',

        pendiente: 'Pendiente',
        en_proceso: 'En proceso',
        terminada: 'Terminada',
        vencida: 'Vencida',

        abierta: 'Abierta',
        cerrada: 'Cerrada',
        programada: 'Programada',
        activa: 'Activa',
        finalizada: 'Finalizada',
        cancelada: 'Cancelada',

        cumple: 'Cumple',
        riesgo: 'Riesgo',
        no_cumple: 'No cumple'
    };

    return textos[estatus] || estatus || '-';
}

function colorEstatus(estatus) {
    const colores = {
        en_tiempo: 'success',
        en_riesgo: 'warning',
        atrasado: 'danger',
        completado: 'primary',
        sin_seguimiento: 'secondary',

        pendiente: 'secondary',
        en_proceso: 'warning',
        terminada: 'success',
        vencida: 'danger',

        abierta: 'success',
        cerrada: 'secondary',
        programada: 'primary',
        activa: 'success',
        finalizada: 'secondary',
        cancelada: 'danger',

        cumple: 'success',
        riesgo: 'warning',
        no_cumple: 'danger'
    };

    return colores[estatus] || 'secondary';
}

function textoPrioridad(prioridad) {
    const textos = {
        alta: 'Alta',
        media: 'Media',
        baja: 'Baja'
    };

    return textos[prioridad] || prioridad || '-';
}

function colorPrioridad(prioridad) {
    const colores = {
        alta: 'danger',
        media: 'warning',
        baja: 'success'
    };

    return colores[prioridad] || 'secondary';
}

function badgeBootstrap(texto, color) {
    const claseTexto = color === 'warning' ? 'text-dark' : '';

    return `
        <span class="badge bg-${color} ${claseTexto}">
            ${texto}
        </span>
    `;
}

function ocultarMenu(ids) {
    ids.forEach(id => {
        const item = document.getElementById(id);

        if (item) {
            item.style.display = 'none';
        }
    });
}

function ocultarMenuPorRutas(rutas) {
    document.querySelectorAll('.sidebar a[href]').forEach(item => {
        const href = item.getAttribute('href') || '';

        if (rutas.includes(href)) {
            item.style.display = 'none';
        }
    });
}

function obtenerRolActual() {
    return String(localStorage.getItem('rol') || '').toLowerCase();
}

function aplicarPermisosMenu() {
    const rolActual = obtenerRolActual();

    if (rolActual === 'consulta') {
        ocultarMenu([
            'menuUsuarios',
            'menuAreas',
            'menuProyectos',
            'menuReuniones',
            'menuAcciones',
            'menuKpis',
            'menuKPIs',
            'menuKpiResultados'
        ]);
        ocultarMenuPorRutas([
            'usuarios.html',
            'areas.html',
            'proyectos.html',
            'reuniones.html',
            'kpis.html',
            'resultados-kpis.html'
        ]);
    }

    if (rolActual === 'colaborador') {
        ocultarMenu([
            'menuUsuarios',
            'menuAreas',
            'menuReuniones',
            'menuKpis',
            'menuKPIs',
            'menuKpiResultados'
        ]);
        ocultarMenuPorRutas([
            'usuarios.html',
            'areas.html',
            'reuniones.html',
            'kpis.html',
            'resultados-kpis.html'
        ]);
    }
}

function marcarMenuActivo() {
    const pagina = window.location.pathname.split('/').pop();

    const menus = {
        'dashboard.html': 'menuDashboard',
        'proyectos.html': 'menuProyectos',
        'proyecto-detalle.html': 'menuProyectos',
        'usuarios.html': 'menuUsuarios',
        'areas.html': 'menuAreas',
        'reuniones.html': 'menuReuniones',
        'reunion-detalle.html': 'menuReuniones',
        'kpis.html': 'menuKpis',
        'resultados-kpis.html': 'menuKpiResultados',
        'tv.html': 'menuTV'
    };

    const menuActivo = menus[pagina];

    if (menuActivo) {
        document.getElementById(menuActivo)?.classList.add('active');
    }
}

function actualizarFechaActual() {
    const fechaActual = document.getElementById('fechaActual');

    if (!fechaActual) {
        return;
    }

    fechaActual.textContent = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function inicializarMenu() {
    aplicarPermisosMenu();
    marcarMenuActivo();
    actualizarFechaActual();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMenu);
} else {
    inicializarMenu();
}
