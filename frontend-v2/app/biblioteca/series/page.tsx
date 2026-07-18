'use client';

import { useEffect, useState } from 'react';
import {
  Serie,
  SerieInput,
  listarSeries,
  criarSerie,
  atualizarSerie,
  apagarSerie,
} from '@/lib/series';
import PainelDetalheObra, { CampoInfo } from '@/components/PainelDetalheObra';
import ElencoEditor from '@/components/ElencoEditor';
import TrilhaSonoraEditor from '@/components/TrilhaSonoraEditor';
import TemporadasEditor from '@/components/TemporadasEditor';
import styles from './page.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ver: 'Quero ver',
  assistindo: 'Assistindo',
  assistido: 'Assistido',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

const FORM_VAZIO: SerieInput = {
  titulo: '',
  diretor: '',
  status: 'quero_ver',
  comentario: '',
  roteirista: '',
  produtores: '',
  estudio: '',
  distribuidora: '',
};

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<SerieInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelSerie, setPainelSerie] = useState<Serie | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarSeries();
    if (resultado === null) {
      setErro('Não foi possível carregar as séries.');
    } else {
      setSeries(resultado);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(serie: Serie) {
    setEditandoUuid(serie.uuid);
    setForm({
      titulo: serie.titulo,
      diretor: serie.diretor ?? '',
      status: serie.status,
      comentario: serie.comentario ?? '',
      nota: serie.nota ?? undefined,
      temporada_atual: serie.temporada_atual,
      episodio_atual: serie.episodio_atual,
      roteirista: serie.roteirista ?? '',
      produtores: serie.produtores ?? '',
      estudio: serie.estudio ?? '',
      distribuidora: serie.distribuidora ?? '',
      ano_lancamento: serie.ano_lancamento ?? undefined,
      ano_termino: serie.ano_termino ?? undefined,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim()) return;

    setSalvando(true);
    const resultado = editandoUuid
      ? await atualizarSerie(editandoUuid, form)
      : await criarSerie(form);

    if (resultado === null) {
      setErro('Não foi possível salvar a série.');
    } else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  function montarInfoGeral(serie: Serie): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (serie.diretor) campos.push({ label: 'Criação', valor: serie.diretor });
    if (serie.ano_lancamento) {
      const periodo = serie.ano_termino
        ? `${serie.ano_lancamento}–${serie.ano_termino}`
        : `${serie.ano_lancamento}–presente`;
      campos.push({ label: 'Período', valor: periodo });
    }
    campos.push({ label: 'Status', valor: STATUS_LABEL[serie.status] ?? serie.status });
    campos.push({
      label: 'Progresso',
      valor: `T${serie.temporada_atual} · Ep ${serie.episodio_atual}`,
    });
    if (serie.nota != null) campos.push({ label: 'Nota', valor: `${serie.nota} / 5` });
    if (serie.roteirista) campos.push({ label: 'Roteiro', valor: serie.roteirista });
    if (serie.produtores) campos.push({ label: 'Produção', valor: serie.produtores });
    if (serie.estudio) campos.push({ label: 'Estúdio', valor: serie.estudio });
    if (serie.distribuidora)
      campos.push({ label: 'Distribuidora', valor: serie.distribuidora });
    if (serie.comentario) campos.push({ label: 'Comentário', valor: serie.comentario });
    return campos;
  }

  async function confirmarExclusao(uuid: string) {
    if (!confirm('Apagar esta série?')) return;
    // TODO(BACKLOG): trocar confirm() nativo por modal .open
    const ok = await apagarSerie(uuid);
    if (!ok) {
      setErro('Não foi possível apagar a série.');
    } else {
      await carregar();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Séries</h1>
        <button className={styles.btnPrimario} onClick={abrirNovo}>
          + Nova série
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : series.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma série cadastrada ainda.</p>
          <button className={styles.btnPrimario} onClick={abrirNovo}>
            Adicionar a primeira
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {series.map((serie) => (
            <div key={serie.uuid} className={styles.card}>
              <div className={styles.cardClicavel} onClick={() => setPainelSerie(serie)}>
                <div className={styles.cardHeader}>
                  <h3>{serie.titulo}</h3>
                </div>
                {serie.diretor && <p className={styles.meta}>Criação: {serie.diretor}</p>}
                <p className={styles.badge}>{STATUS_LABEL[serie.status] ?? serie.status}</p>
                <p className={styles.meta}>
                  T{serie.temporada_atual} · Ep {serie.episodio_atual}
                </p>
              </div>

              <div className={styles.menuWrapper}>
                <button
                  className={styles.btnIcon}
                  onClick={() =>
                    setMenuAbertoUuid(menuAbertoUuid === serie.uuid ? null : serie.uuid)
                  }
                  title="Ações"
                >
                  ⋯
                </button>
                {menuAbertoUuid === serie.uuid && (
                  <div className={styles.menuDropdown}>
                    <button
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        abrirEdicao(serie);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.menuItemPerigo}
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        confirmarExclusao(serie.uuid);
                      }}
                    >
                      Apagar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar série' : 'Nova série'}</h2>
              <button className={styles.btnIcon} onClick={fecharModal}>
                ✕
              </button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <label>
                Título *
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>
              <label>
                Criação
                <input
                  value={form.diretor ?? ''}
                  onChange={(e) => setForm({ ...form, diretor: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status ?? 'quero_ver'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as SerieInput['status'] })
                  }
                >
                  <option value="quero_ver">Quero ver</option>
                  <option value="assistindo">Assistindo</option>
                  <option value="assistido">Assistido</option>
                  <option value="pausado">Pausado</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <label>
                Temporada atual
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.temporada_atual ?? 1}
                  onChange={(e) =>
                    setForm({ ...form, temporada_atual: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Episódio atual
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.episodio_atual ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, episodio_atual: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Nota (0 a 5, meia estrela)
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  inputMode="decimal"
                  value={form.nota ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nota: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Ano de lançamento
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_lancamento ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_lancamento:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Ano de término (vazio = em andamento)
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_termino ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_termino:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Roteirista
                <input
                  value={form.roteirista ?? ''}
                  onChange={(e) => setForm({ ...form, roteirista: e.target.value })}
                />
              </label>
              <label>
                Produtores
                <input
                  value={form.produtores ?? ''}
                  onChange={(e) => setForm({ ...form, produtores: e.target.value })}
                />
              </label>
              <label>
                Estúdio
                <input
                  value={form.estudio ?? ''}
                  onChange={(e) => setForm({ ...form, estudio: e.target.value })}
                />
              </label>
              <label>
                Distribuidora
                <input
                  value={form.distribuidora ?? ''}
                  onChange={(e) => setForm({ ...form, distribuidora: e.target.value })}
                />
              </label>
              <label>
                Comentário
                <textarea
                  value={form.comentario ?? ''}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  rows={3}
                />
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost} onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimario} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>

            {editandoUuid && (
              <div className={styles.modalBody}>
                <TemporadasEditor serieUuid={editandoUuid} />
                <ElencoEditor tipoObra="serie" obraUuid={editandoUuid} />
                <TrilhaSonoraEditor tipoObra="serie" obraUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      {painelSerie && (
        <PainelDetalheObra
          aberto={!!painelSerie}
          onFechar={() => setPainelSerie(null)}
          tipoObra="serie"
          obraUuid={painelSerie.uuid}
          titulo={painelSerie.titulo}
          bannerUrl={painelSerie.banner_url}
          capaUrl={painelSerie.capa_url}
          infoGeral={montarInfoGeral(painelSerie)}
        />
      )}
    </div>
  );
}