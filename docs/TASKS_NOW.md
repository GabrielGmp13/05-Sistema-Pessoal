# Tarefas atuais — fechamento da versão 1.0.0

Atualizado em 2026-09-10. A versão publicada continua **0.2.0**. A 1.0.0 é o
próximo marco planejado, ainda sem autorização de abertura pública.

## Base já concluída

- [x] Aplicação publicada e protegida por autenticação.
- [x] Cadastro, confirmação, recuperação e login Google implementados.
- [x] Signup público fechado em duas camadas; CAPTCHA ativo.
- [x] Suporte com bugs, sugestões, protocolos, histórico e prints privados.
- [x] Isolamento entre duas contas validado em frontend, APIs, banco e Storage.
- [x] Exportação e ensaio de exclusão de conta.
- [x] Agenda/Calendar e YouTube separados por serviço e usuário.
- [x] Imagens novas otimizadas de forma conservadora.
- [x] Responsividade: coluna fixa desde 1024 px e menu abaixo disso.
- [x] Homologação de 2026-09-09 encerrada e massa de teste removida.
- [x] Instalação limpa, 98 testes Node, typecheck e build aprovados.
- [x] Reset local e 22 testes SQL aprovados na última recertificação de banco.

## Gates da 1.0.0

1. [x] Gabriel definiu lançamento controlado para uso pessoal e amigos; signup
       público permanece fechado nos primeiros meses.
2. [ ] Congelar o que entra na 1.0; mover melhorias ao `BACKLOG.md`.
3. [ ] Resolver ou aceitar formalmente:
   - [x] Google Places fica desativado na v1.0.0 por decisão de custo zero;
     Lugares continua com cadastro manual, capa e link externo.
   - validação publicada de Anime/Mangá após adicionar Kitsu como fallback para
     as duas categorias;
   - ENEM completo e gestos touch sem teste manual físico (adiados por Gabriel);
   - smoke publicado da CSP/headers (o smoke local de runtime passou) e os
     demais controles de segurança antes de ampliar além do piloto controlado.
   - [x] atualização de segurança autorizada: Next.js e `eslint-config-next`
     16.3.3, `sharp` 0.35.4 e `baseline-browser-mapping` 2.11.21 no
     lockfile. `npm audit --omit=dev` encerrou com 0 vulnerabilidades após
     `npm ci`; nenhuma publicação foi feita.
   - [x] Logs brutos de Treino, Shape, gêneros e componentes globais substituídos
     pelo registrador sanitizado, com teste de regressão.
   - [ ] Lint completo: de 25 erros/29 avisos para **8 erros/27 avisos** em
     2026-09-10. Corrigidos carregamentos de oito editores e capa privada;
     restante de efeitos/imagens continua aberto, sem supressão global de regras.
   - [x] Regressões locais: CSP permite scripts/frames do CAPTCHA; termos não
     bloqueiam privacidade, ajuda e recuperação. Testes adicionados, smoke
     autenticado da publicação ainda depende da etapa autorizada.
   - [x] Manifesto do frontend declara ESM, eliminando os avisos de
     reinterpretar testes TypeScript como módulos.
4. [ ] Manter documentados os gates de cadastro público (SMTP/domínio, OAuth
       publicado/verificado, limites, templates, retenção e incidente) para
       uma decisão futura; eles não bloqueiam este piloto controlado.
5. [~] Aviso de privacidade revisado e termos com aceite obrigatório criados
       localmente; validar o primeiro aceite no deploy autorizado.
6. [ ] Rodar bateria final limpa e smoke do candidato.
7. [ ] Somente então mudar a versão para `1.0.0` e gerar notas.
8. [ ] Com autorização separada: commit, push, deploy e smoke.
9. [ ] Observar por 24 horas e 7 dias; fechar signup diante de P0/P1.

## Rodada local para convidados — 2026-09-10

- [x] Link externo do MEC Enem em Registrar redação, com nova aba protegida,
  aviso de avaliação estimada por IA e ausência de envio automático de dados.
- [x] Places bloqueado no servidor antes de ler chave/chamar Google e busca
  oculta na interface; cadastro manual preservado. A decisão anterior estava
  somente documentada, não era um bloqueio explícito no código.
- [x] Busca de metadados descarta respostas canceladas e limpa resultados ao
  mudar termo/fonte/filtros; imagem de redação acompanha o caminho atual.
- [x] Carregamentos iniciais de Estudos e Projetos ignoram respostas após sair;
  tarefas são filtradas pelo projeto selecionado, sem exibir as de outro projeto.
- [x] Aceite de termos mantém botão ocupado até atualizar a sessão e trata falha
  inesperada; ícone de Configurações identificado como decorativo.
- [x] 103 testes Node, typecheck e build de 48 páginas aprovados. Lint atual:
  **8 erros e 27 avisos** (antes desta rodada: 16/29). Nenhuma regra desativada.
- [ ] Restante de efeitos em Biblioteca, Artigos, Vídeos, detalhe de Curso e
  Receitas; 12 avisos de dependências e 15 recomendações de imagens.
- [ ] Recuperação manual para amigo fora da equipe: preparar procedimento
  executável e testar em etapa Auth autorizada. Não prometer entrega automática.
- [ ] Revisão final de diff/segredos, validação visual dos recortes alterados e
  publicação autorizada; somente depois smoke de acesso/aceite do convidado.

“Acesso full” foi recebido como autonomia de trabalho; não foram executadas
operações remotas, mudança de versão, commit ou push nesta rodada. A meta de
abrir hoje não significa que o gate operacional já foi aprovado.

## Candidato autorizado para publicação — 2026-09-10

Gabriel autorizou commit e push e pediu retestes após publicação. Validação:
103 testes Node, typecheck/build aprovados, audit de produção zero, lint
**0 erros/25 avisos**. Corrigidos os oito erros remanescentes de carregamento e
sincronização de formulários; conteúdo dos módulos de Curso carrega em paralelo.
Os avisos restantes são 10 dependências e 15 imagens, sem desativação de regras.
O roteiro específico está no topo de `teste.md`; convite/recuperação e recursos
físicos continuam dependentes de autorização/ambiente. Não anunciar v1 pronta.

## Próxima ação exata

### Estado que substitui a triagem histórica abaixo

- [x] Código publicado em `cc2ccde` e ajuste de latência em `bbfb166`.
- [x] 105 testes Node e build aprovados; lint direcionado do ajuste sem erros.
  Lint completo: **0 erros/25 avisos**, sem regras desativadas.
- [x] Termos: bloqueio antes do aceite, privacidade acessível, aceite autorizado
  registrado e persistência confirmada. CSP/headers/APIs sem sessão aprovados.
- [x] Link MEC Enem e Places manual conferidos na publicação; importação de
  artigo/vídeo abriu campos corretos, sem salvar registros.
- [ ] Anime/Mangá: espera redundante corrigida, mas Naruto continua sem
  resultados nas duas categorias. Não declarar integração homologada.
- [ ] Investigar registro `calendar/sincronizacao-automatica` de falha genérica;
  não há evidência suficiente para atribuir causa nem concluir perda de eventos.
- [ ] Executar ENEM completo com massa descartável e limpeza definida; conta
  atual está sem provas. Convite/recuperação continuam exigindo etapa Auth.
- [ ] Retestes detalhados de carregamentos/seleções, CAPTCHA e Agenda em
  `teste.md`; testes físicos continuam adiados. Não anunciar a v1 pronta.

### Triagem histórica (não representa o estado atual)

Triagem anterior de 2026-09-10: os 16 erros/29 avisos eram de análise estática, não de
console em produção. Os 16 erros pertencem à regra `set-state-in-effect`;
os avisos são 12 de dependências de efeitos, 15 de imagens nativas, um de
variável não usada e um falso positivo de `alt-text` sobre ícone Lucide `Image`.
Priorizar efeitos com risco de estado desatualizado, sobrescrita de formulário
ou resposta assíncrona atrasada; não confundir severidade configurada com
gravidade funcional. Recomendações de imagem podem ser aceitas caso a caso,
preservando imagens privadas/GIFs/custo zero. Não houve aceite global da dívida
nem alteração das regras de lint. Não exigir console vazio como critério de
release: falhas reais, perdas de dados e segurança continuam bloqueantes;
ruído externo conhecido e otimizações precisam de classificação, não de
correção cega. Esta rodada não alterou código nem repetiu homologação.

Revisar os efeitos prioritários, depois preparar a recuperação manual
privada sem SMTP pago e validar os termos no candidato. Não há autorização de
operação remota. Requisitos novos do ENEM, Escola/Faculdade e editores em
[EVOLUCAO_ESTUDOS_EDITORES.md](EVOLUCAO_ESTUDOS_EDITORES.md); notificações,
módulos opcionais e teste físico de acessibilidade continuam para depois.
MEC Enem gratuito confirmado; integração automática sem API pública confirmada
fica fora do compromisso da v1. Link externo implementado localmente; múltiplas
avaliações e importação de notas ainda não implementadas.
Congelar a inclusão de expansões na v1 antes de implementá-las. Plano:
[RELEASE_V1.0.0_PLAN.md](RELEASE_V1.0.0_PLAN.md). Evidência já concluída:
[teste.md](teste.md).

## Limites preservados

- Operação gratuita; nenhum custo recorrente sem aprovação.
- Nome provisório “Projeto Pessoal”; sem telefone público.
- Um e-mail operacional privado: `sistemapessoa007@gmail.com`.
- Sem painel admin público e sem compartilhar acesso Supabase/Vercel.
- Saúde, Finanças e demais módulos continuam disponíveis; cada pessoa escolhe
  o que usar e inserir. O site não é serviço médico ou financeiro.
