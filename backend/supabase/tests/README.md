# Testes locais da baseline

Estes testes validam exclusivamente o banco Supabase local. Eles não contêm
credenciais, não usam dados reais e não devem ser executados contra produção.

Pré-requisitos:

- Docker Desktop ativo;
- stack iniciada a partir de `backend/`;
- banco reconstruído com `supabase db reset --local --no-seed`.

Execução a partir da raiz do repositório:

```powershell
Get-Content -Raw backend/supabase/tests/validate_baseline.sql |
  docker exec -i supabase_db_backend psql -U postgres -d postgres -X
```

O script usa uma transação e termina com `ROLLBACK`. As tabelas, linhas e
objetos usados nos testes comportamentais não permanecem no banco local.

