# GreenLog - Workflow n8n para notificaciones de revisión

Este workflow recibe eventos de GreenLog y envía correos por SMTP. En GreenLog el modo prueba queda activo, por lo que `recipients` llega únicamente con `camilo.ortegonc@outlook.com`; el payload también conserva `revisoresReales` para validar a quién iría en producción.

Webhook usado por GreenLog:

```text
https://n8n.srv1253947.hstgr.cloud/webhook/872ac679-540e-43a0-be83-e49777633e88
```

Después de importar el JSON, abre el nodo `Enviar correo SMTP` y selecciona o crea tu credencial SMTP. Luego activa el workflow.

```json
{
  "name": "GreenLog - Notificaciones de revision",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "872ac679-540e-43a0-be83-e49777633e88",
        "responseMode": "responseNode",
        "options": {
          "allowedOrigins": "*"
        }
      },
      "id": "3c4a5e92-2d1e-43a0-a3a1-001greenlog001",
      "name": "Webhook GreenLog",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [-620, 0],
      "webhookId": "872ac679-540e-43a0-be83-e49777633e88"
    },
    {
      "parameters": {
        "jsCode": "const p=$json.body||$json;const a=p.actividad||{};const s=p.solicitante||{};const actor=p.actor||s;const recipients=(Array.isArray(p.recipients)?p.recipients:['camilo.ortegonc@outlook.com']).filter(Boolean);const reales=Array.isArray(p.revisoresReales)?p.revisoresReales:(Array.isArray(p.revisores)?p.revisores:[]);const resolved=p.eventType==='revision_resuelta';const result=p.resultado||a.estadoAprobacion||'';const fmtCOP=(n)=>n==null||n===''?'':new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);const subject=resolved?'GreenLog | '+result+': '+(a.tarea||'Actividad'):'GreenLog | Revisión pendiente: '+(a.tarea||'Actividad');const esc=(v)=>String(v??'').replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));const rows=[['Evento',p.eventType||'revision_solicitada'],['Resultado',resolved?result:'Pendiente de revisión'],['Actividad',a.tarea],['Línea operativa',a.lineaOperativa],['Zona',a.zona],['Fuente',a.fuentePresupuesto],['Tipo planeación',a.tipoPlaneacion],['Año',a.anioPlaneacion],['Presupuesto plan',fmtCOP(a.presupuestoPlan)],['Solicitante',(s.nombre||'')+' <'+(s.email||'')+'>'],['Actor',(actor.nombre||'')+' <'+(actor.email||'')+'>'],['Revisores reales',reales.map((r)=>(r.nombre||'')+' <'+(r.email||'')+'>').join(', ')||'Sin revisores calculados']];const html='<div style=\\'font-family:Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.45\\'><h2 style=\\'color:#003057;margin:0 0 12px\\'>'+esc(subject)+'</h2><p>'+(resolved?'La revisión fue registrada en GreenLog.':'Hay una planeación pendiente de revisión en GreenLog.')+'</p><table style=\\'border-collapse:collapse;width:100%;max-width:760px\\'>'+rows.map(([k,v])=>'<tr><td style=\\'padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:700;width:210px\\'>'+esc(k)+'</td><td style=\\'padding:8px 10px;border:1px solid #e5e7eb\\'>'+esc(v||'—')+'</td></tr>').join('')+'</table><p style=\\'margin-top:18px\\'><a href=\\''+(p.appUrl||'https://ortegonautomation.github.io/Greenlog/')+'\\' style=\\'background:#00B050;color:#003057;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:700\\'>Abrir GreenLog</a></p><p style=\\'font-size:12px;color:#64748b\\'>Modo prueba: '+(p.testMode?'activo. Solo se envía a destinatarios de prueba.':'inactivo.')+'</p></div>';return [{json:{...p,toEmail:recipients.join(','),fromEmail:p.fromEmail||'GreenLog <camilo.ortegonc@outlook.com>',replyTo:s.email||actor.email||'camilo.ortegonc@outlook.com',subject,html,text:rows.map(([k,v])=>k+': '+(v||'—')).join('\\n'),response:{ok:true,eventType:p.eventType||'revision_solicitada',testMode:!!p.testMode,recipients}}}];"
      },
      "id": "3c4a5e92-2d1e-43a0-a3a1-001greenlog002",
      "name": "Preparar correo",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [-380, 0]
    },
    {
      "parameters": {
        "fromEmail": "={{ $json.fromEmail }}",
        "toEmail": "={{ $json.toEmail }}",
        "subject": "={{ $json.subject }}",
        "emailFormat": "html",
        "html": "={{ $json.html }}",
        "options": {
          "replyTo": "={{ $json.replyTo }}",
          "appendAttribution": false
        }
      },
      "id": "3c4a5e92-2d1e-43a0-a3a1-001greenlog003",
      "name": "Enviar correo SMTP",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [-120, 0]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { ok: true, notification: $('Preparar correo').first().json.response } }}",
        "options": {
          "responseCode": 200
        }
      },
      "id": "3c4a5e92-2d1e-43a0-a3a1-001greenlog004",
      "name": "Responder a GreenLog",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [140, 0]
    }
  ],
  "connections": {
    "Webhook GreenLog": {
      "main": [[{ "node": "Preparar correo", "type": "main", "index": 0 }]]
    },
    "Preparar correo": {
      "main": [[{ "node": "Enviar correo SMTP", "type": "main", "index": 0 }]]
    },
    "Enviar correo SMTP": {
      "main": [[{ "node": "Responder a GreenLog", "type": "main", "index": 0 }]]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  }
}
```

## Pruebas mínimas

1. Importar el workflow en n8n.
2. Configurar credencial SMTP en `Enviar correo SMTP`.
3. Activar el workflow.
4. Crear o editar una planeación pendiente en GreenLog.
5. Verificar que `recipients` sea solo `camilo.ortegonc@outlook.com`.
6. Verificar que `revisoresReales` traiga los revisores calculados por línea y zona.
7. Aprobar o rechazar y confirmar que llega el evento `revision_resuelta`.

## Referencias

- Importar/exportar workflows n8n: https://docs.n8n.io/workflows/export-import/
- Webhook node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- Respond to Webhook: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/
- Send Email node SMTP: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/
