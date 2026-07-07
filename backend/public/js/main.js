const alertaNativa = window.alert.bind(window);

function instalarEstilosAlertas() {
    if (document.getElementById('ptcAlertStyles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'ptcAlertStyles';
    style.textContent = `
        .ptc-alert-layer {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.42);
            backdrop-filter: blur(4px);
        }

        .ptc-alert-box {
            width: min(420px, 100%);
            border-radius: 18px;
            background: #ffffff;
            border: 1px solid rgba(15, 23, 42, 0.08);
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
            padding: 24px;
            text-align: left;
            animation: ptcAlertIn 0.18s ease-out;
        }

        .ptc-alert-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 14px;
            color: #ffffff;
            font-size: 24px;
            background: linear-gradient(135deg, #198754, #2cbb78);
        }

        .ptc-alert-icon.warning {
            background: linear-gradient(135deg, #f59e0b, #facc15);
        }

        .ptc-alert-title {
            margin: 0 0 8px;
            color: #0f172a;
            font-size: 20px;
            font-weight: 800;
        }

        .ptc-alert-message {
            margin: 0;
            color: #475569;
            font-size: 15px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .ptc-alert-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 22px;
        }

        .ptc-alert-actions .btn {
            min-width: 104px;
            font-weight: 700;
        }

        @keyframes ptcAlertIn {
            from {
                opacity: 0;
                transform: translateY(14px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    `;

    document.head.appendChild(style);
}

function mostrarAlertaPersonalizada(mensaje, opciones = {}) {
    if (!document.body) {
        alertaNativa(mensaje);
        return Promise.resolve(true);
    }

    instalarEstilosAlertas();

    const esConfirmacion = opciones.confirmar === true;
    const layer = document.createElement('div');
    const icono = esConfirmacion ? 'bi-question-lg' : 'bi-check2';
    const titulo = opciones.titulo || (esConfirmacion ? 'Confirmar acción' : 'Listo');

    layer.className = 'ptc-alert-layer';
    layer.innerHTML = `
        <section class="ptc-alert-box" role="dialog" aria-modal="true">
            <div class="ptc-alert-icon ${esConfirmacion ? 'warning' : ''}">
                <i class="bi ${icono}"></i>
            </div>
            <h3 class="ptc-alert-title"></h3>
            <p class="ptc-alert-message"></p>
            <div class="ptc-alert-actions">
                ${esConfirmacion ? '<button class="btn btn-light" type="button" data-alert-cancel>Cancelar</button>' : ''}
                <button class="btn btn-primary" type="button" data-alert-ok>
                    ${esConfirmacion ? 'Confirmar' : 'Entendido'}
                </button>
            </div>
        </section>
    `;

    layer.querySelector('.ptc-alert-title').textContent = titulo;
    layer.querySelector('.ptc-alert-message').textContent = mensaje || '';
    document.body.appendChild(layer);

    const ok = layer.querySelector('[data-alert-ok]');
    const cancel = layer.querySelector('[data-alert-cancel]');

    return new Promise(resolve => {
        function cerrar(valor) {
            document.removeEventListener('keydown', manejarTecla);
            layer.remove();
            resolve(valor);
        }

        function manejarTecla(event) {
            if (event.key === 'Escape') {
                cerrar(false);
            }
        }

        ok.addEventListener('click', () => cerrar(true));
        cancel?.addEventListener('click', () => cerrar(false));
        document.addEventListener('keydown', manejarTecla);
        ok.focus();
    });
}

function notificar(mensaje, opciones = {}) {
    return mostrarAlertaPersonalizada(mensaje, opciones);
}

function confirmar(mensaje, opciones = {}) {
    return mostrarAlertaPersonalizada(mensaje, {
        ...opciones,
        confirmar: true
    });
}

window.alert = mensaje => {
    notificar(mensaje);
};

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

function cerrarMenuMovil() {
    document.body.classList.remove('mobile-menu-open');
    document.getElementById('mobileMenuToggle')?.setAttribute('aria-expanded', 'false');
}

function alternarMenuMovil() {
    const abierto = document.body.classList.toggle('mobile-menu-open');
    document.getElementById('mobileMenuToggle')?.setAttribute('aria-expanded', abierto ? 'true' : 'false');
}

function inicializarMenuMovil() {
    const sidebar = document.querySelector('.sidebar');

    if (!sidebar || document.getElementById('mobileMenuToggle')) {
        return;
    }

    const boton = document.createElement('button');
    boton.id = 'mobileMenuToggle';
    boton.className = 'mobile-menu-toggle';
    boton.type = 'button';
    boton.setAttribute('aria-label', 'Abrir menu de navegacion');
    boton.setAttribute('aria-expanded', 'false');
    boton.innerHTML = '<i class="bi bi-list"></i>';

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    document.body.appendChild(backdrop);
    document.body.appendChild(boton);

    boton.addEventListener('click', alternarMenuMovil);
    backdrop.addEventListener('click', cerrarMenuMovil);

    sidebar.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', cerrarMenuMovil);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            cerrarMenuMovil();
        }
    });
}

function inicializarMenu() {
    aplicarPermisosMenu();
    marcarMenuActivo();
    actualizarFechaActual();
    inicializarMenuMovil();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMenu);
} else {
    inicializarMenu();
}
