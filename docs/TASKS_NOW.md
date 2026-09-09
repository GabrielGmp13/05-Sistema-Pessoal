# Tarefas atuais — acesso e suporte público

Atualizado em 2026-09-09. A v0.2.0 continua publicada. O lote de acesso e
suporte foi publicado pelo commit `118e487` e a migration de suporte foi
aplicada em produção em 2026-09-06. O cadastro continua fechado e o site
**não foi aberto ao público**.

## Implementado e publicado com cadastro fechado

- [x] Cadastro por e-mail atrás de `NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED=false`.
- [x] Confirmação de e-mail/convite, recuperação e definição de nova senha.
- [x] Bugs e sugestões com protocolo, status, resposta e histórico por usuário.
- [x] Até três prints PNG/JPG/WebP privados de 2 MB por pedido.
- [x] Aviso opcional por e-mail sem anexo; banco é a fonte da verdade.
- [x] FAQ público com dúvidas gerais; sugestões continuam sendo pedidos autenticados.
- [x] Cabeçalhos básicos contra clickjacking, MIME sniffing e permissões não usadas.
- [x] Sem painel admin: operação inicial pelo Supabase Dashboard e trigger de histórico.
- [x] Validação server-side, limite de 10 pedidos/24 h e testes de entrada.
- [x] Decisões, princípios, mapa do projeto e plano de abertura atualizados.
- [x] Solicitações autenticadas de cópia e exclusão com protocolo, histórico e
      frase exata de confirmação; nenhuma exclusão acontece automaticamente.
      Pedido real de cópia homologado em produção com protocolo e histórico.

## Gates antes de aplicar/publicar este lote

1. [x] Reset completo e teste SQL local da migration `20260905000100`;
       schema, bucket, RLS, isolamento, bloqueio de escrita e trigger aprovados.
2. [x] Diff/segredos, typecheck, 80 testes, build (46 rotas), lint do recorte e
       dependências de produção revisados; zero vulnerabilidades no `npm audit --omit=dev`.
3. [x] Migration remota aprovada e aplicada; precheck/dry-run listaram somente
       `20260905000100`, histórico final alinhado e dry-run posterior vazio.
   - [x] Segurança operacional: senha do banco exposta no log privado foi
         trocada por Gabriel em 2026-09-07. A conexão local antiga deve ser
         atualizada somente quando o próximo acesso remoto for necessário.
4. [~] URLs de Auth configuradas para produção em 2026-09-07; SMTP ainda
       depende de domínio próprio e escolha de remetente.
5. [x] Login Google configurado no Supabase com cliente OAuth separado;
       fluxo completo aprovado em produção com a conta manual já existente,
       sem criar usuário duplicado. A conta de Gabriel está na lista de teste
       do projeto Google. O cadastro público permanece fechado.
6. [ ] Se desejar aviso: criar remetente Resend verificado e variáveis server-only.
7. [~] Segunda conta real confirmou perfil/Home sem dados da principal e
       “Meus pedidos” vazio apesar dos três chamados existentes em Gabriel.
       Storage cruzado já passou no teste SQL local; o Edge bloqueou a tentativa
       manual da rota técnica antes de chegar ao site. APIs/módulos restantes
       ainda exigem a rodada completa de `teste.md`. A conta descartável usada
       no ensaio de exportação/exclusão também apresentou zero dados e zero
       arquivos antes de ser removida; uma nova conta de teste será necessária
       para concluir a matriz.
       A conta foi recriada em 2026-09-08. Perfil, conexões Google, pedidos e
       onze módulos abriram sem dados da principal. A matriz real foi ampliada
       com criação, leitura, edição e exclusão de projeto; criação e mudança de
       etapa de tarefa relacionada; e upload privado no Shape. A imagem JPG foi
       otimizada para WebP, apareceu apenas na conta secundária, não abriu pela
       URL direta sem assinatura (`400`) e o bucket `shape` ficou vazio após a
       exclusão autorizada. Projeto, tarefa, registro e imagem temporários foram
       removidos; a conta secundária foi preservada para os testes restantes.
       Agenda, Idiomas, Saúde, Finanças, Lugares e Treino também passaram por
       criação/leitura e isolamento cruzado em produção. Depois da confirmação
       de Gabriel, toda a massa `TESTE ISOLAMENTO` desses seis módulos foi
       removida pela interface; a varredura final encontrou zero marcadores e
       nenhuma página com erro. As sete modalidades padrão do Treino e a conta
       secundária foram preservadas.
8. [x] Aviso de privacidade aprovado e publicado: Gabriel Oliveira como
       responsável, canal `sistemapessoa007@gmail.com`, piloto para maiores de
       18 anos, retenção e procedimento de acesso/exclusão definidos. Todos os
       módulos permanecem disponíveis e cada pessoa escolhe o que usar e inserir.
9. [x] Cloudflare Turnstile criado em modo Managed para o domínio de produção;
       site key na Vercel, deploy aprovado e secret key no Supabase. CAPTCHA
       ativado somente após o widget responder com sucesso no login. Manter
       signup remoto/UI fechados.
       Troca segura de senha e exigência da senha atual foram ativadas no Auth
       em 2026-09-07. A recuperação em produção aceitou o pedido e entregou o
       e-mail na caixa correta em 2026-09-08; a senha não foi alterada.
10. [x] Commit/push e deploy concluídos (`118e487`); tela de login, FAQ,
        recuperação, cabeçalhos e API sem sessão passaram no smoke. Login Google
        concluiu o retorno autenticado e o suporte criou o protocolo
        `SP-20260907-1CE35332`, com histórico inicial visível somente ao autor.
        O protocolo `SP-20260907-C929B5FD` confirmou também upload privado e
        abertura do print por URL assinada.
    - [x] A conta principal foi reiniciada em produção em 2026-09-07: todos os
          registros dos módulos e pedidos de teste foram removidos, os nove
          arquivos correspondentes foram apagados do Storage e o pós-check
          retornou zero arquivo fora de `midias-pessoais`. Login, perfil e as
          duas conexões Google foram preservados; a Agenda pode voltar a receber
          eventos pela sincronização autorizada do Calendar.
11. [ ] Só depois autorizar abertura: habilitar signup remoto e a variável pública juntos.

## Próxima ação

Rodada funcional consolidada em 2026-09-09: 95 testes Node, typecheck, build,
reset local e 22 testes SQL aprovados. A produção passou nos fluxos de Hub,
TMDB, Redações, CSV/APKG, sessão de Revisão, suporte com print/protocolo,
Calendar bidirecional básico, Lugares manual, responsividade e isolamento. Toda
a massa `TESTE FINAL` foi removida, preservando contas, conexões e agenda real.
O ajuste foi publicado em `ea77467`; CI e build passaram, e a busca por
`Dom Casmurro` retornou resultados do Open Library e Google Books no deploy,
sem carregamento infinito. Pendências externas:
`GOOGLE_MAPS_API_KEY`, fontes de Anime/Mangá, SMTP/domínio e abertura deliberada
do cadastro.

Revisão responsiva de 2026-09-09: o limite anterior de 1480 px recolhia a coluna
também em notebooks. Corrigido para menos de 1024 px em CSS e JavaScript; a
partir de 1024 px a coluna permanece fixa nas rotas comuns. Navegação mantém
rolagem própria quando necessário. Publicado em `f7fffc1`: 95 testes, typecheck,
build e lint do recorte aprovados. Home conferida em 360, 1024, 1366, 1440 e
1920 px; Biblioteca e abertura/fechamento do painel conferidos em tela compacta,
com retorno ao layout de notebook ao ampliar. Próxima ação: demais casos de
homologação funcional em `teste.md`.

A matriz entre as duas contas passou para leitura em Agenda, Idiomas, Saúde,
Finanças, Lugares e Treino. Ao testar URLs conhecidas da conta secundária na
principal, foi descoberta uma lacuna de integridade: o RLS escondia os dados,
mas as FKs simples ainda permitiam tentar criar um registro próprio apontando
para um pai de outra conta. A correção de defesa em profundidade foi publicada
(DEC-081): páginas dinâmicas bloqueiam pais alheios, mutações repetem
`user_id` e a migration `20260908000100` transforma dez relações do Treino em
FKs compostas por usuário. Reset completo, 22 testes SQL, 93 testes Node,
typecheck, build de 47 páginas e lint do recorte passaram. O precheck encontrou
uma única sessão vazia criada pelo teste antigo; ela foi removida com
confirmação. A migration foi aplicada em produção, o dry-run final voltou vazio
e as três URLs cruzadas de módulo, exercícios e academia passaram a bloquear os
formulários. A massa temporária de Agenda, Idiomas, Saúde, Finanças, Lugares
e Treino foi removida pela interface após confirmação; a checagem final
retornou zero marcadores nos seis módulos. A rodada posterior manteve 93 testes
Node, typecheck e build de 47 páginas aprovados. Próxima ação: continuar os
casos ainda não homologados de `teste.md`, preservando dados reais e usando a
conta secundária para novas massas descartáveis.

A rodada responsiva autenticada passou sem erro nem rolagem horizontal em 13
páginas a 360 px; Home também passou nos temas Lua e Sol, e a coluna pessoal
apareceu corretamente a 1840 px. Gabriel escolheu corrigir o bloqueio abaixo de
1481 px com um perfil compacto no canto superior direito, reunindo
Configurações, atmosfera e Sair. A implementação local passou nos 93 testes
Node, typecheck, build de 47 páginas e lint do arquivo alterado. O commit
`85bbdf1` foi publicado e a conferência autenticada passou em 360, 1440 e
1840 px, incluindo abertura do perfil, atmosfera e fechamento por `Esc`, sem
duplicar o controle na tela larga. Após conferir o resultado, Gabriel preferiu
substituir o perfil compacto por um botão de três linhas ao lado da navegação,
que abre a coluna pessoal completa como painel lateral inclusive na Biblioteca.
A revisão foi publicada nos commits `89b5477` e `1d7c618`; 95 testes Node,
typecheck, build de 47 páginas e lint do recorte passaram. Em produção, o painel
abriu completo na Home e na Biblioteca a 1100 px, a troca para a Biblioteca foi
direta, `Esc` fechou e devolveu o foco ao menu, e o conteúdo fechado deixou de
ser exposto ao leitor de tela. Próxima ação: continuar os casos ainda não
homologados de `teste.md` com a conta secundária.

Defesa em profundidade de isolamento foi publicada no commit `b5bdf2f`
(DEC-080):
APIs privilegiadas ganharam contrato de autenticação/escopo coberto pela CI;
relações e limite de anexos de suporte repetem o usuário; exclusões lógicas e
helpers genéricos de Storage recusam alvos fora da sessão. A rodada local passou
com 91 testes, typecheck, build de 47 páginas e lint do recorte; GitHub Actions
e deploy Vercel passaram. Oito APIs de produção sem sessão responderam `401`.
O reteste autenticado seguinte começou pela Agenda, mas o controle do Edge
desconectou antes da criação da massa temporária e o CAPTCHA não concluiu no
navegador interno. Retomar na conta secundária, sem tocar na Agenda preservada
da conta principal.

Operar inicialmente sem custo: manter o endereço `*.vercel.app`, cadastro
público fechado e testes restritos. Gabriel definiu **Projeto Pessoal** como
nome provisório e adiou compra de domínio, marca e telefone público. Um domínio
próprio será necessário mais adiante para e-mail de autenticação confiável a
usuários externos; sem ele, não configurar SMTP/Resend nem abrir cadastro.
Nenhuma autorização de uma etapa vale automaticamente para Git/deploy ou
abertura.

O download JSON e a ferramenta operacional de exclusão foram publicados no
commit `af8486b`. Typecheck, 84 testes Node, build, lint do recorte, sintaxe da
ferramenta, reset completo e 21 testes SQL passaram. O teste-base também foi
atualizado para as 71 tabelas e sete buckets já existentes após o suporte. A
migration `20260907000100` foi a única listada no dry-run remoto, foi aplicada
com autorização e teve dry-run final vazio. O deploy de produção ficou `Ready`
no mesmo commit, o site respondeu 200 e a rota de exportação recusou acesso sem
sessão com 401. Próxima ação: fazer o smoke autenticado do download e ensaiar
exportação/exclusão somente com conta descartável. Em paralelo, concluir
recuperação de senha e a matriz de isolamento de `teste.md`.

O smoke autenticado da exportação passou na conta principal e, em 2026-09-08,
também na conta descartável: protocolo e histórico foram criados, o JSON foi
baixado e validado sem campos de token, segredo, senha ou cookie. A conta
descartável não possuía registros nem arquivos; foi excluída pelo Supabase Auth,
sumiu da listagem e passou a receber “E-mail ou senha incorretos” no login. A
recuperação da conta principal também entregou o e-mail esperado; nenhum link
foi aberto e nenhuma senha foi trocada.

Otimização de novos uploads foi publicada no commit `a8aa37f` (DEC-079): WebP com
redimensionamento por finalidade, preservação do original quando ele for menor,
e nenhuma alteração automática dos arquivos antigos. Typecheck, 86 testes,
build e lint do recorte passaram; os três avisos do lint em Shape já existiam.
CI e deploy de produção aprovados. A comparação visual em produção aprovou o
WebP gerado a partir de uma imagem real, sem perda perceptível na inspeção
realizada. A conta de teste foi preservada após uma matriz representativa de
CRUD, relacionamento e Storage: Projetos e Shape ficaram invisíveis entre
contas, a URL sem assinatura foi recusada e toda a massa temporária foi
removida. Continuar os casos por módulo e os testes manuais externos ainda
abertos em `teste.md`.

Plano e testes: [ABERTURA_PUBLICA.md](ABERTURA_PUBLICA.md). Estrutura e arquivos:
[MAPA_DO_PROJETO.md](MAPA_DO_PROJETO.md). Histórico anterior:
[archive/TASKS_HISTORY_2026-08.md](archive/TASKS_HISTORY_2026-08.md).
