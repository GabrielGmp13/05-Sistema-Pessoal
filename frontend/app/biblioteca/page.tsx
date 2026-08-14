'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, Film, Library, Mic2, Play, Sparkles, Tv } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import FilmesSection from './_components/FilmesSection';
import SeriesSection from './_components/SeriesSection';
import AnimesSection from './_components/AnimesSection';
import MangasSection from './_components/MangasSection';
import LivrosSection from './_components/LivrosSection';
import PodcastsSection from './_components/PodcastsSection';
import VideosSection from './_components/VideosSection';
import ArtigosSection from './_components/ArtigosSection';
import { sb } from '@/lib/supabase';
import type { OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import layoutStyles from './layout.module.css';

type CategoriaId = 'filmes' | 'series' | 'animes' | 'mangas' | 'livros' | 'podcasts' | 'videos' | 'artigos';

const CATEGORIAS: { id: CategoriaId; label: string; icon: React.ReactNode }[] = [
  { id: 'filmes', label: 'Filmes', icon: <Film aria-hidden="true" /> },
  { id: 'series', label: 'Séries', icon: <Tv aria-hidden="true" /> },
  { id: 'animes', label: 'Animes', icon: <Sparkles aria-hidden="true" /> },
  { id: 'mangas', label: 'Mangás', icon: <BookOpen aria-hidden="true" /> },
  { id: 'livros', label: 'Livros', icon: <Library aria-hidden="true" /> },
  { id: 'podcasts', label: 'Podcasts', icon: <Mic2 aria-hidden="true" /> },
  { id: 'videos', label: 'Vídeos', icon: <Play aria-hidden="true" /> },
  { id: 'artigos', label: 'Artigos', icon: <FileText aria-hidden="true" /> },
];

const TABELAS_POR_CATEGORIA: Record<CategoriaId, string> = {
  filmes: 'filmes',
  series: 'series',
  animes: 'animes',
  mangas: 'mangas',
  livros: 'livros',
  podcasts: 'podcasts',
  videos: 'videos',
  artigos: 'artigos',
};

export default function BibliotecaPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaId>('filmes');
  const [gatilhoAdicionar, setGatilhoAdicionar] = useState(0);
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoBiblioteca>('recentes');

  // A carga inicial preenche tudo; cada Section mantém sua contagem atualizada após CRUD.
  const [contagens, setContagens] = useState<Record<CategoriaId, number | null>>({
    filmes: null,
    series: null,
    animes: null,
    mangas: null,
    livros: null,
    podcasts: null,
    videos: null,
    artigos: null,
  });

  useEffect(() => {
    let ativo = true;

    async function carregarContagens() {
      const resultados = await Promise.all(
        (Object.entries(TABELAS_POR_CATEGORIA) as [CategoriaId, string][]).map(
          async ([categoria, tabela]) => {
            const { count, error } = await sb
              .from(tabela)
              .select('uuid', { count: 'exact', head: true })
              .eq('deleted', false);
            return [categoria, error ? null : count ?? 0] as const;
          },
        ),
      );

      if (ativo) setContagens(Object.fromEntries(resultados) as Record<CategoriaId, number | null>);
    }

    void carregarContagens();
    return () => {
      ativo = false;
    };
  }, []);

  function handleAdicionar() {
    setGatilhoAdicionar((v) => v + 1);
  }

  function atualizarContagem(id: CategoriaId, total: number) {
    setContagens((prev) => (prev[id] === total ? prev : { ...prev, [id]: total }));
  }

  function selecionarCategoria(id: CategoriaId) {
    setGatilhoAdicionar(0);
    if (id === 'artigos' && ordenacao === 'nota') setOrdenacao('recentes');
    setCategoriaAtiva(id);
  }

  function renderSection() {
    const props = {
      gatilhoAdicionar,
      busca,
      ordenacao,
      onOrdenacaoChange: setOrdenacao,
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
          onSelecionar={(id) => selecionarCategoria(id as CategoriaId)}
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
