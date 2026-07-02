import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { SeccionApp } from '../../types';

const TOUR_KEY = 'greenlog.tour.completed.v3';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Espera a que un selector exista en el DOM (hasta `timeoutMs`).
 * Útil cuando el tour cambia de sección y los elementos aún no se han montado.
 */
const waitForSelector = async (selector: string, timeoutMs = 1800): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (document.querySelector(selector)) return;
    await wait(80);
  }
};

/** Cambia la vista del módulo de Reportes (0=Explora, 1=Comparación, 2=Zona, 3=Proveedores). */
const irAVistaReportes = (v: number) => {
  window.dispatchEvent(new CustomEvent('greenlog:reportes-vista', { detail: v }));
};

// ── Estilos del tour (popover con identidad GreenLog + pulso en el elemento) ──
const TOUR_STYLE_ID = 'greenlog-tour-style';
const injectTourStyles = () => {
  if (document.getElementById(TOUR_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = TOUR_STYLE_ID;
  style.textContent = `
    .greenlog-tour.driver-popover {
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0, 48, 87, 0.28);
      border: 1px solid rgba(72, 148, 110, 0.25);
      max-width: 380px;
      animation: glTourIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes glTourIn {
      from { opacity: 0; transform: translateY(10px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .greenlog-tour .driver-popover-title {
      font-weight: 800; font-size: 16px; color: #003057;
    }
    .greenlog-tour .driver-popover-description { color: #334155; font-size: 13.5px; }
    .greenlog-tour .driver-popover-progress-text {
      color: #48946e; font-weight: 700; font-size: 11px; letter-spacing: 0.4px;
    }
    .greenlog-tour .driver-popover-navigation-btns button {
      border-radius: 8px; font-weight: 600; text-shadow: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .greenlog-tour .driver-popover-navigation-btns button:hover {
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .greenlog-tour .driver-popover-next-btn, .greenlog-tour .driver-popover-done-btn {
      background: linear-gradient(135deg, #48946e, #3a7d5c); color: #fff; border: none;
    }
    .greenlog-tour .driver-popover-prev-btn { background: #f1f5f9; color: #003057; border: none; }
    .greenlog-tour .driver-popover-arrow { border-color: transparent; }
    /* Pulso suave sobre el elemento resaltado para guiar el ojo */
    .driver-active-element { animation: glPulse 1.8s ease-in-out infinite; border-radius: 12px; }
    @keyframes glPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(72, 148, 110, 0.45); }
      50% { box-shadow: 0 0 0 10px rgba(72, 148, 110, 0); }
    }
  `;
  document.head.appendChild(style);
};

// Chip HTML reutilizable para "pruébalo tú mismo".
const chipInteraccion = (texto: string) =>
  `<p style="margin:10px 0 0 0;display:inline-flex;align-items:center;gap:6px;background:#ebf6f0;color:#48946e;font-weight:700;font-size:12px;padding:4px 10px;border-radius:999px">👆 ${texto}</p>`;

export const startTour = (setSeccion: (s: SeccionApp) => void, isAdmin = false) => {
  injectTourStyles();

  const pasos: DriveStep[] = [
    // ───────────────────────── BIENVENIDA ─────────────────────────
    {
      popover: {
        title: isAdmin ? '👋 Bienvenido, administrador' : '👋 Bienvenido a GreenLog',
        description: `<p style="margin:0 0 8px 0">GreenLog te permite <b>planear, ejecutar y analizar</b> las actividades ambientales de CENIT en un solo lugar.</p>
          ${isAdmin
            ? '<p style="margin:0 0 8px 0">Como <b>admin</b> verás además las herramientas de carga masiva, tarifas, actualización de planeaciones y aprobaciones.</p>'
            : '<p style="margin:0 0 8px 0">Este recorrido te muestra lo que puedes hacer en <b>tus zonas</b>: planear actividades, seguir su ejecución y analizar el presupuesto.</p>'}
          <p style="margin:0;color:#003057;font-weight:600">Dura ~2 minutos. ¡Vamos!</p>`,
      },
    },

    // ───────────────────────── INICIO ─────────────────────────
    {
      element: '#app-sidebar',
      popover: {
        title: 'Menú principal',
        description: 'Navega entre los 4 módulos: <b>Inicio</b> (resumen), <b>Planeación</b>, <b>Ejecución</b> y <b>Reportes</b>.',
        side: 'right',
      },
      onHighlightStarted: () => { setSeccion('dashboard'); },
    },
    {
      element: '#dashboard-kpis',
      popover: {
        title: '📌 Indicadores en vivo',
        description: `<p style="margin:0 0 6px 0">La página de inicio resume la planeación con <b>datos reales</b>:</p>
          <ul style="margin:0;padding-left:18px;font-size:13px">
            <li><b>Actividades planeadas</b> 2027</li>
            <li><b>Presupuesto 2027</b> (OPEX en vivo)</li>
            <li><b>Variación vs 2026</b> frente a la línea base</li>
            <li><b>Cobertura</b> de estaciones y zonas</li>
          </ul>`,
        side: 'top',
      },
    },

    // ───────────────────────── PLANEACIÓN ─────────────────────────
    {
      element: '#nav-planeacion',
      popover: {
        title: '📋 Planeación',
        description: isAdmin
          ? 'Donde se registran y aprueban todas las actividades del año.'
          : 'Donde registras las actividades del año en tus zonas: monitoreos, compensaciones, pagos, servicios…',
        side: 'right',
      },
      onHighlightStarted: async () => {
        setSeccion('planeacion');
        await waitForSelector('#planeacion-header');
      },
    },
    {
      element: '#planeacion-new-btn',
      popover: {
        title: '➕ Nueva planeación',
        description: `<p style="margin:0">El botón verde abre un wizard paso a paso: línea operativa → zona y lugar → clasificación (OPEX/CAPEX) → ítems → programación mensual.</p>
          ${chipInteraccion('Al terminar el tour, crea tu primera actividad aquí')}`,
        side: 'left',
      },
    },
    // Solo admin: herramientas masivas.
    ...(isAdmin ? ([
      {
        element: '#planeacion-bulk-btn',
        popover: {
          title: '📥 Carga Masiva (admin)',
          description: `<p style="margin:0 0 6px 0">Sube muchas actividades desde Excel. Hay 2 plantillas (genérica y compensaciones) y el sistema detecta cuál usaste.</p>
            <p style="margin:0;font-size:12px;color:#666">Junto a este botón están también <b>Tarifas Monitoreos</b> (recalcular precios) y <b>Actualizar planeaciones</b> (completar necesidades en masa).</p>`,
          side: 'left',
        },
      },
      {
        popover: {
          title: '✅ Aprobaciones (admin)',
          description: `<p style="margin:0 0 8px 0">Las actividades creadas por los usuarios quedan <b>pendientes de aprobación</b>.</p>
            <p style="margin:0">Desde el detalle de cada actividad puedes <b>aprobar o devolver</b> la planeación; el usuario recibe una notificación con el resultado.</p>`,
        },
      },
    ] as DriveStep[]) : ([
      {
        popover: {
          title: '🔔 Revisión y aprobación',
          description: `<p style="margin:0 0 8px 0">Cuando creas o editas una actividad, queda <b>pendiente de revisión</b> por un administrador.</p>
            <p style="margin:0">Te llegará una <b>notificación</b> (campana de arriba) cuando sea aprobada o devuelta con comentarios.</p>`,
        },
      },
    ] as DriveStep[])),
    {
      element: '#planeacion-table',
      popover: {
        title: 'Tus actividades',
        description: `<p style="margin:0">Cada fila se puede abrir (detalle completo), editar o filtrar por zona, línea y estado.</p>
          ${chipInteraccion('Haz clic en cualquier fila para ver su detalle')}`,
        side: 'top',
      },
    },

    // ───────────────────────── EJECUCIÓN ─────────────────────────
    {
      element: '#nav-ejecucion',
      popover: {
        title: '🔄 Ejecución',
        description: 'Planeación es lo que vas a hacer; Ejecución es lo que está pasando: cada tarjeta muestra el avance y los hitos de una actividad en curso.',
        side: 'right',
      },
      onHighlightStarted: async () => {
        setSeccion('ejecucion');
        await waitForSelector('#ejecucion-grid');
      },
    },

    // ───────────────────────── REPORTES (las 4 vistas) ─────────────────────────
    {
      element: '#nav-reportes',
      popover: {
        title: '📈 Reportes',
        description: 'El tablero financiero: comparación 2026 vs 2027, análisis por zona y dependencia de proveedores. Es la parte más nueva — mírala en acción.',
        side: 'right',
      },
      onHighlightStarted: async () => {
        setSeccion('reportes');
        await waitForSelector('#reportes-nav');
        irAVistaReportes(0);
      },
    },
    {
      element: '#reportes-nav',
      popover: {
        title: '🧭 Navegación por vistas',
        description: `<p style="margin:0">El reporte se recorre como una presentación: usa las <b>flechas</b> o los <b>puntos</b> para moverte entre las 4 vistas.</p>
          ${chipInteraccion('El tour las irá cambiando por ti')}`,
        side: 'bottom',
      },
    },
    {
      element: '#reportes-mapa',
      popover: {
        title: '🗺️ Explora por zona',
        description: `<p style="margin:0 0 6px 0">El mapa de Colombia muestra el presupuesto por zona con su participación.</p>
          <p style="margin:0"><b>Haz clic en un departamento</b> para filtrar todo el reporte por esa zona; clic de nuevo para quitarlo.</p>
          ${chipInteraccion('También puedes filtrar por línea clicando las barras')}`,
        side: 'left',
      },
      onHighlightStarted: async () => {
        irAVistaReportes(0);
        await wait(450);
      },
    },
    {
      element: '#reportes-vista-comparacion',
      popover: {
        title: '⚖️ Comparación 2026 vs 2027',
        description: `<p style="margin:0 0 6px 0">Presupuesto por línea operativa con la <b>brecha en naranja</b>, y la <b>mensualización</b> de la caja.</p>
          <p style="margin:0">Aquí las etiquetas del mapa muestran la <b>variación vs 2026</b> en % y en dinero.</p>`,
        side: 'left',
      },
      onHighlightStarted: async () => {
        irAVistaReportes(1);
        await waitForSelector('#reportes-vista-comparacion');
        await wait(450);
      },
    },
    {
      element: '#reportes-vista-zona',
      popover: {
        title: '🔥 Análisis por zona',
        description: 'Barras del planeado por zona y el <b>mapa de calor</b> Zona × Línea (verde = menor gasto, rojo = mayor) para ubicar dónde poner controles.',
        side: 'top',
      },
      onHighlightStarted: async () => {
        irAVistaReportes(2);
        await waitForSelector('#reportes-vista-zona');
        await wait(450);
      },
    },
    {
      element: '#reportes-vista-proveedores',
      popover: {
        title: '🤝 Dependencia de proveedores',
        description: `<p style="margin:0">Participación del gasto por proveedor con el <b>umbral del 20%</b> y su nivel de riesgo (alto / medio / bajo). El índice general indica si hay concentración excesiva.</p>`,
        side: 'top',
      },
      onHighlightStarted: async () => {
        irAVistaReportes(3);
        await waitForSelector('#reportes-vista-proveedores');
        await wait(450);
      },
    },
    {
      element: '#reportes-descargar',
      popover: {
        title: '⬇️ Descargar reporte',
        description: 'Todo el análisis se exporta a un <b>Excel de 8 hojas</b> listo para comité: resumen, comparaciones, Pareto, caja, proveedores y más.',
        side: 'bottom',
      },
      onHighlightStarted: async () => {
        irAVistaReportes(0);
        await wait(300);
      },
    },

    // ───────────────────────── CIERRE ─────────────────────────
    {
      element: '#tour-trigger',
      popover: {
        title: '❓ ¿Necesitas repasar?',
        description: 'Puedes repetir este tour cuando quieras desde aquí.',
        side: 'left',
      },
      onHighlightStarted: () => { setSeccion('dashboard'); },
    },
    {
      popover: {
        title: '🎉 ¡Listo!',
        description: isAdmin
          ? `<p style="margin:0 0 8px 0">Ya conoces la app completa. Sugerencia: revisa las <b>planeaciones pendientes de aprobación</b> y luego explora el tablero de Reportes con los filtros del mapa.</p>`
          : `<p style="margin:0 0 8px 0">La mejor forma de aprender es <b>creando tu primera actividad</b>:</p>
            <ol style="margin:0;padding-left:18px;font-size:13px">
              <li>Ve a <b>Planeación</b></li>
              <li>Pulsa <b>"Nueva planeación"</b></li>
              <li>Sigue el wizard — todos los campos tienen ayuda</li>
            </ol>`,
      },
    },
  ];

  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.7,
    stagePadding: 8,
    stageRadius: 14,
    smoothScroll: true,
    popoverClass: 'greenlog-tour',
    doneBtnText: 'Finalizar',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    progressText: 'Paso {{current}} de {{total}}',
    steps: pasos,
    onDestroyed: () => {
      try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
    },
  });

  driverObj.drive();
};

/**
 * Llama esto al iniciar la app: dispara el tour automáticamente la PRIMERA vez
 * que un usuario visita la página. Si ya lo completó (o lo cerró), no lo vuelve
 * a abrir hasta que cambies el `TOUR_KEY` a una nueva versión.
 */
export const maybeAutoStartTour = (setSeccion: (s: SeccionApp) => void, isAdmin = false) => {
  try {
    if (localStorage.getItem(TOUR_KEY) === '1') return;
  } catch { /* localStorage puede fallar en modos privados */ }

  // Esperar a que el shell esté montado antes de empezar
  setTimeout(() => {
    if (document.querySelector('#sidebar-logo')) {
      startTour(setSeccion, isAdmin);
    }
  }, 600);
};
