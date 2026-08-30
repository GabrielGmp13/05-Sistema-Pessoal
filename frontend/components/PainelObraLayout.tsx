'use client';

import { useId, useLayoutEffect, useRef, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { BookOpen, ExternalLink, Film, Heart, Headphones, Library, Music2, Pencil, Play, Star, X } from 'lucide-react';
import { getSignedUrl } from '@/lib/supabase';
import { NOMES_MIDIA, organizarCampos, urlExterna, type CampoInfo, type LinkObra, type TipoPainelObra } from './painel-obra-dados';
import styles from './PainelDetalheObra.module.css';

export interface IdentidadeObra {
  tipoObra: TipoPainelObra; titulo: string; subtitulo?: string | null;
  bannerUrl?: string | null; bannerPath?: string | null; capaUrl?: string | null; capaPath?: string | null;
  infoGeral: CampoInfo[]; favorito?: boolean; generos?: string[]; links?: LinkObra[];
  onFechar: () => void; onEditar?: () => void;
}
// Storage privado: usar somente o helper de assinatura existente.
export function ImagemObra({ url, path, alt = '', className, prioridade = false }: {
  url?: string | null; path?: string | null; alt?: string; className?: string; prioridade?: boolean;
}) {
  const [assinada, setAssinada] = useState<{ path: string; url: string | null } | null>(null);
  const [falhou, setFalhou] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let ativo = true;
    void getSignedUrl('capas', path).then(url => { if (ativo) setAssinada({ path, url }); }).catch(() => {});
    return () => { ativo = false; };
  }, [path]);
  const src = (assinada?.path === path ? assinada?.url : null) || urlExterna(url);
  if (!src || falhou === src) return null;
  return <Image unoptimized src={src} alt={alt} width={480} height={640} loading={prioridade ? 'eager' : 'lazy'} className={className} onError={() => setFalhou(src)} />;
}
export function NotaObra({ valor }: { valor: number | null | undefined }) {
  if (valor == null || !Number.isFinite(valor)) return null;
  const nota = Math.min(5, Math.max(0, valor));
  return <span className={styles.nota} aria-label={`Minha nota: ${nota.toLocaleString('pt-BR')} de 5`}>
    <span className={styles.estrelas} aria-hidden="true">{Array.from({ length: 5 }, (_, i) =>
      <span key={i} className={styles.estrela}><Star size={14} /><span style={{ width: `${Math.min(1, Math.max(0, nota - i)) * 100}%` }}><Star size={14} fill="currentColor" /></span></span>)}</span>
    <strong aria-hidden="true">{nota.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / 5</strong>
  </span>;
}
const ICONES = { filme: Film, serie: Film, anime: Play, manga: BookOpen, livro: BookOpen, podcast: Headphones, video: Play, playlist: Library, artigo: BookOpen };
export default function PainelObraLayout({ tipoObra, titulo, subtitulo, bannerUrl, bannerPath, capaUrl, capaPath,
  infoGeral, favorito, generos, links = [], onFechar, onEditar, children, acoes }: IdentidadeObra & { children: ReactNode; acoes?: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const Icone = ICONES[tipoObra];
  const { cabecalho } = organizarCampos(infoGeral);
  const linksValidos = links.map(l => ({ ...l, url: urlExterna(l.url) })).filter(l => l.url);
  const possuiImagem = Boolean(bannerUrl || bannerPath || capaUrl || capaPath);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; if (anterior?.isConnected) anterior.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialogRef} className={styles.painel} aria-labelledby={tituloId} aria-modal="true"
    onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onFechar(); } }}
    onCancel={e => { e.preventDefault(); onFechar(); }} onClick={e => {
      if (e.target !== e.currentTarget) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onFechar();
    }}>
    <header className={`${styles.cabecalho} ${possuiImagem ? styles.comImagem : ''}`}>
      {possuiImagem && <div className={styles.banner} aria-hidden="true"><ImagemObra prioridade url={bannerUrl || capaUrl} path={bannerPath || (!bannerUrl ? capaPath : null)} className={styles.imagemBanner} /></div>}
      <button type="button" autoFocus className={styles.btnFechar} onClick={onFechar} aria-label="Fechar detalhes" title="Fechar (Esc)"><X size={20} /></button>
      <div className={styles.identidade}>
        {(capaUrl || capaPath) && <ImagemObra prioridade url={capaUrl} path={capaPath} className={styles.capa} />}
        <div className={styles.identidadeTexto}>
          <div className={styles.eyebrow}><Icone size={14} /><span>{NOMES_MIDIA[tipoObra]}</span>{favorito && <span className={styles.favorito}><Heart size={13} fill="currentColor" /> Favorito</span>}</div>
          <h1 id={tituloId} className={styles.titulo}>{titulo}</h1>
          {subtitulo?.trim() && subtitulo.trim() !== titulo.trim() && <p className={styles.subtitulo}>{subtitulo}</p>}
          <div className={styles.metadados}>{cabecalho.map(c => c.label === 'Nota' ? <NotaObra key={c.label} valor={Number.parseFloat(c.valor.replace(',', '.'))} />
            : <span key={c.label} className={c.label === 'Status' ? styles.badge : undefined}>{c.valor}</span>)}
            {generos?.filter(g => g.trim()).map(g => <span key={g} className={styles.genero}>{g}</span>)}</div>
        </div>
      </div>
    </header>
    <div className={styles.conteudo} tabIndex={0} aria-label={`Conteúdo de ${titulo}`}>{children}</div>
    <footer className={styles.rodape}>
      <div className={styles.links}>{linksValidos.map(l => <a key={`${l.label}-${l.url}`} className={styles.linkExterno} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}<ExternalLink size={14} /></a>)}</div>
      <div className={styles.acoes}>{acoes}{onEditar && <button type="button" className={styles.btnPrimario} onClick={() => { onFechar(); onEditar(); }}><Pencil size={15} />Editar obra</button>}</div>
    </footer>
  </dialog>;
}
export function SecaoObra({ titulo, children, icone }: { titulo: string; children: ReactNode; icone?: ReactNode }) {
  return <section className={styles.secao}><h2>{icone || <Library size={15} />}{titulo}</h2>{children}</section>;
}
export function CamposObra({ campos }: { campos: CampoInfo[] }) {
  const validos = campos.filter(c => c.valor?.trim());
  if (!validos.length) return null;
  return <dl className={styles.infoGrid}>{validos.map(c => <div key={c.label}><dt>{c.label}</dt><dd>{c.valor}</dd></div>)}</dl>;
}
export function ResumoObra({ infoGeral }: { infoGeral: CampoInfo[] }) {
  const { sinopse, detalhes } = organizarCampos(infoGeral);
  return <>{sinopse && <SecaoObra titulo="Sinopse" icone={<BookOpen size={15} />}><p className={styles.prosa}>{sinopse}</p></SecaoObra>}
    {detalhes.length > 0 && <SecaoObra titulo="Sobre a obra"><CamposObra campos={detalhes} /></SecaoObra>}</>;
}
export function EncerramentoObra({ infoGeral }: { infoGeral: CampoInfo[] }) {
  const { historico, comentario } = organizarCampos(infoGeral);
  return <>{historico.length > 0 && <SecaoObra titulo="Meu histórico"><CamposObra campos={historico} /></SecaoObra>}
    {comentario && <SecaoObra titulo="Meu comentário" icone={<Pencil size={15} />}><p className={styles.comentario}>{comentario}</p></SecaoObra>}</>;
}
export function LinkMusica({ url, children }: { url?: string | null; children: ReactNode }) {
  const href = urlExterna(url);
  return href ? <a className={styles.linkExterno} href={href} target="_blank" rel="noopener noreferrer"><Music2 size={14} />{children}<ExternalLink size={12} /></a> : null;
}
