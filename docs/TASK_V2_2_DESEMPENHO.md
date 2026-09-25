# V2.2 — auditoria e plano de desempenho

**Data da auditoria:** 2026-09-25

**Estado:** correção complementar publicada nos commits `b075da2` e `442b94e`

**Escopo preservado:** V2.1 essencial, sem reativar cômodos pausados e sem
antecipar itens de V3

## Resumo executivo

O piscar do tema claro antes do escuro é um defeito real e tem causa
identificada. O HTML inicial é entregue sem classe de tema e o CSS parte de
`color-scheme: light`. O código que lê a preferência do `localStorage` foi
colocado em `next/script` com `beforeInteractive`, mas o HTML publicado mostra
que o Next.js serializa esse conteúdo na fila `self.__next_s`; portanto ele não
é um script nativo executado imediatamente pelo parser. A classe `dark` chega
depois da primeira aparência clara em alguns carregamentos.

O site já possui cookies essenciais: a sessão do Supabase usa cookies e a
integração Google usa cookies temporários de estado/verificador. Cookies não
são um acelerador genérico; adicionar mais cookies aumenta o cabeçalho enviado
em requisições compatíveis. Para o tema, a primeira solução deve ser um
bootstrap nativo, pequeno e síncrono no `<head>`, mantendo a preferência local.
Um cookie funcional de tema só deve ser adotado se o ensaio demonstrar que o
servidor realmente precisa conhecer o tema antes de renderizar.

Os maiores ganhos esperados para a V2.2 estão em quatro pontos:

1. eliminar o flash de tema e a divergência visual antes da hidratação;
2. reduzir as consultas duplicadas e desnecessárias do Início e do shell;
3. remover atrasos artificiais de navegação de 360 ms e 2,45 s;
4. estabelecer orçamento mensurável para JavaScript, fontes, imagens e Web
   Vitals antes de otimizar por tentativa.

## Resultado implementado

- O bootstrap de tema agora é um `<script>` nativo no HTML. Build local
  confirmou que ele não passa mais por `self.__next_s`; recarga com Lua salva
  manteve `html.dark`, `color-scheme: dark` e zero aviso/erro no console.
- O ensaio repetido de F5 revelou uma segunda troca: na hidratação, o estado
  inicial claro do `ThemeProvider` removia a classe escura já aplicada e só a
  recolocava após ler `localStorage`. Os efeitos agora aguardam a reconciliação
  das preferências; o seletor fica invisível, preservando espaço, durante esse
  intervalo mínimo para não exibir rótulo incorreto.
- O resumo do Início usa `sessionStorage` por conta e por aba durante cinco
  minutos. Após a confirmação da sessão, mostra o último resumo válido e
  revalida no Supabase em segundo plano. O botão Atualizar ignora o cache;
  falhas preservam dados válidos com aviso; logout limpa os caches da sessão.
- O smoke publicado do primeiro candidato confirmou tema escuro em 10/10
  recargas, mas revelou que uma sessão nula transitória descartava o cache.
  A limpeza foi restringida ao evento real `SIGNED_OUT` antes do reteste final.
- O Início passou de 16 operações fixas para cinco essenciais. Projetos e
  Receitas conservam o código e só consultam se forem reativados; os demais
  cômodos pausados não fazem consulta oculta.
- Provas de hoje são derivadas da mesma resposta de próximas provas, eliminando
  uma consulta sobreposta.
- `AppSessionProvider` centraliza sessão, perfil, URLs assinadas e módulos
  ocultos para `GlobalNav`, `RightRail` e Início.
- O relógio que muda a cada segundo foi isolado; calendário/agenda atualizam a
  referência temporal por minuto.
- Navegação comum e transformação da Biblioteca chamam `router.push`
  imediatamente, sem esperas de 360 ms ou 2,45 s.
- Imagens externas/assinadas mantêm a política sem proxy compartilhado e agora
  usam decodificação assíncrona por padrão.
- As fontes foram inventariadas, mas não removidas às cegas: os pesos existentes
  são usados pelo CSS e o navegador baixa sob demanda. Trocar para `next/font`
  sem fonte variável medida poderia antecipar mais downloads, portanto não há
  alteração tipográfica neste lote.

Validação local complementar: 157 testes Node, typecheck, lint e build de 49
páginas; `/`, `/login` e demais páginas estáticas continuam prerenderizadas.
CI e deploy Vercel dos dois commits passaram.

No smoke autenticado, o tema permaneceu escuro em 10/10 recargas do primeiro
candidato e 5/5 do candidato final, sempre sem aviso/erro no console. O cache
não elimina a espera inicial: confirmar a sessão/hidratar ainda levou cerca de
1,4–2,1 s após o evento de carga nas cinco amostras finais. Portanto ele reduz
a espera adicional do Supabase quando esta é maior, mas não equivale ao HTML
personalizado já entregue pelo servidor. Próximo lote deve medir uma resposta
agregada ou renderização autenticada no servidor antes de mudar a arquitetura.

Validação publicada: CI `Validate repository` aprovada; Vercel concluiu o
deploy; `/login` respondeu 200 com `X-Vercel-Cache: PRERENDER` e bootstrap
nativo antes da fila do Next; raiz sem sessão respondeu 307 para `/login`.
Na sessão autenticada, Início abriu com `html.dark`, `color-scheme: dark`, zero
atalho pausado e nenhum aviso/erro no console. Biblioteca abriu pelo menu e o
fluxo retornou ao Início.

## Evidências levantadas

### Tema e primeira pintura — prioridade P0

- `frontend/app/layout.tsx` entrega `<html lang="pt-BR">` sem classe de tema.
- `frontend/app/globals.css` declara `:root { color-scheme: light; }` e só troca
  para escuro quando `.dark` aparece.
- `frontend/components/ThemeProvider.tsx` inicia o estado React como `claro` e
  reconcilia `localStorage` em um `useEffect`.
- No HTML publicado, `tema-anti-flash` aparece dentro de
  `self.__next_s.push(...)`, e não como o bootstrap nativo esperado.
- Na sessão autenticada inspecionada, o estado final estava correto (`dark`), o
  que confirma que o problema é de ordem/primeira pintura, não de persistência.
- O `ThemeProvider` ainda iniciava com `tema='claro'`. Seu efeito de escrita
  removia `.dark` enquanto o efeito de leitura agendava o estado salvo; essa
  janela explica o flash intermitente mesmo depois do bootstrap nativo.

### Excesso de trabalho no Início — prioridade P0

`frontend/app/page.tsx` dispara 16 operações em `Promise.allSettled` ao montar.
Entre elas continuam consultas de Projetos, Receitas, Saúde/humor, Finanças,
Investimentos, Lugares e Idiomas, embora esses cômodos estejam pausados e não
sejam exibidos. Há ainda intervalos sobrepostos de Agenda e Provas que podem
ser carregados uma vez e derivados em memória.

### Trabalho global duplicado — prioridade P1

- `GlobalNav` e `RightRail` obtêm a sessão separadamente e ambos geram URLs
  assinadas para avatar e capa.
- `RightRail` consulta Agenda e Provas que também são consultadas pelo Início.
- `useModulosVisiveis` é usado por mais de um componente e cada instância abre
  seu próprio `onAuthStateChange` e executa `getSession()`.
- `RightRail` atualiza `agora` a cada segundo, causando nova renderização de
  toda a coluna para manter o relógio.

### Navegação percebida — prioridade P0

`GlobalNav` impede a navegação normal e aguarda 360 ms nas transições comuns.
Ao entrar ou sair da Biblioteca no desktop, a espera chega a 2.450 ms para
terminar uma animação. Esse tempo é percebido como lentidão mesmo quando dados
e bundles já estão prontos.

### Fontes, imagens e bundles — prioridade P1/P2

- Há 10 arquivos WOFF2, cinco pesos de Syne e cinco de JetBrains Mono, somando
  aproximadamente 174 KB sem compressão de transporte.
- A busca estática encontrou 32 ocorrências de imagem explicitamente não
  otimizada, `<img>` direto ou o wrapper `UnoptimizedExternalImage`, distribuídas
  por 15 arquivos. Parte é justificada por URLs privadas/assinadas, mas a regra
  ainda precisa ser revisada caso a caso.
- O último build contém 68 chunks estáticos, cerca de 2,5 MB no total entre
  todas as rotas; o maior arquivo individual tem aproximadamente 241 KB sem
  compressão de transporte. Isso é inventário do build, não bytes transferidos
  por uma única rota.
- As imagens públicas do repositório são pequenas; o maior arquivo local
  encontrado tem cerca de 29 KB. O risco principal está nas mídias remotas e
  privadas, não nos banners versionados.

### Linha de base pública

Cinco acessos sem cache ao `/login` publicado retornaram 200, 16.884 bytes e
TTFB entre 308 e 345 ms na máquina da auditoria. A resposta estava marcada
como `X-Vercel-Cache: PRERENDER`. Isso é saudável e deve ser preservado. Não é
uma medição completa da área autenticada nem substitui Lighthouse/Core Web
Vitals.

## Decisão sobre cookies

### Manter

- cookies de autenticação do Supabase;
- cookies transitórios e protegidos do OAuth Google;
- `localStorage` para rascunhos locais e estados temporários que não precisam
  ser enviados ao servidor.

### Não criar na V2.2 sem necessidade medida

- cookies de analytics, marketing ou rastreamento;
- banner de consentimento apenas como suposta otimização;
- cookies duplicando todo o conteúdo do `localStorage`;
- preferência de tema lida pelo layout raiz antes de comparar o custo.

Ler `cookies()` em um layout/página é uma API de tempo de requisição e opta a
rota por renderização dinâmica no Next.js. Como `/login` hoje é prerenderizado,
usar cookie no layout raiz para corrigir o tema pode trocar um defeito visual
por pior TTFB/cache. Se futuramente houver cookies não essenciais, a necessidade
de consentimento e política deve ser avaliada como privacidade/conformidade,
separada de desempenho.

## Plano de execução V2.2

### Lote 0 — linha de base reproduzível

1. Medir três execuções mobile e desktop em `/login`, Início, Agenda,
   Biblioteca, Estudos e Treino, com uma conta descartável.
2. Registrar por rota: LCP, INP/TBT de laboratório, CLS, TTFB, quantidade de
   requisições, bytes transferidos, JavaScript executado e consultas Supabase.
3. Separar primeira visita, recarga sem cache e navegação interna aquecida.
4. Guardar apenas resultados agregados no repositório; não versionar sessão,
   cookies, HAR autenticado ou dados pessoais.

Critério: nenhuma otimização entra sem valor anterior e posterior comparável.

### Lote 1 — tema correto antes da primeira pintura

1. Substituir o uso atual de `next/script` por um bootstrap nativo mínimo no
   início do `<head>`, com valores permitidos para tema, decoração e cor.
2. Manter uma única implementação compartilhada para validar/aplicar as
   preferências, evitando divergência entre bootstrap e `ThemeProvider`.
3. Tornar o controle de tema estável durante a hidratação, sem mostrar ícone ou
   rótulo de tema claro enquanto o documento já está escuro.
4. Testar `claro`, `suave`, `nublado`, `estrelado`, `escuro`, primeira visita
   guiada pelo sistema operacional e falha/bloqueio de storage.
5. Só testar cookie funcional compacto se a solução nativa não eliminar o
   flash. Nesse caso, isolar o impacto para não tornar páginas públicas
   estáticas desnecessariamente dinâmicas.

Critérios de aceite:

- a primeira pintura já usa o tema salvo;
- nenhuma transição claro → escuro em recarga fria ou reabertura;
- zero aviso de hidratação no console;
- sem regressão no cache/TTFB de `/login`.

### Lote 2 — dieta de dados do Início e shell global

1. Impedir consultas de todos os cômodos pausados.
2. Buscar o intervalo maior de Agenda/Provas uma vez e derivar “hoje” em
   memória quando as regras de acesso e ordenação forem equivalentes.
3. Criar uma fonte compartilhada de sessão/perfil/URLs assinadas para
   `GlobalNav` e `RightRail`.
4. Centralizar módulos visíveis em um provider único, com uma sessão e uma
   assinatura de autenticação.
5. Reutilizar ou coordenar os dados de Agenda/Provas entre Início e coluna
   lateral, mantendo atualização manual e tratamento de falha parcial.
6. Isolar o relógio do restante da coluna; avaliar atualização por minuto ou
   componente mínimo se os segundos continuarem visíveis.
7. Cancelar respostas obsoletas ao desmontar/trocar rota e evitar atualização
   de estado após navegação.

Critérios de aceite:

- zero consulta aos cômodos pausados no Início;
- redução de pelo menos 40% nas requisições de dados da carga autenticada
  inicial em relação ao Lote 0;
- apenas uma resolução de sessão/perfil e uma URL assinada por mídia necessária;
- Atualizar e eventos `agenda-atualizada`/`perfil-atualizado` continuam
  funcionando.

### Lote 3 — navegação sem espera artificial

1. Remover o bloqueio de 360 ms da navegação comum.
2. Redesenhar a transição da Biblioteca para acontecer junto/depois da troca
   de rota, sem aguardar 2,45 s antes de `router.push`.
3. Respeitar `prefers-reduced-motion` e manter foco, histórico, abrir em nova
   guia e modificadores de teclado.

Critérios de aceite:

- navegação começa em até 100 ms após clique/toque;
- nenhuma animação impede o uso da rota de destino;
- fluxos e aparência permanecem reconhecíveis, sem remover funcionalidade.

### Lote 4 — fontes, imagens e estabilidade visual

1. Medir quais pesos das duas fontes são realmente usados e reduzir arquivos
   redundantes; preferir fonte variável quando o arquivo final for menor.
2. Avaliar `next/font/local` para preload controlado, fallback ajustado e menor
   deslocamento de layout, sem trocar a identidade tipográfica.
3. Classificar as 32 ocorrências de imagem: pública otimizável, externa sem
   controle, privada assinada ou preview local.
4. Garantir dimensões/proporção reservada em toda mídia para evitar CLS;
   manter lazy loading abaixo da dobra e alta prioridade apenas para o LCP.
5. Não passar mídia privada por cache compartilhado sem prova de isolamento e
   expiração segura.

Critérios de aceite:

- nenhuma regressão visual das fontes;
- CLS até 0,1 nas rotas medidas;
- nenhuma imagem privada fica pública ou reutilizável entre usuários;
- bytes de fontes e imagens registrados antes/depois.

### Lote 5 — JavaScript, renderização e cache

1. Mapear o JavaScript por rota, em vez de usar somente o total da pasta de
   chunks.
2. Carregar sob demanda editores, modais e dependências pesadas que não são
   necessários na primeira interação.
3. Confirmar que dependências de servidor não entram no bundle do navegador.
4. Revisar cache apenas por classe de dado:
   - assets imutáveis: cache longo administrado pelo Next/Vercel;
   - páginas públicas estáticas: preservar prerender/cache;
   - dados pessoais e URLs assinadas: privados, com escopo e expiração;
   - dados mutáveis: invalidação explícita após gravação.
5. Não criar service worker/offline nesta versão; continua fora do escopo V2.2.

Critérios de aceite:

- queda mensurável do JavaScript inicial nas rotas mais pesadas;
- nenhum dado de um usuário servido a outro por cache;
- operações de criar/editar/excluir continuam refletindo imediatamente.

### Lote 6 — gates e publicação

Cada lote deve passar:

- testes Node existentes e novos testes focados;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- QA autenticada com conta descartável;
- teste mobile e desktop, claro/escuro e movimento reduzido;
- comparação de desempenho com o Lote 0;
- CI, deploy Vercel e smoke publicado antes de encerrar o lote.

Metas de referência no percentil 75 quando houver dados de campo, ou em três
execuções consistentes de laboratório enquanto o uso for pequeno:

- LCP até 2,5 s;
- INP até 200 ms (TBT apenas como aproximação no laboratório);
- CLS até 0,1;
- ausência de flash de tema;
- nenhuma rota piora mais de 10% sem justificativa documentada.

## Ordem recomendada

| Ordem | Entrega | Ganho esperado | Risco |
|---|---|---:|---:|
| 1 | Lote 0 + correção do tema | alto e imediatamente perceptível | baixo |
| 2 | consultas do Início/shell | muito alto | médio |
| 3 | atrasos de navegação | muito alto na percepção | médio visual |
| 4 | fontes e imagens | médio | médio por mídia privada |
| 5 | bundles e cache fino | médio/alto conforme medição | alto se mal isolado |
| 6 | consolidação e smoke | garante o resultado | baixo |

## Fora do escopo desta V2.2

- reativar Idiomas, Projetos, Programação ou Diário;
- criar analytics/marketing ou contratar monitoramento pago;
- service worker, PWA ou sincronização contínua em segundo plano;
- redesign funcional dos módulos;
- mudar schema de banco sem uma necessidade nova, medida e documentada;
- antecipar telas catalogadas para V3.

## Fontes técnicas consultadas

- [Next.js — cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Next.js — Font](https://nextjs.org/docs/app/api-reference/components/font)
- [Next.js — Image](https://nextjs.org/docs/app/api-reference/components/image)
- [web.dev — Core Web Vitals](https://web.dev/articles/vitals)
