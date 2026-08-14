# DESIGN.md

Referência visual para qualquer IA ou dev gerar páginas novas sem quebrar a consistência do sistema. As regras aqui refletem o que já está implementado — não são aspiracionais.

---

## Paleta de cores

**Atualizada em 2026-08-12 (DEC-049)** — a paleta aprovada na DEC-037 é o
padrão de todos os módulos, incluindo Biblioteca. A antiga exceção dourada
da Biblioteca foi removida após o teste manual final.

Diferente da DEC-034 (só modo escuro), esta paleta tem **modo claro e
escuro reais**, com toggle funcional no sistema inteiro (DEC-039/049).

```css
/* Claro (:root) e escuro (.dark) — valores completos em oklch() no
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
--text:    var(--foreground)
--texto-secundario: var(--muted-foreground)
```
 
**Nota de comportamento:** no modo escuro dessa paleta, a maior parte da UI
é monocromática (cinza/branco) — cor só aparece em estados semânticos
específicos (badge de sucesso, item ativo). No modo claro, o verde aparece
com mais presença. Isso é intencional do design aprovado, não bug.

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
| Primário | fundo `--accent`, texto `--bg`, `border-radius: 6–8px`, `font-weight: 700` |
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
fragmentos abstratos em forma de pétalas/lascas derivados dos tokens do tema, com presença maior até
“Início” e redução gradual depois. A sidebar da Biblioteca não
duplica perfil. O próprio perfil é o acesso a `/configuracoes`, com hover e
foco visíveis; não existe engrenagem ou atalho separado. Fragmentos pequenos e
com opacidade decrescente usam `--accent`, `--accent-wash` e
`--accent-wash-forte`, sem repetir ou esticar `background_url`, formar uma faixa
sólida ou prejudicar a leitura da navegação.

O toggle de tema pertence à área direita da navegação global, imediatamente ao
lado de “Sair”. Ele não deve voltar a flutuar sobre o conteúdo das páginas; na
tela de login, onde não há logout, permanece como ação isolada no topo direito.

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
- Imagem em `aspect-ratio: 2/3`, `object-fit: cover`, leve zoom no hover
- Coração no canto superior direito da imagem — **só renderiza se o item for
  favorito**, nunca ícone vazio pra não-favoritos
- Nota de 0-5 em badge com estrela sobre a capa e status no rodapé da imagem;
  formulários usam cinco estrelas com seleção em passos de 0.5, nunca input
  numérico simples (DEC-054)
- Título em até 2 linhas, ano/duração ou progresso quando o schema oferece
- Até 2 gêneros em pills compactas
- Menu de ações ("⋯") discreto na área de informações, com clique externo e
  Escape preservados; em telas de toque ele permanece acessível

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
