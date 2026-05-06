// ============================================================
// SharePointService — Servicio de datos CENIT GREENLOG
// Soporta múltiples listas SharePoint:
//   1. ActividadesAmbientales  → Planeación y ejecución
//   2. Presupuesto2026         → Líneas presupuestales mensuales
//   3. Estaciones              → Catálogo de estaciones con matrices
//   4. PermisosAmbientales     → Permisos por estación
// ============================================================
import { ActividadAmbiental, NuevaActividadPayload, PresupuestoLinea, Estacion } from '../types';

const SITE_URL = "https://ecopetrol.sharepoint.com/sites/Cenit-GreenLog";

// ── Nombres de listas SharePoint ──────────────────────────────
const LISTS = {
  actividades: "ActividadesAmbientales",
  presupuesto: "Presupuesto2026",
  estaciones:  "EstacionesCENIT",
  permisos:    "PermisosAmbientales",
};

const listUrl = (name: string) =>
  `${SITE_URL}/_api/web/lists/getbytitle('${name}')/items`;

// Helper for headers
const getHeaders = async () => {
    return {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose'
    };
};

const getDigest = async (): Promise<string> => {
    const response = await fetch(`${SITE_URL}/_api/contextinfo`, {
        method: "POST",
        headers: { "Accept": "application/json;odata=verbose" }
    });
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
};

// ══════════════════════════════════════════════════════════════
// Sección: Actividades Ambientales
// ══════════════════════════════════════════════════════════════
export const SharePointService = {
    // ── Actividades ────────────────────────────────────────────
    async getAll(): Promise<ActividadAmbiental[]> {
        try {
            const headers = await getHeaders();
            // $expand=Responsable para leer el campo Person (Title, EMail, Id)
            const response = await fetch(listUrl(LISTS.actividades) + "?$top=5000&$expand=Responsable", { headers });
            if (!response.ok) throw new Error(`SharePoint Error: ${response.statusText}`);
            const data = await response.json();
            return data.d.results.map((item: any) => mapSharePointToApp(item));
        } catch (error) {
            console.error("Error fetching from SharePoint", error);
            throw error;
        }
    },

    async create(payload: NuevaActividadPayload & { responsableEmail?: string }): Promise<ActividadAmbiental> {
        const headers = await getHeaders();
        // Resolver el usuario SP por email si se proporciona
        let responsableId: number | undefined;
        if (payload.responsableEmail) {
            try { responsableId = await ensureUser(payload.responsableEmail); }
            catch { console.warn('No se pudo resolver el usuario SP, se omitirá el campo Responsable'); }
        }
        const spPayload = mapAppToSharePoint({ ...payload, responsableId });
        const digest = await getDigest();

        const response = await fetch(listUrl(LISTS.actividades), {
            method: 'POST',
            headers: { ...headers, 'X-RequestDigest': digest },
            body: JSON.stringify(spPayload)
        });

        if (!response.ok) throw new Error(`SharePoint Create Error: ${response.statusText}`);
        const data = await response.json();
        return mapSharePointToApp(data.d);
    },

    async update(id: string, cambios: Partial<NuevaActividadPayload>): Promise<ActividadAmbiental> {
        throw new Error("Update not yet implemented in SP Service");
    },

    async delete(id: string): Promise<void> {
        throw new Error("Delete not yet implemented in SP Service");
    },

    // ── Presupuesto ────────────────────────────────────────────
    async getPresupuesto(): Promise<PresupuestoLinea[]> {
        try {
            const headers = await getHeaders();
            const response = await fetch(listUrl(LISTS.presupuesto) + "?$top=5000&$expand=Responsable", { headers });
            if (!response.ok) throw new Error(`SP Presupuesto Error: ${response.statusText}`);
            const data = await response.json();
            return data.d.results.map((item: any) => mapPresupuesto(item));
        } catch (error) {
            console.error("Error fetching presupuesto", error);
            throw error;
        }
    },

    // ── Estaciones ─────────────────────────────────────────────
    async getEstaciones(): Promise<Estacion[]> {
        try {
            const headers = await getHeaders();
            const response = await fetch(listUrl(LISTS.estaciones) + "?$top=500", { headers });
            if (!response.ok) throw new Error(`SP Estaciones Error: ${response.statusText}`);
            const data = await response.json();
            return data.d.results.map((item: any) => mapEstacion(item));
        } catch (error) {
            console.error("Error fetching estaciones", error);
            throw error;
        }
    },
};

// ══════════════════════════════════════════════════════════════
// Mappers — Actividades
// ══════════════════════════════════════════════════════════════
function mapSharePointToApp(item: any): ActividadAmbiental {
    // El campo Responsable (Person) se expande como objeto { Title, EMail, Id }
    const responsableDisplay: string =
        item.Responsable?.Title ||
        item.Responsable?.EMail ||
        (typeof item.Responsable === 'string' ? item.Responsable : '') ||
        '';
    return {
        id: item.Id.toString(),
        tarea: item.Title || item.Tarea,
        lineaOperativa: item.LineaOperativa?.Value || item.LineaOperativa || 'Monitoreos',
        descripcion: item.Descripcion,
        responsable: responsableDisplay,
        contrato: item.Contrato,
        zona: item.Zona?.Value || item.Zona,
        estacion: item.Estacion?.Value || item.Estacion,
        fechaInicio: item.FechaInicio,
        fechaFin: item.FechaFin,
        mes: item.Mes?.Value || item.Mes,
        estado: item.Estado?.Value || item.Estado,
        prioridad: item.Prioridad?.Value || item.Prioridad,
        cuenta: item.Cuenta?.Value || item.Cuenta || 'OPEX',
        porcentajeAvance: item.PorcentajeAvance ?? 0,
        cumplimientoNormativo: item.CumplimientoNormativo,
        novedades: item.Novedades,
        estadoAprobacion: item.EstadoAprobacion?.Value || item.EstadoAprobacion,
        aprobadoPor: item.AprobadoPor,
        presupuestoPlan: item.PresupuestoPlan ?? 0,
        presupuestoEjecutado: item.PresupuestoEjecutado ?? 0,
        presupuestoForecast: item.PresupuestoForecast ?? 0,
        matricesAplicables: item.MatricesAplicables
            ? (typeof item.MatricesAplicables === 'string'
                ? JSON.parse(item.MatricesAplicables)
                : item.MatricesAplicables.results || [])
            : [],
        creadoEn: item.Created,
        actualizadoEn: item.Modified
    } as ActividadAmbiental;
}

// Para escribir un campo Person en SP REST se necesita el ID numérico del usuario.
// Usar ensureUser(email) para obtenerlo antes de llamar a create().
async function ensureUser(email: string): Promise<number> {
    const response = await fetch(`${SITE_URL}/_api/web/ensureuser`, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose' },
        body: JSON.stringify({ logonName: `i:0#.f|membership|${email}` }),
    });
    if (!response.ok) throw new Error(`ensureUser failed for ${email}`);
    const data = await response.json();
    return data.d.Id as number;
}

function mapAppToSharePoint(payload: NuevaActividadPayload & { responsableId?: number }): any {
    const base: any = {
        __metadata: { type: `SP.Data.${LISTS.actividades}ListItem` },
        Title: payload.tarea,
        LineaOperativa: payload.lineaOperativa,
        Descripcion: payload.descripcion,
        Contrato: payload.contrato,
        Zona: payload.zona,
        Estacion: payload.estacion,     // Choice → enviar string del valor
        FechaInicio: payload.fechaInicio,
        FechaFin: payload.fechaFin,
        Mes: payload.mes,
        Estado: payload.estado,
        Prioridad: payload.prioridad,
        Cuenta: payload.cuenta,
        PorcentajeAvance: payload.porcentajeAvance,
        CumplimientoNormativo: payload.cumplimientoNormativo,
        Novedades: payload.novedades,
        EstadoAprobacion: payload.estadoAprobacion,
        PresupuestoPlan: payload.presupuestoPlan,
        PresupuestoEjecutado: payload.presupuestoEjecutado,
        PresupuestoForecast: payload.presupuestoForecast,
        MatricesAplicables: JSON.stringify(payload.matricesAplicables),
    };
    // Person field: ReqularesId (entero de SP) si fue resuelto, si no, omitir
    if (payload.responsableId != null) {
        base['ResponsableId'] = payload.responsableId;
    }
    return base;
}

// ══════════════════════════════════════════════════════════════
// Mappers — Presupuesto
// ══════════════════════════════════════════════════════════════
function mapPresupuesto(item: any): PresupuestoLinea {
    return {
        id: item.Id.toString(),
        mes: item.Mes?.Value || item.Mes || item.Title,
        lineaOperativa: item.LineaOperativa?.Value || item.LineaOperativa,
        contrato: item.Contrato || '',
        zona: item.Zona?.Value || item.Zona || '',
        cuenta: item.Cuenta?.Value || item.Cuenta || 'OPEX',
        responsable: item.Responsable?.Title || item.Responsable?.EMail ||
                    (typeof item.Responsable === 'string' ? item.Responsable : '') || '',
        plan: item.Plan ?? 0,
        ejecutado: item.Ejecutado ?? 0,
        forecast: item.Forecast ?? 0,
        observacion: item.Observacion,
        necesidad: item.Necesidad,
    };
}

// ══════════════════════════════════════════════════════════════
// Mappers — Estaciones
// ══════════════════════════════════════════════════════════════
function mapEstacion(item: any): Estacion {
    return {
        id: item.Id.toString(),
        nombre: item.Title || item.Nombre,
        planta: item.Planta || '',
        zona: item.Zona?.Value || item.Zona || '',
        totalMonitoreos: item.TotalMonitoreos ?? 0,
        ard: !!item.ARD,
        arnd: !!item.ARnD,
        ardSuelo: !!item.ARDSuelo,
        ardAgua: !!item.ARDAgua,
        arndSuelo: !!item.ARnDSuelo,
        arndAgua: !!item.ARnDAgua,
        concesionPozo: !!item.ConcesionPozo,
        concesionCuerpo: !!item.ConcesionCuerpo,
        concesionAcueducto: !!item.ConcesionAcueducto,
        aire: !!item.Aire,
        fuentesFijas: !!item.FuentesFijas,
        ruido: !!item.Ruido,
        fauna: !!item.Fauna,
        piezometros: !!item.Piezometros,
        recirculacion: !!item.Recirculacion,
        oloresOfensivos: !!item.OloresOfensivos,
        observaciones: item.Observaciones,
    };
}
