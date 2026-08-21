# DESIGN.md

Referência visual para qualquer IA ou dev gerar páginas novas sem quebrar a consistência do sistema. As regras aqui refletem o que já está implementado — não são aspiracionais.

---

## Paleta de cores

**Atualizada em 2026-08-12 (DEC-049)** — a paleta aprovada na DEC-037 é o
padrão de todos os módulos, incluindo Biblioteca. A antiga exceção dourada
da Biblioteca foi removida após o teste manual final.

Diferente da DEC-034 (só modo escuro), esta paleta tem **modos claros e
escuros reais**, organizados como iluminações no controlador de atmosfera
(DEC-039/049/060/061): Sol, Suave, Nublado, Estrelado e Lua.

```css
/* Claro (:root), suave (.soft), nublado (.cloudy), estrelado (.starry) e
   escuro (.dark) — valores completos em oklch() no
   globals.css real. Vocabulário shadcn (--background/--card/--primary...)
   é a fonte da verdade; vocabulário antigo (--bg/--surface/--accent...)
   é alias, consumido pelos CSS Modules de Treino/Dashboard sem alteração
   de componente. Ver ARCHITECTURE.md → Stack mista de estilização. */
--bg:      var(--background)
--surface: var(--card)
--surface-2: var(--muted)
--accent:  var(--accent-foreground)   /* cor legível de destaque — texto/ícone/borda ativa */
--accent-wash: var(--accent)          /* fundo do wash — item ativo da sidebar */
--accent-wash-forte: color-mix(in oklch, var(--accent) 55%, var(--accent-foreground) 20%)
--acao:   var(--primary)
--acao-texto: var(--primary-foreground)
--text:    var(--foreground)
--texto-secundario: var(--muted-foreground)
```
 
Cada iluminação altera o conjunto semântico completo, não apenas o fundo:
superfícies, bordas, textos, ações, campos, header, dropdowns, vidro e sombras
seguem a mesma temperatura. Sol usa creme dourado/marfim; Suave combina papel,
areia e argila; Nublado usa azul acinzentado e gelo; Estrelado permanece em
azul-marinho/petróleo; Lua usa carvão e grafite quentes. `--page-glow`,
`--page-depth`, `--glass-background`, `--atmosphere-panel` e os tokens do topo
criam profundidade sem substituir os tokens de negócio.

Cores secundárias usadas em contexto (não são variáveis CSS formais, mas aparecem consistentemente):

| Uso | Cor | Contexto |
|---|---|---|
| Sucesso / feito | `#4ade80` (verde) | Calendário — treino concluído |
| Info / destaque | `#63b3ed` (azul) | Calendário — PR batido |
| Erro / atenção | `#ff6b6b` / `#f87171` | Botões destrutivos, alertas, atraso |
| Aviso | `#fb923c` (laranja) | Estados intermediários |
| Texto terciário / placeholder | `#333` a `#444` | Estados vazios, ícones desligados |

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

### Layout por módulo com sidebar interna (DEC-032)
Módulos com navegação por categoria (Biblioteca; possivelmente Treino/Estudos
no futuro) usam `layout.tsx` próprio dentro da pasta de rota do módulo,
envolvendo a página com uma sidebar lateral compacta e conteúdo fluido. Na
Biblioteca, a sidebar usa largura estável de `13.25rem` a `15.25rem`, enquanto
o conjunto fica centralizado em até `1440px`. Troca de categoria é estado de
cliente (`useState`), sem reload nem URL nova.

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
| Secundário dourado (ex: "Adicionar" no banner) | fundo `--accent-wash-forte`, texto `--accent`, sem borda |
| Fantasma | sem fundo, borda `--border`, texto secundário, hover clareia borda |
| Destrutivo | sem fundo, borda `#ff6b6b`, hover preenche com `rgba(255,107,107,.1)` |
| Ícone | sem fundo, borda `--border`, padding curto, hover borda `--accent` |

Transições nunca acima de `.2s`.

### Inputs
```css
background: var(--bg);
border: 1px solid var(--border);
border-radius: 6–8px;
padding: .5–.65rem;
```
Foco: borda muda para `--accent`.

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
Duas variantes: `.ok` (borda `--accent`) e `.erro` (borda `#ff6b6b`).

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

Em todas as rotas autenticadas, o perfil fica no início da navegação global
(DEC-049): avatar maior, nome ao lado e `user_metadata.background_url`
degradando logo depois do nome até a barra. “Início” é o acesso à Home; a área
de perfil não duplica esse link. Perfil, links e logout ocupam uma única grade
e compartilham altura, alinhamento central e a borda inferior do `header`; o
efeito principal do perfil fica contido na célula esquerda. A imagem real de
background nunca é aplicada ao restante da barra: ela desaparece dentro do
perfil por máscara. Fora dele, a continuidade visual usa apenas manchas e
fragmentos abstratos em forma de pétalas/lascas. Com um background de perfil
configurado, ele ganha apenas um pouco mais de presença dentro do próprio
bloco. Fora dele, as partículas usam a cor ambiente configurável ou o fallback
da iluminação. A densidade é maior perto do perfil, mas continua
visível atrás da navegação sem cobrir os links. A sidebar da Biblioteca não
duplica perfil. O próprio perfil abre um dropdown de resumo, com hover e foco
visíveis; a ação “Editar perfil” dentro dele é o acesso a `/configuracoes`, sem
engrenagem ou atalho separado. O dropdown mostra somente metadados reais
disponíveis e fecha por clique externo, Escape ou troca de rota. Fragmentos pequenos e
orgânicos nunca repetem ou esticam `background_url`, formam faixa sólida ou
prejudicam a leitura. Os links ficam sobre uma cápsula translúcida com blur,
borda e item ativo próprio, separando conteúdo e decoração.
Com Idiomas, Histórico e Programação, a faixa mantém rolagem horizontal abaixo
de 960px; entre 960px e 1319px usa ícones com `aria-label`/tooltip, e a partir
de 1320px volta a exibir os rótulos completos para evitar colisão com perfil e
ações.

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
- Selo pequeno "Categoria ativa", título grande, contagem e botão de adicionar
- Mini-colagem lateral de até quatro capas/thumbnails reais e distintos
- Fallback abstrato elegante; a imagem estática antiga pode aparecer apenas
  como textura de baixa opacidade quando não houver capa real
- Logo abaixo, cabeçalho "Sua coleção" com contador em pill e menu de ordenação
  por recência, título, nota, favoritos ou status. A ordenação é local e atua
  sobre a lista já filtrada pela busca.
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

## Animações

Minimalistas por decisão: hover states, transições de opacidade/transform em
toasts e modais, barra de progresso com `transition: width .3s`.

## Convenções de UI

- Estados vazios sempre têm texto explicativo + call-to-action quando aplicável.
- Toda ação destrutiva passa por modal de confirmação — nunca `confirm()` nativo do browser.
- Toda lista que pode ficar vazia tem um elemento `.vazio` dedicado.
- `esc()`/sanitização é obrigatório em qualquer interpolação de dado do usuário em `innerHTML` (raramente usado no projeto React — a maioria já é seguro por padrão via JSX).
