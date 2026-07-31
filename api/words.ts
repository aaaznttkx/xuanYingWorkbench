import { sql } from './db';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM words WHERE id = ${id}`;
        if (rows.length === 0) {
          return Response.json({ error: 'Not found' }, { status: 404 });
        }
        return Response.json(rows[0]);
      }
      const rows = await sql`SELECT * FROM words ORDER BY added_date DESC, created_at DESC`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: wordId, word, meaning, phonetic, example, addedDate, mastered, reviewCount, lastReviewDate } = body;

      if (!wordId || !word || !meaning || !addedDate) {
        return Response.json({ error: 'Missing required fields: id, word, meaning, addedDate' }, { status: 400 });
      }

      await sql`
        INSERT INTO words (id, word, meaning, phonetic, example, added_date, mastered, review_count, last_review_date)
        VALUES (${wordId}, ${word}, ${meaning}, ${phonetic || ''}, ${example || null}, ${addedDate}, ${mastered || false}, ${reviewCount || 0}, ${lastReviewDate || null})
        ON CONFLICT (id) DO UPDATE SET
          word = EXCLUDED.word, meaning = EXCLUDED.meaning, phonetic = EXCLUDED.phonetic,
          example = EXCLUDED.example, mastered = EXCLUDED.mastered,
          review_count = EXCLUDED.review_count, last_review_date = EXCLUDED.last_review_date,
          updated_at = NOW()
      `;
      return Response.json({ success: true, id: wordId }, { status: 201 });
    }

    if (req.method === 'PUT') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      const body = await req.json();
      const fieldMap: Record<string, string> = { addedDate: 'added_date', reviewCount: 'review_count', lastReviewDate: 'last_review_date' };
      const setClauses: string[] = [];
      const values: any[] = [id];

      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && key !== 'id') {
          const colName = fieldMap[key] || key;
          setClauses.push(`${colName} = $${values.length + 1}`);
          values.push(value);
        }
      }
      if (setClauses.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });

      setClauses.push("updated_at = NOW()");
      await sql(`UPDATE words SET ${setClauses.join(', ')} WHERE id = $1`, ...values);
      return Response.json({ success: true });
    }

    if (req.method === 'DELETE') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      await sql`DELETE FROM words WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
