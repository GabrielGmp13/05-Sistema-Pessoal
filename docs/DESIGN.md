# DESIGN.md

Referência visual para qualquer IA ou dev gerar páginas novas sem quebrar a consistência do sistema. As regras aqui refletem o que já está implementado — não são aspiracionais.

---

## Paleta de cores

**Atualizada em 2026-07-25 (DEC-037)** — nova paleta padrão do sistema,
gerada a partir do design aprovado no v0.dev para Estudos v2. Aplicada a
Dashboard, Treino e Estudos via `globals.css`. **Exceção: Biblioteca**
mantém a paleta dourada/âmbar da DEC-034 (ver bloco "Exceção — Biblioteca"
abaixo) — decisão explícita do usuário, não migrada junto.

Diferente da DEC-034 (só modo escuro), esta paleta tem **modo claro e
escuro reais**, com toggle funcional no sistema inteiro exceto Biblioteca
(DEC-039).

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

### Exceção — Biblioteca (DEC-034, mantida)

```css
--bg:      #0c0c14
--surface: #13131f
--surface-2: #1a1a28
--border:  rgba(255, 255, 255, 0.07)
--accent:  #c9a96e
--accent-wash: rgba(201, 169, 110, 0.12)
--accent-wash-forte: rgba(201, 169, 110, 0.2)
--text:    #ede9e1
--texto-secundario: #8a8799
```

Aplicada via classe `.bibliotecaTheme` em `app/biblioteca/layout.tsx` —
fixa, sem modo claro, sem toggle (DEC-039). Nenhum componente da Biblioteca
precisou mudar.

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
envolvendo a página com uma sidebar lateral fixa — proporção **2/9 sidebar,
7/9 conteúdo**. Troca de categoria é estado de cliente (`useState`), sem
reload nem URL nova.

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

## Padrão: Sidebar de módulo com perfil (novo, 2026-07-20)

Introduzido na Biblioteca v2 (DEC-032 + DEC-034), pensado como componente
genérico reutilizável (`components/Sidebar.tsx`) para futuros módulos com
navegação por categoria.

**Estrutura, de cima pra baixo:**
1. **Faixa de perfil** (78px de altura): imagem de fundo opcional
   (`user_metadata.background_url`) com overlay escuro em gradiente, avatar
   circular com anel `--accent` sobreposto, nome + subtítulo neutro (nunca
   rótulo de plano pago — ver DEC-034)
2. **Campo de busca** (opcional, controlado pelo componente pai)
3. **Rótulo de seção** (ex: "Biblioteca") — uppercase, pequeno, `--texto-secundario`
4. **Lista de itens** — ícone + label + badge de contagem. **O badge de
   contagem só aparece no item ativo**, não em todos simultaneamente
5. **Rodapé fixo** — botão primário de ação (ex: "+ Adicionar obra")

Item ativo: `border-left: 2px solid var(--accent)`, fundo `--accent-wash`,
texto `--accent`.

---

## Padrão: Banner de categoria / hero (novo, 2026-07-20)

Introduzido na Biblioteca v2. Usado no topo do conteúdo de cada categoria de
um módulo com sidebar.

**Estrutura:**
- Altura fixa (168px desktop / 130px mobile)
- Fundo, em ordem de prioridade: **(1)** imagem estática do módulo em
  `public/<modulo>/banners/<categoria>.jpg`, se existir; **(2)** mosaico
  borrado dos dados reais do usuário daquela categoria (ex: capas de obras
  já cadastradas); **(3)** gradiente escuro liso, se não houver nem imagem
  nem dado
- Selo pequeno uppercase no canto superior esquerdo (ex: "Minha Biblioteca")
- Título grande em itálico (`Syne` itálico), centralizado, na base do hero
- Gradiente de transição de transparente para `--bg` sólido na base — o
  hero **não é fixo/sticky**, rola normalmente junto com o conteúdo
- Logo abaixo do hero (fora dele, em fluxo normal): linha com contagem de
  itens à esquerda e botão de adicionar à direita

**Importante:** o hero precisa ficar **fora** de qualquer container com
padding lateral — ele deve encostar nas bordas da área de conteúdo (full
bleed). O padding lateral é aplicado só no sub-header e no grid abaixo dele.

---

## Padrão: Card de item de coleção (novo, 2026-07-20)

Introduzido na Biblioteca v2, mas genérico o bastante para qualquer catálogo
futuro (ex: se Hábitos ou Projetos precisarem de card com imagem).

**Estrutura:**
- Imagem em `aspect-ratio: 2/3`, `object-fit: cover`, leve zoom no hover
- Coração no canto superior direito da imagem — **só renderiza se o item for
  favorito**, nunca ícone vazio pra não-favoritos
- Título em 1 linha só, truncado com `text-overflow: ellipsis` (não 2 linhas)
- Linha com ano (esquerda) e nota★ (direita, cor `--accent`)
- 1 categoria/gênero principal abaixo, texto simples sem chip/caixinha
- Menu de ações ("⋯") no canto superior esquerdo, **visível só no hover**
  (ou quando já está aberto) — não fica sempre visível

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
