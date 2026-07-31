import { neon } from '@neondatabase/serverless';

// Neon serverless HTTP driver
// Connects via DATABASE_URL env var automatically set by Vercel + Neon integration
const databaseUrl = process.env.DATABASE_URL;

// The Neon `sql` function: supports tagged templates sql`SELECT ...` returning rows array directly
export const sql = databaseUrl ? neon(databaseUrl) : createMockSql();

function createMockSql() {
  const mockFn = async (..._args: any[]) => {
    console.log('[Mock DB] DATABASE_URL not configured - query skipped');
    return [];
  };
  // Make it work as tagged template too
  return new Proxy(mockFn, {
    apply(target, _thisArg, args) {
      if (Array.isArray(args[0])) {
        // tagged template
        console.log('[Mock DB]', args[0].join('?'));
        return Promise.resolve([]);
      }
      return target(...args);
    },
  });
}
