// Aplica supabase/migrations/*.sql al proyecto enlazado vía Management API
// y registra cada versión en supabase_migrations (compatibilidad con `supabase db push`).
// Uso: $env:SUPABASE_ACCESS_TOKEN='sbp_...'; node scripts/apply-migrations.mjs [--dry]
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF ?? 'bipcvxetgypugwnbhmwm';
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const DRY = process.argv.includes('--dry');
const { readdirSync, readFileSync } = await import('node:fs');

if (!TOKEN) { console.error('Falta SUPABASE_ACCESS_TOKEN'); process.exit(1); }

async function sql(query) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 500)}`);
  return text;
}

const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  const version = f.split('_')[0];
  const body = readFileSync(`supabase/migrations/${f}`, 'utf8');
  if (DRY) { console.log(`[dry] ${f} (${body.length} bytes)`); continue; }
  try {
    await sql(body);
    await sql(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key, name text, statements text[]
      );
      insert into supabase_migrations.schema_migrations (version, name)
      values ('${version}', '${f}')
      on conflict (version) do nothing;`);
    console.log(`OK  ${f}`);
  } catch (e) {
    console.error(`FAIL ${f}\n  ${e.message}`);
    process.exit(1);
  }
}
console.log(DRY ? 'dry-run completado' : 'Migraciones aplicadas');
