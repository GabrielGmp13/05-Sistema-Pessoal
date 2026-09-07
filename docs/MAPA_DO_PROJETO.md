# Mapa simples do projeto

Este documento explica o que Gabriel precisa olhar e o que pode ou não entrar
no GitHub público. O código publicado não deve conter dados reais nem segredos.

## O que existe na raiz

| Item | Para que serve | GitHub público? |
|---|---|---|
| `.github/workflows/validate.yml` | Testa o site a cada envio ao GitHub, sem credenciais reais. | Sim |
| `.gitignore` | Impede dependências, builds, estados locais e segredos de entrarem no Git. | Sim |
| `.nvmrc` | Fixa a versão do Node.js. | Sim |
| `AGENTS.md` | Regras obrigatórias para qualquer IA trabalhar no projeto. | Sim |
| `README.md` | Entrada rápida para instalar, testar e entender o projeto. | Sim |
| `CLAUDE.md` | Aponta outras IAs para as regras comuns. | Sim |
| `estrutura.txt` | Fotografia histórica da estrutura; pode ficar, mas não é fonte atual. | Sim, sem dados pessoais |
| `frontend/` | O site Next.js que o público usa. | Sim, exceto `.env*`, `.next/` e `node_modules/` |
| `backend/` | Banco: migrations, testes SQL e ferramenta Supabase; não é outro site. | Sim, exceto `.env*`, `.temp/`, `.branches/` e `node_modules/` |
| `browser-extension/` | Extensão local auxiliar de revisão. | Sim apenas se não guardar histórico/URLs/dados pessoais |
| `docs/` | Manual, decisões, banco, manutenção, testes e histórico técnico. | Sim, depois de retirar e-mails, prints, tokens e dados reais |

## Dentro de `frontend/`

| Item | Função |
|---|---|
| `app/` | Páginas e rotas de servidor. Pastas viram endereços do site. `app/api/` contém ações protegidas do servidor. |
| `components/` | Peças reaproveitadas de interface, como navegação, botões e modais. |
| `lib/` | Regras de negócio, acesso ao Supabase, validações e integrações. `lib/server/` nunca deve ser importada no navegador. |
| `public/` | Arquivos públicos servidos diretamente, como ícones. Nunca colocar documentos privados aqui. |
| `tests/` | Testes automáticos do frontend e das regras de segurança. |
| `.env.example` | Lista de nomes das configurações, sempre vazias. |
| `.env.local` | Segredos reais da máquina. Ignorado: nunca enviar, copiar em issue ou print. |
| `package.json` / `package-lock.json` | Versão, comandos e dependências exatas do site. |
| `proxy.ts` | Porteiro: valida a sessão e decide quais rotas são públicas. |
| `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs` | Configuração de build, TypeScript, CSS e revisão de código. |
| `.next/`, `node_modules/`, `tsconfig.tsbuildinfo` | Saídas geradas localmente. Não revisar nem enviar ao GitHub. |

## Dentro de `backend/supabase/`

| Item | Função |
|---|---|
| `migrations/` | Única cadeia SQL executável. Migration aplicada nunca é editada. |
| `tests/` | Testes locais de schema, RLS, isolamento e buckets. |
| `history/` | Arquivo histórico. Nunca executar como migration. |
| `snapshots/` | Evidência do banco em uma data. Não executar e nunca incluir linhas/dados reais. |
| `config.toml` | Configuração do Supabase local, sem senha de produção. |
| `seed.sql` | Dados fictícios opcionais para desenvolvimento. |
| `.env`, `.temp/`, `.branches/` | Credenciais/estado local. Nunca vão ao GitHub. |

## Documentos que Gabriel verifica antes de publicar

1. `TASKS_NOW.md`: o que terminou e o que ainda bloqueia.
2. `CHANGELOG.md`: o que a versão muda de verdade.
3. `DATABASE.md`: se a migration está local, aplicada ou pendente.
4. `DECISIONS.md`: escolhas novas e decisões superadas.
5. `teste.md`: testes humanos necessários.
6. `MANUTENCAO.md`: rotina depois da publicação.
7. Documento de release da versão: escopo, resultado e limitações.

Para abrir contas, consulte `CONFIGURAR_ACESSO_PUBLICO.md`. O texto de
privacidade ainda não aprovado fica em `AVISO_DE_PRIVACIDADE_RASCUNHO.md`.

## Nunca colocar no repositório público

- `.env.local`, `.env`, chaves, tokens, senha de banco, cookies ou backup real;
- lista de usuários, e-mails, relatos brutos, prints e anexos de chamados;
- exportações do Supabase com linhas reais, logs completos ou URLs assinadas;
- documentos pessoais, financeiros ou de saúde;
- instruções que incluam a credencial na linha de comando.

`RELEASE_V0.2.0.md` deve continuar no GitHub: ele é documentação técnica do que
foi publicado, não um pacote separado. Antes de cada push, a revisão de segredos
e dados pessoais continua obrigatória.
