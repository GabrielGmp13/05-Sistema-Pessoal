'use client';

import { useEffect, useState } from 'react';
import PainelSimples from '@/components/PainelSimples';
import type { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  apagarArtigo,
  atualizarArtigo,
  criarArtigo,
  listarArtigos,
  type Artigo,
  type ArtigoInput,
} from '@/lib/artigos';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import { ordenarItensBiblioteca, type OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import styles from './BibliotecaSection.module.css';

const FORM_VAZIO: ArtigoInput = {
  titulo: '',
  url: '',
  autor: '',
  site_origem: '',
  favorito: false,
  comentario: '',
};

interface Props {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
}

function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

export default function ArtigosSection({
  gatilhoAdicionar,
  busca = '',
  onTotalCarregado,
  ordenacao,
  onOrdenacaoChange,
}: Props) {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<ArtigoInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelArtigo, setPainelArtigo] = useState<Artigo | null>(null);
  const [artigoParaApagar, setArtigoParaApagar] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarArtigos();
    if (resultado === null) setErro('Não foi possível carregar os artigos.');
    else {
      setArtigos(resultado);
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

  function abrirEdicao(artigo: Artigo) {
    setEditandoUuid(artigo.uuid);
    setForm({
      titulo: artigo.titulo,
      url: artigo.url,
      autor: artigo.autor ?? '',
      site_origem: artigo.site_origem ?? '',
      data_leitura: artigo.data_leitura,
      tempo_leitura_minutos: artigo.tempo_leitura_minutos,
      favorito: artigo.favorito,
      comentario: artigo.comentario ?? '',
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) return;
    setSalvando(true);
    const resultado = editandoUuid
      ? await atualizarArtigo(editandoUuid, form)
      : await criarArtigo(form);
    if (!resultado) setErro('Não foi possível salvar o artigo.');
    else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!artigoParaApagar) return;
    const ok = await apagarArtigo(artigoParaApagar);
    if (!ok) setErro('Não foi possível apagar o artigo.');
    else await carregar();
  }

  async function alternarFavorito(artigo: Artigo) {
    const atualizado = await atualizarArtigo(artigo.uuid, {
      titulo: artigo.titulo,
      url: artigo.url,
      favorito: !artigo.favorito,
    });
    if (!atualizado) {
      setErro('Não foi possível atualizar o favorito.');
      return;
    }
    setArtigos((atuais) => atuais.map((item) => item.uuid === atualizado.uuid ? atualizado : item));
    setPainelArtigo((atual) => atual?.uuid === atualizado.uuid ? atualizado : atual);
  }

  function montarInfo(artigo: Artigo): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (artigo.autor) campos.push({ label: 'Autor', valor: artigo.autor });
    if (artigo.site_origem) campos.push({ label: 'Site', valor: artigo.site_origem });
    campos.push({ label: 'Status', valor: artigo.data_leitura ? 'Lido' : 'Não lido' });
    if (artigo.data_leitura) campos.push({ label: 'Leitura', valor: formatarData(artigo.data_leitura) });
    if (artigo.tempo_leitura_minutos) campos.push({ label: 'Tempo', valor: `${artigo.tempo_leitura_minutos} min` });
    if (artigo.comentario) campos.push({ label: 'Comentário', valor: artigo.comentario });
    return campos;
  }

  const filtrados = busca
    ? artigos.filter((artigo) => [artigo.titulo, artigo.autor, artigo.site_origem].some((valor) => valor?.toLowerCase().includes(busca.toLowerCase())))
    : artigos;
  const ordenados = ordenarItensBiblioteca(filtrados, ordenacao, {
    titulo: (artigo) => artigo.titulo,
    atualizadoEm: (artigo) => artigo.updated_at,
    favorito: (artigo) => artigo.favorito,
    status: (artigo) => (artigo.data_leitura ? 'lido' : 'nao_lido'),
  });

  return (
    <>
      <BibliotecaBanner
        titulo="Artigos"
        total={artigos.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo artigo"
        ordenacao={ordenacao}
        onOrdenacaoChange={onOrdenacaoChange}
        notaDisponivel={false}
      />
      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}
        {carregando ? <p className={styles.vazio}>Carregando...</p> : ordenados.length === 0 ? (
          <div className={styles.vazio}>
            <p>{busca ? 'Nenhum artigo encontrado para esta busca.' : 'Nenhum artigo cadastrado ainda.'}</p>
            {!busca && <button className={styles.btnPrimario} onClick={abrirNovo}>Adicionar o primeiro</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {ordenados.map((artigo) => (
              <BibliotecaCard
                key={artigo.uuid}
                titulo={artigo.titulo}
                capaUrl={null}
                favorito={artigo.favorito}
                nota={null}
                ano={artigo.data_leitura ? Number(artigo.data_leitura.slice(0, 4)) : null}
                generos={artigo.site_origem ? [{ nome: artigo.site_origem }] : []}
                status={artigo.data_leitura ? 'Lido' : 'Para ler'}
                detalhe={artigo.tempo_leitura_minutos ? `${artigo.tempo_leitura_minutos} min` : null}
                placeholder="Aa"
                onClick={() => setPainelArtigo(artigo)}
                onEditar={() => abrirEdicao(artigo)}
                onAlternarFavorito={() => void alternarFavorito(artigo)}
                onApagar={() => setArtigoParaApagar(artigo.uuid)}
                menuAberto={menuAbertoUuid === artigo.uuid}
                onAlternarMenu={() => setMenuAbertoUuid(menuAbertoUuid === artigo.uuid ? null : artigo.uuid)}
              />
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar artigo' : 'Novo artigo'}</h2>
              <button type="button" className={styles.btnIcon} onClick={fecharModal}>×</button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <label>Título *<input required value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} /></label>
              <label>URL *<input required type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} /></label>
              <label>Autor<input value={form.autor ?? ''} onChange={(event) => setForm({ ...form, autor: event.target.value })} /></label>
              <label>Site de origem<input value={form.site_origem ?? ''} onChange={(event) => setForm({ ...form, site_origem: event.target.value })} /></label>
              <label>Data da leitura<input type="date" value={form.data_leitura ?? ''} onChange={(event) => setForm({ ...form, data_leitura: event.target.value || null })} /></label>
              <label>Tempo de leitura em minutos<input type="number" min={1} inputMode="numeric" value={form.tempo_leitura_minutos ?? ''} onChange={(event) => setForm({ ...form, tempo_leitura_minutos: event.target.value === '' ? null : Number(event.target.value) })} /></label>
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

      <ConfirmDialog
        open={artigoParaApagar !== null}
        title="Apagar artigo?"
        description="O artigo deixará de aparecer na Biblioteca."
        confirmLabel="Apagar"
        onOpenChange={(open) => { if (!open) setArtigoParaApagar(null); }}
        onConfirm={confirmarExclusao}
      />

      {painelArtigo && (
        <PainelSimples
          aberto
          onFechar={() => setPainelArtigo(null)}
          titulo={painelArtigo.titulo}
          infoGeral={montarInfo(painelArtigo)}
          linkUrl={painelArtigo.url}
          linkLabel="Ler artigo"
        />
      )}
    </>
  );
}
