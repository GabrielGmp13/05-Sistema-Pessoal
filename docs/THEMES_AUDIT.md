# Auditoria do sistema de temas

Auditoria iniciada em 2026-08-30 e atualizada após a revisão autorizada da
paleta. Este documento descreve o CSS final, não os valores antigos nem as
razões de contraste fornecidas pelo v0.

## Resumo executivo

- Existem **cinco iluminações**: `Sol`, `Suave`, `Nublado`, `Estrelado` e
  `Lua`.
- Existem **cinco decorações independentes**: `Primavera`, `Verão`, `Outono`,
  `Inverno` e `Nenhum`. Iluminação e decoração podem ser combinadas livremente.
- A fonte global de cor é `frontend/app/globals.css`. Ela usa majoritariamente
  `oklch()`, não HSL ou hex. As tabelas abaixo preservam o literal exato do
  código; equivalentes hex sRGB são aproximações arredondadas, pois conversão
  de espaço de cor e clipping de gamut impedem chamá-los de valores-fonte.
- O tema é persistido em `localStorage` e aplicado por classes no `<html>`;
  decoração usa `data-decoracao` e a cor ambiente usa custom property inline.
- Corrigidos os pares de estado, erros e cores fixas identificados. Os pares
  determinísticos usados pela interface passam nos 25 cenários testados.
  Isso não equivale a uma certificação de acessibilidade do site inteiro.
- `GlobalNav.module.css` é o único módulo que redefine uma variável de cor do
  tema (`--season-glow`). `SeasonalDecor.module.css` define somente variáveis
  geométricas locais; suas cores são literais decorativas.

## 1. Temas e nomes exatos

| Rótulo exibido | Valor TypeScript/localStorage | Seletor no `<html>` | Esquema |
|---|---|---|---|
| Sol | `claro` | `:root` (nenhuma classe adicional) | claro |
| Suave | `suave` | `.soft` | claro |
| Nublado | `nublado` | `.cloudy` | claro |
| Estrelado | `estrelado` | `.dark.starry` | escuro |
| Lua | `escuro` | `.dark` | escuro |

Observação de cascata: Estrelado recebe primeiro `.dark` e depois `.starry`.
Como `.starry` aparece depois no arquivo e redefine a paleta, seus valores
prevalecem. Suave e Nublado herdam de `:root` tudo o que não sobrescrevem.

### Decorações independentes

| Rótulo | Valor persistido | Seletor | Tokens globais exatos |
|---|---|---|---|
| Primavera | `primavera` | `html[data-decoracao='primavera']` | `--season-accent: oklch(0.62 0.12 148)`; `--season-surface: oklch(0.84 0.055 345)`; `--season-border: oklch(0.58 0.08 342)`; `--season-glow: oklch(0.66 0.1 338)` |
| Verão | `verao` | `html[data-decoracao='verao']` | `--season-accent: oklch(0.66 0.14 82)`; `--season-surface: oklch(0.84 0.075 78)`; `--season-border: oklch(0.62 0.11 76)`; `--season-glow: oklch(0.68 0.13 75)` |
| Outono | `outono` | `html[data-decoracao='outono']` | `--season-accent: oklch(0.48 0.12 53)`; `--season-surface: oklch(0.62 0.065 74)`; `--season-border: oklch(0.48 0.09 58)`; `--season-glow: oklch(0.5 0.12 52)` |
| Inverno | `inverno` | `html[data-decoracao='inverno']` | `--season-accent: oklch(0.6 0.09 222)`; `--season-surface: oklch(0.74 0.05 230)`; `--season-border: oklch(0.58 0.075 225)`; `--season-glow: oklch(0.64 0.09 222)` |
| Nenhum | `nenhum` | `html[data-decoracao='nenhum']` | `--season-accent: var(--accent)`; `--season-surface: var(--muted)`; `--season-border: var(--border)`; `--season-glow: transparent` |

O valor legado `noite` é migrado automaticamente para `nenhum`.

## 2. Variáveis globais de cor por iluminação

### Tokens semânticos principais

Cada célula mostra o valor efetivo exato de `globals.css`. Todos os temas
sobrescrevem os tokens principais, inclusive sucesso/aviso/erro. Suave herda
somente gráficos e parte dos tokens figurativos; Estrelado herda os quatro
`*-line` de Lua, pois recebe também `.dark`.

| Variável | Sol `:root` | Suave `.soft` | Nublado `.cloudy` | Lua `.dark` | Estrelado `.starry` |
|---|---|---|---|---|---|
| `--background` | `oklch(0.965 0.025 92)` | `oklch(0.94 0.035 58)` | `oklch(0.91 0.035 228)` | `oklch(0.13 0.018 255)` | `oklch(0.095 0.055 265)` |
| `--foreground` | `oklch(0.22 0.035 72)` | `oklch(0.22 0.04 48)` | `oklch(0.2 0.05 247)` | `oklch(0.94 0.018 245)` | `oklch(0.95 0.025 242)` |
| `--card` | `oklch(0.985 0.018 92)` | `oklch(0.98 0.022 68)` | `oklch(0.965 0.025 226)` | `oklch(0.19 0.022 252)` | `oklch(0.15 0.06 258)` |
| `--card-foreground` | `oklch(0.22 0.035 72)` | `oklch(0.22 0.04 48)` | `oklch(0.2 0.05 247)` | `oklch(0.94 0.018 245)` | `oklch(0.95 0.025 242)` |
| `--popover` | `oklch(0.99 0.014 92)` | `oklch(0.985 0.018 68)` | `oklch(0.975 0.022 224)` | `oklch(0.22 0.025 252)` | `oklch(0.18 0.065 257)` |
| `--popover-foreground` | `oklch(0.22 0.035 72)` | `oklch(0.22 0.04 48)` | `oklch(0.2 0.05 247)` | `oklch(0.94 0.018 245)` | `oklch(0.95 0.025 242)` |
| `--primary` | `oklch(0.34 0.095 148)` | `oklch(0.32 0.085 145)` | `oklch(0.34 0.1 222)` | `oklch(0.78 0.075 210)` | `oklch(0.78 0.14 244)` |
| `--primary-foreground` | `oklch(0.985 0.012 92)` | `oklch(0.985 0.012 78)` | `oklch(0.985 0.012 224)` | `oklch(0.16 0.025 252)` | `oklch(0.12 0.045 267)` |
| `--secondary` | `oklch(0.89 0.035 88)` | `oklch(0.87 0.045 60)` | `oklch(0.85 0.045 226)` | `oklch(0.27 0.025 250)` | `oklch(0.24 0.065 255)` |
| `--secondary-foreground` | `oklch(0.25 0.04 72)` | `oklch(0.25 0.045 48)` | `oklch(0.22 0.055 243)` | `oklch(0.92 0.018 245)` | `oklch(0.93 0.028 242)` |
| `--muted` | `oklch(0.91 0.028 92)` | `oklch(0.89 0.04 68)` | `oklch(0.86 0.038 230)` | `oklch(0.25 0.022 250)` | `oklch(0.22 0.06 257)` |
| `--muted-foreground` | `oklch(0.4 0.04 76)` | `oklch(0.4 0.045 52)` | `oklch(0.38 0.06 242)` | `oklch(0.76 0.025 242)` | `oklch(0.78 0.06 243)` |
| `--accent` | `oklch(0.84 0.1 145)` | `oklch(0.8 0.085 144)` | `oklch(0.75 0.1 202)` | `oklch(0.34 0.065 205)` | `oklch(0.31 0.12 270)` |
| `--accent-foreground` | `oklch(0.25 0.09 148)` | `oklch(0.24 0.085 145)` | `oklch(0.22 0.08 221)` | `oklch(0.92 0.055 205)` | `oklch(0.93 0.075 230)` |
| `--success` | `oklch(0.46 0.13 150)` | `oklch(0.45 0.13 151)` | `oklch(0.43 0.12 193)` | `oklch(0.64 0.1 165)` | `oklch(0.62 0.12 202)` |
| `--success-foreground` | `oklch(0.985 0.012 92)` | `oklch(0.985 0.012 78)` | `oklch(0.985 0.012 224)` | `oklch(0.16 0.025 165)` | `oklch(0.12 0.04 202)` |
| `--success-muted` | `oklch(0.86 0.075 145)` | `oklch(0.84 0.075 144)` | `oklch(0.81 0.065 204)` | `oklch(0.3 0.045 165)` | `oklch(0.27 0.075 215)` |
| `--warning` | `oklch(0.48 0.14 68)` | `oklch(0.46 0.14 65)` | `oklch(0.45 0.14 72)` | `oklch(0.62 0.13 65)` | `oklch(0.65 0.13 78)` |
| `--warning-foreground` | `oklch(0.985 0.012 92)` | `oklch(0.985 0.012 78)` | `oklch(0.985 0.012 224)` | `oklch(0.16 0.025 65)` | `oklch(0.13 0.035 78)` |
| `--destructive` | `oklch(0.48 0.18 25)` | `oklch(0.45 0.18 25)` | `oklch(0.43 0.18 25)` | `oklch(0.7 0.17 22)` | `oklch(0.7 0.18 24)` |
| `--border` | `oklch(0.63 0.045 86)` | `oklch(0.61 0.055 58)` | `oklch(0.56 0.065 226)` | `oklch(0.55 0.03 245)` | `oklch(0.52 0.08 245)` |
| `--input` | `oklch(0.64 0.04 88)` | `oklch(0.62 0.05 62)` | `oklch(0.58 0.06 227)` | `oklch(0.58 0.03 245)` | `oklch(0.56 0.08 245)` |
| `--ring` | `oklch(0.43 0.13 148)` | `oklch(0.4 0.12 145)` | `oklch(0.43 0.12 216)` | `oklch(0.76 0.08 210)` | `oklch(0.78 0.14 244)` |

### Gráficos e sidebar

| Variável | Sol | Suave | Nublado | Lua | Estrelado |
|---|---|---|---|---|---|
| `--chart-1` | `oklch(0.48 0.13 148)` | `oklch(0.48 0.13 148)` | `oklch(0.43 0.12 216)` | `oklch(0.72 0.085 165)` | `oklch(0.7 0.14 244)` |
| `--chart-2` | `oklch(0.38 0.08 76)` | `oklch(0.38 0.08 76)` | `oklch(0.54 0.11 210)` | `oklch(0.68 0.055 215)` | `oklch(0.7 0.12 205)` |
| `--chart-3` | `oklch(0.48 0.14 68)` | `oklch(0.48 0.14 68)` | `oklch(0.45 0.14 72)` | `oklch(0.72 0.055 85)` | `oklch(0.76 0.12 78)` |
| `--chart-4` | `oklch(0.42 0.04 75)` | `oklch(0.42 0.04 75)` | `oklch(0.52 0.07 270)` | `oklch(0.58 0.07 245)` | `oklch(0.65 0.13 292)` |
| `--chart-5` | `oklch(0.65 0.025 75)` | `oklch(0.65 0.025 75)` | `oklch(0.72 0.06 238)` | `oklch(0.5 0.035 225)` | `oklch(0.58 0.1 265)` |
| `--sidebar` | `oklch(0.955 0.022 92)` | `oklch(0.925 0.03 62)` | `oklch(0.925 0.03 228)` | `oklch(0.155 0.02 252)` | `oklch(0.115 0.055 263)` |
| `--sidebar-foreground` | `oklch(0.22 0.035 72)` | `oklch(0.22 0.04 48)` | `oklch(0.2 0.05 247)` | `oklch(0.94 0.018 245)` | `oklch(0.95 0.025 242)` |
| `--sidebar-primary` | `oklch(0.34 0.095 148)` | `oklch(0.32 0.085 145)` | `oklch(0.34 0.1 222)` | `oklch(0.78 0.075 210)` | `oklch(0.78 0.14 244)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0.012 92)` | `oklch(0.985 0.012 78)` | `oklch(0.985 0.012 224)` | `oklch(0.16 0.025 252)` | `oklch(0.12 0.045 267)` |
| `--sidebar-accent` | `oklch(0.84 0.1 145)` | `oklch(0.8 0.085 144)` | `oklch(0.75 0.1 202)` | `oklch(0.34 0.065 205)` | `oklch(0.31 0.12 270)` |
| `--sidebar-accent-foreground` | `oklch(0.25 0.09 148)` | `oklch(0.24 0.085 145)` | `oklch(0.22 0.08 221)` | `oklch(0.92 0.055 205)` | `oklch(0.93 0.075 230)` |
| `--sidebar-border` | `oklch(0.63 0.045 86)` | `oklch(0.61 0.055 58)` | `oklch(0.56 0.065 226)` | `oklch(0.55 0.03 245)` | `oklch(0.52 0.08 245)` |
| `--sidebar-ring` | `oklch(0.43 0.13 148)` | `oklch(0.4 0.12 145)` | `oklch(0.43 0.12 216)` | `oklch(0.76 0.08 210)` | `oklch(0.78 0.14 244)` |

### Atmosfera, topo e profundidade

| Variável | Sol | Suave | Nublado | Lua | Estrelado |
|---|---|---|---|---|---|
| `--ambient-fallback` | `oklch(0.52 0.13 148)` | `oklch(0.61 0.11 145)` | `oklch(0.58 0.115 211)` | `oklch(0.7 0.06 210)` | `oklch(0.73 0.13 238)` |
| `--header-tint` | `oklch(0.94 0.035 88)` | `oklch(0.928 0.038 62)` | `oklch(0.89 0.044 224)` | `oklch(0.22 0.018 252)` | `oklch(0.205 0.057 263)` |
| `--header-depth` | `oklch(0.89 0.045 98)` | `oklch(0.902 0.047 78)` | `oklch(0.855 0.055 235)` | `oklch(0.18 0.014 258)` | `oklch(0.165 0.05 269)` |
| `--page-glow` | `oklch(0.82 0.09 80 / 24%)` | `oklch(0.83 0.075 30 / 25%)` | `oklch(0.76 0.09 207 / 27%)` | `oklch(0.46 0.06 215 / 16%)` | `oklch(0.46 0.14 256 / 22%)` |
| `--page-depth` | `oklch(0.94 0.03 108)` | `oklch(0.925 0.035 91)` | `oklch(0.9 0.035 246)` | `oklch(0.17 0.014 258)` | `oklch(0.145 0.04 273)` |
| `--glass-background` | `oklch(0.985 0.018 92 / 82%)` | `oklch(0.972 0.024 71 / 76%)` | `oklch(0.95 0.025 226 / 74%)` | `oklch(0.25 0.016 252 / 78%)` | `oklch(0.225 0.05 258 / 76%)` |
| `--glass-border` | `oklch(0.63 0.05 82 / 64%)` | `oklch(0.74 0.065 55 / 45%)` | `oklch(0.67 0.075 227 / 44%)` | `oklch(0.68 0.022 242 / 25%)` | `oklch(0.63 0.09 240 / 30%)` |
| `--atmosphere-panel` | `oklch(0.975 0.02 91)` | `oklch(0.965 0.028 68)` | `oklch(0.948 0.028 225)` | `oklch(0.245 0.018 252)` | `oklch(0.225 0.055 258)` |
| `--atmosphere-shadow` | `0 7px 24px oklch(0.25 0.055 72 / 18%)` | `0 7px 24px oklch(0.4 0.045 55 / 14%)` | `0 7px 26px oklch(0.33 0.075 239 / 16%)` | `0 7px 26px oklch(0.08 0.012 260 / 36%)` | `0 8px 28px oklch(0.08 0.035 270 / 52%)` |
| `--atmosphere-panel-shadow` | `0 22px 52px oklch(0.25 0.045 72 / 24%)` | `0 22px 52px oklch(0.36 0.045 48 / 23%)` | `0 22px 54px oklch(0.28 0.07 245 / 24%)` | `0 24px 58px oklch(0.06 0.014 260 / 52%)` | `0 24px 60px oklch(0.07 0.045 272 / 68%)` |
| `--sun-line` | `oklch(0.62 0.14 83)` | `oklch(0.62 0.14 83)` | `oklch(0.62 0.14 83)` | `oklch(0.68 0.09 82)` | `oklch(0.68 0.09 82)` |
| `--cloud-line` | `oklch(0.55 0.08 213)` | `oklch(0.55 0.08 213)` | `oklch(0.55 0.08 213)` | `oklch(0.62 0.04 218)` | `oklch(0.62 0.04 218)` |
| `--star-line` | `oklch(0.4 0.1 259)` | `oklch(0.4 0.1 259)` | `oklch(0.4 0.1 259)` | `oklch(0.58 0.095 260)` | `oklch(0.58 0.095 260)` |
| `--moon-line` | `oklch(0.3 0.035 75)` | `oklch(0.3 0.035 75)` | `oklch(0.3 0.035 75)` | `oklch(0.8 0.022 225)` | `oklch(0.8 0.022 225)` |

### Equivalentes hex sRGB dos tokens opacos principais

Estes valores são derivados, não substituem os literais OKLCH acima.

| Tema | background / foreground | card / card-foreground | primary / primary-foreground | muted / muted-foreground | accent / accent-foreground |
|---|---|---|---|---|---|
| Sol | `#f9f3e1` / `#251807` | `#fefaed` / `#251807` | `#044418` / `#fdfaf1` | `#e8e1cd` / `#54452f` | `#a1dca2` / `#002c03` |
| Suave | `#fee6d5` / `#291409` | `#fff6e9` / `#291409` | `#0f3e14` / `#fff9f1` | `#edd6bf` / `#5b4131` | `#9dcd9b` / `#002901` |
| Nublado | `#cae7f4` / `#01172b` | `#e3f7ff` / `#01172b` | `#00415c` / `#f2fcff` | `#b9d6e5` / `#234660` | `#53c1c9` / `#002134` |
| Lua | `#04080e` / `#e2edf7` | `#0c141d` / `#e2edf7` | `#7cc5d2` / `#060e18` | `#1a232c` / `#a4b3c0` | `#004148` / `#baf0f6` |
| Estrelado | `#000114` / `#e1f1fe` | `#000924` / `#e1f1fe` | `#5fc0ff` / `#020417` | `#061a36` / `#97bddb` | `#1b276c` / `#b4f2ff` |

### Aliases globais de compatibilidade

Definidos uma vez em `:root` e herdados por todas as iluminações:

| Variável | Definição exata |
|---|---|
| `--bg` | `var(--background)` |
| `--surface` | `var(--card)` |
| `--surface-2` | `color-mix(in oklch, var(--muted) 94%, var(--season-surface))` |
| `--accent-wash` | `color-mix(in oklch, var(--accent) 88%, var(--season-accent))` |
| `--accent-wash-forte` | `color-mix(in oklch, var(--accent-wash) 72%, var(--accent-foreground))` |
| `--season-border-soft` | `color-mix(in oklch, var(--border) 88%, var(--season-border))` |
| `--acao` | `var(--primary)` |
| `--acao-texto` | `var(--primary-foreground)` |
| `--text` | `var(--foreground)` |
| `--texto-secundario` | `var(--muted-foreground)` |
| `--info` | `var(--primary)` |
| `--erro` | `var(--destructive)` |
| `--erro-forte` | `var(--destructive)` |
| `--aviso` | `var(--warning)` |
| `--texto-terciario` | `var(--muted-foreground)` |

O bloco `@theme inline` também cria aliases Tailwind `--color-*` para todos os
tokens shadcn (`background`, `foreground`, `card`, `primary`, `secondary`,
`muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`,
`sidebar-*`, `success*` e `warning*`). Eles não têm valores cromáticos próprios:
apontam para as variáveis listadas acima.

## 3. Variáveis globais versus específicas de módulo

### Globais

- Todas as variáveis cromáticas das seções anteriores vivem em
  `frontend/app/globals.css`.
- `ThemeProvider.tsx` pode definir `--ambient-color: #rrggbb` inline no `<html>`.
  É uma preferência do usuário validada por regex, persistida localmente.
- `GlobalNav.tsx` expõe a mesma preferência dentro da navegação como
  `--cor-ambiente`, com fallback para `var(--ambient-fallback)`.

### Específicas de módulo

| Arquivo | Variável | Escopo/valor |
|---|---|---|
| `components/GlobalNav.module.css:2,34-50` | `--season-glow` | Redefinição local para o brilho do topo. Usa `color-mix()` e, em Verão/Outono/Inverno, literais OKLCH próprios. Não altera o token global fora do componente. |
| `components/SeasonalDecor.module.css:12-21` | `--percurso-sazonal`, `--voo-sazonal`, `--voo-sazonal-meio` | Variáveis geométricas de animação, não cores. |
| `components/GlobalNav.tsx:197-199` | `--indicador-x`, `--indicador-largura`, `--indicador-opacidade` | Geometria/opacidade do indicador, não cores. |

Não foram encontradas outras custom properties cromáticas definidas em CSS
Modules.

## 4. Cores hardcoded fora das variáveis globais

A lista agrupa todas as ocorrências cromáticas relevantes. `transparent`,
`currentColor` e palavras encontradas apenas dentro de propriedades como
`white-space` não são cores hardcoded e foram excluídas.

### Cores fixas de interface corrigidas

| Arquivo | Antes | Agora |
|---|---|---|
| `app/treino/[moduloUuid]/page.module.css` | `#888`, `#555`, `#ff6b6b` | `--texto-secundario` e `--destructive` |
| `app/treino/[moduloUuid]/[treinoUuid]/page.module.css` | mesmos literais | tokens de texto e erro |
| `app/treino/[moduloUuid]/[treinoUuid]/academia/page.module.css` | cinzas fixos e badge azul fixo | texto secundário e par `primary/primary-foreground` |
| `app/treino/shape/page.module.css` | `#888` | `--texto-secundario` |
| `components/StarRating.module.css` | `#e0a91c` | `--warning`; foco usa `--ring` |
| `app/historico/page.tsx` | `amber-500` | `warning` |

Também corrigidos `ListaEditavel` e `PainelDetalheObra`: títulos/links usavam
`--accent` (fundo) como texto e agora usam `--primary`. No hover do link o
texto usa `--accent-foreground` sobre `--accent-wash`. O fechar do painel usa
superfície opaca temática, evitando texto escuro sobre scrim escuro em Sol,
Suave e Nublado. Geometria e conteúdo dos painéis foram preservados.

Cores de texto/badges sobre capas em `BibliotecaCard.module.css` permanecem
intencionais: branco, `#f5d06f` (estrela), `#ff7b8e` (coração) e
`#9de2b2` (indicador), sobre scrim escuro próprio. Não devem ser substituídas
por cores de texto escuras dos temas claros.

### Overlays, sombras e máscaras fixas

| Arquivo/linhas | Literais | Classificação |
|---|---|---|
| `components/PainelDetalheObra.module.css:4` | `rgba(0,0,0,.72)` | Overlay modal; o fechar agora usa `--surface`. |
| `app/biblioteca/_components/BibliotecaSection.module.css:269` | `rgba(0,0,0,.72)` | Overlay dos formulários. |
| `components/ui/confirm-dialog.tsx:53` | `bg-black/70` | Overlay do modal de confirmação. |
| `app/agenda/page.tsx:670,750` | `bg-black/70` | Overlays da Agenda. |
| `app/estudos/materia/[materiaUuid]/page.tsx:867` | `bg-black/70` | Overlay de Estudos. |
| `app/treino/shape/page.module.css:19-20` | `rgb(0 0 0 / .7)`, `rgb(0 0 0 / .3)` | Overlay e sombra modal. |
| `components/SeletorGenero.module.css:45` | `rgba(0,0,0,.4)` | Sombra do seletor. |
| `app/biblioteca/_components/BibliotecaCard.module.css:47,77,86,88,107,109,123,132,133,147,149,164,255` | pretos/brancos translúcidos | Scrim da imagem, badges, menu, bordas e sombras. |
| `components/GlobalNav.module.css:215` | `white` em `color-mix()` | Realce do avatar. |
| `components/GlobalNav.module.css:317-318,418-426` | `#000` | Máscaras de imagem; a cor da máscara representa alfa, não cor visual. |
| `app/biblioteca/_components/BibliotecaBanner.module.css:47` | `#000` | Máscara do banner, não cor visual. |
| `app/biblioteca/_components/BibliotecaCard.module.css:253,259` | `black` em `color-mix()` | Escurecimento explícito apenas no ajuste `.dark`. |

### Decoração sazonal fixa

`components/SeasonalDecor.module.css:45-104` contém `#db7894`, `#f4b6c8`,
`#fff0f4`, `#8abf91`, `#94c99a`, `#fff8c9`, `#ffd66f`, `#fff3a4`,
`#a85d32`, `#b8662e`, `#df9746`, `#6f3d22`, `#98502d`, `#8b823d`,
`#f7fbff` e `#d8efff`. São pétalas, brilhos, folhas e neve. Elas ignoram a
iluminação de propósito, mas várias são misturadas com `--ambient-color`.

`components/GlobalNav.module.css:38,42,46` também fixa OKLCH em brilhos locais:
`oklch(0.82 0.12 82)`, `oklch(0.62 0.12 53)` e
`oklch(0.82 0.075 222)`.

### Cores de dados configuráveis, não chrome da interface

| Arquivo/linhas | Literal | Uso |
|---|---|---|
| `components/GlobalNav.tsx:408` | `#78927b` | Valor inicial do seletor de cor ambiente. |
| `components/VolumesEditor.tsx:17` | `#b8f566` | Cor inicial de arco de mangá. |
| `lib/modulos-treinos.ts:11-17` | `#63b3ed`, `#b8f566`, `#4ade80`, `#fb923c`, `#f472b6`, `#a78bfa`, `#f87171` | Identidade persistida das modalidades de Treino. |
| `app/financas/page.tsx:67,138,192` | `#3b82f6` | Cor inicial de categoria financeira. |
| `app/idiomas/page.tsx:36,112` | `#7c9a72` | Cor inicial de idioma. |
| `app/estudos/areas/[tipo]/page.tsx:37,108` | `#7c9a72` | Cor inicial/fallback de matéria. |
| `app/treino/page.tsx:202` | `backgroundColor: modulo.cor` | Cor de dado escolhida para o módulo, não token da interface. |

## 5. Contraste WCAG AA

Método reproduzível em `frontend/tests/theme-contrast.test.ts`: conversão
OKLCH → sRGB com clipping, composição alfa source-over em sRGB e luminância
relativa WCAG 2.2. `color-mix(in oklch)` usa interpolação de matiz pelo caminho
curto. Valores fora do gamut podem variar discretamente com o mapeamento do
navegador; os testes são regressão de tokens, não certificação integral.

Referências: [WCAG — contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum),
[WCAG — contraste não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)
e [CSS Color 4](https://www.w3.org/TR/css-color-4/).

### Razões recalculadas do CSS final

Todos os pares desta tabela passam AA para texto normal (4,5:1). AAA para
texto normal exige 7:1; pares abaixo de 7 não recebem essa classificação.

| Par | Sol | Suave | Nublado | Lua | Estrelado |
|---|---:|---:|---:|---:|---:|
| `foreground / background` | 15,71:1 | 14,55:1 | 13,95:1 | 16,91:1 | 17,95:1 |
| `card-foreground / card` | 16,66:1 | 16,32:1 | 16,41:1 | 15,51:1 | 17,10:1 |
| `popover-foreground / popover` | 16,89:1 | 16,57:1 | 16,88:1 | 14,54:1 | 16,36:1 |
| `primary-foreground / primary` | 10,84:1 | 11,76:1 | 10,51:1 | 9,95:1 | 10,15:1 |
| `secondary-foreground / secondary` | 11,57:1 | 10,83:1 | 11,03:1 | 11,90:1 | 13,47:1 |
| `muted-foreground / muted` | 7,09:1 | 6,69:1 | 6,54:1 | 7,47:1 | 8,74:1 |
| `accent-foreground / accent` | 9,76:1 | 8,83:1 | 7,76:1 | 9,11:1 | 11,03:1 |
| `success-foreground / success` | 6,41:1 | 6,64:1 | 6,85:1 | 6,03:1 | 5,94:1 |
| `warning-foreground / warning` | 6,44:1 | 7,04:1 | 7,30:1 | 5,17:1 | 6,12:1 |
| `foreground / success-muted` | 11,65:1 | 10,97:1 | 10,26:1 | 11,24:1 | 12,44:1 |
| `success / background` | 6,05:1 | 5,78:1 | 5,51:1 | 6,28:1 | 6,11:1 |
| `warning / background` | 6,08:1 | 6,13:1 | 5,87:1 | 5,35:1 | 6,29:1 |
| `destructive / background` | 6,50:1 | 6,82:1 | 6,75:1 | 6,97:1 | 7,15:1 |
| `destructive / wash 10%`¹ | 5,49:1 | 5,70:1 | 5,59:1 | 5,69:1 | 6,22:1 |
| `destructive / wash 20%`¹ | 4,60:1 | 4,72:1 | 4,57:1 | 4,84:1 | 5,38:1 |

¹ Menor razão entre o wash aplicado sobre `background` e sobre `card`.
O botão destrutivo agora usa 10% em repouso e 20% no hover nos cinco temas;
a antiga exceção escura de 30% foi retirada por perder contraste.

### Contrato de uso corrigido

- `success`/`warning` são cores de estado legíveis sobre a página e fundos
  sólidos para badges; seus `*-foreground` são exclusivos desses fundos sólidos.
- `success-muted` e washes de aviso usam `foreground`, não o texto inverso
  de uma superfície sólida. Mensagens e números soltos usam `success`/`warning`.
- As 25 combinações (cinco iluminações × cinco decorações) são verificadas para
  texto principal/secundário, superfícies derivadas, estados, aliases,
  `accent-wash`, ações da Biblioteca e estrelas. Campos, bordas-base e ring
  passam 3:1 contra `background` e `card`.
- Bordas decorativas translúcidas (`glass-border`, misturas e divisores),
  sombras e partículas não são confundidas com bordas essenciais de controle.
- A tela de login e o seletor de atmosfera foram exercitados pelo navegador
  nas 25 combinações, sem overflow nem corte do dropdown no viewport testado.
  A sessão local estava desautenticada; páginas internas com dados reais ainda
  exigem homologação visual no deploy.

As razões que acompanhavam a proposta do v0 **não foram adotadas**: havia
resultados incorretos para sucesso, aviso e bordas. Os valores finais foram
ajustados conforme os pares realmente usados pelos componentes.

## 6. Como o tema é aplicado

### Persistência

| Preferência | Chave `localStorage` | Default |
|---|---|---|
| Iluminação | `sistema-pessoal:tema` | preferência escura do SO; senão `claro` |
| Decoração | `sistema-pessoal:decoracao` | `primavera` |
| Cor ambiente | `sistema-pessoal:cor-ambiente` | ausente; usa `--ambient-fallback` |

### Sequência

1. `frontend/app/layout.tsx` executa `SCRIPT_ANTI_FLASH` com estratégia
   `beforeInteractive`.
2. O script lê `localStorage` antes da hidratação e aplica `dark`, `soft`,
   `cloudy` e/ou `starry` em `document.documentElement.classList`.
3. Ele define `document.documentElement.dataset.decoracao` e, quando válida,
   `--ambient-color` inline no `<html>`.
4. `ThemeProvider.tsx` reconcilia o estado React com as mesmas preferências.
5. Mudanças feitas em `ThemeToggle.tsx` atualizam imediatamente
   `localStorage`, classes, `data-decoracao` e custom property.

Não existe atributo `data-theme`. A iluminação usa classes; somente decoração
usa data-attribute. A classe `dark` também ativa a variante Tailwind
`@custom-variant dark (&:is(.dark *))`.

## 7. Componentes/páginas que ignoram variáveis de tema

### Correções concluídas nesta revisão

- Treino interno, Shape, estrelas e aviso do Histórico agora acompanham tema.
- Aliases legados de erro/aviso/informação e texto terciário apontam para tokens.
- Badges e mensagens deixam de usar texto inverso sobre um fundo suave.
- Sidebar, tags e placeholders da Biblioteca mantêm texto legível nas novas
  superfícies; estrutura e transições não foram alteradas.
- Focos que usavam `accent` ou uma mistura sazonal fraca passam a usar `ring`.
- Não foi alterada cor persistida como dado nem preferência salva do usuário.

Validações finais: typecheck e build aprovados; 55 testes Node passam
(27 neste teste de temas/contratos). O lint global mantém 6 erros e 5 avisos
em arquivos não modificados pelo lote; nenhum achado nos arquivos alterados.

### Fixos intencionais, mas que não respondem à iluminação

- `BibliotecaCard.module.css`: overlays de capa, coração, nota e texto sobre
  imagem mantêm uma paleta própria escura para legibilidade fotográfica.
- `SeasonalDecor.module.css`: pétalas, brilho solar, folhas e neve têm cores
  figurativas próprias; parte delas responde apenas à cor ambiente.
- Overlays modais usam preto translúcido de forma consistente em várias áreas.
- Máscaras `#000` de GlobalNav/BibliotecaBanner não pintam pixels; controlam
  transparência e não constituem tema visual.
- Cores de modalidades, matérias, idiomas, categorias financeiras e arcos de
  mangá são dados configuráveis/persistidos, não chrome temático.

## Arquivos relacionados lidos

- `frontend/app/globals.css`
- `frontend/app/layout.tsx`
- `frontend/components/ThemeProvider.tsx`
- `frontend/components/ThemeToggle.tsx`
- `frontend/components/ThemeToggle.module.css`
- `frontend/components/SeasonalDecor.tsx`
- `frontend/components/SeasonalDecor.module.css`
- `frontend/components/GlobalNav.tsx`
- `frontend/components/GlobalNav.module.css`
- `frontend/components/AppChrome.tsx`
- `frontend/components/AppChrome.module.css`
- `frontend/components/RightRail.tsx`
- `frontend/components/RightRail.module.css`
- Os 22 arquivos CSS do frontend e os arquivos TS/TSX com literais de cor,
  classes Tailwind cromáticas, estilos inline e custom properties.

## Limitações desta auditoria

- Contraste sobre capas, banners, avatares e gradientes depende da imagem e do
  ponto amostrado; requer teste visual/computado no navegador.
- As 25 combinações de iluminação/estação têm testes determinísticos. Cor
  ambiente arbitrária, imagens e gradientes em cada ponto da tela não estão
  cobertos por essa matriz; não se afirma conformidade global de todas as telas.
- WCAG 4,5:1 foi aplicado como solicitado. Texto grande pode usar 3:1, mas o
  relatório não promove nenhuma falha com base nessa exceção.
