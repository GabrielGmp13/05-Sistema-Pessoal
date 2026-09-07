# Integrações externas — configuração vigente da v0.2.0

Data da revisão: 2026-09-07. O painel Google Cloud foi conferido visualmente por
Gabriel: projeto OAuth externo em **Testing**, com dois usuários de teste e
Branding básico concluído por Gabriel. Nenhum segredo foi inspecionado ou alterado.

## Inventário de variáveis e dependências

Em desenvolvimento, preencher `frontend/.env.local` (ignorado pelo Git); na
Vercel, **Settings → Environment Variables**, escolher o ambiente correto e
redeployar. Nunca copiar valores para documentação, relatório de bug ou Git.
Chaves públicas do Supabase identificam o projeto; não substituem RLS.

| Variável / configuração | Uso e exposição | Obrigatória para |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto | Aplicação |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon/publishable, nunca service role | Aplicação |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo somente servidor | Persistência das integrações Google |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth, somente servidor | Calendar/YouTube conectados |
| `GOOGLE_REDIRECT_URI` | Callback exato por ambiente | OAuth Google |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | 32 bytes aleatórios em base64, servidor | Cofre de tokens Google |
| `TMDB_API_KEY` | Chave servidor | Busca de filmes/séries e complemento técnico de anime |
| `YOUTUBE_API_KEY` | Chave servidor | Busca de vídeos/músicas (distinta de OAuth) |
| `GOOGLE_BOOKS_API_KEY` | Chave servidor | Fonte Google Books, não Open Library |
| `GOOGLE_MAPS_API_KEY` | Chave servidor; conferir billing/quota antes de habilitar | Places opcional |
| `BRAPI_TOKEN` | Token servidor opcional | Cotações sob demanda |
| SMTP no Supabase Dashboard | Segredo no provedor/Auth, não no frontend | Convites/recuperação para amigos; pendente |

`NODE_ENV` e `VERCEL_GIT_COMMIT_SHA` são metadados do runtime/deploy, não chaves
a cadastrar manualmente. **Reportar bug não exige API, e-mail ou variável nova.**

AniList, Kitsu, Jikan, Open Library, iTunes Search e Open Graph não precisam
de chave neste código. Disponibilidade, quota, licença e atribuição de dados
ainda dependem de cada provedor. Imagens remotas podem revelar IP ao host;
uploads privados usam Storage. Não habilitar cobrança sem autorização.

## Google OAuth

### Login no Projeto Pessoal

Em 2026-09-07, o login com Google foi preparado em um projeto Google Cloud
separado, `Projeto Pessoal Login`, com cliente Web exclusivo para o Supabase.
O cliente aceita a origem de produção e retorna somente para
`https://lxzhdvhtujqydqndhiec.supabase.co/auth/v1/callback`. O Supabase retorna
ao site por `https://expansiondominionpersonaledition.vercel.app/auth/confirm`,
que também está na lista de URLs autorizadas de Auth.

O botão do site usa apenas a configuração nativa do Supabase; o ID do cliente
é público, mas a chave secreta permanece exclusivamente no painel do Supabase.
Não copiar o JSON baixado, a chave secreta ou qualquer variável para Git.
Enquanto o app Google estiver em **Testing**, somente contas adicionadas como
usuários de teste podem entrar. Essa lista não substitui a regra de contas do
site: antes de convidar amigos, testar uma conta manual já existente e manter
cadastro público desligado. A conta Google de Gabriel foi incluída nessa lista
em 2026-09-07; cada amigo que participar do piloto precisará ser incluído antes
do teste.

O projeto Google Cloud abaixo continua sendo exclusivo para, depois do login,
cada usuário conectar separadamente uma conta Google para YouTube e/ou
Calendar. Essas integrações e o login não compartilham chaves nem callback.

As conexões Google estão implementadas com API Routes server-side, `state` de
uso único em cookie HttpOnly, PKCE, tokens cifrados por AES-256-GCM e tabela sem
policy de cliente. YouTube e Calendar têm registros e autorizações separados,
podendo apontar para contas Google diferentes. O navegador recebe apenas o
estado e o e-mail de cada serviço; access e refresh tokens nunca são enviados
ao frontend.

### Configuração no Google Cloud

1. Criar ou escolher um projeto no Google Cloud Console.
2. Habilitar **YouTube Data API v3**, **Google Calendar API**, **Books API** e,
   se a busca de lugares for usada, **Places API (New)**.
3. Configurar a tela de consentimento OAuth. Enquanto o app estiver em teste,
   adicionar cada conta Google autorizada no beta como usuário de teste. Manter
   Calendar/YouTube nesse projeto de teste: não publicar nem mudar para interno
   sem preparar a verificação dos escopos e a política de privacidade.
4. Criar credencial **OAuth client ID > Web application**.
5. Cadastrar como redirect URI exatamente
   `https://SEU-DOMINIO/api/integracoes/google/callback`. Para desenvolvimento,
   cadastrar também o callback local usado pelo navegador.
6. Configurar as variáveis abaixo no ambiente de produção e fazer novo deploy.

```env
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://SEU-DOMINIO/api/integracoes/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_BOOKS_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_MAPS_API_KEY` e a chave de criptografia
são exclusivamente server-side e nunca recebem prefixo `NEXT_PUBLIC_`. Gere a
última uma única vez com 32 bytes aleatórios em base64, guarde-a no cofre de
variáveis da Vercel e não a troque sem antes desconectar as contas existentes.

Depois do deploy, abrir **Perfil e configurações > Contas Google** e conectar
separadamente **YouTube** e **Google Calendar**. O fluxo sempre permite escolher
a conta: YouTube solicita somente `youtube.readonly`; Calendar solicita somente
`calendar.events` (ambos também pedem identidade/e-mail). A migration preserva
eventual conexão legada como Calendar, mas o pós-check encontrou o cofre vazio
em produção; no deploy atual, ambos precisam ser autorizados. **Desconectar** atua somente sobre o serviço
escolhido, solicita revogação ao Google e remove sua cópia cifrada local. Se o
provedor não responder, a remoção local continua sendo obrigatória.

## YouTube playlists

- A conexão lista playlists do usuário e pagina listas maiores que 50 itens.
- A Biblioteca também aceita um link público de playlist. O ID é validado no
  servidor, a prévia vem da API oficial e o usuário escolhe o que importar.
- Ao abrir uma playlist, os vídeos podem ser selecionados e importados em lotes
  de até 50 por chamada; a UI divide seleções maiores automaticamente.
- A playlist importada fica persistida em Biblioteca > Vídeos; seus itens
  apontam para vídeos normais da Biblioteca, portanto o fluxo Vídeo → Curso é
  preservado. Reimportar reaproveita vídeos com o mesmo `youtube_id` e atualiza
  os vínculos, sem duplicar a obra.
- O cadastro manual e a busca por `YOUTUBE_API_KEY` continuam disponíveis.
- Título, canal, thumbnail e duração retornados pelo YouTube são persistidos.
- Vídeos privados/removidos são omitidos e aparecem no resumo como
  indisponíveis. A playlist especial “Assistir mais tarde” (`WL`) não pode ser
  lida por esse endpoint oficial e recebe uma mensagem explícita, sem simulação.

## Metadados da Biblioteca

- **Filmes e séries:** TMDB, com `TMDB_API_KEY` server-side.
- **Vídeos:** YouTube Data API v3, com `YOUTUBE_API_KEY` para busca manual;
  playlists da conta usam a conexão OAuth separada descrita acima.
- **Livros:** Google Books, com `GOOGLE_BOOKS_API_KEY` server-side. A chave pode
  ser do mesmo projeto Google, mas deve ser restrita à Books API. Open Library
  complementa resultados sem chave, inclusive quando a fonte Google falha.
- **Animes e mangás:** AniList + Kitsu para busca parcial; Jikan participa dos
  fallbacks/metadados. Relações e detalhe AniList preservam identidade de obra;
  TMDB pode complementar equipe técnica. Não há integração IMDb direta.
  Todos podem limitar chamadas; o cadastro manual continua disponível.
- **Podcasts:** iTunes Search da Apple, sem chave. O cadastro manual continua
  disponível em caso de limite ou indisponibilidade.
- **Artigos:** leitura server-side de Open Graph, sem chave, com bloqueio de
  rede privada, redirects limitados, timeout e limite de tamanho.

As consultas JSON externas têm timeout de 10 segundos para não deixar uma
função do deploy presa quando o provedor estiver lento. Ausência de chave em
YouTube, TMDB ou Google Books desativa somente a importação daquela fonte.

No beta: testar troca de conta durante OAuth (deve rejeitar a continuação),
troca de conta Google/renovação e desconexão por serviço. A remoção local é
separada por serviço, mas a revogação no provedor pode exigir reconectar outra
autorização da mesma conta/app; não prometer isolamento da política do Google.
Apps External em Testing podem ter refresh token com validade de sete dias
para estes escopos. Ver [OAuth oficial](https://developers.google.com/identity/protocols/oauth2).

## YPT / Yeolpumta

Não foi localizada API pública documentada nem contrato oficial verificável de
exportação CSV/JSON. Por segurança, o sistema não recebe login, senha, cookie
ou token do YPT e não usa scraping. O registro manual de sessão continua sendo
o caminho suportado. Uma importação somente poderá ser desenhada a partir de
um arquivo exportado real, fornecido sem dados sensíveis, com formato estável,
prévia e deduplicação definidas; não existe parser especulativo nesta versão.

## Google Calendar

- Cada compromisso manual de `agenda` pode ser exportado para o calendário
  primário pelo ícone no card semanal.
- A primeira exportação cria o evento; as seguintes atualizam o mesmo ID, sem
  duplicar. O vínculo fica em `google_calendar_event_id`.
- Compromissos sem hora viram evento de dia inteiro. Os demais usam
  `America/Recife`; sem duração explícita, o fallback é 60 minutos.
- Provas de Estudos continuam somente leitura na Agenda e não exibem exportação.
- A sincronização consulta o mês atual (incluindo os dias visíveis das semanas
  limítrofes) ao entrar/navegar, ao retomar a aba e a cada dois minutos enquanto
  o site estiver aberto. O botão manual permite sincronizar imediatamente o
  período visível. Ocorrências recorrentes são expandidas. IDs remotos evitam
  duplicação; mudanças remotas atualizam a linha e cancelamentos viram exclusão
  lógica. Se remoto e local mudaram desde a última sincronização, o item fica
  marcado como conflito e não é sobrescrito.
- Criações, edições e exclusões feitas na Agenda são enviadas imediatamente ao
  Google. Se o evento já tiver sido removido no Google, a exclusão local ainda
  conclui sem bloquear o usuário.
- A implementação atual usa somente o calendário primário. Sincronização com o
  navegador fechado exige webhook HTTPS e armazenamento de canal/sync token;
  escolha de calendários e resolução interativa de conflito permanecem futuras.

## Google Places

- Habilitar **Places API (New)** no Google Cloud e configurar
  `GOOGLE_MAPS_API_KEY` no ambiente do servidor. Restrinja a chave à Places API.
- A busca de `/lugares` passa por uma API Route autenticada; a chave nunca entra
  no bundle cliente. O resultado preenche nome, endereço, cidade, país, Place ID
  e coordenadas internas, mas latitude/longitude não aparecem no formulário.
- Sem a variável, cadastro manual, capas e links externos continuam funcionando;
  somente a pesquisa retorna a mensagem de integração não configurada.

## Google Photos e alternativa adotada

O Google Photos Library API não oferece mais o antigo acesso amplo; o Picker
exige sessão de seleção e suas referências não são um repositório permanente.
Para evitar dependência transitória, a v2.1 adotou Supabase Storage privado como
fonte controlada das imagens:

- `capas`: capas das oito categorias e banners de Filmes, Séries, Animes,
  Mangás, Livros e Podcasts; JPG/PNG/WebP até 3 MB;
- `midias-pessoais`: avatar/background, Receitas, Lugares e arquivos de
  provas/simulados; imagens até 8 MB no cliente e documentos até 15 MB;
- paths começam por `{auth.uid()}` e a exibição usa signed URL.

Substituições têm rollback se a gravação do registro falhar. O Picker do Google
Photos não integra a v2.1 porque não melhora durabilidade, privacidade ou custo
operacional sobre esse contrato completo.

## Anki `.apkg`

`.apkg` é aceito em Revisão junto do CSV/TSV existente. O parser server-side:

- limita o pacote a 25 MB e a base SQLite descompactada a 60 MB;
- extrai somente `collection.anki2`, `collection.anki21` ou `collection.anki21b`;
- mostra decks, quantidade e prévia antes de gravar;
- converte cards básicos e cloze, remove HTML simples e deduplica conteúdo;
- permite atribuir todos os cards importados a uma matéria e conteúdo;
- importa no máximo 500 cards do deck selecionado por operação.

As dependências `fflate`, `sql.js` e `@types/sql.js` foram adicionadas para ZIP
e SQLite sem binário nativo. Mídias embutidas e modelos com JavaScript/template
complexo não são copiados; nesses casos, revisar a prévia ou usar CSV/TSV.

## Artigos, extensão e BRAPI

- Artigos usam Open Graph server-side com validação DNS contra SSRF, redirects
  manuais, timeout de 8 s, limite de 512 KB, tempo estimado e fallback manual.
- A extensão Manifest V3 apenas abre o formulário de Artigo/Vídeo com URL e
  título; instalação e configuração estão em `browser-extension/README.md`.
- `BRAPI_TOKEN` é opcional e server-side. A cotação é sob demanda, usa cache de
  60 s, valida ticker e mantém fallback claro para token/quota/ativo ausente.
  Histórico persistido, alertas e automações financeiras são pós-v2.
# Avisos de suporte por e-mail (opcional)

O próximo lote aceita Resend por chamada HTTPS server-side, sem SDK adicional.
Variáveis: `RESEND_API_KEY`, `SUPPORT_EMAIL_FROM` e
`SUPPORT_NOTIFICATION_EMAIL`. Sem as três, o chamado continua salvo e nenhum
e-mail é tentado. A mensagem contém protocolo/resumo e e-mail da conta, mas
nunca anexo, URL assinada ou credencial. O domínio remetente precisa estar
verificado no provedor. Isto não substitui o SMTP do Supabase Auth, responsável
por convite, confirmação e recuperação de senha.
