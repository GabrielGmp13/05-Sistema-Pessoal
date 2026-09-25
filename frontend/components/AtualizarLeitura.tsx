'use client';

import { useState } from 'react';
import { atualizarProgressoLivro, type Livro } from '@/lib/livros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AtualizarLeitura({ livro, onSalvo }: { livro: Livro; onSalvo: (livro: Livro) => void }) {
  const [modo, setModo] = useState<'adicionar' | 'definir'>('adicionar');
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  async function salvar() {
    setSalvando(true); setMensagem('');
    try {
      if (!valor.trim()) throw new Error('Informe as páginas.');
      const atualizado = await atualizarProgressoLivro(livro, Number(valor), modo);
      if (!atualizado) throw new Error('Não foi possível atualizar. Recarregue o livro para conferir se o progresso mudou em outra aba antes de tentar novamente.');
      onSalvo(atualizado); setValor(''); setMensagem(`Progresso salvo: página ${atualizado.pagina_atual}.`);
    } catch (error) { setMensagem(error instanceof Error ? error.message : 'Não foi possível atualizar.'); }
    finally { setSalvando(false); }
  }
  return <div className="space-y-2"><fieldset disabled={salvando} className="flex flex-wrap items-center gap-2">
    <select aria-label="Como atualizar a leitura" className="rounded-md border border-border bg-background px-2 py-2 text-sm" value={modo} onChange={(event) => setModo(event.target.value as 'adicionar' | 'definir')}><option value="adicionar">Li mais</option><option value="definir">Estou na página</option></select>
    <Input aria-label={modo === 'adicionar' ? 'Páginas lidas' : 'Página atual'} type="number" min={modo === 'adicionar' ? 1 : 0} step={1} value={valor} onChange={(event) => setValor(event.target.value)} className="w-24" />
    <Button onClick={() => void salvar()}>{salvando ? 'Salvando…' : 'Salvar leitura'}</Button>
  </fieldset>{mensagem && <p role="status" className="text-sm">{mensagem}</p>}</div>;
}
