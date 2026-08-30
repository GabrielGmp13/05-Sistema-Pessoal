import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Regressão dos pares usados pela UI, não certificação WCAG de páginas inteiras.
// OKLCH -> sRGB (clipping), alfa source-over e luminância WCAG 2.2.
// Misturas opacas seguem o hue shorter de color-mix(in oklch).
type Color = { l: number; c: number; h: number; a: number }
type Rgb = [number, number, number]
type Tokens = Record<string, string>
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const themes = [':root', '.soft', '.cloudy', '.dark', '.starry']
const seasons = ['primavera', 'verao', 'outono', 'inverno', 'nenhum']

function block(selector: string): Tokens {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const body = css.match(new RegExp(`^${escaped} \\{([\\s\\S]*?)^\\}`, 'm'))?.[1]
  assert.ok(body, `Bloco ausente: ${selector}`)
  return Object.fromEntries([...body.matchAll(/^\s*(--[\w-]+):\s*(.+);/gm)].map(m => [m[1], m[2]]))
}

function splitArgs(value: string): string[] {
  let depth = 0
  let start = 0
  const result: string[] = []
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++
    if (value[i] === ')') depth--
    if (value[i] === ',' && depth === 0) {
      result.push(value.slice(start, i).trim())
      start = i + 1
    }
  }
  return [...result, value.slice(start).trim()]
}

function color(value: string, tokens: Tokens): Color {
  const alias = value.match(/^var\((--[\w-]+)\)$/)
  if (alias) return color(tokens[alias[1]], tokens)
  if (value === 'transparent') return { l: 0, c: 0, h: 0, a: 0 }
  const raw = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+)%)?\)$/)
  if (raw) return { l: +raw[1], c: +raw[2], h: +raw[3], a: raw[4] ? +raw[4] / 100 : 1 }
  const mixed = value.match(/^color-mix\(in oklch, (.*)\)$/)
  assert.ok(mixed, `Cor não suportada pelo teste: ${value}`)
  const args = splitArgs(mixed[1]).map(arg => {
    const weighted = arg.match(/^(.*) (\d+(?:\.\d+)?)%$/)
    return { color: color(weighted ? weighted[1] : arg, tokens), weight: weighted ? +weighted[2] / 100 : null }
  })
  const weight = args[0].weight ?? 1 - (args[1].weight ?? 0.5)
  const first = args[0].color
  const second = args[1].color
  const alpha = first.a * weight + second.a * (1 - weight)
  const t = alpha ? first.a * weight / alpha : weight
  const hue1 = first.a === 0 ? second.h : first.h
  const hue2 = second.a === 0 ? first.h : second.h
  const delta = ((hue2 - hue1 + 540) % 360) - 180
  return {
    l: first.l * t + second.l * (1 - t),
    c: first.c * t + second.c * (1 - t),
    h: hue1 + delta * (1 - weight),
    a: alpha,
  }
}

function srgb(value: Color): Rgb {
  const a = value.c * Math.cos(value.h * Math.PI / 180)
  const b = value.c * Math.sin(value.h * Math.PI / 180)
  const l = (value.l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (value.l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (value.l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(channel => {
    const clipped = Math.max(0, Math.min(1, channel))
    return clipped <= 0.0031308 ? clipped * 12.92 : 1.055 * clipped ** (1 / 2.4) - 0.055
  }) as Rgb
}

function over(foreground: Rgb, alpha: number, background: Rgb): Rgb {
  return foreground.map((v, i) => v * alpha + background[i] * (1 - alpha)) as Rgb
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return r * 0.2126 + g * 0.7152 + b * 0.0722
}

function contrast(foreground: Color, background: Color, base: Color): number {
  const bg = over(srgb(background), background.a, srgb(base))
  const fg = over(srgb(foreground), foreground.a, bg)
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

test('cálculo de contraste respeita referências e composição alfa', () => {
  const black = color('oklch(0 0 0)', {})
  const white = color('oklch(1 0 0)', {})
  assert.ok(Math.abs(contrast(black, white, white) - 21) < 0.001)
  assert.equal(contrast(black, black, white), 1)
  const translucent = color('color-mix(in oklch, oklch(0 0 0) 50%, transparent)', {})
  // Preto com alfa 50% sobre branco resulta em sRGB 0.5, não L OKLCH 0.5.
  assert.ok(Math.abs(contrast(white, translucent, white) - 3.97665) < 0.001)
})

for (const theme of themes) {
  for (const season of seasons) {
    test(`contraste de tokens: ${theme} + ${season}`, () => {
      const tokens = { ...block(':root'), ...(theme === '.starry' ? block('.dark') : {}), ...block(theme), ...block(`html[data-decoracao='${season}']`) }
      const resolve = (name: string) => color(name.startsWith('--') ? tokens[name] : name, tokens)
      const base = resolve('--background')
      const failures: string[] = []
      function check(fg: string, bg: string, minimum = 4.5, backdrop = base) {
        const ratio = contrast(resolve(fg), resolve(bg), backdrop)
        if (ratio < minimum) failures.push(`${fg} / ${bg}: ${ratio.toFixed(2)} < ${minimum}`)
      }
      for (const name of ['card', 'popover', 'primary', 'secondary', 'accent', 'success', 'warning', 'sidebar-primary', 'sidebar-accent']) {
        check(`--${name}-foreground`, `--${name}`)
      }
      check('--foreground', '--background')
      check('--sidebar-foreground', '--sidebar')
      for (const bg of ['--background', '--card', '--popover', '--muted', '--surface-2']) {
        check('--muted-foreground', bg)
      }
      for (const bg of ['--surface-2', '--success-muted', '--accent-wash']) check('--foreground', bg)
      check('--accent-foreground', '--accent-wash')
      for (const fg of ['--success', '--warning', '--destructive', '--primary']) {
        for (const bg of ['--background', '--card']) check(fg, bg)
      }
      for (const bg of ['--background', '--card']) {
        for (const amount of [10, 20]) {
          check('--destructive', `color-mix(in oklch, var(--destructive) ${amount}%, transparent)`, 4.5, resolve(bg))
        }
        check('--input', bg, 3)
        check('--border', bg, 3)
        check('--ring', bg, 3)
      }
      check('--warning', '--surface-2', 3)
      check('--primary-foreground', 'color-mix(in oklch, var(--success) 74%, var(--primary))')
      assert.deepEqual(failures, [], failures.join('\n'))
    })
  }
}

test('componentes preservam os contratos de texto semântico', () => {
  const badges = readFileSync(new URL('../components/ui/badge.tsx', import.meta.url), 'utf8')
  assert.match(badges, /bg-success text-success-foreground/)
  assert.match(badges, /bg-warning text-warning-foreground/)
  assert.doesNotMatch(badges, /bg-success-muted text-success-foreground|bg-warning\/20 text-warning-foreground/)
  for (const file of ['ListaEditavel', 'PainelDetalheObra']) {
    const source = readFileSync(new URL(`../components/${file}.module.css`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /(?:^|[;\s])color:\s*var\(--accent\);/m)
  }
})
