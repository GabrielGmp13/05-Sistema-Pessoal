# Integrações externas — configuração da v2.1

Data da revisão: 2026-08-21.

## Google OAuth

A conexão Google está implementada com API Routes server-side, `state` de uso
único em cookie HttpOnly, PKCE, tokens cifrados por AES-256-GCM e tabela sem
policy de cliente. O navegador recebe apenas estado conectado/desconectado;
access e refresh tokens nunca são enviados ao frontend.

### Configuração no Google Cloud

1. Criar ou escolher um projeto no Google Cloud Console.
2. Habilitar **YouTube Data API v3** e **Google Calendar API**.
3. Configurar a tela de consentimento OAuth. Enquanto o app estiver em teste,
   adicionar a conta do Gabriel como usuário de teste.
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
```

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET` e a chave de criptografia
são exclusivamente server-side e nunca recebem prefixo `NEXT_PUBLIC_`. Gere a
última uma única vez com 32 bytes aleatórios em base64, guarde-a no cofre de
variáveis da Vercel e não a troque sem antes desconectar as contas existentes.

Depois do deploy, abrir **Perfil e configurações > Google > Conectar Google**,
autorizar os escopos `youtube.readonly` e `calendar.events` e confirmar o e-mail
conectado. **Desconectar** solicita revogação ao Google e remove a cópia cifrada
local. Se o provedor não responder, a remoção local continua sendo obrigatória.

## YouTube playlists

- A conexão lista playlists do usuário e pagina listas maiores que 50 itens.
- Ao abrir uma playlist, os vídeos podem ser selecionados e importados em lotes
  de até 50 por chamada; a UI divide seleções maiores automaticamente.
- `youtube_id` já existente é ignorado; o cadastro manual e a busca por
  `YOUTUBE_API_KEY` continuam disponíveis.
- Título, canal, thumbnail e duração retornados pelo YouTube são persistidos.
- Vídeos privados/removidos são omitidos. “Assistir mais tarde” continua sujeito
  às limitações próprias da YouTube Data API e pode não aparecer como playlist.

## Google Calendar

- Cada compromisso manual de `agenda` pode ser exportado para o calendário
  primário pelo ícone no card semanal.
- A primeira exportação cria o evento; as seguintes atualizam o mesmo ID, sem
  duplicar. O vínculo fica em `google_calendar_event_id`.
- Compromissos sem hora viram evento de dia inteiro. Os demais usam
  `America/Recife`; sem duração explícita, o fallback é 60 minutos.
- Provas de Estudos continuam somente leitura na Agenda e não exibem exportação.
- Sincronização bidirecional, importação do Calendar e tratamento de exclusão
  remota são pós-v2 por exigirem conflito, autoria e política de remoção.

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
