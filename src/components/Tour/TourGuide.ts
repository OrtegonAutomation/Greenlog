import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { SeccionApp } from '../../types';

export const startTour = (setSeccion: (s: SeccionApp) => void) => {
    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: 'Finalizar',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        progressText: 'Paso {{current}} de {{total}}',
        steps: [
            { element: '#sidebar-logo', popover: { title: 'Bienvenido a GreenLog', description: 'Tu sistema integral para el control y gestión ambiental. Aquí comienza tu experiencia.' } },
            { element: '#app-sidebar', popover: { title: 'Navegación Principal', description: 'Usa este menú para acceder a los diferentes módulos: Planeación, Ejecución y Reportes.' } },
            { element: '#dashboard-kpis', popover: { title: 'Indicadores Clave', description: 'Visualiza rápidamente el estado de tus actividades ambientales y métricas importantes.' } },
            {
                element: '#nav-planeacion',
                popover: { title: 'Módulo de Planeación', description: 'Vamos a explorar cómo gestionar tus actividades.' },
                onHighlightStarted: () => { setSeccion('planeacion'); },
            },
            { element: '#planeacion-header', popover: { title: 'Planeación Ambiental', description: 'Aquí puedes ver, filtrar y crear nuevas actividades ambientales.', side: 'bottom' } },
            { element: '#planeacion-new-btn', popover: { title: 'Nueva Actividad', description: 'Haz clic aquí para registrar una nueva actividad en el sistema.', side: 'left' } },
            {
                element: '#nav-ejecucion',
                popover: { title: 'Módulo de Ejecución', description: 'Pasemos a ver el seguimiento en tiempo real.' },
                onHighlightStarted: () => { setSeccion('ejecucion'); },
            },
            { element: '#ejecucion-grid', popover: { title: 'Seguimiento en Campo', description: 'Monitorea el avance de las actividades con tarjetas visuales y barras de progreso.', side: 'top' } },
            {
                element: '#nav-reportes',
                popover: { title: 'Módulo de Reportes', description: 'Finalmente, analicemos los resultados.' },
                onHighlightStarted: () => { setSeccion('reportes'); },
            },
            { element: '#reportes-charts', popover: { title: 'Análisis y Estadísticas', description: 'Gráficos detallados para la toma de decisiones basada en datos.', side: 'top' } },
            { element: '#tour-trigger', popover: { title: '¿Necesitas ayuda?', description: 'Puedes volver a iniciar este tour en cualquier momento haciendo clic aquí.', side: 'left' } }
        ]
    });

    driverObj.drive();
};
