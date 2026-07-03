# Âncora IA

Clone do ChatGPT com a identidade visual da **Âncora Telecom** (provedora de internet via
fibra óptica de Marechal Deodoro/AL). O chat é a assistente virtual **Ana**, que responde
em português do Brasil sobre os serviços da empresa e também funciona como assistente
geral com busca na web, geração de documentos e planilhas.

Construído em **Next.js 14** (App Router), com respostas em streaming e o **Mangaba**
(camada de IA que fala com qualquer motor compatível com a API OpenAI — hoje configurado
para o Hugging Face Router, podendo apontar também para um Ollama/Mangaba local) como
provedor padrão de IA.

## Stack tecnológica

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- Runtime **Edge** no endpoint de chat (`app/api/chat/route.ts`) para latência baixa;
  demais rotas em runtime **Node.js**
- **PostgreSQL** (Supabase/Neon, via `pg`) para usuários e conversas
- **Upstash Redis** (opcional) para rate limiting distribuído entre instâncias
- **bcryptjs** para hash de senhas (com migração automática de um esquema HMAC legado)
- Geração de arquivos: **docx** (Word), **exceljs** (Excel)
- Extração de conteúdo: **pdfjs-dist** (PDF), **mammoth** (Word)
- Busca na web: **Tavily** (preferencial) com fallback para **DuckDuckGo** (`duck-duck-scrape`)
- Renderização de markdown: **react-markdown**, **remark-gfm**, **remark-math**,
  **rehype-katex** (fórmulas) e **rehype-highlight** (código)
- Testes com **Vitest**

## Paleta de cores

Definida em `app/globals.css` (com suporte a tema claro/escuro via `[data-theme="dark"]`):

| Token CSS | Uso | Cor (tema claro) |
|---|---|---|
| `--ancora-rosa` | Acento principal / primária | `#0C0CA1` (azul profundo) |
| `--ancora-vermelho` | Azul vivo (gradiente) | `#1A2DF3` |
| `--ancora-roxo` | Secundária | `#2A7C6F` (teal) |
| `--ancora-roxo-claro` | Apoio | `#7ECDFF` |
| `--ancora-preto` / `--ancora-branco` | Base | `#0b1020` / `#ffffff` |
| `--gradient-ancora` | Gradiente primário | `linear-gradient(135deg, #0C0CA1, #1A2DF3)` |
| `--gradient-roxo` | Gradiente secundário | `linear-gradient(135deg, #2A7C6F, #3FA99A)` |

> Nota: os nomes das variáveis (`--ancora-rosa`, `--ancora-vermelho`, `--ancora-roxo`) vêm
> de um rebrand anterior do template e foram mantidos por compatibilidade, mas os valores
> hexadecimais atuais já refletem a identidade real da Âncora Telecom (azul + teal), não
> rosa/roxo. Fonte: **Inter**.

## Funcionalidades

- **Chat em streaming** com a assistente Ana (`app/api/chat/route.ts`, Edge Runtime)
- **Autenticação por sessão** via cookie httpOnly assinado (`app/lib/auth.ts` /
  `app/lib/auth-edge.ts`), com registro, login e logout
- **Histórico de conversas** persistido no Postgres, sincronizado por usuário
  (`app/api/conversations`)
- **Rate limiting** por IP/usuário em login, registro e chat, com fallback in-memory e
  modo distribuído via Upstash Redis (`app/lib/ratelimit.ts`)
- **Busca na web** integrada ao chat (Tavily ou DuckDuckGo) para respostas com contexto
  atualizado (`app/api/search`, `app/lib/search*.ts`)
- **Geração de documentos Word (.docx)** a partir de uma especificação estruturada
  (`app/api/document`)
- **Geração de planilhas Excel (.xlsx)** a partir de uma especificação estruturada
  (`app/api/spreadsheet`)
- **Extração de conteúdo de PDF e Word** enviados pelo usuário (`app/lib/extract.ts`)
- Suporte a **fórmulas matemáticas (KaTeX)** e **realce de código** no markdown renderizado
- **Seed administrativo** de usuários protegido por token (`app/api/admin/seed`)
- Tema **claro/escuro**

## Variáveis de ambiente

Nenhuma variável é obrigatória para `npm run build` (todas têm fallback ou validação
lazy em runtime), mas várias são necessárias para o app funcionar de verdade em produção:

| Variável | Onde é usada | Finalidade |
|---|---|---|
| `OPENAI_BASE_URL` | `app/api/chat`, `app/api/status` | URL base do endpoint compatível com OpenAI que serve o Mangaba (Hugging Face Router, Ollama local, etc.). Padrão: `https://router.huggingface.co/v1` |
| `OPENAI_API_KEY` | `app/api/chat`, `app/api/status` | Chave de autenticação do provedor de IA configurado em `OPENAI_BASE_URL` |
| `OPENAI_MODEL` | `app/api/chat`, `app/api/status` | Id do modelo a usar (ex.: `mangaba-pro`); se ausente, é escolhido automaticamente entre os modelos disponíveis |
| `OPENAI_MODEL_FALLBACKS` | `app/api/chat` | Lista de modelos alternativos caso o principal falhe |
| `OPENAI_VISION_MODEL` | `app/api/chat` | Modelo usado quando a mensagem inclui imagem |
| `OPENAI_MAX_TOKENS` | `app/api/chat` | Limite de tokens da resposta |
| `POSTGRES_URL` | `app/lib/db.ts` | String de conexão do Postgres (pooler — preferencial) para usuários e conversas |
| `POSTGRES_URL_NON_POOLING` | `app/lib/db.ts` | String de conexão direta do Postgres (fallback, sem pooler) |
| `SESSION_SECRET` | `app/lib/auth.ts`, `app/lib/auth-edge.ts` | Segredo usado para assinar (HMAC) os cookies de sessão; obrigatório (mín. 32 caracteres) em produção |
| `SEED_SECRET` | `app/api/admin/seed` | Token exigido para autorizar o endpoint de seed administrativo de usuários |
| `SEED_DEFAULT_PASSWORD` | `scripts/seed-users.mjs`, `app/api/admin/seed` | Senha padrão usada ao popular usuários via seed |
| `ADMIN_SEED_TOKEN` | `scripts/seed-users.mjs` | Token usado pelo script de seed local para autenticar contra o endpoint de admin |
| `TAVILY_API_KEY` | `app/lib/search-providers.ts` | Chave da API Tavily para busca na web com conteúdo já extraído; sem ela, cai para DuckDuckGo |
| `UPSTASH_REDIS_REST_URL` | `app/lib/ratelimit.ts` | URL REST do Upstash Redis para rate limiting distribuído entre instâncias |
| `UPSTASH_REDIS_REST_TOKEN` | `app/lib/ratelimit.ts` | Token REST do Upstash Redis |
| `NEXT_PUBLIC_BUILD` | `next.config.js` | Id do build (SHA do commit), gerado automaticamente — não precisa ser definido manualmente |

Nenhum valor real de segredo deve ser commitado. Use um arquivo `.env.local` (já ignorado
pelo `.gitignore`) para desenvolvimento local.

## IA gratuita com Mangaba

O **Mangaba** é a camada de branding/orquestração de IA usada pelo projeto — ela fala com
qualquer motor compatível com a API OpenAI através de `OPENAI_BASE_URL`/`OPENAI_MODEL`
(ver `app/lib/mangaba.ts`), podendo apontar tanto para o Hugging Face Router (configuração
atual em produção) quanto para uma instância local no mesmo fluxo do Ollama
(`http://localhost:11434`), rodando 100% na máquina do usuário.

Instalação do motor local (opcional, para rodar sem depender de um provedor externo):

**macOS / Linux:**
```bash
curl -fsSL https://mangaba-site.vercel.app/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://mangaba-site.vercel.app/install.ps1 | iex
```

## Como rodar localmente

O projeto usa **npm** (lockfile `package-lock.json`).

```bash
# instalar dependências (também sincroniza o worker do pdf.js via postinstall)
npm install

# ambiente de desenvolvimento (http://localhost:3000)
npm run dev

# build de produção
npm run build

# subir o build de produção
npm run start

# lint
npm run lint

# testes (Vitest)
npm run test
npm run test:watch
```

Para o chat responder de verdade é preciso configurar ao menos `OPENAI_BASE_URL` e
`OPENAI_API_KEY` (ou apontar para um Mangaba/Ollama local) e, para login/histórico de
conversas, `POSTGRES_URL` e `SESSION_SECRET` — ver seção de variáveis de ambiente acima.

## Estrutura

```
ancoratelecom-chat/
├── app/
│   ├── api/
│   │   ├── chat/route.ts            # streaming de chat (Edge)
│   │   ├── conversations/           # CRUD de histórico de conversas
│   │   ├── document/route.ts        # geração de .docx
│   │   ├── spreadsheet/route.ts     # geração de .xlsx
│   │   ├── search/route.ts          # busca na web (Tavily/DuckDuckGo)
│   │   ├── login|register|logout|me/route.ts  # autenticação
│   │   ├── admin/seed/route.ts      # seed administrativo de usuários
│   │   └── status/route.ts          # healthcheck do motor de IA
│   ├── lib/                         # auth, db, mangaba, ratelimit, search, extract...
│   ├── globals.css                  # paleta + estilos do chat (claro/escuro)
│   ├── layout.tsx
│   ├── page.tsx                     # landing
│   └── chat/page.tsx                # interface do chat
├── public/                          # logo Âncora, worker do pdf.js
├── scripts/                         # seed de usuários, sync do pdf.js worker
├── tests/                           # testes Vitest (auth, ratelimit, search, etc.)
└── ...
```

## Deploy na Vercel

Configure as variáveis de ambiente listadas acima conforme o ambiente (produção usa
Hugging Face Router como motor de IA e Postgres do Supabase/Neon para persistência).

## Limitações conhecidas / troubleshooting

- **Lint não configurado:** o repositório não possui um arquivo de configuração do ESLint
  nem a dependência `eslint` instalada. Rodar `npm run lint` (`next lint`) localmente
  dispara um assistente interativo de setup na primeira execução, o que também trava em
  ambientes não interativos como CI. Por isso o step de lint no pipeline de CI está
  marcado como best-effort (`continue-on-error: true`) até que a configuração de ESLint
  seja adicionada ao projeto.
- **Build não exige env vars, mas o app precisa delas para funcionar:** `npm run build`
  completa com sucesso mesmo sem nenhuma variável de ambiente configurada (as rotas usam
  fallback ou validação lazy em runtime). Porém, sem `OPENAI_BASE_URL`/`OPENAI_API_KEY` o
  chat não responde de verdade, e sem `POSTGRES_URL`/`SESSION_SECRET` login e histórico de
  conversas não funcionam.
