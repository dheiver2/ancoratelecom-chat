// Conexão dos scripts de manutenção (seed-users).
//
// Desde 10/11/2026 o banco de produção é o Postgres próprio na PoC Golden, alcançado por WebSocket em
// db.mangaba.ia.br — o mesmo caminho do app. Rode os scripts com o atalho que põe DB_URL e DB_WS_PROXY
// no ambiente sem gravar a URL em disco:
//   ~/Downloads/Projetos/golden-postgres/scripts/com-banco.sh <banco> node scripts/<script>.mjs ...
//
// Sem DB_URL vale POSTGRES_URL, para um Postgres local. URL do Neon é recusada: o Neon ficou só como
// cópia antiga e gravar nele não muda nada em produção (PERMITIR_NEON=1 libera, para quem voltou o app
// para o Neon).
import pg from "pg";
import { Pool as PoolWs, neonConfig } from "@neondatabase/serverless";

export function abrirPool() {
  if (process.env.DB_URL) {
    const proxy = process.env.DB_WS_PROXY;
    if (!proxy) throw new Error("DB_URL sem DB_WS_PROXY (use db.mangaba.ia.br/v1)");
    neonConfig.wsProxy = proxy;
    neonConfig.useSecureWebSocket = !/^(127\.0\.0\.1|localhost)[:/]/.test(proxy);
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
    return new PoolWs({ connectionString: process.env.DB_URL, max: 2 });
  }
  const url = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || "";
  if (!url) throw new Error("sem banco: rode com ~/Downloads/Projetos/golden-postgres/scripts/com-banco.sh <banco> node scripts/...");
  if (url.includes("neon.tech") && !process.env.PERMITIR_NEON) {
    throw new Error("a URL é do Neon, que deixou de ser o banco de produção em 10/11/2026. Rode com: " +
      "~/Downloads/Projetos/golden-postgres/scripts/com-banco.sh <banco> node scripts/...");
  }
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return new pg.Pool({
    connectionString: url.replace("sslmode=require", "sslmode=no-verify"),
    ssl: local ? false : { rejectUnauthorized: false },
  });
}
