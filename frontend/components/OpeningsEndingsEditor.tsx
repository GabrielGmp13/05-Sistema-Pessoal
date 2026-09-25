'use client';

import { useEffect, useState } from 'react';
import {
  listarOpeningsEndings,
  criarOpeningEnding,
  atualizarOpeningEnding,
  apagarOpeningEnding,
  OpeningEnding,
  TipoOpeningEnding,
} from '@/lib/openings-endings';
import styles from './ListaEditavel.module.css';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { validarCamposLista } from '@/lib/editor-lista';
import BuscaMetadados from '@/app/biblioteca/_components/BuscaMetadados';

interface Props {
  animeUuid: string;
}

const VAZIO = { tipo: 'opening' as TipoOpeningEnding, nome: '', artista: '', link_video: '' };

export default function OpeningsEndingsEditor({ animeUuid }: Props) {
  const [itens, setItens] = useState<OpeningEnding[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [exclusao, setExclusao] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const res = await listarOpeningsEndings(animeUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    let ativo = true;
    void listarOpeningsEndings(animeUuid).then((res) => {
      if (!ativo) return;
      setItens(res ?? []);
      setCarregando(false);
    });
    return () => { ativo = false; };
  }, [animeUuid]);

  async function adicionar() {
    if (salvando) return;
    const falha = validarCamposLista([{ chave: 'nome', rotulo: 'Nome', obrigatorio: true }, { chave: 'link_video', rotulo: 'Link', url: true }], novo);
    if (falha) { setErro(falha); return; }
    setSalvando(true);
    setErro('');
    try {
    const dados = {
      tipo: novo.tipo,
      nome: novo.nome.trim(),
      artista: novo.artista.trim() || null,
      link_video: novo.link_video.trim() || null,
    };
    const criado = editando ? await atualizarOpeningEnding(editando, dados) : await criarOpeningEnding(animeUuid, { ...dados, ordem: Math.max(-1, ...itens.map((item) => item.ordem)) + 1 });
    if (criado) {
      setNovo(VAZIO);
      setEditando(null);
      await carregar();
    } else setErro('Não foi possível salvar a faixa. Seus campos foram preservados.');
    } catch { setErro('Não foi possível confirmar o salvamento. Reabra a lista antes de repetir.'); }
    finally { setSalvando(false); }
  }

  async function remover(uuid: string) {
    setSalvando(true);
    try {
      if (!await apagarOpeningEnding(uuid)) { setErro('Não foi possível remover a faixa.'); return; }
      if (editando === uuid) { setEditando(null); setNovo(VAZIO); }
      await carregar();
    } catch { setErro('Não foi possível confirmar a remoção.'); }
    finally { setSalvando(false); }
  }

  return (
    <div className={styles.wrapper}>
      <h4>Openings / Endings</h4>
      {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
      <div className={styles.linhaAdicionar}>
        <input placeholder="Pesquisar música, artista ou anime" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <BuscaMetadados fonte="musica" termo={busca} onSelect={(resultado) => {
        setNovo((atual) => ({ ...atual, nome: resultado.titulo, artista: resultado.autor ?? '', link_video: resultado.linkOficial ?? '' }));
        setBusca('');
      }} />
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid}>
              <span>
                <strong>{item.tipo === 'opening' ? 'OP' : item.tipo === 'ending' ? 'ED' : 'OST'}</strong> {item.nome}
                {item.artista ? ` — ${item.artista}` : ''}
              </span>
              <button type="button" disabled={salvando} aria-label={`Editar ${item.nome}`} onClick={() => { setEditando(item.uuid); setNovo({ tipo: item.tipo, nome: item.nome, artista: item.artista ?? '', link_video: item.link_video ?? '' }); }}>Editar</button>
              <button type="button" disabled={salvando} aria-label={`Remover ${item.nome}`} onClick={() => setExclusao(item.uuid)}>
                ✕
              </button>
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhuma faixa ainda.</li>}
        </ul>
      )}

      <div className={styles.linhaAdicionar}>
        <select
          value={novo.tipo}
          onChange={(e) => setNovo({ ...novo, tipo: e.target.value as TipoOpeningEnding })}
        >
          <option value="opening">Opening</option>
          <option value="ending">Ending</option>
          <option value="trilha_sonora">Trilha sonora</option>
        </select>
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
        />
        <input
          placeholder="Artista (opcional)"
          value={novo.artista}
          onChange={(e) => setNovo({ ...novo, artista: e.target.value })}
        />
        <input
          placeholder="Link da música ou vídeo (opcional)"
          value={novo.link_video}
          onChange={(e) => setNovo({ ...novo, link_video: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          {editando ? 'Salvar faixa' : '+ Adicionar'}
        </button>
        {editando ? <button type="button" disabled={salvando} onClick={() => { setEditando(null); setNovo(VAZIO); }}>Cancelar edição</button> : null}
      </div>
      <ConfirmDialog open={Boolean(exclusao)} onOpenChange={(open) => { if (!open) setExclusao(null); }} title="Remover faixa?" description="O anime e as outras faixas serão preservados." confirmLabel="Remover" onConfirm={async () => { if (exclusao) await remover(exclusao); }} />
    </div>
  );
}
