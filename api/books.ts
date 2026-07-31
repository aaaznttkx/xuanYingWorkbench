import { sql } from './db.js';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM books WHERE id = ${id}`;
        if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(rows[0]);
      }
      const rows = await sql`SELECT * FROM books ORDER BY start_date DESC, created_at DESC`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: bookId, title, author, cover, totalPages, startDate, finishedDate, status } = body;
      if (!bookId || !title || !startDate) {
        return Response.json({ error: 'Missing required fields: id, title, startDate' }, { status: 400 });
      }

      await sql`
        INSERT INTO books (id, title, author, cover, total_pages, start_date, finished_date, status)
        VALUES (${bookId}, ${title}, ${author || ''}, ${cover || null}, ${totalPages || null}, ${startDate}, ${finishedDate || null}, ${status || 'reading'})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, author = EXCLUDED.author, cover = EXCLUDED.cover,
          total_pages = EXCLUDED.total_pages, finished_date = EXCLUDED.finished_date,
          status = EXCLUDED.status, updated_at = NOW()
      `;
      return Response.json({ success: true, id: bookId }, { status: 201 });
    }

    if (req.method === 'PUT') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      const body = await req.json();
      const fieldMap: Record<string, string> = { totalPages: 'total_pages', startDate: 'start_date', finishedDate: 'finished_date' };
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
      await sql(`UPDATE books SET ${setClauses.join(', ')} WHERE id = $1`, ...values);
      return Response.json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      await sql`DELETE FROM reading_notes WHERE book_id = ${id}`;
      await sql`DELETE FROM books WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
