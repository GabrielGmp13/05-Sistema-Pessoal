'use client';

import { useEffect, useState } from 'react';
import PainelSimples from '@/components/PainelSimples';
import type { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import styles from './BibliotecaSection.module.css';

const FORM_VAZIO: VideoInput = {
  titulo: '',
  url: '',
  canal: '',
  capa_url: '',
  assistido: false,
  favorito: false,
  comentario: '',
};

interface Props {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
}

function formatarDuracao(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restante = segundos % 60;
  return horas > 0
    ? `${horas}h ${minutos.toString().padStart(2, '0')}min`
    : `${minutos}:${restante.toString().padStart(2, '0')}`;
}

export default function VideosSection({ gatilhoAdicionar, busca = '', onTotalCarregado }: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<VideoInput>(FORM_VAZIO);
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

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarVideos();
    if (resultado === null) setErro('Não foi possível carregar os vídeos.');
    else {
      setVideos(resultado);
      onTotalCarregado?.(resultado.length);
    }
    setCarregando(false);
  }

  useEffect(() => { void carregar(); }, []);
  useEffect(() => { if (gatilhoAdicionar > 0) abrirNovo(); }, [gatilhoAdicionar]);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
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
      assistido: video.assistido,
      favorito: video.favorito,
      nota: video.nota,
      comentario: video.comentario ?? '',
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
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
    const resultado = editandoUuid
      ? await atualizarVideo(editandoUuid, form)
      : await criarVideo(form);
    if (!resultado) setErro('Não foi possível salvar o vídeo.');
    else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!videoParaApagar) return;
    const ok = await apagarVideo(videoParaApagar);
    if (!ok) setErro('Não foi possível apagar o vídeo.');
    else await carregar();
  }

  function montarInfo(video: Video): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (video.canal) campos.push({ label: 'Canal', valor: video.canal });
    campos.push({ label: 'Status', valor: video.assistido ? 'Assistido' : 'Não assistido' });
    if (video.duracao_segundos) campos.push({ label: 'Duração', valor: formatarDuracao(video.duracao_segundos) });
    if (video.nota != null) campos.push({ label: 'Nota', valor: `${video.nota} / 10` });
    if (video.comentario) campos.push({ label: 'Comentário', valor: video.comentario });
    return campos;
  }

  const filtrados = busca
    ? videos.filter((video) => [video.titulo, video.canal].some((valor) => valor?.toLowerCase().includes(busca.toLowerCase())))
    : videos;

  return (
    <>
      <BibliotecaBanner
        titulo="Vídeos"
        total={videos.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo vídeo"
        capas={videos.map((video) => video.capa_url)}
      />
      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}
        {mensagem && <p className={styles.sucesso}>{mensagem}</p>}
        {carregando ? <p className={styles.vazio}>Carregando...</p> : filtrados.length === 0 ? (
          <div className={styles.vazio}>
            <p>{busca ? 'Nenhum vídeo encontrado para esta busca.' : 'Nenhum vídeo cadastrado ainda.'}</p>
            {!busca && <button className={styles.btnPrimario} onClick={abrirNovo}>Adicionar o primeiro</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtrados.map((video) => (
              <BibliotecaCard
                key={video.uuid}
                titulo={video.titulo}
                capaUrl={video.capa_url}
                favorito={video.favorito}
                nota={video.nota}
                ano={null}
                generos={video.canal ? [{ nome: video.canal }] : []}
                placeholder="▶"
                onClick={() => setPainelVideo(video)}
                onEditar={() => abrirEdicao(video)}
                onApagar={() => setVideoParaApagar(video.uuid)}
                menuAberto={menuAbertoUuid === video.uuid}
                onAlternarMenu={() => setMenuAbertoUuid(menuAbertoUuid === video.uuid ? null : video.uuid)}
              />
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar vídeo' : 'Novo vídeo'}</h2>
              <button type="button" className={styles.btnIcon} onClick={fecharModal}>×</button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <BuscaMetadados
                fonte="youtube"
                termoInicial={form.url}
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
              <label>Título *<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
              <label>URL *<input required type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} /></label>
              <label>Canal<input value={form.canal ?? ''} onChange={(event) => setForm({ ...form, canal: event.target.value })} /></label>
              <label>Duração em segundos<input type="number" min={1} inputMode="numeric" value={form.duracao_segundos ?? ''} onChange={(event) => setForm({ ...form, duracao_segundos: event.target.value === '' ? null : Number(event.target.value) })} /></label>
              <label>URL da capa<input type="url" value={form.capa_url ?? ''} onChange={(event) => setForm({ ...form, capa_url: event.target.value })} /></label>
              <label>Nota (0 a 10)<input type="number" min={0} max={10} step={0.5} inputMode="decimal" value={form.nota ?? ''} onChange={(event) => setForm({ ...form, nota: event.target.value === '' ? null : Number(event.target.value) })} /></label>
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
          titulo={painelVideo.titulo}
          capaUrl={painelVideo.capa_url}
          infoGeral={montarInfo(painelVideo)}
          linkUrl={painelVideo.url}
          linkLabel="Assistir vídeo"
        >
          <button
            type="button"
            className={styles.btnPrimario}
            onClick={() => void abrirVinculoCurso(painelVideo)}
          >
            Usar em Curso
          </button>
        </PainelSimples>
      )}
    </>
  );
}
