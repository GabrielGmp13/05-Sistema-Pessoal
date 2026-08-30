'use client';

import { useEffect, useState } from 'react';
import { Check, Play } from 'lucide-react';
import { listarVideosDaPlaylist, type VideoPlaylist } from '@/lib/videos-playlists';
import type { Video } from '@/lib/videos';
import PainelObraLayout, { CamposObra, ImagemObra, SecaoObra } from './PainelObraLayout';
import { dataPainel } from './painel-obra-dados';
import styles from './PainelDetalheObra.module.css';

export default function PainelPlaylist({ playlist, onFechar, onAbrirVideo }: {
  playlist: VideoPlaylist; onFechar: () => void; onAbrirVideo: (video: Video) => void;
}) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let ativo = true;
    void listarVideosDaPlaylist(playlist.uuid).then(res => { if (ativo) { setVideos(res); setErro(res === null); } })
      .catch(() => { if (ativo) setErro(true); });
    return () => { ativo = false; };
  }, [playlist.uuid]);
  return <PainelObraLayout tipoObra="playlist" titulo={playlist.nome} onFechar={onFechar}
    capaUrl={videos?.[0]?.capa_url} capaPath={videos?.[0]?.capa_path} infoGeral={[]}
    links={[{ label: 'Abrir no YouTube', url: playlist.origem_url }]}>
    <SecaoObra titulo="Sobre a playlist"><CamposObra campos={[
      { label: 'Origem', valor: playlist.origem === 'youtube_link' ? 'Link do YouTube' : 'Conta conectada' },
      ...(playlist.importada_em ? [{ label: 'Importada em', valor: dataPainel(playlist.importada_em) }] : []),
      ...(videos ? [{ label: 'Vídeos disponíveis', valor: String(videos.length) }, { label: 'Assistidos', valor: String(videos.filter(v => v.assistido).length) }] : []),
    ]} /></SecaoObra>
    {erro ? <p className={styles.erro} role="alert">Não foi possível carregar os vídeos. Feche e abra a playlist para tentar novamente.</p>
      : videos === null ? <p role="status" className={styles.status}>Carregando vídeos...</p>
        : videos.length > 0 ? <SecaoObra titulo={`Vídeos · ${videos.length}`}><ol className={styles.lista}>{videos.map((v, i) => <li key={v.uuid}>
          <button type="button" className={styles.videoLinha} onClick={() => onAbrirVideo(v)}>
            <span className={styles.numero}>{String(i + 1).padStart(2, '0')}</span><ImagemObra url={v.capa_url} path={v.capa_path} className={styles.videoCapa} />
            <div><strong>{v.titulo}</strong><small>{[v.canal, v.duracao_segundos != null ? `${Math.floor(v.duracao_segundos / 60)}:${String(v.duracao_segundos % 60).padStart(2, '0')}` : null].filter(Boolean).join(' · ')}</small></div>
            {v.assistido ? <Check size={16} className={styles.concluido} aria-label="Assistido" /> : <Play size={16} aria-hidden="true" />}
          </button></li>)}</ol></SecaoObra> : null}
  </PainelObraLayout>;
}
