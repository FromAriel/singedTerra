// Contract check for ADR-0011's password-auth and owner-only profile foundation.
// Run: node scripts/checks/profile_identity.mjs

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configPath = join(root, 'supabase', 'config.toml');
const migrationPath = join(root, 'supabase', 'migrations', '012_profiles.sql');
const gameplayReadMigrationPath = join(
  root,
  'supabase',
  'migrations',
  '013_authenticated_gameplay_reads.sql',
);
const packagePath = join(root, 'package.json');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function stripSqlComments(sql) {
  let output = '';
  let state = 'normal';
  let blockDepth = 0;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];
    if (state === 'line-comment') {
      if (char === '\n') {
        output += char;
        state = 'normal';
      } else {
        output += ' ';
      }
      continue;
    }
    if (state === 'block-comment') {
      if (char === '/' && next === '*') {
        blockDepth += 1;
        output += '  ';
        index += 1;
      } else if (char === '*' && next === '/') {
        blockDepth -= 1;
        output += '  ';
        index += 1;
        if (blockDepth === 0) state = 'normal';
      } else {
        output += char === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (state === 'single-quote') {
      output += char;
      if (char === "'" && next === "'") {
        output += next;
        index += 1;
      } else if (char === "'") {
        state = 'normal';
      }
      continue;
    }
    if (state === 'double-quote') {
      output += char;
      if (char === '"' && next === '"') {
        output += next;
        index += 1;
      } else if (char === '"') {
        state = 'normal';
      }
      continue;
    }
    if (char === '-' && next === '-') {
      state = 'line-comment';
      output += '  ';
      index += 1;
    } else if (char === '/' && next === '*') {
      state = 'block-comment';
      blockDepth = 1;
      output += '  ';
      index += 1;
    } else if (char === "'") {
      state = 'single-quote';
      output += char;
    } else if (char === '"') {
      state = 'double-quote';
      output += char;
    } else {
      output += char;
    }
  }
  return output;
}

function maskSqlLiterals(sql) {
  let output = '';
  for (let index = 0; index < sql.length;) {
    const rest = sql.slice(index);
    const dollarTag = rest.match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
    if (dollarTag) {
      const close = sql.indexOf(dollarTag, index + dollarTag.length);
      const end = close < 0 ? sql.length : close + dollarTag.length;
      output += sql.slice(index, end).replace(/[^\n]/g, ' ');
      index = end;
      continue;
    }
    if (sql[index] !== "'") {
      output += sql[index];
      index += 1;
      continue;
    }
    output += "''";
    index += 1;
    while (index < sql.length) {
      if (sql[index] === '\n') output += '\n';
      if (sql[index] === "'" && sql[index + 1] === "'") {
        index += 2;
      } else if (sql[index] === "'") {
        index += 1;
        break;
      } else {
        index += 1;
      }
    }
  }
  return output;
}

function normalizeStatement(statement) {
  return statement.replace(/\s+/g, ' ').trim().toLowerCase();
}

const config = await readFile(configPath, 'utf8');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
let migration;
try {
  migration = await readFile(migrationPath, 'utf8');
} catch {
  fail(`required migration is missing: ${migrationPath}`);
}
let gameplayReadMigration;
try {
  gameplayReadMigration = await readFile(gameplayReadMigrationPath, 'utf8');
} catch {
  fail(`required migration is missing: ${gameplayReadMigrationPath}`);
}

const normalizedMigration = migration.replace(/\r\n/g, '\n');
const migrationDigest = createHash('sha256').update(normalizedMigration).digest('hex');
const expectedMigrationDigest = 'fe714f86c31dcc01a41227d1b273965b20bf50cbe8ccdd76fadeec2f572e6b43';
if (migrationDigest !== expectedMigrationDigest) {
  fail('012_profiles.sql differs from its reviewed immutable migration digest');
}

const gameplayReadSql = maskSqlLiterals(stripSqlComments(gameplayReadMigration));
const normalizedGameplayReadMigration = gameplayReadMigration.replace(/\r\n/g, '\n');
const gameplayReadMigrationDigest = createHash('sha256')
  .update(normalizedGameplayReadMigration)
  .digest('hex');
const expectedGameplayReadMigrationDigest = 'bea4e72ebf44d9ba3c636a92025e5cd9ac34716d8bc9aff6bb506c4a5d8a6ecb';
if (gameplayReadMigrationDigest !== expectedGameplayReadMigrationDigest) {
  fail('013_authenticated_gameplay_reads.sql differs from its reviewed immutable migration digest');
}
const gameplayReadStatements = gameplayReadSql
  .split(';')
  .map((statement) => normalizeStatement(statement))
  .filter(Boolean);
const expectedGameplayReadStatements = [
  'revoke insert, update, delete on table public.rooms, public.room_actions, public.match_scores from authenticated',
  'grant select on table public.rooms, public.room_actions, public.match_scores to authenticated',
  'create policy rooms_select_authenticated on public.rooms for select to authenticated using (true)',
  'create policy room_actions_select_authenticated on public.room_actions for select to authenticated using (true)',
  'create policy match_scores_select_authenticated on public.match_scores for select to authenticated using (true)',
];
if (
  gameplayReadStatements.length !== expectedGameplayReadStatements.length
  || expectedGameplayReadStatements.some((statement) => !gameplayReadStatements.includes(statement))
) {
  fail('authenticated gameplay compatibility migration must contain only the reviewed read grants and policies');
}

const authBlock = config.match(/^\[auth\]\s*$([\s\S]*?)(?=^\[|\Z)/m)?.[1] ?? '';
const emailBlock = config.match(/^\[auth\.email\]\s*$([\s\S]*?)(?=^\[|\Z)/m)?.[1] ?? '';
if (!/^enabled\s*=\s*true\s*$/m.test(authBlock)) fail('[auth].enabled must be true');
if (!/^enable_signup\s*=\s*true\s*$/m.test(authBlock)) fail('[auth].enable_signup must be true');
if (!/^minimum_password_length\s*=\s*8\s*$/m.test(authBlock)) {
  fail('[auth].minimum_password_length must enforce the client policy');
}
if (!/^site_url\s*=\s*"https:\/\/suadtl\.github\.io\/singedTerra\/"\s*$/m.test(authBlock)) {
  fail('[auth].site_url must target the production GitHub Pages origin');
}
if (!/^additional_redirect_urls\s*=\s*\["http:\/\/localhost:5173"\]\s*$/m.test(authBlock)) {
  fail('[auth].additional_redirect_urls must retain the local development origin');
}
if (!/^enable_signup\s*=\s*true\s*$/m.test(emailBlock)) fail('[auth.email].enable_signup must be true');
if (!/^enable_confirmations\s*=\s*false\s*$/m.test(emailBlock)) fail('[auth.email].enable_confirmations must be false');

const deployBackend = packageJson.scripts?.['deploy:backend'] ?? '';
const dbPushIndex = deployBackend.indexOf('supabase db push');
const configPushIndex = deployBackend.indexOf('supabase config push');
if (dbPushIndex < 0 || configPushIndex < 0 || dbPushIndex > configPushIndex) {
  fail('deploy:backend must install the profile migration before enabling signup config');
}

const sqlWithoutComments = stripSqlComments(migration);
const sqlStructure = maskSqlLiterals(sqlWithoutComments);

const required = [
  /CREATE TABLE public\.profiles/i,
  /id\s+uuid\s+PRIMARY KEY\s+REFERENCES auth\.users\s*\(id\)\s+ON DELETE CASCADE/i,
  /display_name\s+text\s+NOT NULL/i,
  /char_length\s*\(btrim\s*\(display_name\)\)\s+BETWEEN\s+1\s+AND\s+24/i,
  /ALTER TABLE public\.profiles ENABLE ROW LEVEL SECURITY/i,
  /REVOKE ALL ON TABLE public\.profiles FROM PUBLIC, anon/i,
  /GRANT SELECT ON TABLE public\.profiles TO authenticated/i,
  /CREATE POLICY profiles_select_own[\s\S]*FOR SELECT[\s\S]*TO authenticated[\s\S]*USING\s*\(\s*\(select auth\.uid\(\)\)\s*=\s*id\s*\)/i,
  /SECURITY DEFINER/i,
  /SET search_path = ''/i,
  /CREATE TRIGGER on_auth_user_created[\s\S]*AFTER INSERT ON auth\.users/i,
];

const missing = required.filter((pattern) => !pattern.test(sqlStructure));
if (missing.length > 0) fail(`${missing.length} required profile migration contract(s) are missing`);

const alterTableStatements = [...sqlWithoutComments.matchAll(/\bALTER\s+TABLE\s+[^;]+;/ig)]
  .map((match) => normalizeStatement(match[0]));
if (
  alterTableStatements.length !== 1
  || alterTableStatements[0] !== 'alter table public.profiles enable row level security;'
) {
  fail('migration permits exactly one ALTER TABLE: enabling RLS on public.profiles');
}

const policyStatements = [...sqlWithoutComments.matchAll(/\bCREATE\s+POLICY\s+[^;]+;/ig)]
  .map((match) => normalizeStatement(match[0]));
if (
  policyStatements.length !== 1
  || policyStatements[0] !== 'create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);'
) {
  fail('migration permits exactly the owner-only profiles_select_own policy');
}

const functionDefinitions = [...sqlWithoutComments.matchAll(/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/ig)];
const triggerDefinitions = [...sqlWithoutComments.matchAll(/\bCREATE\s+TRIGGER\b/ig)];
if (functionDefinitions.length !== 1 || triggerDefinitions.length !== 1) {
  fail('migration permits exactly one profile trigger function and one trigger');
}

const requiredClassifications = [
  /(?:^|;)\s*COMMENT ON TABLE public\.profiles IS 'classification: PRIVATE/i,
  /(?:^|;)\s*COMMENT ON COLUMN public\.profiles\.id IS 'classification: PRIVATE/i,
  /(?:^|;)\s*COMMENT ON COLUMN public\.profiles\.display_name IS 'classification: PRIVATE/i,
  /(?:^|;)\s*COMMENT ON COLUMN public\.profiles\.created_at IS 'classification: INTERNAL/i,
  /(?:^|;)\s*COMMENT ON COLUMN public\.profiles\.updated_at IS 'classification: INTERNAL/i,
];
if (requiredClassifications.some((pattern) => !pattern.test(sqlWithoutComments))) {
  fail('profile table and every stored column require an active classification statement');
}

if (!/INSERT INTO public\.profiles\s*\(id, display_name\)[\s\S]*SELECT[\s\S]*FROM auth\.users[\s\S]*ON CONFLICT \(id\) DO NOTHING/i.test(sqlStructure)) {
  fail('migration must backfill any auth users that predate the trigger');
}

const forbidden = [
  { label: 'destructive statement', pattern: /\b(?:DROP|TRUNCATE)\b/i },
  { label: 'destructive data mutation', pattern: /\b(?:DELETE\s+FROM|UPDATE\s+public\.profiles)\b/i },
  { label: 'RLS disable', pattern: /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i },
  { label: 'credential column', pattern: /\b(?:email|password|access_token|refresh_token|seat_token)\s+[a-z]/i },
  { label: 'public or anonymous profile grant', pattern: /GRANT\s+(?:ALL|SELECT|INSERT|UPDATE|DELETE)[^;]*\sTO\s+(?:PUBLIC|anon)\b/i },
  { label: 'client profile insert', pattern: /GRANT\s+INSERT[\s\S]*TO\s+authenticated/i },
  { label: 'permissive policy', pattern: /CREATE\s+POLICY[\s\S]*?USING\s*\(\s*true\s*\)/i },
  { label: 'write policy', pattern: /CREATE\s+POLICY[\s\S]*?FOR\s+(?:INSERT|UPDATE|DELETE|ALL)\b/i },
  { label: 'public or anonymous profile policy', pattern: /CREATE\s+POLICY[\s\S]*?\bTO\s+(?:PUBLIC|anon)\b/i },
  { label: 'table ownership change', pattern: /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?profiles\s+OWNER\s+TO\b/i },
  { label: 'policy alteration', pattern: /\bALTER\s+POLICY\b/i },
  { label: 'role ownership reassignment', pattern: /REASSIGN\s+OWNED\b/i },
  { label: 'role mutation', pattern: /\bALTER\s+(?:ROLE|USER)\b/i },
  { label: 'role creation', pattern: /\bCREATE\s+(?:ROLE|USER)\b/i },
  { label: 'role switching', pattern: /(?:^|;)\s*SET\s+(?:LOCAL\s+)?ROLE\b/i },
  { label: 'anonymous code block', pattern: /\bDO\s+\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/i },
  { label: 'dynamic SQL', pattern: /\bEXECUTE\b(?!\s+FUNCTION\b)/i },
  { label: 'derived profile exposure', pattern: /\bCREATE\s+(?:MATERIALIZED\s+)?VIEW\b/i },
  { label: 'default privilege mutation', pattern: /\bALTER\s+DEFAULT\s+PRIVILEGES\b/i },
];
for (const { label, pattern } of forbidden) {
  if (pattern.test(sqlWithoutComments)) fail(`migration contains forbidden ${label}`);
}

const policies = [...sqlStructure.matchAll(/CREATE\s+POLICY\s+([a-z_]+)/ig)].map((match) => match[1]);
if (policies.length !== 1 || policies[0]?.toLowerCase() !== 'profiles_select_own') {
  fail('migration must define exactly the one owner-only profile SELECT policy');
}

const grants = [...sqlStructure.matchAll(/GRANT\s+([^;]+);/ig)].map((match) => match[0].replace(/\s+/g, ' ').trim());
if (grants.length !== 1 || !/^GRANT SELECT ON TABLE public\.profiles TO authenticated;$/i.test(grants[0] ?? '')) {
  fail('migration must define exactly one authenticated SELECT grant');
}

const adversarialMutations = [
  `${sqlWithoutComments}\nALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`,
  `${sqlWithoutComments}\nGRANT ALL ON TABLE public.profiles TO PUBLIC;`,
  `${sqlWithoutComments}\nCREATE POLICY profiles_public ON public.profiles FOR SELECT USING (true);`,
];
if (!adversarialMutations.every((probe) => forbidden.some(({ pattern }) => pattern.test(probe)))) {
  fail('migration guard mutation probes must reject RLS disable, public grant, and permissive policy');
}

const inlineCommentDecoy = migration.replace(
  'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
  'SELECT 1; -- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
);
if (required.every((pattern) => pattern.test(maskSqlLiterals(stripSqlComments(inlineCommentDecoy))))) {
  fail('migration guard mutation probe accepted a required control in an inline comment');
}

const stringLiteralDecoy = migration.replace(
  'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
  "SELECT 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;';",
);
if (required.every((pattern) => pattern.test(maskSqlLiterals(stripSqlComments(stringLiteralDecoy))))) {
  fail('migration guard mutation probe accepted a required control in a string literal');
}

const ownershipEscalation = `${sqlWithoutComments}\nALTER TABLE public.profiles OWNER TO authenticated;`;
if (!forbidden.some(({ pattern }) => pattern.test(ownershipEscalation))) {
  fail('migration guard mutation probe accepted authenticated table ownership');
}

const equivalentEscalations = [
  `${sqlWithoutComments}\nALTER TABLE profiles OWNER TO authenticated;`,
  `${sqlWithoutComments}\nALTER POLICY profiles_select_own ON public.profiles USING (id IS NOT NULL);`,
  `${sqlWithoutComments}\nDO $guard$ DECLARE q text := 'ALTER TABLE profiles OWNER ' || 'TO authenticated'; BEGIN EXECUTE q; END $guard$;`,
];
if (!equivalentEscalations.every((probe) => forbidden.some(({ pattern }) => pattern.test(probe)))) {
  fail('migration guard mutation probes accepted equivalent ownership, policy, or dynamic-SQL escalation');
}

console.log('PASS: password auth config and owner-only profile migration satisfy ADR-0011.');
