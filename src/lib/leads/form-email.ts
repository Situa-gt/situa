function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="width:210px;padding:12px 16px;color:#6b7280;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #edf0f6;background:#fafbff">${escHtml(label)}</td>
      <td style="padding:12px 16px;color:#111827;font-size:15px;font-weight:600;border-bottom:1px solid #edf0f6">${escHtml(value)}</td>
    </tr>`
}

export function formLeadEmail(input: { full_name: string; email: string; phone?: string | null; message?: string | null }, projectName: string, modelName: string | null) {
  const html = `
    <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
      <div style="max-width:720px;margin:0 auto;padding:28px 16px">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(28,31,61,.08)">
          <div style="background:#6b66eb;padding:26px 30px;color:#ffffff">
            <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.88">Sitúa.gt</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.18;font-weight:800">Nuevo prospecto generado</h1>
          </div>

          <div style="padding:28px 30px">
            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Datos del prospecto</h2>
            <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #edf0f6;border-radius:14px;overflow:hidden;margin-bottom:28px">
              ${infoRow('Nombre', input.full_name)}
              ${infoRow('Correo electrónico', input.email || 'No indicado')}
              ${infoRow('Teléfono', input.phone ?? 'No indicado')}
            </table>

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Proyecto de interés</h2>
            <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #edf0f6;border-radius:14px;overflow:hidden;margin-bottom:28px">
              ${infoRow('Proyecto', projectName)}
              ${modelName ? infoRow('Modelo', modelName) : ''}
            </table>

            <h2 style="margin:0 0 14px;font-size:21px;line-height:1.25;color:#111827">Consulta del prospecto</h2>
            <div style="border-left:5px solid #6b66eb;background:#f7f6ff;border-radius:12px;padding:18px 20px;color:#1f2937;font-size:16px;line-height:1.65">
              ${escHtml(input.message ?? 'Sin mensaje adicional.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  return { subject: `Nueva consulta — ${projectName}`, html }
}
