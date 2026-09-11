# Plano de release 1.0.0

Status: **planejada, não lançada**. Versão atual do manifesto: `0.2.0`.

## Objetivo

Transformar a base homologada em um marco estável e compreensível para quem
usa, para Gabriel manter sozinho e para uma futura equipe continuar sem
reorganizar tudo. A 1.0 não significa “todas as ideias prontas”; significa que
o escopo escolhido funciona, é operável e tem limites claros.

## Escolha de lançamento

**Decisão confirmada em 2026-09-09:** a v1.0.0 será um lançamento controlado
para uso pessoal do Gabriel e amigos. O cadastro público permanece desligado
nos primeiros meses; nenhuma configuração remota de Auth, OAuth ou Vercel foi
alterada por esta decisão.

### Opção A — amigos com acesso controlado

**Escolhida para a v1.0.0.**

- Mantém signup público desligado.
- Gabriel libera contas nominalmente e adiciona testadores OAuth se necessário.
- Mantém custo zero e reduz risco operacional.
- Pode ser 1.0.0 se o escopo estiver congelado e estável.

### Opção B — cadastro aberto

**Fora do escopo da v1.0.0.** Só deve ser reavaliada em uma etapa futura, com
aprovação explícita e os gates próprios concluídos.

- Exige SMTP/remetente confiável, estratégia de domínio, OAuth publicado e
  possivelmente verificado, monitoramento de abuso e incidentes.
- Exige teste de uma conta externa que não pertença à equipe.
- Deve começar pequeno mesmo depois da abertura.

## Escopo mínimo recomendado

- Login, recuperação e isolamento de conta.
- Início e navegação responsiva.
- Módulos existentes, com integrações opcionais degradando para manual.
- Suporte por bug/sugestão com protocolo e print privado.
- Privacidade, exportação e solicitação de exclusão.
- Rotina semanal/mensal documentada.

Places, catálogo externo completo, editor avançado de PDF, sync com navegador
fechado, mídia avançada do Anki e analytics não precisam bloquear a 1.0 se
forem descritos como opcionais ou futuros.

## Gates bloqueantes

- Nenhum P0/P1 conhecido aberto.
- `npm audit --omit=dev` sem vulnerabilidade crítica ou alta conhecida na
  cadeia publicada (0 vulnerabilidades na auditoria local de 2026-09-09).
- Testes Node, typecheck e build aprovados em instalação limpa em 2026-09-09;
  nova rodada em 2026-09-10 passou com 106 testes, typecheck e build de 48
  páginas. O lint caiu para 0 erros e 0 avisos.
- Migrations alinhadas; nenhuma pendência inesperada.
- Smoke de login, recuperação, isolamento, CRUD, Storage, suporte, Agenda e
  exportação.
- Sem segredo em Git, bundle ou logs revisados.
- Privacidade, retenção e contato coerentes com o público.
- Auth compatível com o tipo de lançamento.
- Rollback simples: desligar signup, reverter frontend e preservar banco.

## Decisões pendentes

- Requisitos novos e diferenças para o código: `EVOLUCAO_ESTUDOS_EDITORES.md`.
  Recuperação manual privada escolhida para o piloto, sem domínio pago;
  procedimento e homologação específicos ainda pendentes. Não confundir com
  envio automático do SMTP padrão do Supabase.
- Places permanece desativado na v1.0.0 por decisão de custo zero; lançar com
  cadastro manual, capa privada e link externo já existentes.
- Publicar e validar a correção de Anime/Mangá: o Vercel chamou as três fontes,
  mas a Kitsu recusava o `User-Agent` próprio com 406. Sem esse cabeçalho,
  `attac` retornou Attack on Titan para Anime e Mangá.
- ENEM manual completo não bloqueia mais a abertura aos amigos: Gabriel decidiu
  testá-lo pessoalmente durante o uso e registrar qualquer regressão concreta.
- Validar no deploy a CSP e os headers endurecidos (o smoke local de runtime
  passou), com smoke das integrações e imagens após a publicação autorizada.
- Domínio/SMTP somente se o lançamento escolhido exigir; nenhum serviço pago
  sem estimativa e aprovação.

## Sequência

1. Escolher público e congelar escopo.
2. Tratar ou aceitar cada achado.
3. Revisar privacidade, segurança e operação.
4. Criar candidato local e validar.
5. Alterar versão e documentação.
6. Revisar diff, stage e segredos.
7. Autorizar commit/push e aguardar CI/deploy.
8. Fazer smoke publicado sem massa permanente desnecessária.
9. Registrar a release e observar por 24 h/7 dias.

## Critério de “terminado”

A 1.0.0 termina quando o escopo congelado está publicado, os gates aplicáveis
estão aprovados, os limites estão documentados e Gabriel consegue seguir
`MANUTENCAO.md` sem depender da memória do chat. Backlog futuro não impede o
encerramento.
