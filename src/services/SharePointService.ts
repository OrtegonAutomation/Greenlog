import { ActividadAmbiental, NuevaActividadPayload } from '../types';

const SITE_URL = "https://strategycolombia.sharepoint.com/sites/PatiodeAutomatizacinCamilo";
const LIST_NAME = "ActividadesAmbientales";
const API_URL = `${SITE_URL}/_api/web/lists/getbytitle('${LIST_NAME}')/items`;

// Helper for headers
const getHeaders = async () => {
    // In a real PCF/Power Pages environment, auth is handled automatically or via specific tokens.
    // For local dev without proxy, this will fail 401. 
    // We assume the environment (production) will inject the proper context or cookie auth.
    return {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose'
    };
};

export const SharePointService = {
    async getAll(): Promise<ActividadAmbiental[]> {
        try {
            const headers = await getHeaders();
            const response = await fetch(API_URL, { headers });
            if (!response.ok) throw new Error(`SharePoint Error: ${response.statusText}`);

            const data = await response.json();
            const results = data.d.results;

            return results.map((item: any) => mapSharePointToApp(item));
        } catch (error) {
            console.error("Error fetching from SharePoint", error);
            throw error;
        }
    },

    async create(payload: NuevaActividadPayload): Promise<ActividadAmbiental> {
        const headers = await getHeaders();
        const spPayload = mapAppToSharePoint(payload);

        // Get RequestDigest for write operations
        const contextInfoResponse = await fetch(`${SITE_URL}/_api/contextinfo`, {
            method: "POST",
            headers: { "Accept": "application/json;odata=verbose" }
        });
        const contextInfo = await contextInfoResponse.json();
        const digest = contextInfo.d.GetContextWebInformation.FormDigestValue;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                ...headers,
                'X-RequestDigest': digest
            },
            body: JSON.stringify(spPayload)
        });

        if (!response.ok) throw new Error(`SharePoint Create Error: ${response.statusText}`);
        const data = await response.json();
        return mapSharePointToApp(data.d);
    },

    async update(id: string, cambios: Partial<NuevaActividadPayload>): Promise<ActividadAmbiental> {
        // Implementation skipped for brevity, similar to create but using MERGE/PATCH and Item ID uri
        // For this task, we focus on reading first.
        throw new Error("Update not yet implemented in SP Service");
    },

    async delete(id: string): Promise<void> {
        throw new Error("Delete not yet implemented in SP Service");
    }
};

// Mappers
function mapSharePointToApp(item: any): ActividadAmbiental {
    return {
        id: item.Id.toString(),
        tarea: item.Tarea || item.Title, // Fallback if column rename didn't propagate to internal name
        tipo: item.TipoActividad?.Value || item.TipoActividad,
        descripcion: item.Descripcion,
        responsable: item.Responsable,
        fechaInicio: item.FechaInicio,
        fechaFin: item.FechaFin,
        ubicacionZona: item.UbicacionZona?.Value || item.UbicacionZona,
        estado: item.Estado?.Value || item.Estado,
        prioridad: item.Prioridad?.Value || item.Prioridad,
        porcentajeAvance: item.PorcentajeAvance,
        cumplimientoNormativo: item.CumplimientoNormativo,
        novedades: item.Novedades,
        estadoAprobacion: item.EstadoAprobacion?.Value || item.EstadoAprobacion,
        aprobadoPor: item.AprobadoPor,
        creadoEn: item.Created,
        actualizadoEn: item.Modified
    } as ActividadAmbiental;
}

function mapAppToSharePoint(payload: NuevaActividadPayload): any {
    return {
        __metadata: { type: `SP.Data.${LIST_NAME}ListItem` },
        Title: payload.tarea,
        TipoActividad: payload.tipo,
        Descripcion: payload.descripcion,
        Responsable: payload.responsable,
        FechaInicio: payload.fechaInicio,
        FechaFin: payload.fechaFin,
        UbicacionZona: payload.ubicacionZona,
        Estado: payload.estado,
        Prioridad: payload.prioridad,
        PorcentajeAvance: payload.porcentajeAvance,
        CumplimientoNormativo: payload.cumplimientoNormativo,
        Novedades: payload.novedades,
        EstadoAprobacion: payload.estadoAprobacion
    };
}
