# Integrações externas — estado seguro da v2.1

Data da revisão: 2026-08-21.

## Regra comum para OAuth Google

YouTube, Calendar e Photos não podem usar chave pública nem guardar refresh token no navegador. A próxima implementação precisa de:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI` somente no servidor;
- callback com `state` de uso único, vínculo ao `auth.uid()` e proteção contra CSRF;
- armazenamento server-side cifrado do refresh token, com rotação/revogação e RLS;
- UI que só declare **conectado** depois de validar o token no provedor;
- checklist no Google Cloud Console para consentimento, redirects e escopos.

O schema atual não possui um cofre/contrato cifrado para refresh tokens. Por isso, este lote não criou rotas OAuth incompletas nem uma falsa conexão.

## YouTube

- A busca e importação manual de vídeos continua funcional com `YOUTUBE_API_KEY` server-side.
- Listar playlists privadas do próprio usuário usa OAuth 2.0 (`mine=true`); chave de API não basta.
- Escopo mínimo planejado: `https://www.googleapis.com/auth/youtube.readonly`.
- A playlist “Assistir mais tarde” tem operações não suportadas pela API; o fluxo deve tratar essa limitação explicitamente.
- Fallback mantido: URL manual, metadados pela API pública e extensão local.

Fontes oficiais: [Playlists no YouTube Data API](https://developers.google.com/youtube/v3/guides/implementation/playlists) e [`playlists.list`](https://developers.google.com/youtube/v3/docs/playlists/list).

## Google Calendar

- Objetivo futuro: exportação unilateral de eventos manuais da Agenda para o calendário primário.
- Escopo mínimo planejado: `https://www.googleapis.com/auth/calendar.events`.
- Timezone explícito: `America/Recife`.
- Para idempotência real, a Agenda precisará armazenar o ID externo ou gerar um ID aceito pelo Calendar. Nenhuma coluna foi criada antes de fechar o contrato OAuth/token.
- Provas de Estudos continuam somente leitura na Agenda e não devem ser exportadas como se fossem eventos manuais sem decisão específica.

Fontes oficiais: [escopos do Calendar](https://developers.google.com/workspace/calendar/api/auth) e [criação/idempotência de eventos](https://developers.google.com/workspace/calendar/api/guides/create-events).

## Google Photos

- Desde 31/03/2025, o Library API não oferece mais o antigo acesso amplo à biblioteca; o Picker API é o caminho indicado para seleção iniciada pelo usuário.
- O Picker exige OAuth e uma sessão de seleção. Contas de serviço não substituem o usuário nesse fluxo.
- Mesmo quando habilitado, a imagem escolhida deve ser copiada para o Supabase Storage privado; Google Photos não vira fonte permanente da capa.
- O upload direto ao bucket `capas` é o caminho funcional atual.

Fontes oficiais: [visão geral do Google Photos APIs](https://developers.google.com/photos/overview/about), [notas de versão](https://developers.google.com/photos/support/release-notes) e [sessões do Picker](https://developers.google.com/photos/picker/guides/sessions).

## Anki `.apkg`

- CSV/TSV UTF-8 com preview, limite, módulo e deduplicação permanece o caminho suportado e agora tem testes automatizados.
- `.apkg` combina pacote ZIP, SQLite, modelos e mídia. Um parser parcial seria frágil e poderia importar conteúdo incorreto.
- Estado: **PÓS-V2 / PENDENTE DECISÃO** sobre biblioteca de parsing, limite de arquivo, suporte de mídia e mapeamento de modelos.

Fonte oficial: [formatos importáveis pelo Anki](https://docs.ankiweb.net/importing/intro.html) e [arquivos de texto](https://docs.ankiweb.net/importing/text-files.html).

## Extensão Edge/Chrome

- Implementada em `browser-extension/` com Manifest V3 e service worker local.
- Não lê cookies, sessão ou conteúdo da conta; apenas abre `/biblioteca` com URL/título para revisão.
- A autenticação continua a do próprio site. A URL publicada é configurada pelo usuário e salva em `chrome.storage.sync`.
- O popup informa se o domínio ainda não foi configurado, não fecha em caso de
  erro e confirma quando a Biblioteca foi aberta para revisão.
- Instalação manual, recarga, configuração e fluxos separados de Artigo/YouTube
  estão documentados no README da extensão.

Fonte oficial: [Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3).
