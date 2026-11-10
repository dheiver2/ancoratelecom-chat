// ============================================================
// Provisiona as contas dos funcionários (allowlist) no Postgres.
// - Cria a tabela users se não existir.
// - Para cada e-mail SEM conta, gera uma senha aleatória e insere (bcrypt).
// - NÃO altera contas já existentes (preserva quem já tem senha).
// - Grava as credenciais geradas em ./seed-credentials.txt (NÃO versionado).
//
// Uso (produção, banco na PoC Golden desde 10/11/2026):
//   ~/Downloads/Projetos/golden-postgres/scripts/com-banco.sh ancora node scripts/seed-users.mjs
// Postgres local: POSTGRES_URL="postgres://...@localhost/..." node scripts/seed-users.mjs
// ============================================================
import { abrirPool } from "./_banco.mjs";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Carrega .env.local se POSTGRES_URL não estiver no ambiente.
if (!process.env.POSTGRES_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* segue sem .env.local */ }
}

const EMAILS = [
  "anna01.angelo@gmail.com",
  "paulafalcao@alpha1consultoria.com",
  "bkocomercial@alpha1consultoria.com",
  "alpha1auxvendas@gmail.com",
  "noc@alpha1consultoria.com",
  "jadson.ferreira@alpha1consultoria.com",
  "jairoribeiro@alpha1consultoria.com",
  "faturamento@alpha1consultoria.com",
  "financeiro@alpha1consultoria.com",
  "analisededadosalpha1@gmail.com",
  "messias.mma2014@gmail.com",
  "contasapagar@alpha1consultoria.com",
  "maycon.tavares@alpha1consultoria.com",
  "gestao@alpha1consultoria.com",
  "operacional@alpha1consultoria.com",
  "adm@alpha1consultoria.com",
  "vitor.ar.vr@gmail.com",
  "vitormoliveira90@gmail.com",
  "williamsandrevieiradasilva@gmail.com",
];

function genPassword() {
  // 10 chars base64url legíveis o suficiente para senha temporária.
  return crypto.randomBytes(8).toString("base64url");
}

let pool;
try { pool = abrirPool(); } catch (e) { console.error(e.message); process.exit(1); }

const created = [];
let skipped = 0;
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  for (const raw of EMAILS) {
    const email = raw.trim().toLowerCase();
    const exists = await pool.query("SELECT 1 FROM users WHERE username = $1 LIMIT 1", [email]);
    if (exists.rows.length) { skipped++; continue; }
    const password = genPassword();
    const hash = await bcrypt.hash(password, 12);
    await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2)", [email, hash]);
    created.push({ email, password });
  }

  if (created.length) {
    const lines = ["E-MAIL\tSENHA TEMPORÁRIA", ...created.map((c) => `${c.email}\t${c.password}`)];
    fs.writeFileSync("seed-credentials.txt", lines.join("\n") + "\n");
  }
  console.log(`Criadas: ${created.length} | Já existiam: ${skipped}`);
  if (created.length) console.log("Credenciais geradas em ./seed-credentials.txt (distribua e não versione).");
} catch (e) {
  console.error("Falha no seed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
