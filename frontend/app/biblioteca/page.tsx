'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import FilmesSection from './_components/FilmesSection';
import SeriesSection from './_components/SeriesSection';
import AnimesSection from './_components/AnimesSection';
import MangasSection from './_components/MangasSection';
import LivrosSection from './_components/LivrosSection';
import PodcastsSection from './_components/PodcastsSection';
import VideosSection from './_components/VideosSection';
import ArtigosSection from './_components/ArtigosSection';
import layoutStyles from './layout.module.css';

type CategoriaId = 'filmes' | 'series' | 'animes' | 'mangas' | 'livros' | 'podcasts' | 'videos' | 'artigos';

const CATEGORIAS: { id: CategoriaId; label: string; icon: string }[] = [
  { id: 'filmes',   label: 'Filmes',   icon: '🎬' },
  { id: 'series',   label: 'Séries',   icon: '📺' },
  { id: 'animes',   label: 'Animes',   icon: '🇯🇵' },
  { id: 'mangas',   label: 'Mangás',   icon: '📖' },
  { id: 'livros',   label: 'Livros',   icon: '📚' },
  { id: 'podcasts', label: 'Podcasts', icon: '🎙️' },
  { id: 'videos',   label: 'Vídeos',   icon: '▶' },
  { id: 'artigos',  label: 'Artigos',  icon: 'Aa' },
];

export default function BibliotecaPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaId>('filmes');
  const [gatilhoAdicionar, setGatilhoAdicionar] = useState(0);
  const [busca, setBusca] = useState('');

  // Cada Section avisa aqui quantos itens carregou — usado pro badge
  // de contagem na sidebar (só aparece na categoria ativa, ver Sidebar.tsx).
  const [contagens, setContagens] = useState<Record<CategoriaId, number>>({
    filmes: 0,
    series: 0,
    animes: 0,
    mangas: 0,
    livros: 0,
    podcasts: 0,
    videos: 0,
    artigos: 0,
  });

  function handleAdicionar() {
    setGatilhoAdicionar((v) => v + 1);
  }

  function atualizarContagem(id: CategoriaId, total: number) {
    setContagens((prev) => (prev[id] === total ? prev : { ...prev, [id]: total }));
  }

  function renderSection() {
    const props = {
      gatilhoAdicionar,
      busca,
    };
    switch (categoriaAtiva) {
      case 'filmes':
        return (
          <FilmesSection
            key="filmes"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('filmes', t)}
          />
        );
      case 'series':
        return (
          <SeriesSection
            key="series"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('series', t)}
          />
        );
      case 'animes':
        return (
          <AnimesSection
            key="animes"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('animes', t)}
          />
        );
      case 'mangas':
        return (
          <MangasSection
            key="mangas"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('mangas', t)}
          />
        );
      case 'livros':
        return (
          <LivrosSection
            key="livros"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('livros', t)}
          />
        );
      case 'podcasts':
        return (
          <PodcastsSection
            key="podcasts"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('podcasts', t)}
          />
        );
      case 'videos':
        return (
          <VideosSection
            key="videos"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('videos', t)}
          />
        );
      case 'artigos':
        return (
          <ArtigosSection
            key="artigos"
            {...props}
            onTotalCarregado={(t: number) => atualizarContagem('artigos', t)}
          />
        );
    }
  }

  return (
    <>
      <div className={layoutStyles.sidebarWrapper}>
        <Sidebar
          itens={CATEGORIAS.map((c) => ({
            id: c.id,
            label: c.label,
            icon: c.icon,
            count: contagens[c.id],
          }))}
          ativoId={categoriaAtiva}
          onSelecionar={(id) => setCategoriaAtiva(id as CategoriaId)}
          onAdicionar={handleAdicionar}
          rotuloAdicionar="Adicionar obra"
          busca={busca}
          onBuscaChange={setBusca}
          acaoSecundaria={{ href: '/biblioteca/generos', label: 'Gerenciar gêneros' }}
        />
      </div>
      <div className={layoutStyles.contentWrapper}>
        {renderSection()}
      </div>
    </>
  );
}
