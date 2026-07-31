import { sql } from './db';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM sport_records WHERE id = ${id}`;
        if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(rows[0]);
      }
      const rows = await sql`SELECT * FROM sport_records ORDER BY date DESC, created_at DESC`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: recordId, type, duration, distance, date, note } = body;
      if (!recordId || !type || duration == null || !date) {
        return Response.json({ error: 'Missing required fields: id, type, duration, date' }, { status: 400 });
      }

      await sql`
        INSERT INTO sport_records (id, type, duration, distance, date, note)
        VALUES (${recordId}, ${type}, ${duration}, ${distance || null}, ${date}, ${note || null})
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type, duration = EXCLUDED.duration,
          distance = EXCLUDED.distance, date = EXCLUDED.date,
          note = EXCLUDED.note, updated_at = NOW()
      `;
      return Response.json({ success: true, id: recordId }, { status: 201 });
    }

    if (req.method === 'PUT') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      const body = await req.json();
      const setClauses: string[] = [];
      const values: any[] = [id];

      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && key !== 'id') {
          setClauses.push(`${key} = $${values.length + 1}`);
          values.push(value);
        }
      }
      if (setClauses.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

      setClauses.push("updated_at = NOW()");
      await sql(`UPDATE sport_records SET ${setClauses.join(', ')} WHERE id = $1`, ...values);
      return Response.json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      await sql`DELETE FROM sport_records WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
