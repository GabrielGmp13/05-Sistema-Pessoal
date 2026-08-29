import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppChrome } from '@/components/AppChrome';
import { GlobalNav } from '@/components/GlobalNav';
import { CalendarAutoSync } from '@/components/CalendarAutoSync';

export const metadata: Metadata = {
  title: 'Sistema Pessoal',
  description: 'Gestão pessoal — treino, estudos, biblioteca, revisão espaçada e agenda',
};

// Script anti-flash: aplica a classe do tema antes da hidratação, lendo a
// preferência salva (ou o tema do SO na primeira visita). Sem isso, a tela
// pisca no tema errado por uma fração de segundo a cada carregamento.
const SCRIPT_ANTI_FLASH = `
(function() {
  try {
    var chave = 'sistema-pessoal:tema';
    var salvo = localStorage.getItem(chave);
    var escuro = salvo ? salvo === 'escuro' || salvo === 'estrelado' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (escuro) document.documentElement.classList.add('dark');
    if (salvo === 'suave') document.documentElement.classList.add('soft');
    if (salvo === 'nublado') document.documentElement.classList.add('cloudy');
    if (salvo === 'estrelado') document.documentElement.classList.add('starry');
    var decoracao = localStorage.getItem('sistema-pessoal:decoracao');
    if (decoracao === 'noite') {
      decoracao = 'nenhum';
      localStorage.setItem('sistema-pessoal:decoracao', decoracao);
    }
    var decoracoes = ['primavera', 'verao', 'outono', 'inverno', 'nenhum'];
    document.documentElement.dataset.decoracao = decoracoes.indexOf(decoracao) >= 0 ? decoracao : 'primavera';
    var corAmbiente = localStorage.getItem('sistema-pessoal:cor-ambiente');
    if (/^#[0-9a-f]{6}$/i.test(corAmbiente || '')) document.documentElement.style.setProperty('--ambient-color', corAmbiente);
  } catch (e) {}
})();
`;


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <Script id="tema-anti-flash" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SCRIPT_ANTI_FLASH }} />
      </head>
      <body>
        <ThemeProvider>
          <CalendarAutoSync />
          <GlobalNav />
          <AppChrome>{children}</AppChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
