'use client';

import { useEffect, useState } from 'react';
import PainelSimples from '@/components/PainelSimples';
import PainelPlaylist from '@/components/PainelPlaylist';
import painelStyles from '@/components/PainelDetalheObra.module.css';
import type { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import StarRating from '@/components/StarRating';
import BuscaMetadados from './BuscaMetadados';
import {
  apagarVideo,
  atualizarVideo,
  criarVideo,
  listarVideos,
  type Video,
  type VideoInput,
} from '@/lib/videos';
import { listarMaterias, type Materia } from '@/lib/materias';
import {
  criarModuloCurso,
  listarModulosCurso,
  type ModuloCurso,
} from '@/lib/modulos-curso';
import {
  buscarConteudoDeVideoNoCurso,
  criarConteudo,
} from '@/lib/conteudos';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import { ordenarItensBiblioteca, type OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import styles from './BibliotecaSection.module.css';
import CapaUploadField from './CapaUploadField';
import { persistirComCapa, removerArquivosBiblioteca } from '@/lib/biblioteca-capas';
import {
  listarPlaylistsVideos,
  type VideoPlaylist,
} from '@/lib/videos-playlists';

interface PlaylistPreview {
  id: string;
  titulo: string;
  descricao: string;
  capaUrl: string | null;
  quantidade: number;
  origemUrl: string;
}

interface PlaylistPreviewVideo {
  youtubeId: string;
  titulo: string;
  canal: string | null;
  capaUrl: string | null;
}

const FORM_VAZIO: VideoInput = {
  titulo: '',
  url: '',
  canal: '',
  capa_url: '',
  capa_path: null,
  assistido: false,
  favorito: false,
  comentario: '',
};

interface Props {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
  rascunhoImportacao?: { url: string; titulo: string } | null;
}

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restante = segundos % 60;
  return horas > 0
    ? `${horas}h ${minutos.toString().padStart(2, '0')}min`
    : `${minutos}:${restante.toString().padStart(2, '0')}`;
}

export default function VideosSection({
  gatilhoAdicionar,
  busca = '',
  onTotalCarregado,
  ordenacao,
  onOrdenacaoChange,
  rascunhoImportacao,
}: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<VideoInput>(FORM_VAZIO);
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelVideo, setPainelVideo] = useState<Video | null>(null);
  const [videoParaApagar, setVideoParaApagar] = useState<string | null>(null);
  const [videoParaCurso, setVideoParaCurso] = useState<Video | null>(null);
  const [cursos, setCursos] = useState<Materia[]>([]);
  const [modulosCurso, setModulosCurso] = useState<ModuloCurso[]>([]);
  const [cursoUuid, setCursoUuid] = useState('');
  const [moduloUuid, setModuloUuid] = useState('');
  const [novoModuloNome, setNovoModuloNome] = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [erroVinculo, setErroVinculo] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [playlistAberta, setPlaylistAberta] = useState<VideoPlaylist | null>(null);
  const [modalPlaylistAberto, setModalPlaylistAberto] = useState(false);
  const [linkPlaylist, setLinkPlaylist] = useState('');
  const [previewPlaylist, setPreviewPlaylist] = useState<PlaylistPreview | null>(null);
  const [previewVideos, setPreviewVideos] = useState<PlaylistPreviewVideo[]>([]);
  const [selecionadosPlaylist, setSelecionadosPlaylist] = useState<Set<string>>(new Set());
  const [proximaPaginaPlaylist, setProximaPaginaPlaylist] = useState<string | null>(null);
  const [processandoPlaylist, setProcessandoPlaylist] = useState(false);
  const [erroPlaylist, setErroPlaylist] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const [resultado, playlistsResultado] = await Promise.all([listarVideos(), listarPlaylistsVideos()]);
    if (resultado === null || playlistsResultado === null) setErro('Não foi possível carregar os vídeos ou playlists.');
    else {
      setVideos(resultado);
      setPlaylists(playlistsResultado);
      onTotalCarregado?.(resultado.length);
    }
    setCarregando(false);
  }

  useEffect(() => { void carregar(); }, []);
  useEffect(() => { if (gatilhoAdicionar > 0) { abrirNovo(); if (rascunhoImportacao) setForm((atual) => ({ ...atual, ...rascunhoImportacao })); } }, [gatilhoAdicionar, rascunhoImportacao]);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
    setArquivoCapa(null);
    setModalAberto(true);
  }

  function abrirEdicao(video: Video) {
    setEditandoUuid(video.uuid);
    setForm({
      titulo: video.titulo,
      url: video.url,
      youtube_id: video.youtube_id,
      canal: video.canal ?? '',
      duracao_segundos: video.duracao_segundos,
      capa_url: video.capa_url ?? '',
      capa_path: video.capa_path,
      assistido: video.assistido,
      favorito: video.favorito,
      nota: video.nota,
      comentario: video.comentario ?? '',
    });
    setArquivoCapa(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
  }

  function abrirImportacaoPlaylist() {
    setLinkPlaylist('');
    setPreviewPlaylist(null);
    setPreviewVideos([]);
    setSelecionadosPlaylist(new Set());
    setProximaPaginaPlaylist(null);
    setErroPlaylist(null);
    setModalPlaylistAberto(true);
  }

  function fecharImportacaoPlaylist() {
    if (processandoPlaylist) return;
    setModalPlaylistAberto(false);
  }

  async function buscarPlaylistPorLink(event: React.FormEvent) {
    event.preventDefault();
    if (!linkPlaylist.trim()) return;
    setProcessandoPlaylist(true);
    setErroPlaylist(null);
    setPreviewPlaylist(null);
    setPreviewVideos([]);
    setSelecionadosPlaylist(new Set());
    try {
      const query = new URLSearchParams({ url: linkPlaylist.trim() });
      const response = await fetch(`/api/integracoes/google/youtube/playlist-link?${query}`, { cache: 'no-store' });
      const body = await response.json() as {
        playlist?: PlaylistPreview;
        videos?: PlaylistPreviewVideo[];
        proximaPagina?: string | null;
        erro?: string;
      };
      if (!response.ok || !body.playlist) throw new Error(body.erro || 'Não foi possível consultar a playlist.');
      setPreviewPlaylist(body.playlist);
      setPreviewVideos(body.videos ?? []);
      setSelecionadosPlaylist(new Set((body.videos ?? []).map((video) => video.youtubeId)));
      setProximaPaginaPlaylist(body.proximaPagina ?? null);
    } catch (error) {
      setErroPlaylist(error instanceof Error ? error.message : 'Não foi possível consultar a playlist.');
    } finally {
      setProcessandoPlaylist(false);
    }
  }

  async function carregarMaisDaPlaylist() {
    if (!previewPlaylist || !proximaPaginaPlaylist) return;
    setProcessandoPlaylist(true);
    setErroPlaylist(null);
    try {
      const query = new URLSearchParams({ playlistId: previewPlaylist.id, pageToken: proximaPaginaPlaylist });
      const response = await fetch(`/api/integracoes/google/youtube/playlist-videos?${query}`, { cache: 'no-store' });
      const body = await response.json() as { videos?: PlaylistPreviewVideo[]; proximaPagina?: string | null; erro?: string };
      if (!response.ok) throw new Error(body.erro || 'Não foi possível carregar mais vídeos.');
      const novos = body.videos ?? [];
      setPreviewVideos((atuais) => [...atuais, ...novos]);
      setSelecionadosPlaylist((atuais) => new Set([...atuais, ...novos.map((video) => video.youtubeId)]));
      setProximaPaginaPlaylist(body.proximaPagina ?? null);
    } catch (error) {
      setErroPlaylist(error instanceof Error ? error.message : 'Não foi possível carregar mais vídeos.');
    } finally {
      setProcessandoPlaylist(false);
    }
  }

  function alternarVideoPlaylist(youtubeId: string) {
    setSelecionadosPlaylist((atuais) => {
      const proximo = new Set(atuais);
      if (proximo.has(youtubeId)) proximo.delete(youtubeId);
      else proximo.add(youtubeId);
      return proximo;
    });
  }

  async function importarPlaylist() {
    if (!previewPlaylist || selecionadosPlaylist.size === 0) return;
    setProcessandoPlaylist(true);
    setErroPlaylist(null);
    let criados = 0;
    let duplicados = 0;
    let indisponiveis = 0;
    try {
      const ids = [...selecionadosPlaylist];
      for (let inicio = 0; inicio < ids.length; inicio += 50) {
        const response = await fetch('/api/integracoes/google/youtube/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtubeIds: ids.slice(inicio, inicio + 50),
            playlist: {
              youtubePlaylistId: previewPlaylist.id,
              nome: previewPlaylist.titulo,
              origem: 'youtube_link',
              origemUrl: previewPlaylist.origemUrl,
            },
          }),
        });
        const body = await response.json() as { criados?: number; duplicados?: number; indisponiveis?: number; erro?: string };
        if (!response.ok) throw new Error(body.erro || 'Não foi possível importar a playlist.');
        criados += body.criados ?? 0;
        duplicados += body.duplicados ?? 0;
        indisponiveis += body.indisponiveis ?? 0;
      }
      setMensagem(`${criados} vídeo(s) novo(s), ${duplicados} duplicado(s) vinculados e ${indisponiveis} indisponível(is).`);
      setModalPlaylistAberto(false);
      await carregar();
    } catch (error) {
      setErroPlaylist(error instanceof Error ? error.message : 'Não foi possível importar a playlist.');
    } finally {
      setProcessandoPlaylist(false);
    }
  }

  function abrirPlaylist(playlist: VideoPlaylist) {
    setPlaylistAberta(playlist);
  }

  async function abrirVinculoCurso(video: Video) {
    setPainelVideo(null);
    setVideoParaCurso(video);
    setCursoUuid('');
    setModuloUuid('');
    setNovoModuloNome('');
    setModulosCurso([]);
    setErroVinculo(null);
    const resultado = await listarMaterias('curso');
    if (resultado === null) setErroVinculo('Não foi possível carregar os cursos.');
    else setCursos(resultado);
  }

  function fecharVinculoCurso() {
    setVideoParaCurso(null);
    setErroVinculo(null);
  }

  async function selecionarCurso(uuid: string) {
    setCursoUuid(uuid);
    setModuloUuid('');
    setNovoModuloNome('');
    setErroVinculo(null);
    if (!uuid) {
      setModulosCurso([]);
      return;
    }
    const resultado = await listarModulosCurso(uuid);
    if (resultado === null) setErroVinculo('Não foi possível carregar os módulos do curso.');
    else setModulosCurso(resultado);
  }

  async function vincularAoCurso(event: React.FormEvent) {
    event.preventDefault();
    if (!videoParaCurso || !cursoUuid || (!moduloUuid && !novoModuloNome.trim())) return;

    setVinculando(true);
    setErroVinculo(null);

    const existente = await buscarConteudoDeVideoNoCurso(videoParaCurso.uuid, cursoUuid);
    if (existente === undefined) {
      setErroVinculo('Não foi possível verificar os conteúdos atuais do curso.');
      setVinculando(false);
      return;
    }
    if (existente) {
      setErroVinculo('Este vídeo já está vinculado a uma aula desse curso.');
      setVinculando(false);
      return;
    }

    let destinoUuid = moduloUuid;
    if (!destinoUuid) {
      const modulo = await criarModuloCurso({
        materia_uuid: cursoUuid,
        nome: novoModuloNome.trim(),
        ordem: modulosCurso.length,
      });
      if (!modulo) {
        setErroVinculo('Não foi possível criar o módulo do curso.');
        setVinculando(false);
        return;
      }
      destinoUuid = modulo.uuid;
    }

    const conteudo = await criarConteudo(
      {
        nome: videoParaCurso.titulo,
        teoria_vista: false,
        dominado_manual: false,
        revisao_uuid: null,
        modulo_curso_uuid: destinoUuid,
        video_uuid: videoParaCurso.uuid,
      },
      [cursoUuid],
    );

    if (!conteudo) setErroVinculo('Não foi possível adicionar o vídeo ao curso.');
    else {
      setMensagem(`“${videoParaCurso.titulo}” foi adicionado ao curso.`);
      fecharVinculoCurso();
    }
    setVinculando(false);
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) return;
    setSalvando(true);
    const atual = editandoUuid ? videos.find((video) => video.uuid === editandoUuid) : null;
    const persistencia = await persistirComCapa({ categoria: 'videos', arquivo: arquivoCapa, capaPathAtual: atual?.capa_path, persistir: (capaPath) => {
      const dados = capaPath ? { ...form, capa_path: capaPath } : form;
      return editandoUuid ? atualizarVideo(editandoUuid, dados) : criarVideo(dados);
    }});
    const resultado = persistencia.resultado;
    if (!resultado) setErro(persistencia.erro ?? 'Não foi possível salvar o vídeo.');
    else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!videoParaApagar) return;
    const removido = videos.find((item) => item.uuid === videoParaApagar);
    const ok = await apagarVideo(videoParaApagar);
    if (!ok) setErro('Não foi possível apagar o vídeo.');
    else {
      if (removido) await removerArquivosBiblioteca([removido.capa_path]);
      await carregar();
    }
  }

  async function alternarFavorito(video: Video) {
    const atualizado = await atualizarVideo(video.uuid, {
      titulo: video.titulo,
      url: video.url,
      capa_url: video.capa_url,
      favorito: !video.favorito,
    });
    if (!atualizado) {
      setErro('Não foi possível atualizar o favorito.');
      return;
    }
    setVideos((atuais) => atuais.map((item) => item.uuid === atualizado.uuid ? atualizado : item));
    setPainelVideo((atual) => atual?.uuid === atualizado.uuid ? atualizado : atual);
  }

  function montarInfo(video: Video): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (video.canal) campos.push({ label: 'Canal', valor: video.canal });
    campos.push({ label: 'Status', valor: video.assistido ? 'Assistido' : 'Não assistido' });
    if (video.duracao_segundos) campos.push({ label: 'Duração', valor: formatarDuracao(video.duracao_segundos) });
    if (video.nota != null) campos.push({ label: 'Nota', valor: `${video.nota} / 5` });
    if (video.comentario) campos.push({ label: 'Comentário', valor: video.comentario });
    return campos;
  }

  const filtrados = busca
    ? videos.filter((video) => [video.titulo, video.canal].some((valor) => valor?.toLowerCase().includes(busca.toLowerCase())))
    : videos;
  const ordenados = ordenarItensBiblioteca(filtrados, ordenacao, {
    titulo: (video) => video.titulo,
    atualizadoEm: (video) => video.updated_at,
    nota: (video) => video.nota,
    favorito: (video) => video.favorito,
    status: (video) => (video.assistido ? 'assistido' : 'nao_assistido'),
  });

  return (
    <>
      <BibliotecaBanner
        titulo="Vídeos"
        total={videos.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo vídeo"
        capas={videos.map((video) => video.capa_url)}
        ordenacao={ordenacao}
        onOrdenacaoChange={onOrdenacaoChange}
      />
      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}
        {mensagem && <p className={styles.sucesso}>{mensagem}</p>}
        <section className={styles.playlistsSection} aria-labelledby="videos-playlists-title">
          <div className={styles.playlistsHeader}>
            <div>
              <h2 id="videos-playlists-title">Playlists importadas</h2>
              <p>Organize vídeos importados sem retirar os itens da Biblioteca.</p>
            </div>
            <button type="button" className={styles.btnPrimario} onClick={abrirImportacaoPlaylist}>Importar playlist por link</button>
          </div>
          {playlists.length > 0 ? <div className={styles.playlistsGrid}>{playlists.map((playlist) => (
            <button type="button" key={playlist.uuid} className={styles.playlistCard} onClick={() => void abrirPlaylist(playlist)}>
              <strong>{playlist.nome}</strong>
              <span>{playlist.origem === 'youtube_link' ? 'Link do YouTube' : 'Conta conectada'} · {playlist.quantidade_videos} vídeo(s)</span>
              <small>Atualizada em {new Date(playlist.updated_at).toLocaleDateString('pt-BR')}</small>
            </button>
          ))}</div> : <p className={styles.playlistsVazio}>Nenhuma playlist importada ainda.</p>}
          <p className={styles.playlistLimitacao}>“Assistir mais tarde” pode não ser acessível pela API oficial do YouTube; isso não é falha do Sistema Pessoal.</p>
        </section>
        {carregando ? <p className={styles.vazio}>Carregando...</p> : ordenados.length === 0 ? (
          <div className={styles.vazio}>
            <p>{busca ? 'Nenhum vídeo encontrado para esta busca.' : 'Nenhum vídeo cadastrado ainda.'}</p>
            {!busca && <button className={styles.btnPrimario} onClick={abrirNovo}>Adicionar o primeiro</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {ordenados.map((video) => (
              <BibliotecaCard
                key={video.uuid}
                titulo={video.titulo}
                capaUrl={video.capa_url}
                capaPath={video.capa_path}
                favorito={video.favorito}
                nota={video.nota}
                ano={null}
                generos={video.canal ? [{ nome: video.canal }] : []}
                status={video.assistido ? 'Assistido' : 'Não assistido'}
                detalhe={video.duracao_segundos ? formatarDuracao(video.duracao_segundos) : null}
                placeholder="▶"
                onClick={() => setPainelVideo(video)}
                onEditar={() => abrirEdicao(video)}
                onAlternarFavorito={() => void alternarFavorito(video)}
                onApagar={() => setVideoParaApagar(video.uuid)}
                menuAberto={menuAbertoUuid === video.uuid}
                onAlternarMenu={() => setMenuAbertoUuid(menuAbertoUuid === video.uuid ? null : video.uuid)}
              />
            ))}
          </div>
        )}
      </div>

      {modalPlaylistAberto && (
        <div className={styles.modalOverlay} onClick={fecharImportacaoPlaylist}>
          <div className={`${styles.modal} ${styles.modalPlaylist}`} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Importar playlist por link</h2>
              <button type="button" className={styles.btnIcon} onClick={fecharImportacaoPlaylist}>×</button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={buscarPlaylistPorLink} className={styles.playlistBusca}>
                <label>Link da playlist<input type="url" required placeholder="https://www.youtube.com/playlist?list=..." value={linkPlaylist} onChange={(event) => setLinkPlaylist(event.target.value)} /></label>
                <button type="submit" className={styles.btnPrimario} disabled={processandoPlaylist}>{processandoPlaylist ? 'Consultando...' : 'Buscar playlist'}</button>
              </form>
              {erroPlaylist && <p className={styles.erro}>{erroPlaylist}</p>}
              {previewPlaylist && <div className={styles.playlistPreview}>
                <div>
                  <strong>{previewPlaylist.titulo}</strong>
                  <span>{previewPlaylist.quantidade} vídeo(s) informados pelo YouTube</span>
                </div>
                {previewVideos.length > 0 ? <div className={styles.playlistVideosPreview}>{previewVideos.map((video) => (
                  <label key={video.youtubeId} className={styles.playlistVideoOpcao}>
                    <input type="checkbox" checked={selecionadosPlaylist.has(video.youtubeId)} onChange={() => alternarVideoPlaylist(video.youtubeId)} />
                    <span><strong>{video.titulo}</strong><small>{video.canal ?? video.youtubeId}</small></span>
                  </label>
                ))}</div> : <p className={styles.playlistsVazio}>Nenhum vídeo importável foi retornado.</p>}
                <div className={styles.modalFooter}>
                  {proximaPaginaPlaylist && <button type="button" className={styles.btnGhost} disabled={processandoPlaylist} onClick={() => void carregarMaisDaPlaylist()}>Carregar mais</button>}
                  <button type="button" className={styles.btnPrimario} disabled={processandoPlaylist || selecionadosPlaylist.size === 0} onClick={() => void importarPlaylist()}>Importar {selecionadosPlaylist.size} vídeo(s)</button>
                </div>
              </div>}
            </div>
          </div>
        </div>
      )}

      {playlistAberta && <PainelPlaylist key={playlistAberta.uuid} playlist={playlistAberta}
        onFechar={() => setPlaylistAberta(null)}
        onAbrirVideo={(video) => { setPlaylistAberta(null); setPainelVideo(video); }} />}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar vídeo' : 'Novo vídeo'}</h2>
              <button type="button" className={styles.btnIcon} onClick={fecharModal}>×</button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <label>Título *<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
              <label>URL *<input required type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} /></label>
              <BuscaMetadados
                fonte="youtube"
                termo={form.url.trim() || form.titulo}
                onSelect={(resultado) => setForm((atual) => ({
                  ...atual,
                  titulo: resultado.titulo,
                  url: resultado.linkOficial ?? atual.url,
                  youtube_id: resultado.identificadorExterno ?? atual.youtube_id,
                  canal: resultado.autor ?? atual.canal,
                  duracao_segundos: resultado.duracaoSegundos ?? atual.duracao_segundos,
                  capa_url: resultado.capaUrl ?? atual.capa_url,
                }))}
              />
              <label>Canal<input value={form.canal ?? ''} onChange={(event) => setForm({ ...form, canal: event.target.value })} /></label>
              <label>Duração em segundos<input type="number" min={1} inputMode="numeric" value={form.duracao_segundos ?? ''} onChange={(event) => setForm({ ...form, duracao_segundos: event.target.value === '' ? null : Number(event.target.value) })} /></label>
              <label>URL da capa<input type="url" value={form.capa_url ?? ''} onChange={(event) => setForm({ ...form, capa_url: event.target.value })} /></label>
              <CapaUploadField arquivo={arquivoCapa} onChange={setArquivoCapa} />
              <StarRating value={form.nota} onChange={(nota) => setForm({ ...form, nota })} />
              <label className={styles.checkboxLabel}><input type="checkbox" checked={form.assistido ?? false} onChange={(event) => setForm({ ...form, assistido: event.target.checked })} />Assistido</label>
              <label className={styles.checkboxLabel}><input type="checkbox" checked={form.favorito ?? false} onChange={(event) => setForm({ ...form, favorito: event.target.checked })} />Favorito</label>
              <label>Comentário<textarea rows={3} value={form.comentario ?? ''} onChange={(event) => setForm({ ...form, comentario: event.target.value })} /></label>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost} onClick={fecharModal}>Cancelar</button>
                <button type="submit" className={styles.btnPrimario} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {videoParaCurso && (
        <div className={styles.modalOverlay} onClick={fecharVinculoCurso}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Usar em Curso</h2>
              <button type="button" className={styles.btnIcon} onClick={fecharVinculoCurso}>×</button>
            </div>
            <form onSubmit={vincularAoCurso} className={styles.modalBody}>
              <p className={styles.modalDescricao}>
                Crie uma aula vinculada ao vídeo “{videoParaCurso.titulo}”.
              </p>
              {erroVinculo && <p className={styles.erro}>{erroVinculo}</p>}
              <label>
                Curso *
                <select required value={cursoUuid} onChange={(event) => void selecionarCurso(event.target.value)}>
                  <option value="">Selecione um curso</option>
                  {cursos.map((curso) => <option key={curso.uuid} value={curso.uuid}>{curso.nome}</option>)}
                </select>
              </label>
              <label>
                Módulo existente
                <select
                  value={moduloUuid}
                  disabled={!cursoUuid}
                  onChange={(event) => {
                    setModuloUuid(event.target.value);
                    if (event.target.value) setNovoModuloNome('');
                  }}
                >
                  <option value="">Selecione ou crie abaixo</option>
                  {modulosCurso.map((modulo) => <option key={modulo.uuid} value={modulo.uuid}>{modulo.nome}</option>)}
                </select>
              </label>
              <label>
                Novo módulo
                <input
                  value={novoModuloNome}
                  disabled={!cursoUuid}
                  placeholder="Ex: Fundamentos"
                  onChange={(event) => {
                    setNovoModuloNome(event.target.value);
                    if (event.target.value) setModuloUuid('');
                  }}
                />
              </label>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost} onClick={fecharVinculoCurso}>Cancelar</button>
                <button
                  type="submit"
                  className={styles.btnPrimario}
                  disabled={vinculando || !cursoUuid || (!moduloUuid && !novoModuloNome.trim())}
                >
                  {vinculando ? 'Adicionando...' : 'Criar aula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={videoParaApagar !== null}
        title="Apagar vídeo?"
        description="O vídeo deixará de aparecer na Biblioteca."
        confirmLabel="Apagar"
        onOpenChange={(open) => { if (!open) setVideoParaApagar(null); }}
        onConfirm={confirmarExclusao}
      />

      {painelVideo && (
        <PainelSimples
          aberto
          onFechar={() => setPainelVideo(null)}
          onEditar={() => abrirEdicao(painelVideo)}
          favorito={painelVideo.favorito}
          tipoObra="video"
          obraUuid={painelVideo.uuid}
          capaPath={painelVideo.capa_path}
          titulo={painelVideo.titulo}
          capaUrl={painelVideo.capa_url}
          infoGeral={montarInfo(painelVideo)}
          linkUrl={painelVideo.url}
          linkLabel="Assistir vídeo"
        >
          <button
            type="button"
            className={painelStyles.btnSecundario}
            onClick={() => void abrirVinculoCurso(painelVideo)}
          >
            Usar em Curso
          </button>
        </PainelSimples>
      )}
    </>
  );
}
