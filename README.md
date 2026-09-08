# CircoRay — Parque dos Horrores

Experiência interativa hospedada no Cloudflare Pages, com painel administrativo em `/adm/` e configuração persistente em Workers KV.

## Estrutura

- `/` — experiência pública.
- `/adm/` — painel administrativo.
- `/api/config` — configuração pública usada pelo jogo.
- `/api/admin/*` — endpoints administrativos autenticados.
- `assets/js/game-legacy.js` — lógica legada isolada durante a migração gradual.
- `assets/js/boot.js` — inicialização e aplicação da configuração remota.
- `assets/js/game-config-adapter.js` — ponte entre a configuração e a lógica existente.
- `functions/` — Cloudflare Pages Functions.

## Cloudflare Pages

O projeto usa Pages Functions; portanto não é mais um site puramente estático.

Configuração recomendada do projeto:

- Framework preset: `None`
- Build command: vazio
- Build output directory: `/`
- Production branch: `main`

### 1. Criar o KV

No Cloudflare, crie um namespace Workers KV para guardar a configuração publicada.

No projeto Pages, em **Settings > Bindings**, adicione um binding do tipo **KV namespace** com o nome exato:

`CONFIG_KV`

Associe o namespace criado. Faça isso para Production e, se desejar testar previews com persistência, também para Preview.

### 2. Criar os segredos

Em **Settings > Variables and Secrets**, configure:

- `ADMIN_PASSWORD` — senha usada para entrar em `/adm/`.
- `SESSION_SECRET` — segredo aleatório longo, recomendado com pelo menos 32 bytes de entropia.

Não coloque nenhum desses valores no repositório.

### 3. Redeploy

Bindings e secrets de Pages Functions passam a valer após um novo deployment. Depois do redeploy:

- acesse `https://SEU-PROJETO.pages.dev/adm/`;
- entre com `ADMIN_PASSWORD`;
- altere a configuração;
- clique em **Publicar alterações**.

A página pública busca `/api/config` sem cache e recebe a revisão publicada no KV. Se o KV estiver temporariamente indisponível ou ainda não tiver configuração gravada, o servidor usa os valores padrão para não derrubar a experiência.

## Segurança do admin

- senha validada somente no servidor;
- cookie de sessão `HttpOnly`, `Secure` e `SameSite=Strict`;
- sessão assinada por HMAC e expira em 12 horas;
- tentativas de senha incorreta são limitadas por IP usando KV;
- endpoints de escrita exigem sessão válida;
- publicação usa `expectedRevision` para impedir sobrescrita silenciosa por duas abas administrativas;
- `/adm/` usa `noindex` e respostas recebem headers de segurança.

## Desenvolvimento local

Nunca versione `.dev.vars` ou `.env` contendo segredos.

Para testar Pages Functions localmente, use Wrangler com um binding KV chamado `CONFIG_KV` e forneça `ADMIN_PASSWORD` e `SESSION_SECRET` por `.dev.vars` ou equivalente.
