import { sql } from './db.js';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const weekStart = url.searchParams.get('weekStart');

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await sql`SELECT * FROM weekly_reports WHERE id = ${id}`;
        if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(rows[0]);
      }
      if (weekStart) {
        const rows = await sql`SELECT * FROM weekly_reports WHERE week_start = ${weekStart} ORDER BY generated_at DESC LIMIT 1`;
        if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json(rows[0]);
      }
      const rows = await sql`SELECT * FROM weekly_reports ORDER BY week_start DESC LIMIT 20`;
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id: reportId, weekStart: ws, weekEnd, sportSummary, readingSummary, englishSummary, generatedAt } = body;
      if (!reportId || !ws || !weekEnd) {
        return Response.json({ error: 'Missing required fields: id, weekStart, weekEnd' }, { status: 400 });
      }

      await sql`
        INSERT INTO weekly_reports (id, week_start, week_end, sport_summary, reading_summary, english_summary, generated_at)
        VALUES (
          ${reportId}, ${ws}, ${weekEnd},
          ${JSON.stringify(sportSummary || {})},
          ${JSON.stringify(readingSummary || {})},
          ${JSON.stringify(englishSummary || {})},
          ${generatedAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          week_start = EXCLUDED.week_start, week_end = EXCLUDED.week_end,
          sport_summary = EXCLUDED.sport_summary, reading_summary = EXCLUDED.reading_summary,
          english_summary = EXCLUDED.english_summary, generated_at = EXCLUDED.generated_at,
          updated_at = NOW()
      `;
      return Response.json({ success: true, id: reportId }, { status: 201 });
    }

    if (req.method === 'DELETE') {
      if (!id) return Response.json({ error: 'Missing id parameter' }, { status: 400 });
      await sql`DELETE FROM weekly_reports WHERE id = ${id}`;
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
