import { sql } from './db';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM english_records WHERE id = ${id}`;
        if (rows.length === 0) {
          return Response.json({ error: 'Not found' }, { status: 404 });
        }
        return Response.json(rows[0]);
      }
      const rows = await sql`SELECT * FROM english_records ORDER BY date DESC, created_at DESC`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: recordId, type, date, duration, title, content, score, notes } = body;

      if (!recordId || !type || !date || duration == null) {
        return Response.json({ error: 'Missing required fields: id, type, date, duration' }, { status: 400 });
      }

      await sql`
        INSERT INTO english_records (id, type, date, duration, title, content, score, notes)
        VALUES (${recordId}, ${type}, ${date}, ${duration}, ${title || null}, ${content || null}, ${score ? JSON.stringify(score) : null}, ${notes || null})
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          date = EXCLUDED.date,
          duration = EXCLUDED.duration,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          score = EXCLUDED.score,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `;
      return Response.json({ success: true, id: recordId }, { status: 201 });
    }

    if (req.method === 'PUT') {
      if (!id) {
        return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      }
      const body = await req.json();
      const setClauses: string[] = [];
      const values: any[] = [id];

      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          if (key === 'score') {
            setClauses.push(`score = '${JSON.stringify(value)}'`);
          } else {
            setClauses.push(`${key} = $${values.length + 1}`);
            values.push(value);
          }
        }
      }

      if (setClauses.length === 0) {
        return Response.json({ error: 'No fields to update' }, { status: 400 });
      }

      setClauses.push("updated_at = NOW()");
      const query = `UPDATE english_records SET ${setClauses.join(', ')} WHERE id = $1`;
      await sql(query, ...values);
      return Response.json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      }
      await sql`DELETE FROM english_records WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
