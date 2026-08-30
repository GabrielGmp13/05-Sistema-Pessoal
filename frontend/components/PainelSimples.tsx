'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { listarVolumes, type MangaVolume } from '@/lib/mangas-volumes';
import { listarAnotacoesLivro, type LivroAnotacao } from '@/lib/livros-anotacoes';
import PainelObraLayout, { ResumoObra, EncerramentoObra, type IdentidadeObra } from './PainelObraLayout';
import { AcompanhamentoObra, AnotacoesObra, ProgressoLeitura, VolumesObra } from './PainelObraLeitura';
import styles from './PainelDetalheObra.module.css';

type Props = Omit<IdentidadeObra, 'tipoObra'> & {
  aberto: boolean; obraUuid: string; tipoObra: 'manga' | 'livro' | 'podcast' | 'video' | 'artigo';
  linkUrl?: string | null; linkLabel?: string; children?: ReactNode;
  paginaAtual?: number | null; paginasTotal?: number | null;
};
export default function PainelSimples(props: Props) {
  return props.aberto ? <SimplesAberto key={props.tipoObra + props.obraUuid} {...props} /> : null;
}
function SimplesAberto({ tipoObra, obraUuid, linkUrl, linkLabel = 'Abrir link', children, paginaAtual, paginasTotal, ...props }: Props) {
  const [volumes, setVolumes] = useState<MangaVolume[]>([]);
  const [anotacoes, setAnotacoes] = useState<LivroAnotacao[]>([]);
  const [carregando, setCarregando] = useState(tipoObra === 'manga' || tipoObra === 'livro');
  const [erro, setErro] = useState(false);
  useEffect(() => {
    if (tipoObra !== 'manga' && tipoObra !== 'livro') return;
    let ativo = true;
    async function carregar() {
      try {
        if (tipoObra === 'manga') {
          const res = await listarVolumes(obraUuid);
          if (ativo) { setVolumes(res ?? []); setErro(res === null); }
        } else {
          const res = await listarAnotacoesLivro(obraUuid);
          if (ativo) { setAnotacoes(res ?? []); setErro(res === null); }
        }
      } catch { if (ativo) setErro(true); }
      finally { if (ativo) setCarregando(false); }
    }
    void carregar();
    return () => { ativo = false; };
  }, [tipoObra, obraUuid]);
  const detalhes = props.infoGeral.filter(c => !['Capítulo atual', 'Episódio atual'].includes(c.label)
    && !(tipoObra === 'livro' && c.label === 'Progresso'));
  return <PainelObraLayout {...props} tipoObra={tipoObra} links={[...(props.links ?? []), { label: linkLabel, url: linkUrl }]} acoes={children}>
    <ResumoObra infoGeral={detalhes} />
    {tipoObra === 'livro' && <ProgressoLeitura atual={paginaAtual} total={paginasTotal} />}
    {(tipoObra === 'manga' || tipoObra === 'podcast') && <AcompanhamentoObra tipo={tipoObra} campos={props.infoGeral} />}
    {carregando && <p className={styles.status} role="status">Carregando detalhes da obra...</p>}
    {erro && <p className={styles.erro} role="alert">Não foi possível carregar todos os detalhes. Feche e abra a obra para tentar novamente.</p>}
    {tipoObra === 'manga' && <VolumesObra volumes={volumes} />}
    {tipoObra === 'livro' && <AnotacoesObra anotacoes={anotacoes} />}
    <EncerramentoObra infoGeral={props.infoGeral} />
  </PainelObraLayout>;
}
