# DESIGN.md

Referência visual para qualquer IA ou dev gerar páginas novas sem quebrar a consistência do sistema. As regras aqui refletem o que já está implementado — não são aspiracionais.

---

## Paleta de cores

**Atualizada em 2026-08-30** — revisão das cinco iluminações a partir da
proposta do v0, com contraste recalculado e correção dos consumidores de cor.
A fonte única de tokens continua a da DEC-037/049, incluindo Biblioteca;
não há tema independente por módulo. Valores completos e limites da validação
estão em `THEMES_AUDIT.md` e `frontend/tests/theme-contrast.test.ts`.

Diferente da DEC-034 (só modo escuro), esta paleta tem **modos claros e
escuros reais**, organizados como iluminações no controlador de atmosfera
(DEC-039/049/060/061): Sol, Suave, Nublado, Estrelado e Lua.

```css
/* Claro (:root), suave (.soft), nublado (.cloudy), estrelado (.dark.starry) e
   escuro (.dark) — valores completos em oklch() no
   globals.css real. Vocabulário shadcn (--background/--card/--primary...)
   é a fonte da verdade; vocabulário antigo (--bg/--surface/--acao...)
   é alias, consumido pelos CSS Modules de Treino/Dashboard sem alteração
   de componente. Ver ARCHITECTURE.md → Stack mista de estilização. */
--bg: var(--background);
--surface: var(--card);
--surface-2: color-mix(in oklch, var(--muted) 94%, var(--season-surface));
--accent-wash: color-mix(in oklch, var(--accent) 88%, var(--season-accent));
--accent-wash-forte: color-mix(in oklch, var(--accent-wash) 72%, var(--accent-foreground));
--acao: var(--primary);
--acao-texto: var(--primary-foreground);
--text: var(--foreground);
--texto-secundario: var(--muted-foreground);
--texto-terciario: var(--muted-foreground);
--info: var(--primary);
--erro: var(--destructive);
--erro-forte: var(--destructive);
--aviso: var(--warning);
```
 
Cada iluminação altera o conjunto semântico completo, não apenas o fundo:
superfícies, bordas, textos, ações, campos, header, dropdowns, vidro e sombras
seguem a mesma temperatura. Sol usa creme dourado/marfim; Suave combina papel,
areia e argila; Nublado usa azul acinzentado e gelo; Estrelado permanece em
azul-marinho/petróleo; Lua usa carvão, grafite e ardósia neutros/frios, sem
preto puro ou dominante alaranjada. `--page-glow`,
`--page-depth`, `--glass-background`, `--atmosphere-panel` e os tokens do topo
criam profundidade sem substituir os tokens de negócio. A iluminação define a
base; `--season-accent`, `--season-surface`, `--season-border` e
`--season-glow` acrescentam uma nuance leve de Primavera, Verão, Outono ou
Inverno. “Nenhum” aponta esses tokens para a paleta-base e não adiciona nuance.

Na entrada de Treino, o fundo e as superfícies derivam desses mesmos tokens em
camadas discretas: métricas e modalidades recebem relevo sutil, enquanto
Estrelado e Lua aprofundam azul-marinho/carvão sem reduzir contraste. O card de
Shape mantém foto full-bleed com clipping arredondado, título no topo e dados
corporais concentrados em um rodapé com overlay legível.

### Contrato de cores e contraste

`--accent` é fundo semântico, não alias de texto. Para texto nesse fundo usar
`--accent-foreground`; para foco de teclado usar `--ring`, nunca uma cor
sazonal decorativa de baixo contraste.

| Uso | Tokens | Contexto |
|---|---|---|
| Sucesso / feito | `--success` | Texto/ícone de estado sobre página/card |
| Aviso / intermediário | `--warning` | Texto de aviso e estrelas interativas |
| Badge sólido de sucesso/aviso | `--success` + `--success-foreground`, ou `--warning` + `--warning-foreground` | Texto inverso somente sobre o fundo sólido correspondente |
| Estado com fundo suave | `--foreground` sobre `--success-muted` ou wash de aviso | Não usar o texto inverso do badge sólido |
| Info / PR | `--primary` + `--primary-foreground` | Badge preenchido |
| Erro / destrutivo | `--destructive` | Texto e borda; botão com wash de 10%, hover de 20% |
| Texto secundário / vazio | `--muted-foreground` | Nunca cinza hexadecimal fixo |

Testar pares de texto normal a 4,5:1 e indicadores essenciais de controle a
3:1. A regressão automatizada cobre os pares declarados nos cinco temas ×
cinco decorações, incluindo transparências destrutivas; não certifica fotos,
cores de dados escolhidas pelo usuário ou todas as sobreposições possíveis.
Scrims pretos, texto branco sobre capas, máscaras e cores figurativas de
pétalas/folhas/neve permanecem intencionais e inventariados na auditoria.

## Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| Dados/números | JetBrains Mono | valores, datas, métricas, badges numéricos |
| Títulos | Syne | `<h1>`–`<h3>`, headers de seção, nomes de card |
| Títulos grandes em destaque (hero/banner) | Syne itálico | ver Banner de categoria, abaixo — substitui "Fraunces" da referência original (fonte não self-hosted, não adotada — ver DEC-034) |
| Corpo de texto | herdado do sistema (sans-serif padrão) | parágrafos, labels de formulário |

Todas self-hosted em `.woff2` — nunca carregar de CDN externo.

---

## Layout e grid

- Container principal: `.container`, largura controlada, padding lateral consistente.
- Grids de duas colunas em desktop colapsam para uma coluna abaixo de `680px`–`720px`.
- Grids de cards usam `repeat(auto-fill, minmax(...))` quando o número de itens é variável.
- Breakpoint extra para telas muito pequenas: `360px`–`400px`.
- Rotas autenticadas comuns passam pelo `AppChrome`: coluna pessoal fixa à
  esquerda, do topo ao rodapé da janela, e conteúdo principal à direita em
  telas largas. A coluna recolhe abaixo de `1480px` para preservar módulos
  densos e mobile. Telas de foco, como prova ENEM e sessão de Revisão, e todas
  as rotas `/biblioteca/*` continuam em largura total; a Biblioteca já possui
  sua própria sidebar local e nunca exibe as duas colunas juntas. Perfil,
  atmosfera e saída ocupam o topo em formato compacto somente nesse módulo
  (DEC-071).
- A coluna lateral usa a mesma atmosfera do site, não um tema independente:
  relógio digital, calendário do mês, linha temporal da Agenda/provas e resumo
  de perfil/tema herdam `--glass-background`, `--page-glow`,
  `--season-accent` e demais tokens globais.
- Perfil e o card de controles (editar, atmosfera e sair) são blocos fixos no
  topo e no rodapé da coluna. Entre eles há uma única área rolável contendo
  relógio, calendário e o card completo da Agenda. Assim, todos os compromissos
  continuam alcançáveis sem deslocar a identidade nem as ações permanentes.
- Em telas largas, o topo global mostra somente a navegação principal dentro da
  área de conteúdo. Perfil, controle de atmosfera e saída ficam na coluna
  pessoal. A área principal recebe gradientes discretos e linhas luminosas por
  tema/estação, criando profundidade sem reescrever os cards de cada módulo.
- Cabeçalhos de página começam diretamente no título principal. Não usar
  eyebrow/kicker pequeno acima do `<h1>`; rótulos pequenos permanecem válidos
  dentro de seções e cards, onde ajudam a criar hierarquia (DEC-071).

### Layout por módulo com sidebar interna (DEC-032)
Módulos com navegação por categoria (Biblioteca; possivelmente Treino/Estudos
no futuro) usam `layout.tsx` próprio dentro da pasta de rota do módulo,
envolvendo a página com uma sidebar lateral compacta e conteúdo fluido. Na
Biblioteca, a sidebar usa largura estável de `13.25rem` a `15.25rem`, enquanto
o conjunto fica centralizado em até `1440px`. No catálogo desktop, a sidebar
permanece imóvel e a coleção possui a única rolagem vertical; Gêneros e mobile
usam a rolagem normal da página. Troca de categoria é estado de cliente
(`useState`), sem reload nem URL nova.

---

## Componentes

### Cards (genérico)
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 10px–14px;
padding: 1–1.5rem;
```

### Botões
| Tipo | Estilo |
|---|---|
| Primário | fundo `--acao`, texto `--acao-texto`, `border-radius: 6–8px`, `font-weight: 700` |
| Ação do banner da Biblioteca | fundo misturado de `--success`/`--primary`, texto `--primary-foreground`, sem cor dourada fixa |
| Fantasma | sem fundo, borda `--border`, texto secundário, hover clareia borda |
| Destrutivo | texto `--destructive`; CSS Modules usam borda temática, shadcn usa wash de 10% e hover de 20% |
| Ícone | sem fundo, borda `--border`, padding curto, foco `--ring` |

Transições nunca acima de `.2s`.

### Inputs
```css
background: var(--bg);
border: 1px solid var(--border);
border-radius: 6–8px;
padding: .5–.65rem;
```
Foco: borda muda para `--ring`.

### Modais
```css
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.72); }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; max-width: 320–420px; }
```
Sempre com header (título + botão fechar `✕`), body, footer (botão fantasma + ação). Fecham via clique no backdrop, tecla Escape, ou botão `✕`.
**Toda ação destrutiva passa por modal de confirmação — nunca `confirm()` nativo do browser.** O padrão reutilizável atual é `components/ui/confirm-dialog.tsx`; a dívida conhecida foi zerada em 2026-08-11.

### Toast
```css
position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
```
Duas variantes: `.ok` (borda semântica de sucesso) e `.erro` (borda `--destructive`).

---

## Padrão: Sidebar de módulo

Introduzido na Biblioteca v2 (DEC-032 + DEC-034), pensado como componente
genérico reutilizável (`components/Sidebar.tsx`) para futuros módulos com
navegação por categoria.

**Estrutura, de cima pra baixo:**
1. **Campo de busca** (opcional, controlado pelo componente pai)
2. **Rótulo de seção** (ex: "Biblioteca") — uppercase, pequeno, `--texto-secundario`
3. **Lista de itens** — ícone + label + badge; as contagens reais de todas as categorias são carregadas na entrada do módulo
4. **Rodapé** — ação secundária opcional e botão primário (ex: "+ Adicionar obra")

Em telas largas, perfil, atmosfera e logout vivem na coluna pessoal esquerda
nas rotas comuns (DEC-049 evoluída): avatar, nome e
`user_metadata.background_url` aparecem no bloco de perfil da coluna, junto dos
controles de editar, tema e sair. “Início” continua sendo o acesso à Home. Na
Biblioteca, a coluna pessoal inteira é omitida porque o módulo já possui sidebar
própria; seu perfil reaparece compacto na barra superior com atmosfera e saída,
preservando os acessos sem criar uma segunda coluna (DEC-071). A imagem real de
background nunca é aplicada ao restante da barra superior: a continuidade
visual fora do perfil usa apenas manchas e fragmentos abstratos em forma de
pétalas/lascas. As partículas usam a cor ambiente configurável ou o fallback
da iluminação, sem cobrir os links.
Fragmentos pequenos e orgânicos nunca repetem ou esticam `background_url`,
formam faixa sólida ou prejudicam a leitura. Os links ficam sobre uma cápsula
translúcida com blur, borda e item ativo próprio, separando conteúdo e decoração.
Com Idiomas, Histórico e Programação, a faixa mantém rolagem horizontal abaixo
de 960px; entre 960px e 1319px usa ícones com `aria-label`/tooltip, e a partir
de 1320px volta a exibir os rótulos completos para evitar colisão com perfil e
ações.

O wrapper do controlador não pinta superfície própria: somente o botão
arredondado recebe fundo e borda. O foco de teclado usa anéis em duas camadas
com o mesmo raio de 8px; o botão “Sair” segue o mesmo padrão, sem outline
retangular externo.

O controle de atmosfera pertence à área direita da navegação global,
imediatamente ao lado de “Sair”. Um único botão abre duas dimensões independentes:
a linha de iluminação (Sol, Suave, Nublado, Estrelado e Lua) e a linha de
decoração (Primavera/pétalas, Verão/brilhos e raios, Outono/folhas,
Inverno/neve e cristais, mais Nenhum). “Noite” foi removida desta dimensão por
não ser estação do ano; `estrelado` continua como iluminação, e o valor local
antigo `noite` migra automaticamente para `nenhum`. Ambas persistem em `localStorage`; a animação CSS
respeita `prefers-reduced-motion`. A cor ambiente também é local, editável no
resumo do perfil e aplicada apenas a partículas, brilhos e rastros — nunca à
barra inteira. Na tela de login, onde não há logout, o controlador permanece
como ação isolada no topo direito.

As decorações sazonais usam uma camada compartilhada no fundo de toda a faixa
superior e outra atrás dos cards da coluna pessoal; não ficam limitadas à
cápsula dos links. Primavera exibe pétalas suaves flutuando, verão pequenos
brilhos solares, outono folhas secas voando e inverno flocos de neve caindo.
Somente a neve usa percurso vertical; as outras três estações atravessam a tela
horizontalmente em trajetórias onduladas de vento. Na Biblioteca não existe
coluna pessoal, portanto sua camada lateral também fica oculta e somente o topo
é decorado. As partículas da faixa superior levam o dobro do tempo para
percorrer o caminho das equivalentes laterais, reduzindo sua velocidade pela
metade. Essas camadas usam `pointer-events: none`, ficam abaixo do conteúdo
legível e viram composição estática quando `prefers-reduced-motion: reduce` está
ativo.

Item ativo: pill com fundo derivado de `--success-muted`, contraste por
`--success-foreground` e marcador interno sutil. A sidebar é um painel
arredondado independente, sem duplicar perfil e sem rolagem interna em alturas
desktop comuns.

---

## Padrão: Banner de categoria / hero (atualizado em 2026-08-13)

Introduzido na Biblioteca v2. Usado no topo do conteúdo de cada categoria de
um módulo com sidebar.

**Estrutura:**
- Card de aproximadamente `230px`, borda e sombra discretas, sem full bleed
- Título grande, contagem e botão de adicionar, sem selo redundante acima
- Mini-colagem lateral de até quatro capas/thumbnails reais e distintos
- Fallback abstrato elegante; a imagem estática antiga pode aparecer apenas
  como textura de baixa opacidade quando não houver capa real
- Logo abaixo, somente contador em pill e menu de ordenação por recência,
  título, nota, favoritos ou status, alinhados à direita. A linha fica a 15 px
  do banner e da grade, sem divisor ou rótulos de coleção. A ordenação é local
  e atua sobre a lista já filtrada pela busca.
- O hero rola normalmente e usa os tokens globais nos temas claro e escuro

---

## Padrão: Card de item de coleção (atualizado em 2026-08-13)

Introduzido na Biblioteca v2, mas genérico o bastante para qualquer catálogo
futuro (ex: se Hábitos ou Projetos precisarem de card com imagem).

**Estrutura:**
- Imagem dominante em `aspect-ratio: 2/3`, `object-fit: cover`, moldura interna
  discreta e leve zoom no hover
- Coração sempre visível no canto superior direito da imagem, preenchido quando
  favorito e vazado quando não favorito; funciona como ação rápida de um clique,
  tem foco visível e não abre o painel do card
- Nota de 0-5 em badge com estrela sobre a capa e status no rodapé da imagem;
  formulários usam cinco estrelas com seleção em passos de 0.5, nunca input
  numérico simples (DEC-054)
- Corpo inferior claro e limpo no tema claro, integrado ao fundo escuro do card
  no tema escuro; título em até 2 linhas, ano/duração ou progresso quando o
  schema oferece
- Até 2 gêneros em pills compactas
- Menu de ações ("⋯") discreto na área de informações, mantendo favorito como
  alternativa à ação rápida, além de edição e exclusão; clique externo e Escape
  são preservados e, em telas de toque, ele permanece acessível

---

## Responsividade

Regra geral: qualquer grid de mais de uma coluna precisa de media query
colapsando para coluna única em telas pequenas. Inputs numéricos em páginas
mobile-first usam `inputmode="decimal"` / `inputmode="numeric"`.

Na Agenda, mês e semana não são abas concorrentes: o calendário mensal aparece
primeiro e o dia selecionado nele controla a semana detalhada logo abaixo. A
linha cronológica da coluna pessoal é estritamente “Hoje” e não corta itens por
quantidade; ela cresce dentro do miolo rolável junto do relógio e calendário.
Dias anteriores recebem uma linha diagonal contínua a 45 graus, da ponta
inferior esquerda à ponta superior direita da célula do mês. Clicar numa célula
abre um painel central com todos os itens e descrições
daquele dia. A semana usa cabeçalho de sete dias e grade horária vertical em
uma área de altura limitada com rolagem própria; eventos são posicionados pelo
horário e duração e mantêm a ação local de concluir/reabrir. Na coluna pessoal,
o evento cujo intervalo inclui a hora atual recebe destaque e rótulo “Agora”.

## Animações

Minimalistas por decisão: hover states, transições de opacidade/transform em
toasts e modais, barra de progresso com `transition: width .3s`.

Trocas iniciadas pela navegação global usam uma sequência React/CSS controlada.
O conteúdo atual sai horizontalmente e o novo entra pelo lado correspondente à
ordem dos módulos no topo; o indicador ativo desliza até o novo item. Ao entrar
na Biblioteca em tela larga, os blocos inferiores da coluna descem, o perfil se
compacta e ocupa o topo antes de o catálogo assumir a largura total. Ao sair, a
sequência percorre o caminho inverso. Os pontos finais reutilizam as mesmas
medidas e aparência dos componentes reais para não haver piscada, duplicação ou
“teleporte” ao concluir. Não adicionar dependência para esse efeito e
`prefers-reduced-motion: reduce` elimina o movimento.

## Convenções de UI

- Estados vazios sempre têm texto explicativo + call-to-action quando aplicável.
- Toda ação destrutiva passa por modal de confirmação — nunca `confirm()` nativo do browser.
- Toda lista que pode ficar vazia tem um elemento `.vazio` dedicado.
- `esc()`/sanitização é obrigatório em qualquer interpolação de dado do usuário em `innerHTML` (raramente usado no projeto React — a maioria já é seguro por padrão via JSX).
## Títulos de Anime na coleção (2026-08-30)

Cards de Anime apresentam primeiro o nome original com sigla calculada e,
quando diferente, o nome traduzido com sua sigla em uma segunda linha de menor
ênfase. Exemplo: `Shingeki no Kyojin · SnK` e `Attack on Titan · AOT`. A sigla
é apenas apresentação e não cria coluna no banco.

O editor de Anime usa uma janela larga (até 960 px), formulário básico em duas
colunas no desktop e uma coluna no celular. Temporadas e complementos mostram
a obra externa com capa e metadados antes da confirmação. A ordem de consumo é
uma linha do tempo vertical numerada, com ações explícitas para mover cada obra.

Seletores de obras relacionadas não expõem campos técnicos soltos: busca,
resultado escolhido com capa/metadados e uma única ação de confirmação formam
um bloco visual. Falhas de persistência aparecem no próprio bloco. Período,
duração média por episódio e nota geral são cartões somente leitura; a nota é
atribuída em cada temporada.

### Painéis de detalhes — referência v0 adaptada (2026-08-30)

O painel de leitura usa `PainelObraLayout`, compartilhado pelas nove mídias,
com CSS Modules e somente tokens existentes para cores. A coleção, a sidebar
e os formulários de criação/edição não são redesenhados neste lote.

- Janela de até 1024 × 860 px, com pelo menos 24 px acima/abaixo no desktop.
  Até 640 px de viewport, mantém 8 px nas laterais e 12 px acima/abaixo.
- Banner decorativo em degradê para `--card`, capa pequena, tipo, título,
  subtítulo, status, nota e gêneros formam uma identidade única no cabeçalho.
  Sem imagem, não reservar um banner vazio. Anime preserva original/sigla
  e tradução/sigla, sem duplicar nomes iguais.
- Cabeçalho e rodapé não acompanham a rolagem central. O cabeçalho tem limite
  próprio e pode rolar somente quando títulos/metadados extensos excederem
  44% da janela, evitando sobreposição em telas baixas ou com zoom elevado.
- Sinopse e comentário ocupam largura de leitura, nunca uma célula estreita
  de metadados. Seções relacionadas usam divisores discretos e 24 px internos.
- Temporadas/complementos em duas colunas, músicas de Anime em grupos OP/ED/OST,
  volumes agrupados por arco, citações diferenciadas de anotações e playlist
  como lista numerada. Container queries reduzem grades para uma coluna quando
  o próprio painel fica estreito.
- Campo nulo/vazio não gera seção. Não inventar listas de episódios de podcast,
  capítulos de mangá, resumos de artigos ou totais que o banco não armazena.
- Ações: links reais, `Editar obra` abre o formulário existente e vídeos
  preservam `Usar em Curso`. Nenhuma edição inline ou ação fictícia do demo.
- `<dialog>.showModal()` usa a camada superior nativa do navegador, independente
  do `transform` do AppChrome, com foco modal, Escape, botão fechar, clique fora
  e restauração de foco/rolagem ao fechar. Substitui o portal específico anterior.
- Entrada discreta de 180 ms; `prefers-reduced-motion` remove o movimento.
