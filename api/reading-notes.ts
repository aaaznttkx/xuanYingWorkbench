import { sql } from './db.js';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const bookId = url.searchParams.get('bookId');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM reading_notes WHERE id = ${id}`;
        if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(rows[0]);
      }
      if (bookId) {
        const rows = await sql`SELECT * FROM reading_notes WHERE book_id = ${bookId} ORDER BY date DESC, created_at DESC`;
        return Response.json(rows);
      }
      const rows = await sql`SELECT * FROM reading_notes ORDER BY date DESC, created_at DESC`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: noteId, bookId: bId, chapter, keyPoints, reflection, duration, date } = body;
      if (!noteId || !bId || !date) {
        return Response.json({ error: 'Missing required fields: id, bookId, date' }, { status: 400 });
      }

      await sql`
        INSERT INTO reading_notes (id, book_id, chapter, key_points, reflection, duration, date)
        VALUES (${noteId}, ${bId}, ${chapter || ''}, ${keyPoints || ''}, ${reflection || ''}, ${duration || 0}, ${date})
        ON CONFLICT (id) DO UPDATE SET
          book_id = EXCLUDED.book_id, chapter = EXCLUDED.chapter,
          key_points = EXCLUDED.key_points, reflection = EXCLUDED.reflection,
          duration = EXCLUDED.duration, date = EXCLUDED.date, updated_at = NOW()
      `;
      return Response.json({ success: true, id: noteId }, { status: 201 });
    }

    if (req.method === 'PUT') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      const body = await req.json();
      const fieldMap: Record<string, string> = { bookId: 'book_id', keyPoints: 'key_points' };
      const setClauses: string[] = [];
      const values: any[] = [id];

      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && key !== 'id') {
          setClauses.push(`${fieldMap[key] || key} = $${values.length + 1}`);
          values.push(value);
        }
      }
      if (setClauses.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

      setClauses.push("updated_at = NOW()");
      await sql(`UPDATE reading_notes SET ${setClauses.join(', ')} WHERE id = $1`, ...values);
      return Response.json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      await sql`DELETE FROM reading_notes WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
