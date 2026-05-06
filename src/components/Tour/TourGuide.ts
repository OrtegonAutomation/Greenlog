import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { SeccionApp } from '../../types';

const TOUR_KEY = 'greenlog.tour.completed.v2';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Espera a que un selector exista en el DOM (hasta `timeoutMs`).
 * Útil cuando el tour cambia de sección y los elementos aún no se han montado.
 */
const waitForSelector = async (selector: string, timeoutMs = 1500): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (document.querySelector(selector)) return;
    await wait(80);
  }
};

export const startTour = (setSeccion: (s: SeccionApp) => void) => {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.65,
    stagePadding: 8,
    stageRadius: 12,
    smoothScroll: true,
    doneBtnText: 'Finalizar',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    progressText: 'Paso {{current}} de {{total}}',
    steps: [
      // ───────────────────────── BIENVENIDA ─────────────────────────
      {
        popover: {
          title: '👋 Bienvenido a GreenLog',
          description: `<p style="margin:0 0 8px 0">Te voy a mostrar en pocos minutos cómo funciona la herramienta.</p>
            <p style="margin:0 0 8px 0">GreenLog te permite <b>planear, ejecutar y reportar</b> todas las actividades ambientales de CENIT en un solo lugar — desde monitoreos hasta compensaciones, pagos y servicios.</p>
            <p style="margin:0;color:#003057;font-weight:600">Pulsa "Siguiente" para empezar.</p>`,
        },
      },

      // ───────────────────────── DASHBOARD ─────────────────────────
      {
        element: '#sidebar-logo',
        popover: {
          title: 'Identidad de la app',
          description: 'GreenLog · Sistema de Control Ambiental de CENIT. Este logo te lleva siempre al inicio.',
          side: 'right',
          align: 'start',
        },
        onHighlightStarted: () => { setSeccion('dashboard'); },
      },
      {
        element: '#app-sidebar',
        popover: {
          title: 'Menú principal',
          description: 'Aquí navegas entre los <b>4 módulos</b> de la app: Dashboard (resumen), Planeación, Ejecución y Reportes.',
          side: 'right',
        },
      },
      {
        element: '#dashboard-hero',
        popover: {
          title: 'Resumen general',
          description: 'El dashboard te muestra de un vistazo cómo va el año: actividades planeadas, en ejecución, cerradas y pendientes de aprobación.',
          side: 'bottom',
        },
      },
      {
        element: '#dashboard-kpis',
        popover: {
          title: 'Indicadores clave (KPIs)',
          description: 'Estos números te dicen al instante: cuántas actividades hay, cuánto presupuesto se planeó vs. se ejecutó, y qué tan al día estás.',
          side: 'top',
        },
      },

      // ───────────────────────── PLANEACIÓN ─────────────────────────
      {
        element: '#nav-planeacion',
        popover: {
          title: '📋 Módulo de Planeación',
          description: 'Aquí pasarás la mayoría del tiempo. Es donde registras todas las actividades del año: monitoreos, compensaciones, pagos, servicios, etc.',
          side: 'right',
        },
        onHighlightStarted: async () => {
          setSeccion('planeacion');
          await waitForSelector('#planeacion-header');
        },
      },
      {
        element: '#planeacion-header',
        popover: {
          title: 'Planeación Ambiental',
          description: 'En esta pantalla ves todas las actividades que se van a ejecutar y desde aquí lanzas las acciones principales.',
          side: 'bottom',
        },
      },
      {
        element: '#planeacion-new-btn',
        popover: {
          title: '➕ Nueva planeación',
          description: `<p style="margin:0 0 8px 0">El botón <b>verde</b> abre un wizard de 6-7 pasos para crear una actividad nueva.</p>
            <ul style="margin:0;padding-left:18px;font-size:13px">
              <li><b>Línea operativa</b> (Monitoreos, Compensaciones, etc.)</li>
              <li><b>Zona y lugar</b> (estación, sistema/sector)</li>
              <li><b>Descripción</b> (solo para Compensaciones: ID, acto administrativo, jurisdicción)</li>
              <li><b>Clasificación</b> (OPEX/CAPEX, años a planear, contrato)</li>
              <li><b>Ítems / parámetros</b> (qué se va a hacer)</li>
              <li><b>Programación mensual</b> (cuánto y cuándo)</li>
            </ul>`,
          side: 'left',
        },
      },
      {
        element: '#planeacion-bulk-btn',
        popover: {
          title: '📥 Carga Masiva',
          description: `<p style="margin:0 0 8px 0">Si tienes muchas actividades, puedes cargarlas desde Excel.</p>
            <p style="margin:0 0 6px 0"><b>Hay 2 plantillas:</b></p>
            <ul style="margin:0;padding-left:18px;font-size:13px">
              <li><b>Genérica</b> — para Monitoreos, Servicios, Pagos, etc.</li>
              <li><b>Compensaciones</b> — viene pre-llenada con ~30 obligaciones reales para que solo digites cantidades.</li>
            </ul>
            <p style="margin:8px 0 0 0;font-size:12px;color:#666">El sistema detecta automáticamente cuál subiste.</p>`,
          side: 'left',
        },
      },
      {
        element: '#planeacion-export-financiera',
        popover: {
          title: '📊 Exportar Matriz Financiera',
          description: 'Descarga una plantilla Excel con todo el OPEX/CAPEX del año, formateada para enviar a Financiera.',
          side: 'bottom',
        },
      },
      {
        element: '#planeacion-export-detalle',
        popover: {
          title: '📋 Detalle Interno',
          description: 'Reporte por zona, línea operativa, parámetro y mes. Es la vista que usa el equipo ambiental para hacer seguimiento operativo.',
          side: 'bottom',
        },
      },
      {
        element: '#planeacion-table',
        popover: {
          title: 'Lista de actividades',
          description: `<p style="margin:0 0 8px 0">Aquí ves <b>todas las actividades</b> creadas. Cada fila se puede:</p>
            <ul style="margin:0;padding-left:18px;font-size:13px">
              <li>Hacer click para ver el detalle completo</li>
              <li>Editar (vuelve al wizard con datos pre-cargados)</li>
              <li>Eliminar</li>
              <li>Filtrar por zona, línea, estado, etc.</li>
            </ul>`,
          side: 'top',
        },
      },

      // ───────────────────────── COMPENSACIONES ─────────────────────────
      {
        popover: {
          title: '🌳 Sobre Compensaciones',
          description: `<p style="margin:0 0 8px 0">Las <b>Compensaciones / Provisiones</b> tienen su propio flujo dentro de Planeación, con campos específicos:</p>
            <ul style="margin:0 0 8px 0;padding-left:18px;font-size:13px">
              <li><b>Descripción de la obligación</b> — ID, fecha, acto administrativo (Resolución/Comunicado), permiso, autoridad, jurisdicción (corporación + departamento + municipio + vereda/predio), expediente, categoría.</li>
              <li><b>Multi-año</b> — puedes planear hasta 3 años: Año 1 mensualizado, Años 2 y 3 anualizados.</li>
              <li><b>Saldo disponible</b> — si la obligación ya tiene plata asignada, el sistema valida que no superes ese tope.</li>
              <li><b>IPC e IVA por ítem</b> — controla impuestos a nivel granular.</li>
              <li><b>Cambio de actividades por año</b> — siembra → mantenimiento, sin reescribir desde cero.</li>
            </ul>
            <p style="margin:0;font-size:12px;color:#666">Selecciona una línea operativa "Compensaciones" en el wizard para ver estos pasos.</p>`,
        },
      },

      // ───────────────────────── EJECUCIÓN ─────────────────────────
      {
        element: '#nav-ejecucion',
        popover: {
          title: '🔄 Módulo de Ejecución',
          description: 'Mientras Planeación es lo que vas a hacer, Ejecución es lo que estás haciendo ahora.',
          side: 'right',
        },
        onHighlightStarted: async () => {
          setSeccion('ejecucion');
          await waitForSelector('#ejecucion-grid');
        },
      },
      {
        element: '#ejecucion-grid',
        popover: {
          title: 'Seguimiento en campo',
          description: `<p style="margin:0 0 8px 0">Cada tarjeta es una actividad en curso, con su <b>barra de progreso</b> y los hitos cumplidos.</p>
            <p style="margin:0;font-size:12px;color:#666">Útil para ver de un vistazo qué está al día y qué se está retrasando.</p>`,
          side: 'top',
        },
      },

      // ───────────────────────── REPORTES ─────────────────────────
      {
        element: '#nav-reportes',
        popover: {
          title: '📈 Módulo de Reportes',
          description: 'Análisis y gráficos para entender qué está pasando con los datos.',
          side: 'right',
        },
        onHighlightStarted: async () => {
          setSeccion('reportes');
          await waitForSelector('#reportes-charts');
        },
      },
      {
        element: '#reportes-charts',
        popover: {
          title: 'Gráficos y estadísticas',
          description: 'Distribución por zona, evolución mensual del presupuesto, comparación plan vs. ejecutado, top de contratos más usados, etc.',
          side: 'top',
        },
      },

      // ───────────────────────── CIERRE ─────────────────────────
      {
        element: '#tour-trigger',
        popover: {
          title: '❓ ¿Necesitas ayuda?',
          description: `<p style="margin:0 0 8px 0">Puedes <b>repetir este tour</b> cuando quieras desde aquí.</p>
            <p style="margin:0;font-size:12px;color:#666">También está disponible un manual completo en la sección de ayuda.</p>`,
          side: 'left',
        },
        onHighlightStarted: () => { setSeccion('dashboard'); },
      },
      {
        popover: {
          title: '🎉 ¡Listo!',
          description: `<p style="margin:0 0 8px 0">Ya conoces lo básico de GreenLog. La mejor forma de aprender es <b>creando tu primera actividad</b>.</p>
            <p style="margin:0 0 8px 0;color:#003057;font-weight:600">Sugerencia para empezar:</p>
            <ol style="margin:0;padding-left:18px;font-size:13px">
              <li>Ve a <b>Planeación</b></li>
              <li>Pulsa <b>"Nueva planeación"</b></li>
              <li>Sigue los pasos del wizard (todos los campos tienen ayuda contextual)</li>
            </ol>`,
        },
      },
    ],
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
export const maybeAutoStartTour = (setSeccion: (s: SeccionApp) => void) => {
  try {
    if (localStorage.getItem(TOUR_KEY) === '1') return;
  } catch { /* localStorage puede fallar en modos privados */ }

  // Esperar a que el shell esté montado antes de empezar
  setTimeout(() => {
    if (document.querySelector('#sidebar-logo')) {
      startTour(setSeccion);
    }
  }, 600);
};
