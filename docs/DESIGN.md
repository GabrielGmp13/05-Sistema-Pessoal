# DESIGN.md

Referência visual para qualquer IA ou dev gerar páginas novas sem quebrar a consistência do sistema. As regras aqui refletem o que já está implementado em `style.css` e nas páginas geradas — não são aspiracionais.

---

## Paleta de cores

```css
--bg:      #0d0d0d   /* fundo principal */
--surface: #1a1a1a   /* cards, modais, superfícies elevadas */
--border:  #2a2a2a   /* bordas padrão */
--accent:  #b8f566   /* verde-limão — ações primárias, destaques, progresso */
--text:    #e0e0e0   /* texto principal */
```

Cores secundárias usadas em contexto (não são variáveis CSS formais, mas aparecem consistentemente):

| Uso | Cor | Contexto |
|---|---|---|
| Sucesso / feito | `#4ade80` (verde) | Calendário — treino concluído |
| Info / destaque | `#63b3ed` (azul) | Calendário — PR batido |
| Erro / atenção | `#ff6b6b` / `#f87171` | Botões destrutivos, alertas, atraso |
| Aviso | `#fb923c` (laranja) | Estados intermediários |
| Texto secundário | `#555` a `#888` | Labels, metadados, texto de apoio |
| Texto terciário / placeholder | `#333` a `#444` | Estados vazios, ícones desligados |

## Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| Dados/números | JetBrains Mono | valores, datas, métricas, badges numéricos |
| Títulos | Syne | `<h1>`–`<h3>`, headers de seção, nomes de card |
| Corpo de texto | herdado do sistema (sans-serif padrão) | parágrafos, labels de formulário |

Ambas self-hosted em `.woff2` — nunca carregar de CDN externo.

Escala típica observada: títulos de página `1.4rem`, títulos de seção `.95rem`–`1.1rem`, corpo `.82rem`–`.9rem`, metadados `.65rem`–`.75rem`.

---

## Layout e grid

- Container principal: `.container`, largura controlada, padding lateral consistente.
- Grids de duas colunas em desktop colapsam para uma coluna abaixo de `680px`–`720px` (o breakpoint exato varia por página, mas fica nessa faixa).
- Grids de cards usam `repeat(auto-fill, minmax(...))` quando o número de itens é variável (galeria de shape), ou `grid-template-columns` fixo quando é um número conhecido de itens (hub nav de 3 atalhos).
- Breakpoint extra para telas muito pequenas: `360px`–`400px`, geralmente reduzindo grids de 3–4 colunas para 1–2.

---

## Componentes

### Cards
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 10px–14px;   /* 14px em cards de destaque (revisão), 10–12px no resto */
padding: 1–1.5rem;
```

### Botões
| Tipo | Estilo |
|---|---|
| Primário (`.btn-sm`, `.btn-salvar`, `.btn-comecar`) | fundo `--accent`, texto `--bg`, `border-radius: 6–8px`, `font-weight: 700` |
| Fantasma (`.btn-ghost`) | sem fundo, borda `--border`, texto `#888`, hover clareia borda |
| Destrutivo (`.btn-danger`, `.perigo`) | sem fundo, borda `#ff6b6b`, hover preenche com `rgba(255,107,107,.1)` |
| Ícone (`.btn-icon`) | sem fundo, borda `--border`, padding curto, hover borda `--accent` |

Todos os botões usam `transition: filter .12s` (primário) ou `border-color .12s` (secundário) — nunca transições acima de `.2s` para não parecer lento.

### Inputs
```css
background: var(--bg);
border: 1px solid var(--border);
border-radius: 6–8px;
padding: .5–.65rem;
```
Foco: borda muda para `--accent` (herdado do `style.css`, não redefinido por página).

### Modais
```css
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.72); }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; max-width: 320–420px; }
```
Sempre com `.modal-header` (título + botão fechar `✕`), `.modal-body`, `.modal-footer` (botão fantasma + ação). Fecham via clique no backdrop, tecla Escape, ou botão `✕`.

### Toast
```css
position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
```
Duas variantes: `.ok` (borda `--accent`) e `.erro` (borda `#ff6b6b`). Aparece por ~3s, anima entrada/saída com `translateY`.

### Navbar
```html
<nav class="nav">
  <a href="index.html" class="nav-logo">SP</a>
  <div class="nav-links">...</div>
</nav>
```
Sempre com link de volta ao `index.html` e 2–3 links de navegação lateral do módulo atual.

---

## Responsividade

Regra geral: qualquer grid de mais de uma coluna precisa de uma media query colapsando para coluna única em telas pequenas. Formulários e listas já são naturalmente responsivos (flex column). Inputs numéricos em páginas mobile-first (Academia, Shape) usam `inputmode="decimal"` / `inputmode="numeric"` para abrir o teclado certo.

## Animações

Minimalistas por decisão: hover states (`transform: translateY(-2px)` em cards clicáveis), transições de opacidade/transform em toasts e modais, barra de progresso com `transition: width .3s`. Nada de animação decorativa sem função.

## Convenções de UI

- Estados vazios sempre têm texto explicativo + call-to-action quando aplicável (nunca uma tela em branco).
- Toda ação destrutiva passa por modal de confirmação — nunca `confirm()` nativo do browser.
- Toda lista que pode ficar vazia tem um elemento `.vazio` dedicado, nunca um array vazio silencioso.
- `esc()` é obrigatório em qualquer interpolação de dado do usuário em `innerHTML`.
