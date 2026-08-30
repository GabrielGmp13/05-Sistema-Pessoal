'use client';

import { BookOpen, Check, Heart, Quote } from 'lucide-react';
import type { MangaVolume } from '@/lib/mangas-volumes';
import type { LivroAnotacao } from '@/lib/livros-anotacoes';
import { CamposObra, SecaoObra } from './PainelObraLayout';
import { dataPainel, percentualProgresso, type CampoInfo } from './painel-obra-dados';
import styles from './PainelDetalheObra.module.css';

export function VolumesObra({ volumes }: { volumes: MangaVolume[] }) {
  if (!volumes.length) return null;
  const grupos = new Map<string, MangaVolume[]>();
  for (const volume of volumes) {
    const arco = volume.arco?.trim() || 'Volumes';
    grupos.set(arco, [...(grupos.get(arco) ?? []), volume]);
  }
  return <SecaoObra titulo={`Volumes · ${volumes.filter(v => v.lido).length} de ${volumes.length} lidos`} icone={<BookOpen size={15} />}>
    {[...grupos].map(([arco, itens]) => <div key={arco}><h3 className={styles.subtituloSecao}>{arco}</h3><ul className={styles.lista}>{itens.map(v =>
      <li key={v.uuid} className={styles.linhaLista}><span className={styles.numero}>{String(v.numero).padStart(2, '0')}</span><div><strong>Volume {v.numero}</strong>{v.data_leitura && <small>{dataPainel(v.data_leitura)}</small>}</div>
        <span className={v.lido ? styles.concluido : styles.numero}>{v.lido ? <><Check size={13} /> Lido</> : 'Não lido'}</span></li>)}</ul></div>)}
  </SecaoObra>;
}
export function AnotacoesObra({ anotacoes }: { anotacoes: LivroAnotacao[] }) {
  const itens = anotacoes.filter(a => a.texto?.trim());
  if (!itens.length) return null;
  return <SecaoObra titulo="Anotações e citações" icone={<Quote size={15} />}><div className={styles.lista}>{itens.map(a => a.tipo === 'citacao'
    ? <blockquote key={a.uuid} className={styles.citacao}><p>{a.texto}</p><footer>Citação{a.pagina != null && ` · Página ${a.pagina}`}{a.favorito && <Heart size={12} aria-label="Favorita" />}</footer></blockquote>
    : <article key={a.uuid} className={styles.cartao}><h3>Anotação{a.pagina != null && ` · Página ${a.pagina}`}{a.favorito && <Heart size={12} aria-label="Favorita" />}</h3><p className={styles.prosa}>{a.texto}</p></article>)}</div></SecaoObra>;
}
export function ProgressoLeitura({ atual, total }: { atual?: number | null; total?: number | null }) {
  if (atual == null && total == null) return null;
  const percentual = percentualProgresso(atual, total);
  return <SecaoObra titulo="Minha leitura" icone={<BookOpen size={15} />}><CamposObra campos={[
    ...(atual != null ? [{ label: 'Página atual', valor: String(atual) }] : []),
    ...(total != null ? [{ label: 'Total de páginas', valor: String(total) }] : []),
  ]} />{percentual != null && <progress className={styles.progresso} value={percentual} max={100} aria-label="Progresso da leitura">{Math.round(percentual)}%</progress>}</SecaoObra>;
}
export function AcompanhamentoObra({ tipo, campos }: { tipo: 'manga' | 'podcast'; campos: CampoInfo[] }) {
  const progresso = campos.filter(c => ['Capítulo atual', 'Episódio atual'].includes(c.label));
  if (!progresso.length) return null;
  return <SecaoObra titulo={tipo === 'manga' ? 'Minha leitura' : 'Onde parei'}><CamposObra campos={progresso} /></SecaoObra>;
}
