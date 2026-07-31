import { sql } from './db.js';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM wrong_questions WHERE id = ${id}`;
        if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(rows[0]);
      }
      const rows = await sql`SELECT * FROM wrong_questions ORDER BY date DESC, created_at DESC`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: qId, type, question, answer, myAnswer, analysis, date, reviewed } = body;
      if (!qId || !type || !question || !answer || !myAnswer || !date) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }

      await sql`
        INSERT INTO wrong_questions (id, type, question, answer, my_answer, analysis, date, reviewed)
        VALUES (${qId}, ${type}, ${question}, ${answer}, ${myAnswer}, ${analysis || ''}, ${date}, ${reviewed || false})
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type, question = EXCLUDED.question, answer = EXCLUDED.answer,
          my_answer = EXCLUDED.my_answer, analysis = EXCLUDED.analysis,
          date = EXCLUDED.date, reviewed = EXCLUDED.reviewed, updated_at = NOW()
      `;
      return Response.json({ success: true, id: qId }, { status: 201 });
    }

    if (req.method === 'PUT') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      const body = await req.json();
      const fieldMap: Record<string, string> = { myAnswer: 'my_answer' };
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
      await sql(`UPDATE wrong_questions SET ${setClauses.join(', ')} WHERE id = $1`, ...values);
      return Response.json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      await sql`DELETE FROM wrong_questions WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
