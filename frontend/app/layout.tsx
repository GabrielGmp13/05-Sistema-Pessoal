import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalNav } from '@/components/GlobalNav';

export const metadata: Metadata = {
  title: 'Sistema Pessoal',
  description: 'Gestão pessoal — treino, estudos, biblioteca, revisão espaçada e agenda',
};

// Script anti-flash: aplica a classe `.dark` antes da hidratação, lendo a
// preferência salva (ou o tema do SO na primeira visita). Sem isso, a tela
// pisca no tema errado por uma fração de segundo a cada carregamento.
const SCRIPT_ANTI_FLASH = `
(function() {
  try {
    var chave = 'sistema-pessoal:tema';
    var salvo = localStorage.getItem(chave);
    var escuro = salvo ? salvo === 'escuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (escuro) document.documentElement.classList.add('dark');
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
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ANTI_FLASH }} />
      </head>
      <body>
        <ThemeProvider>
          <GlobalNav />
          {children}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
