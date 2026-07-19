-- ============================================================
-- 013_biblioteca_v2_b6_podcasts.sql
-- Biblioteca v2 — Sub-fase B6: Podcasts
-- Sem tabela nova — só reorganização de campo. `artistName` da iTunes API
-- (DEC-016) hoje é salvo prefixado em `comentario` ("Produtora: ..."); ganha
-- coluna própria para não misturar metadado com anotação livre do usuário.
-- Ver DECISIONS.md — DEC-029 (a registrar)
-- ============================================================

ALTER TABLE podcasts
  ADD COLUMN produtora TEXT;

-- Não há migração automática de dados de `comentario` para `produtora` —
-- só dados de teste existentes até agora (mesmo raciocínio de DEC-023).
-- Frontend passa a salvar `artistName` da iTunes API direto em `produtora`.