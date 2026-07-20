'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import FilmesSection from './_components/FilmesSection';
import SeriesSection from './_components/SeriesSection';
import AnimesSection from './_components/AnimesSection';
import MangasSection from './_components/MangasSection';
import LivrosSection from './_components/LivrosSection';
import PodcastsSection from './_components/PodcastsSection';
import layoutStyles from './layout.module.css';

type CategoriaId = 'filmes' | 'series' | 'animes' | 'mangas' | 'livros' | 'podcasts';

const CATEGORIAS: { id: CategoriaId; label: string; icon: string }[] = [
  { id: 'filmes',  label: 'Filmes',  icon: '🎬' },
  { id: 'series',  label: 'Séries',  icon: '📺' },
  { id: 'animes',  label: 'Animes',  icon: '🇯🇵' },
  { id: 'mangas',  label: 'Mangás',  icon: '📖' },
  { id: 'livros',  label: 'Livros',  icon: '📚' },
  { id: 'podcasts',label: 'Podcasts',icon: '🎙️' },
];

export default function BibliotecaPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaId>('filmes');
  const [gatilhoAdicionar, setGatilhoAdicionar] = useState(0);
  const [busca, setBusca] = useState('');

  function handleAdicionar() {
    setGatilhoAdicionar((v) => v + 1);
  }

  function renderSection() {
    const props = {
      key: categoriaAtiva,
      gatilhoAdicionar,
      busca,
    };
    switch (categoriaAtiva) {
      case 'filmes':   return <FilmesSection {...props} />;
      case 'series':   return <SeriesSection {...props} />;
      case 'animes':   return <AnimesSection {...props} />;
      case 'mangas':   return <MangasSection {...props} />;
      case 'livros':   return <LivrosSection {...props} />;
      case 'podcasts': return <PodcastsSection {...props} />;
      default:         return <FilmesSection {...props} />;
    }
  }

  return (
    <>
      <div className={layoutStyles.sidebarWrapper}>
        <Sidebar
          itens={CATEGORIAS.map((c) => ({ id: c.id, label: c.label, icon: c.icon }))}
          ativoId={categoriaAtiva}
          onSelecionar={(id) => setCategoriaAtiva(id as CategoriaId)}
          onAdicionar={handleAdicionar}
          rotuloAdicionar="Adicionar obra"
          busca={busca}
          onBuscaChange={setBusca}
        />
      </div>
      <div className={layoutStyles.contentWrapper}>
        {renderSection()}
      </div>
    </>
  );
}