'use client';

import { useEffect, useState } from 'react';
import {
  listarVolumes,
  criarVolume,
  atualizarVolume,
  apagarVolume,
  MangaVolume,
} from '@/lib/mangas-volumes';
import styles from './ListaEditavel.module.css';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Props {
  mangaUuid: string;
}

const VAZIO = { numero: '', arco: '', cor: '#b8f566' };

export default function VolumesEditor({ mangaUuid }: Props) {
  const [itens, setItens] = useState<MangaVolume[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [exclusao, setExclusao] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const res = await listarVolumes(mangaUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    let ativo = true;
    void listarVolumes(mangaUuid).then((res) => {
      if (!ativo) return;
      setItens(res ?? []);
      setCarregando(false);
    });
    return () => { ativo = false; };
  }, [mangaUuid]);

  async function adicionar() {
    const numero = Number(novo.numero);
    if (!Number.isInteger(numero) || numero < 1 || numero > 2147483647) { setErro('Informe um número inteiro positivo.'); return; }
    if (itens.some((item) => item.numero === numero && item.uuid !== editando)) { setErro('Este número de volume já está cadastrado.'); return; }
    setSalvando(true);
    setErro('');
    try {
    const dados = {
      numero,
      arco: novo.arco.trim() || null,
      cor: novo.cor || null,
    };
    const criado = editando ? await atualizarVolume(editando, dados) : await criarVolume(mangaUuid, dados);
    if (criado) {
      setNovo(VAZIO);
      setEditando(null);
      await carregar();
    } else setErro('Não foi possível salvar o volume. Seus campos foram preservados.');
    } catch { setErro('Não foi possível confirmar o salvamento. Reabra a lista antes de repetir.'); }
    finally { setSalvando(false); }
  }

  async function alternarLido(vol: MangaVolume) {
    setSalvando(true);
    setErro('');
    try {
      if (!await atualizarVolume(vol.uuid, { lido: !vol.lido })) { setErro('Não foi possível atualizar a leitura.'); return; }
      await carregar();
    } catch { setErro('Não foi possível confirmar a leitura.'); }
    finally { setSalvando(false); }
  }

  async function remover(uuid: string) {
    setSalvando(true);
    try {
      if (!await apagarVolume(uuid)) { setErro('Não foi possível remover o volume.'); return; }
      if (editando === uuid) { setEditando(null); setNovo(VAZIO); }
      await carregar();
    } catch { setErro('Não foi possível confirmar a remoção.'); }
    finally { setSalvando(false); }
  }

  return (
    <div className={styles.wrapper}>
      <h4>Volumes</h4>
      {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((vol) => (
            <li key={vol.uuid}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {vol.cor && (
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: vol.cor,
                      display: 'inline-block',
                    }}
                  />
                )}
                <strong>Vol {vol.numero}</strong>
                {vol.arco ? ` — ${vol.arco}` : ''}
              </span>
              <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--texto-secundario)' }}>
                  <input type="checkbox" disabled={salvando} checked={vol.lido} onChange={() => alternarLido(vol)} />{' '}
                  lido
                </label>
                <button type="button" disabled={salvando} aria-label={`Editar volume ${vol.numero}`} onClick={() => { setEditando(vol.uuid); setNovo({ numero: String(vol.numero), arco: vol.arco ?? '', cor: vol.cor ?? '#808080' }); }}>Editar</button>
                <button type="button" disabled={salvando} aria-label={`Remover volume ${vol.numero}`} onClick={() => setExclusao(vol.uuid)}>
                  ✕
                </button>
              </span>
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhum volume ainda.</li>}
        </ul>
      )}

      <fieldset className={styles.linhaAdicionar} disabled={salvando || carregando} style={{ border: 0, padding: 0, margin: 0 }}>
        <input
          placeholder="Número"
          aria-label="Número do volume" min={1} step={1}
          type="number"
          inputMode="numeric"
          value={novo.numero}
          onChange={(e) => setNovo({ ...novo, numero: e.target.value })}
        />
        <input
          placeholder="Arco (opcional)"
          aria-label="Arco (opcional)"
          value={novo.arco}
          onChange={(e) => setNovo({ ...novo, arco: e.target.value })}
        />
        <input
          type="color"
          value={novo.cor}
          onChange={(e) => setNovo({ ...novo, cor: e.target.value })}
          title="Cor do arco"
          style={{ width: '2.2rem', padding: '0.15rem', flex: '0 0 auto' }}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          {editando ? 'Salvar volume' : '+ Adicionar'}
        </button>
        {editando ? <button type="button" onClick={() => { setEditando(null); setNovo(VAZIO); }}>Cancelar edição</button> : null}
      </fieldset>
      <ConfirmDialog open={Boolean(exclusao)} onOpenChange={(open) => { if (!open) setExclusao(null); }} title="Remover volume?" description="O mangá e os outros volumes serão preservados." confirmLabel="Remover" onConfirm={async () => { if (exclusao) await remover(exclusao); }} />
    </div>
  );
}
