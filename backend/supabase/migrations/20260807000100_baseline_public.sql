-- 20260807000100_baseline_public.sql
-- Baseline operacional do schema public do Sistema Pessoal.
--
-- Fonte factual:
--   snapshots/2026-08-07-production/public_schema.sql
--   SHA-256 a5b71dfde138b0da61d69afe0ff754b27d2145d13d4337503708a69bcf1e7d2d
--
-- Escopo intencional:
--   - 44 tabelas finais de public;
--   - constraints, índices, RLS e policies atuais;
--   - GRANT ALL atual para authenticated.
--
-- Excluído por ser gerenciado pela plataforma:
--   - criação/ownership do schema public;
--   - ACLs de anon, service_role e postgres;
--   - default privileges da plataforma;
--   - schemas auth, storage, realtime e extensions.
--
-- Não executar sobre produção existente. Esta baseline destina-se somente a
-- ambientes novos; produção será alinhada futuramente apenas pelo histórico.

BEGIN;

CREATE TABLE "public"."agenda" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "data" "date" NOT NULL,
    "treino_uuid" "text",
    "titulo" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."animes" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome_original" "text" NOT NULL,
    "nome_traduzido" "text",
    "capa_url" "text",
    "capa_path" "text",
    "banner_url" "text",
    "banner_path" "text",
    "sinopse" "text",
    "ano_lancamento" integer,
    "ano_termino" integer,
    "classificacao_indicativa" "text",
    "duracao_minutos" integer,
    "mal_id" "text",
    "anilist_id" "text",
    "link_imdb" "text",
    "link_mal" "text",
    "link_anilist" "text",
    "link_oficial" "text",
    "diretor" "text",
    "roteirista" "text",
    "produtores" "text",
    "estudio" "text",
    "distribuidora" "text",
    "character_designer" "text",
    "animador_chefe" "text",
    "compositor" "text",
    "status" "text" DEFAULT 'quero_ver'::"text",
    "nota" numeric(3,1),
    "comentario" "text",
    "data_inicio" "date",
    "data_fim" "date",
    "favorito" boolean DEFAULT false,
    "vezes_consumido" integer DEFAULT 0,
    "onde_consumi" "text",
    "valor_pago" numeric(10,2),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    CONSTRAINT "animes_nota_range" CHECK ((("nota" IS NULL) OR (("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))))
);

CREATE TABLE "public"."animes_episodios" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "temporada_uuid" "text" NOT NULL,
    "numero" integer NOT NULL,
    "titulo" "text",
    "arco" "text",
    "filler" boolean DEFAULT false,
    "assistido" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."animes_generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "anime_uuid" "text" NOT NULL,
    "genero_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."animes_ordem_consumo" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "anime_uuid" "text" NOT NULL,
    "ordem" integer NOT NULL,
    "tipo_referencia" "text" NOT NULL,
    "referencia_uuid" "text" NOT NULL,
    "rotulo" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."animes_temporadas" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "anime_uuid" "text" NOT NULL,
    "numero" integer NOT NULL,
    "numero_episodios" integer,
    "nota_imdb" numeric(3,1),
    "minha_nota" numeric(2,1),
    "data_assisti" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."anotacoes_estudo" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text" NOT NULL,
    "conteudo_uuid" "text",
    "titulo" "text",
    "corpo" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."atividades" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "data_entrega" "date",
    "feita" boolean DEFAULT false,
    "entregue" boolean DEFAULT false,
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."conteudos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "revisao_uuid" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "modulo_curso_uuid" "text",
    "teoria_vista" boolean DEFAULT false NOT NULL,
    "dominado_manual" boolean DEFAULT false NOT NULL
);

CREATE TABLE "public"."conteudos_materias" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conteudo_uuid" "text" NOT NULL,
    "materia_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."elenco" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo_obra" "text" NOT NULL,
    "obra_uuid" "text" NOT NULL,
    "ator" "text" NOT NULL,
    "personagem" "text",
    "foto_url" "text",
    "ordem" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "dublador_original" "text",
    "dublador_br" "text"
);

CREATE TABLE "public"."execucoes_cardio" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sessao_uuid" "text" NOT NULL,
    "exercicio_uuid" "text" NOT NULL,
    "concluido" boolean DEFAULT false,
    "distancia_real_km" numeric(6,3),
    "duracao_real_minutos" integer,
    "data_hora" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."execucoes_forca" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sessao_uuid" "text" NOT NULL,
    "exercicio_uuid" "text" NOT NULL,
    "serie_numero" integer,
    "carga_real" numeric(6,2),
    "reps_real" integer,
    "concluida" boolean DEFAULT false,
    "data_hora" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."exercicios_cardio" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "treino_uuid" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "distancia_alvo_km" numeric(6,3),
    "duracao_alvo_minutos" integer,
    "imagem_path" "text",
    "ordem" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."exercicios_forca" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "treino_uuid" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "series_alvo" integer,
    "reps_alvo" integer,
    "carga_alvo" numeric(6,2),
    "descanso_segundos" integer,
    "imagem_path" "text",
    "ordem" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."filmes" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "diretor" "text",
    "tmdb_id" "text",
    "capa_url" "text",
    "capa_path" "text",
    "status" "text" DEFAULT 'quero_ver'::"text",
    "comentario" "text",
    "data_inicio" "date",
    "data_fim" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "favorito" boolean DEFAULT false,
    "vezes_consumido" integer DEFAULT 0,
    "onde_consumi" "text",
    "valor_pago" numeric(10,2),
    "banner_url" "text",
    "banner_path" "text",
    "classificacao_indicativa" "text",
    "duracao_minutos" integer,
    "link_imdb" "text",
    "link_mal" "text",
    "link_anilist" "text",
    "link_oficial" "text",
    "nota" numeric(3,1),
    "roteirista" "text",
    "produtores" "text",
    "estudio" "text",
    "distribuidora" "text",
    "orcamento" numeric(14,2),
    "bilheteria" numeric(14,2),
    "ano_lancamento" integer,
    "anime_uuid" "text",
    "tipo_complemento" "text",
    CONSTRAINT "filmes_nota_range" CHECK ((("nota" IS NULL) OR (("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))))
);

CREATE TABLE "public"."filmes_generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "filme_uuid" "text" NOT NULL,
    "genero_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."livros" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "autor" "text",
    "isbn" "text",
    "google_books_id" "text",
    "capa_url" "text",
    "capa_path" "text",
    "paginas_total" integer,
    "pagina_atual" integer DEFAULT 0,
    "status" "text" DEFAULT 'quero_ler'::"text",
    "comentario" "text",
    "data_inicio" "date",
    "data_fim" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "favorito" boolean DEFAULT false,
    "vezes_consumido" integer DEFAULT 0,
    "onde_consumi" "text",
    "valor_pago" numeric(10,2),
    "banner_url" "text",
    "banner_path" "text",
    "classificacao_indicativa" "text",
    "duracao_minutos" integer,
    "link_imdb" "text",
    "link_mal" "text",
    "link_anilist" "text",
    "link_oficial" "text",
    "nota" numeric(3,1),
    "editora" "text",
    "idioma" "text",
    "formato" "text" DEFAULT 'fisico'::"text",
    "ano_publicacao" integer,
    CONSTRAINT "livros_nota_range" CHECK ((("nota" IS NULL) OR (("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))))
);

CREATE TABLE "public"."livros_anotacoes" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "livro_uuid" "text" NOT NULL,
    "tipo" "text" DEFAULT 'anotacao'::"text" NOT NULL,
    "pagina" integer,
    "texto" "text" NOT NULL,
    "favorito" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."livros_generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "livro_uuid" "text" NOT NULL,
    "genero_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."mangas" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "autor" "text",
    "mal_id" "text",
    "capa_url" "text",
    "capa_path" "text",
    "capitulo_atual" integer DEFAULT 0,
    "status" "text" DEFAULT 'quero_ler'::"text",
    "comentario" "text",
    "data_inicio" "date",
    "data_fim" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "favorito" boolean DEFAULT false,
    "vezes_consumido" integer DEFAULT 0,
    "onde_consumi" "text",
    "valor_pago" numeric(10,2),
    "banner_url" "text",
    "banner_path" "text",
    "classificacao_indicativa" "text",
    "duracao_minutos" integer,
    "link_imdb" "text",
    "link_mal" "text",
    "link_anilist" "text",
    "link_oficial" "text",
    "nota" numeric(3,1),
    "titulo_traduzido" "text",
    "editora" "text",
    "status_publicacao" "text" DEFAULT 'em_andamento'::"text",
    "ano_inicio_publicacao" integer,
    "ano_fim_publicacao" integer,
    CONSTRAINT "mangas_nota_range" CHECK ((("nota" IS NULL) OR (("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))))
);

CREATE TABLE "public"."mangas_generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "manga_uuid" "text" NOT NULL,
    "genero_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."mangas_volumes" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "manga_uuid" "text" NOT NULL,
    "numero" integer NOT NULL,
    "arco" "text",
    "cor" "text",
    "lido" boolean DEFAULT false,
    "data_leitura" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."materiais_estudo" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conteudo_uuid" "text" NOT NULL,
    "tipo" "text" DEFAULT 'link'::"text" NOT NULL,
    "titulo" "text" NOT NULL,
    "url" "text",
    "arquivo_path" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."materias" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" DEFAULT 'escola'::"text" NOT NULL,
    "cor" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "plataforma" "text",
    "carga_horaria_total_horas" numeric(6,1),
    "horas_dedicadas" numeric(6,1) DEFAULT 0,
    "certificado_path" "text",
    "concluido" boolean DEFAULT false,
    "data_conclusao" "date",
    "area_enem" "text",
    "mostra_escola" boolean DEFAULT false NOT NULL,
    "mostra_enem" boolean DEFAULT false NOT NULL,
    CONSTRAINT "materias_area_enem_check" CHECK ((("area_enem" IS NULL) OR ("area_enem" = ANY (ARRAY['linguagens'::"text", 'humanas'::"text", 'natureza'::"text", 'matematica'::"text"]))))
);

CREATE TABLE "public"."modulos_curso" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "ordem" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."modulos_treino" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "cor" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."openings_endings" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "anime_uuid" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "artista" "text",
    "link_video" "text",
    "minha_nota" numeric(2,1),
    "ordem" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."podcasts" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "capa_path" "text",
    "episodio_atual" integer DEFAULT 0,
    "status" "text" DEFAULT 'ouvindo'::"text",
    "comentario" "text",
    "data_inicio" "date",
    "data_fim" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "itunes_id" "text",
    "capa_url" "text",
    "favorito" boolean DEFAULT false,
    "vezes_consumido" integer DEFAULT 0,
    "onde_consumi" "text",
    "valor_pago" numeric(10,2),
    "banner_url" "text",
    "banner_path" "text",
    "classificacao_indicativa" "text",
    "duracao_minutos" integer,
    "link_imdb" "text",
    "link_mal" "text",
    "link_anilist" "text",
    "link_oficial" "text",
    "nota" numeric(3,1),
    "produtora" "text",
    CONSTRAINT "podcasts_nota_range" CHECK ((("nota" IS NULL) OR (("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))))
);

CREATE TABLE "public"."podcasts_generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "podcast_uuid" "text" NOT NULL,
    "genero_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."provas" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text",
    "tipo" "text" DEFAULT 'escola'::"text" NOT NULL,
    "conteudo_uuid" "text",
    "titulo" "text",
    "data" "date" NOT NULL,
    "tempo_minutos" integer,
    "redacao_uuid" "text",
    "nota" numeric(5,1),
    "feita" boolean DEFAULT false,
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."questoes_individuais" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text",
    "conteudo_uuid" "text",
    "acertou" boolean,
    "data" "date" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "prova_uuid" "text",
    "numero" integer,
    "motivo_erro" "text",
    "letra_marcada" "text",
    "letra_correta" "text",
    "dificuldade" "text",
    CONSTRAINT "questoes_individuais_dificuldade_check" CHECK ((("dificuldade" IS NULL) OR ("dificuldade" = ANY (ARRAY['facil'::"text", 'medio'::"text", 'dificil'::"text"])))),
    CONSTRAINT "questoes_individuais_letra_correta_check" CHECK ((("letra_correta" IS NULL) OR ("letra_correta" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'E'::"text"])))),
    CONSTRAINT "questoes_individuais_letra_marcada_check" CHECK ((("letra_marcada" IS NULL) OR ("letra_marcada" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'E'::"text"]))))
);

CREATE TABLE "public"."redacoes" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tema" "text" NOT NULL,
    "texto" "text",
    "nota" numeric(4,1),
    "comentario" "text",
    "data" "date" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "competencia_1" numeric(5,1),
    "competencia_2" numeric(5,1),
    "competencia_3" numeric(5,1),
    "competencia_4" numeric(5,1),
    "competencia_5" numeric(5,1),
    "imagem_path" "text",
    CONSTRAINT "redacoes_competencia_1_check" CHECK ((("competencia_1" IS NULL) OR (("competencia_1" >= (0)::numeric) AND ("competencia_1" <= (200)::numeric)))),
    CONSTRAINT "redacoes_competencia_2_check" CHECK ((("competencia_2" IS NULL) OR (("competencia_2" >= (0)::numeric) AND ("competencia_2" <= (200)::numeric)))),
    CONSTRAINT "redacoes_competencia_3_check" CHECK ((("competencia_3" IS NULL) OR (("competencia_3" >= (0)::numeric) AND ("competencia_3" <= (200)::numeric)))),
    CONSTRAINT "redacoes_competencia_4_check" CHECK ((("competencia_4" IS NULL) OR (("competencia_4" >= (0)::numeric) AND ("competencia_4" <= (200)::numeric)))),
    CONSTRAINT "redacoes_competencia_5_check" CHECK ((("competencia_5" IS NULL) OR (("competencia_5" >= (0)::numeric) AND ("competencia_5" <= (200)::numeric))))
);

CREATE TABLE "public"."revisao_espacada" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pergunta" "text" NOT NULL,
    "resposta" "text",
    "modulo" "text",
    "referencia_uuid" "text",
    "ef" numeric(4,2) DEFAULT 2.5,
    "repeticoes" integer DEFAULT 0,
    "intervalo_dias" integer DEFAULT 1,
    "proxima_revisao" "date" DEFAULT CURRENT_DATE,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."series" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "diretor" "text",
    "tmdb_id" "text",
    "capa_url" "text",
    "capa_path" "text",
    "temporada_atual" integer DEFAULT 1,
    "episodio_atual" integer DEFAULT 0,
    "status" "text" DEFAULT 'quero_ver'::"text",
    "comentario" "text",
    "data_inicio" "date",
    "data_fim" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "favorito" boolean DEFAULT false,
    "vezes_consumido" integer DEFAULT 0,
    "onde_consumi" "text",
    "valor_pago" numeric(10,2),
    "banner_url" "text",
    "banner_path" "text",
    "classificacao_indicativa" "text",
    "duracao_minutos" integer,
    "link_imdb" "text",
    "link_mal" "text",
    "link_anilist" "text",
    "link_oficial" "text",
    "nota" numeric(3,1),
    "roteirista" "text",
    "produtores" "text",
    "estudio" "text",
    "distribuidora" "text",
    "ano_lancamento" integer,
    "ano_termino" integer,
    CONSTRAINT "series_nota_range" CHECK ((("nota" IS NULL) OR (("nota" >= (0)::numeric) AND ("nota" <= (10)::numeric))))
);

CREATE TABLE "public"."series_generos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "serie_uuid" "text" NOT NULL,
    "genero_uuid" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."series_temporadas" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "serie_uuid" "text" NOT NULL,
    "numero" integer NOT NULL,
    "numero_episodios" integer,
    "nota_imdb" numeric(3,1),
    "minha_nota" numeric(2,1),
    "data_assisti" "date",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."sessoes_estudo" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text" NOT NULL,
    "conteudo_uuid" "text",
    "inicio" timestamp with time zone NOT NULL,
    "fim" timestamp with time zone,
    "duracao_minutos" integer,
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."sessoes_treino" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "treino_uuid" "text" NOT NULL,
    "data_inicio" timestamp with time zone NOT NULL,
    "data_fim" timestamp with time zone,
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."shape" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "data" "date" NOT NULL,
    "peso" numeric(5,2),
    "foto_path" "text",
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

CREATE TABLE "public"."simulados" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "materia_uuid" "text",
    "data" "date" NOT NULL,
    "total_questoes" integer NOT NULL,
    "total_acertos" integer DEFAULT 0 NOT NULL,
    "tempo_minutos" integer,
    "observacoes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "conteudo_uuid" "text",
    "redacao_uuid" "text"
);

CREATE TABLE "public"."treinos" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false,
    "modulo_uuid" "text"
);

CREATE TABLE "public"."trilha_sonora" (
    "uuid" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo_obra" "text" NOT NULL,
    "obra_uuid" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "artista" "text",
    "duracao_segundos" integer,
    "link_spotify" "text",
    "link_youtube_music" "text",
    "ordem" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."animes_episodios"
    ADD CONSTRAINT "animes_episodios_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."animes_generos"
    ADD CONSTRAINT "animes_generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."animes_ordem_consumo"
    ADD CONSTRAINT "animes_ordem_consumo_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."animes"
    ADD CONSTRAINT "animes_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."animes_temporadas"
    ADD CONSTRAINT "animes_temporadas_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."anotacoes_estudo"
    ADD CONSTRAINT "anotacoes_estudo_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."atividades"
    ADD CONSTRAINT "atividades_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."conteudos_materias"
    ADD CONSTRAINT "conteudos_materias_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."conteudos"
    ADD CONSTRAINT "conteudos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."elenco"
    ADD CONSTRAINT "elenco_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."execucoes_cardio"
    ADD CONSTRAINT "execucoes_cardio_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."execucoes_forca"
    ADD CONSTRAINT "execucoes_forca_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."exercicios_cardio"
    ADD CONSTRAINT "exercicios_cardio_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."exercicios_forca"
    ADD CONSTRAINT "exercicios_forca_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."filmes_generos"
    ADD CONSTRAINT "filmes_generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."filmes"
    ADD CONSTRAINT "filmes_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."generos"
    ADD CONSTRAINT "generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."livros_anotacoes"
    ADD CONSTRAINT "livros_anotacoes_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."livros_generos"
    ADD CONSTRAINT "livros_generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."livros"
    ADD CONSTRAINT "livros_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."mangas_generos"
    ADD CONSTRAINT "mangas_generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."mangas"
    ADD CONSTRAINT "mangas_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."mangas_volumes"
    ADD CONSTRAINT "mangas_volumes_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."materiais_estudo"
    ADD CONSTRAINT "materiais_estudo_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."materias"
    ADD CONSTRAINT "materias_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."modulos_curso"
    ADD CONSTRAINT "modulos_curso_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."modulos_treino"
    ADD CONSTRAINT "modulos_treino_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."openings_endings"
    ADD CONSTRAINT "openings_endings_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."podcasts_generos"
    ADD CONSTRAINT "podcasts_generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."podcasts"
    ADD CONSTRAINT "podcasts_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."provas"
    ADD CONSTRAINT "provas_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."questoes_individuais"
    ADD CONSTRAINT "questoes_individuais_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."redacoes"
    ADD CONSTRAINT "redacoes_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."revisao_espacada"
    ADD CONSTRAINT "revisao_espacada_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."series_generos"
    ADD CONSTRAINT "series_generos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."series_temporadas"
    ADD CONSTRAINT "series_temporadas_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."sessoes_estudo"
    ADD CONSTRAINT "sessoes_estudo_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."sessoes_treino"
    ADD CONSTRAINT "sessoes_treino_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."shape"
    ADD CONSTRAINT "shape_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."simulados"
    ADD CONSTRAINT "simulados_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."treinos"
    ADD CONSTRAINT "treinos_pkey" PRIMARY KEY ("uuid");

ALTER TABLE ONLY "public"."trilha_sonora"
    ADD CONSTRAINT "trilha_sonora_pkey" PRIMARY KEY ("uuid");

CREATE INDEX "idx_agenda_data" ON "public"."agenda" USING "btree" ("data") WHERE (NOT "deleted");

CREATE INDEX "idx_animes_ativos" ON "public"."animes" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_animes_episodios_temporada" ON "public"."animes_episodios" USING "btree" ("temporada_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_animes_temporadas_anime" ON "public"."animes_temporadas" USING "btree" ("anime_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_anotacoes_estudo_conteudo" ON "public"."anotacoes_estudo" USING "btree" ("conteudo_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_anotacoes_estudo_materia" ON "public"."anotacoes_estudo" USING "btree" ("materia_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_atividades_materia" ON "public"."atividades" USING "btree" ("materia_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_conteudos_materias_conteudo" ON "public"."conteudos_materias" USING "btree" ("conteudo_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_conteudos_materias_materia" ON "public"."conteudos_materias" USING "btree" ("materia_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_elenco_obra" ON "public"."elenco" USING "btree" ("tipo_obra", "obra_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_exercicios_cardio_ativos" ON "public"."exercicios_cardio" USING "btree" ("treino_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_exercicios_forca_ativos" ON "public"."exercicios_forca" USING "btree" ("treino_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_filmes_anime" ON "public"."filmes" USING "btree" ("anime_uuid") WHERE (("anime_uuid" IS NOT NULL) AND (NOT "deleted"));

CREATE INDEX "idx_filmes_ativos" ON "public"."filmes" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_generos_ativos" ON "public"."generos" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_livros_anotacoes_livro" ON "public"."livros_anotacoes" USING "btree" ("livro_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_livros_ativos" ON "public"."livros" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_mangas_ativos" ON "public"."mangas" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_mangas_volumes_manga" ON "public"."mangas_volumes" USING "btree" ("manga_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_materiais_estudo_conteudo" ON "public"."materiais_estudo" USING "btree" ("conteudo_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_materias_user" ON "public"."materias" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_modulos_curso_materia" ON "public"."modulos_curso" USING "btree" ("materia_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_modulos_treino_ativos" ON "public"."modulos_treino" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_ordem_consumo_anime" ON "public"."animes_ordem_consumo" USING "btree" ("anime_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_podcasts_ativos" ON "public"."podcasts" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_provas_data" ON "public"."provas" USING "btree" ("data") WHERE (NOT "deleted");

CREATE INDEX "idx_questoes_individuais_conteudo" ON "public"."questoes_individuais" USING "btree" ("conteudo_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_questoes_individuais_materia" ON "public"."questoes_individuais" USING "btree" ("materia_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_questoes_individuais_prova" ON "public"."questoes_individuais" USING "btree" ("prova_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_redacoes_data" ON "public"."redacoes" USING "btree" ("data") WHERE (NOT "deleted");

CREATE INDEX "idx_revisao_proxima" ON "public"."revisao_espacada" USING "btree" ("proxima_revisao") WHERE (NOT "deleted");

CREATE INDEX "idx_series_ativas" ON "public"."series" USING "btree" ("user_id") WHERE (NOT "deleted");

CREATE INDEX "idx_series_temporadas_serie" ON "public"."series_temporadas" USING "btree" ("serie_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_sessoes_data" ON "public"."sessoes_treino" USING "btree" ("data_inicio" DESC) WHERE (NOT "deleted");

CREATE INDEX "idx_sessoes_estudo_inicio" ON "public"."sessoes_estudo" USING "btree" ("inicio") WHERE (NOT "deleted");

CREATE INDEX "idx_sessoes_estudo_materia" ON "public"."sessoes_estudo" USING "btree" ("materia_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_sessoes_treino" ON "public"."sessoes_treino" USING "btree" ("treino_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_shape_data" ON "public"."shape" USING "btree" ("data" DESC) WHERE (NOT "deleted");

CREATE INDEX "idx_simulados_conteudo" ON "public"."simulados" USING "btree" ("conteudo_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_simulados_data" ON "public"."simulados" USING "btree" ("data") WHERE (NOT "deleted");

CREATE INDEX "idx_treinos_modulo" ON "public"."treinos" USING "btree" ("modulo_uuid") WHERE (NOT "deleted");

CREATE INDEX "idx_trilha_sonora_obra" ON "public"."trilha_sonora" USING "btree" ("tipo_obra", "obra_uuid") WHERE (NOT "deleted");

ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_treino_uuid_fkey" FOREIGN KEY ("treino_uuid") REFERENCES "public"."treinos"("uuid");

ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."animes_episodios"
    ADD CONSTRAINT "animes_episodios_temporada_uuid_fkey" FOREIGN KEY ("temporada_uuid") REFERENCES "public"."animes_temporadas"("uuid");

ALTER TABLE ONLY "public"."animes_episodios"
    ADD CONSTRAINT "animes_episodios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."animes_generos"
    ADD CONSTRAINT "animes_generos_anime_uuid_fkey" FOREIGN KEY ("anime_uuid") REFERENCES "public"."animes"("uuid");

ALTER TABLE ONLY "public"."animes_generos"
    ADD CONSTRAINT "animes_generos_genero_uuid_fkey" FOREIGN KEY ("genero_uuid") REFERENCES "public"."generos"("uuid");

ALTER TABLE ONLY "public"."animes_generos"
    ADD CONSTRAINT "animes_generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."animes_ordem_consumo"
    ADD CONSTRAINT "animes_ordem_consumo_anime_uuid_fkey" FOREIGN KEY ("anime_uuid") REFERENCES "public"."animes"("uuid");

ALTER TABLE ONLY "public"."animes_ordem_consumo"
    ADD CONSTRAINT "animes_ordem_consumo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."animes_temporadas"
    ADD CONSTRAINT "animes_temporadas_anime_uuid_fkey" FOREIGN KEY ("anime_uuid") REFERENCES "public"."animes"("uuid");

ALTER TABLE ONLY "public"."animes_temporadas"
    ADD CONSTRAINT "animes_temporadas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."animes"
    ADD CONSTRAINT "animes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."anotacoes_estudo"
    ADD CONSTRAINT "anotacoes_estudo_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."anotacoes_estudo"
    ADD CONSTRAINT "anotacoes_estudo_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."anotacoes_estudo"
    ADD CONSTRAINT "anotacoes_estudo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."atividades"
    ADD CONSTRAINT "atividades_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."atividades"
    ADD CONSTRAINT "atividades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conteudos_materias"
    ADD CONSTRAINT "conteudos_materias_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."conteudos_materias"
    ADD CONSTRAINT "conteudos_materias_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."conteudos_materias"
    ADD CONSTRAINT "conteudos_materias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conteudos"
    ADD CONSTRAINT "conteudos_modulo_curso_uuid_fkey" FOREIGN KEY ("modulo_curso_uuid") REFERENCES "public"."modulos_curso"("uuid");

ALTER TABLE ONLY "public"."conteudos"
    ADD CONSTRAINT "conteudos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."elenco"
    ADD CONSTRAINT "elenco_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."execucoes_cardio"
    ADD CONSTRAINT "execucoes_cardio_exercicio_uuid_fkey" FOREIGN KEY ("exercicio_uuid") REFERENCES "public"."exercicios_cardio"("uuid");

ALTER TABLE ONLY "public"."execucoes_cardio"
    ADD CONSTRAINT "execucoes_cardio_sessao_uuid_fkey" FOREIGN KEY ("sessao_uuid") REFERENCES "public"."sessoes_treino"("uuid");

ALTER TABLE ONLY "public"."execucoes_cardio"
    ADD CONSTRAINT "execucoes_cardio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."execucoes_forca"
    ADD CONSTRAINT "execucoes_forca_exercicio_uuid_fkey" FOREIGN KEY ("exercicio_uuid") REFERENCES "public"."exercicios_forca"("uuid");

ALTER TABLE ONLY "public"."execucoes_forca"
    ADD CONSTRAINT "execucoes_forca_sessao_uuid_fkey" FOREIGN KEY ("sessao_uuid") REFERENCES "public"."sessoes_treino"("uuid");

ALTER TABLE ONLY "public"."execucoes_forca"
    ADD CONSTRAINT "execucoes_forca_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."exercicios_cardio"
    ADD CONSTRAINT "exercicios_cardio_treino_uuid_fkey" FOREIGN KEY ("treino_uuid") REFERENCES "public"."treinos"("uuid");

ALTER TABLE ONLY "public"."exercicios_cardio"
    ADD CONSTRAINT "exercicios_cardio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."exercicios_forca"
    ADD CONSTRAINT "exercicios_forca_treino_uuid_fkey" FOREIGN KEY ("treino_uuid") REFERENCES "public"."treinos"("uuid");

ALTER TABLE ONLY "public"."exercicios_forca"
    ADD CONSTRAINT "exercicios_forca_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."filmes"
    ADD CONSTRAINT "filmes_anime_uuid_fkey" FOREIGN KEY ("anime_uuid") REFERENCES "public"."animes"("uuid");

ALTER TABLE ONLY "public"."filmes_generos"
    ADD CONSTRAINT "filmes_generos_filme_uuid_fkey" FOREIGN KEY ("filme_uuid") REFERENCES "public"."filmes"("uuid");

ALTER TABLE ONLY "public"."filmes_generos"
    ADD CONSTRAINT "filmes_generos_genero_uuid_fkey" FOREIGN KEY ("genero_uuid") REFERENCES "public"."generos"("uuid");

ALTER TABLE ONLY "public"."filmes_generos"
    ADD CONSTRAINT "filmes_generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."filmes"
    ADD CONSTRAINT "filmes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."generos"
    ADD CONSTRAINT "generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."livros_anotacoes"
    ADD CONSTRAINT "livros_anotacoes_livro_uuid_fkey" FOREIGN KEY ("livro_uuid") REFERENCES "public"."livros"("uuid");

ALTER TABLE ONLY "public"."livros_anotacoes"
    ADD CONSTRAINT "livros_anotacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."livros_generos"
    ADD CONSTRAINT "livros_generos_genero_uuid_fkey" FOREIGN KEY ("genero_uuid") REFERENCES "public"."generos"("uuid");

ALTER TABLE ONLY "public"."livros_generos"
    ADD CONSTRAINT "livros_generos_livro_uuid_fkey" FOREIGN KEY ("livro_uuid") REFERENCES "public"."livros"("uuid");

ALTER TABLE ONLY "public"."livros_generos"
    ADD CONSTRAINT "livros_generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."livros"
    ADD CONSTRAINT "livros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mangas_generos"
    ADD CONSTRAINT "mangas_generos_genero_uuid_fkey" FOREIGN KEY ("genero_uuid") REFERENCES "public"."generos"("uuid");

ALTER TABLE ONLY "public"."mangas_generos"
    ADD CONSTRAINT "mangas_generos_manga_uuid_fkey" FOREIGN KEY ("manga_uuid") REFERENCES "public"."mangas"("uuid");

ALTER TABLE ONLY "public"."mangas_generos"
    ADD CONSTRAINT "mangas_generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mangas"
    ADD CONSTRAINT "mangas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."mangas_volumes"
    ADD CONSTRAINT "mangas_volumes_manga_uuid_fkey" FOREIGN KEY ("manga_uuid") REFERENCES "public"."mangas"("uuid");

ALTER TABLE ONLY "public"."mangas_volumes"
    ADD CONSTRAINT "mangas_volumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."materiais_estudo"
    ADD CONSTRAINT "materiais_estudo_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."materiais_estudo"
    ADD CONSTRAINT "materiais_estudo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."materias"
    ADD CONSTRAINT "materias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."modulos_curso"
    ADD CONSTRAINT "modulos_curso_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."modulos_curso"
    ADD CONSTRAINT "modulos_curso_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."modulos_treino"
    ADD CONSTRAINT "modulos_treino_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."openings_endings"
    ADD CONSTRAINT "openings_endings_anime_uuid_fkey" FOREIGN KEY ("anime_uuid") REFERENCES "public"."animes"("uuid");

ALTER TABLE ONLY "public"."openings_endings"
    ADD CONSTRAINT "openings_endings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."podcasts_generos"
    ADD CONSTRAINT "podcasts_generos_genero_uuid_fkey" FOREIGN KEY ("genero_uuid") REFERENCES "public"."generos"("uuid");

ALTER TABLE ONLY "public"."podcasts_generos"
    ADD CONSTRAINT "podcasts_generos_podcast_uuid_fkey" FOREIGN KEY ("podcast_uuid") REFERENCES "public"."podcasts"("uuid");

ALTER TABLE ONLY "public"."podcasts_generos"
    ADD CONSTRAINT "podcasts_generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."podcasts"
    ADD CONSTRAINT "podcasts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."provas"
    ADD CONSTRAINT "provas_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."provas"
    ADD CONSTRAINT "provas_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."provas"
    ADD CONSTRAINT "provas_redacao_uuid_fkey" FOREIGN KEY ("redacao_uuid") REFERENCES "public"."redacoes"("uuid");

ALTER TABLE ONLY "public"."provas"
    ADD CONSTRAINT "provas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."questoes_individuais"
    ADD CONSTRAINT "questoes_individuais_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."questoes_individuais"
    ADD CONSTRAINT "questoes_individuais_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."questoes_individuais"
    ADD CONSTRAINT "questoes_individuais_prova_uuid_fkey" FOREIGN KEY ("prova_uuid") REFERENCES "public"."provas"("uuid");

ALTER TABLE ONLY "public"."questoes_individuais"
    ADD CONSTRAINT "questoes_individuais_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redacoes"
    ADD CONSTRAINT "redacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."revisao_espacada"
    ADD CONSTRAINT "revisao_espacada_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."series_generos"
    ADD CONSTRAINT "series_generos_genero_uuid_fkey" FOREIGN KEY ("genero_uuid") REFERENCES "public"."generos"("uuid");

ALTER TABLE ONLY "public"."series_generos"
    ADD CONSTRAINT "series_generos_serie_uuid_fkey" FOREIGN KEY ("serie_uuid") REFERENCES "public"."series"("uuid");

ALTER TABLE ONLY "public"."series_generos"
    ADD CONSTRAINT "series_generos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."series_temporadas"
    ADD CONSTRAINT "series_temporadas_serie_uuid_fkey" FOREIGN KEY ("serie_uuid") REFERENCES "public"."series"("uuid");

ALTER TABLE ONLY "public"."series_temporadas"
    ADD CONSTRAINT "series_temporadas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."sessoes_estudo"
    ADD CONSTRAINT "sessoes_estudo_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."sessoes_estudo"
    ADD CONSTRAINT "sessoes_estudo_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."sessoes_estudo"
    ADD CONSTRAINT "sessoes_estudo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."sessoes_treino"
    ADD CONSTRAINT "sessoes_treino_treino_uuid_fkey" FOREIGN KEY ("treino_uuid") REFERENCES "public"."treinos"("uuid");

ALTER TABLE ONLY "public"."sessoes_treino"
    ADD CONSTRAINT "sessoes_treino_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."shape"
    ADD CONSTRAINT "shape_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."simulados"
    ADD CONSTRAINT "simulados_conteudo_uuid_fkey" FOREIGN KEY ("conteudo_uuid") REFERENCES "public"."conteudos"("uuid");

ALTER TABLE ONLY "public"."simulados"
    ADD CONSTRAINT "simulados_materia_uuid_fkey" FOREIGN KEY ("materia_uuid") REFERENCES "public"."materias"("uuid");

ALTER TABLE ONLY "public"."simulados"
    ADD CONSTRAINT "simulados_redacao_uuid_fkey" FOREIGN KEY ("redacao_uuid") REFERENCES "public"."redacoes"("uuid");

ALTER TABLE ONLY "public"."simulados"
    ADD CONSTRAINT "simulados_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."treinos"
    ADD CONSTRAINT "treinos_modulo_uuid_fkey" FOREIGN KEY ("modulo_uuid") REFERENCES "public"."modulos_treino"("uuid");

ALTER TABLE ONLY "public"."treinos"
    ADD CONSTRAINT "treinos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."trilha_sonora"
    ADD CONSTRAINT "trilha_sonora_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."agenda" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."animes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."animes_episodios" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."animes_generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."animes_ordem_consumo" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."animes_temporadas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."anotacoes_estudo" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."atividades" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."conteudos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."conteudos_materias" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."elenco" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."execucoes_cardio" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."execucoes_forca" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."exercicios_cardio" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."exercicios_forca" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."filmes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."filmes_generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."livros" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."livros_anotacoes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."livros_generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mangas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mangas_generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."mangas_volumes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."materiais_estudo" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."materias" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."modulos_curso" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."modulos_treino" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."openings_endings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."podcasts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."podcasts_generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."provas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."questoes_individuais" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."redacoes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."revisao_espacada" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."series" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."series_generos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."series_temporadas" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sessoes_estudo" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sessoes_treino" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."shape" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."simulados" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."treinos" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."trilha_sonora" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_data" ON "public"."agenda" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."animes" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."animes_episodios" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."animes_generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."animes_ordem_consumo" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."animes_temporadas" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."anotacoes_estudo" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."atividades" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."conteudos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."conteudos_materias" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."elenco" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."execucoes_cardio" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."execucoes_forca" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."exercicios_cardio" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."exercicios_forca" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."filmes" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."filmes_generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."livros" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."livros_anotacoes" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."livros_generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."mangas" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."mangas_generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."mangas_volumes" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."materiais_estudo" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."materias" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."modulos_curso" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."modulos_treino" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."openings_endings" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."podcasts" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."podcasts_generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."provas" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."questoes_individuais" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."redacoes" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."revisao_espacada" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."series" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."series_generos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."series_temporadas" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."sessoes_estudo" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."sessoes_treino" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."shape" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."simulados" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."treinos" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_own_data" ON "public"."trilha_sonora" USING (("auth"."uid"() = "user_id"));

-- authenticated possui GRANT ALL nas 44 tabelas no estado remoto capturado.
GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT ALL ON TABLE "public"."agenda" TO "authenticated";
GRANT ALL ON TABLE "public"."animes" TO "authenticated";
GRANT ALL ON TABLE "public"."animes_episodios" TO "authenticated";
GRANT ALL ON TABLE "public"."animes_generos" TO "authenticated";
GRANT ALL ON TABLE "public"."animes_ordem_consumo" TO "authenticated";
GRANT ALL ON TABLE "public"."animes_temporadas" TO "authenticated";
GRANT ALL ON TABLE "public"."anotacoes_estudo" TO "authenticated";
GRANT ALL ON TABLE "public"."atividades" TO "authenticated";
GRANT ALL ON TABLE "public"."conteudos" TO "authenticated";
GRANT ALL ON TABLE "public"."conteudos_materias" TO "authenticated";
GRANT ALL ON TABLE "public"."elenco" TO "authenticated";
GRANT ALL ON TABLE "public"."execucoes_cardio" TO "authenticated";
GRANT ALL ON TABLE "public"."execucoes_forca" TO "authenticated";
GRANT ALL ON TABLE "public"."exercicios_cardio" TO "authenticated";
GRANT ALL ON TABLE "public"."exercicios_forca" TO "authenticated";
GRANT ALL ON TABLE "public"."filmes" TO "authenticated";
GRANT ALL ON TABLE "public"."filmes_generos" TO "authenticated";
GRANT ALL ON TABLE "public"."generos" TO "authenticated";
GRANT ALL ON TABLE "public"."livros" TO "authenticated";
GRANT ALL ON TABLE "public"."livros_anotacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."livros_generos" TO "authenticated";
GRANT ALL ON TABLE "public"."mangas" TO "authenticated";
GRANT ALL ON TABLE "public"."mangas_generos" TO "authenticated";
GRANT ALL ON TABLE "public"."mangas_volumes" TO "authenticated";
GRANT ALL ON TABLE "public"."materiais_estudo" TO "authenticated";
GRANT ALL ON TABLE "public"."materias" TO "authenticated";
GRANT ALL ON TABLE "public"."modulos_curso" TO "authenticated";
GRANT ALL ON TABLE "public"."modulos_treino" TO "authenticated";
GRANT ALL ON TABLE "public"."openings_endings" TO "authenticated";
GRANT ALL ON TABLE "public"."podcasts" TO "authenticated";
GRANT ALL ON TABLE "public"."podcasts_generos" TO "authenticated";
GRANT ALL ON TABLE "public"."provas" TO "authenticated";
GRANT ALL ON TABLE "public"."questoes_individuais" TO "authenticated";
GRANT ALL ON TABLE "public"."redacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."revisao_espacada" TO "authenticated";
GRANT ALL ON TABLE "public"."series" TO "authenticated";
GRANT ALL ON TABLE "public"."series_generos" TO "authenticated";
GRANT ALL ON TABLE "public"."series_temporadas" TO "authenticated";
GRANT ALL ON TABLE "public"."sessoes_estudo" TO "authenticated";
GRANT ALL ON TABLE "public"."sessoes_treino" TO "authenticated";
GRANT ALL ON TABLE "public"."shape" TO "authenticated";
GRANT ALL ON TABLE "public"."simulados" TO "authenticated";
GRANT ALL ON TABLE "public"."treinos" TO "authenticated";
GRANT ALL ON TABLE "public"."trilha_sonora" TO "authenticated";

COMMIT;

