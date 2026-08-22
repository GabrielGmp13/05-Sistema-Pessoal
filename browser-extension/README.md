# Extensão Edge/Chrome — Salvar na Biblioteca

A extensão abre o Sistema Pessoal com URL e título pré-preenchidos. Ela não lê a sessão do site, não armazena credenciais e não salva o item sozinha: o login e a confirmação final continuam dentro do app.

## Instalar localmente

### Google Chrome

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `browser-extension` deste repositório.
5. Fixe **Salvar no Sistema Pessoal** na barra do navegador, se desejar.

### Microsoft Edge

1. Abra `edge://extensions`.
2. Ative **Modo de desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `browser-extension` deste repositório.
5. Fixe a extensão na barra do navegador, se desejar.

Depois de atualizar os arquivos locais, volte à página de extensões e clique em **Recarregar** no card da extensão.

Não é necessário compactar, publicar em loja ou configurar segredo. A pasta
deve continuar inteira, contendo `manifest.json`, popup, opções e service worker.

## Configurar o endereço

1. Clique no ícone da extensão e em **Configurar endereço** — ou abra **Detalhes > Opções da extensão**.
2. Informe somente a origem HTTPS publicada, por exemplo `https://seu-site.vercel.app`.
3. Clique em **Salvar**.

Não inclua `/biblioteca`, parâmetros ou uma barra de rota. `http://localhost` também é aceito apenas para desenvolvimento local.

## Enviar um Artigo

1. Abra uma página comum com endereço `http` ou `https`.
2. Clique no ícone e em **Enviar página atual**, ou use o botão direito e **Salvar no Sistema Pessoal**.
3. A Biblioteca abre no formulário de Artigo com URL e título preenchidos.
4. Revise os metadados e clique em salvar dentro do site.

## Enviar um Vídeo do YouTube

1. Abra um vídeo em `youtube.com` ou `youtu.be`.
2. Use o ícone ou o menu de contexto da extensão.
3. A Biblioteca abre no formulário de Vídeo. Quando a API do YouTube estiver configurada no deploy, o site pode completar os metadados disponíveis.
4. Revise e salve dentro do site.

## Resultado esperado e limites

- Se o usuário não estiver autenticado, o próprio site solicita login.
- O item aparece na Biblioteca somente depois da confirmação no formulário.
- Páginas internas do navegador, arquivos locais e endereços sem `http`/`https` não podem ser enviados.
- A extensão não faz scraping, OAuth ou autenticação própria e não contém token, senha ou segredo de API.

## Checklist de homologação

1. Antes de configurar, clicar em enviar e confirmar que a extensão abre as opções.
2. Salvar a origem HTTPS do deploy e reabrir o popup para conferir o domínio.
3. Em um artigo, usar popup e menu de contexto; ambos devem abrir a categoria Artigos com URL/título preenchidos.
4. Em um vídeo `youtube.com` ou `youtu.be`, repetir e confirmar a categoria Vídeos.
5. Estando deslogado, confirmar que o site pede login e preserva o fluxo de revisão.
6. Tentar uma página interna `edge://`/`chrome://`; o popup deve rejeitar sem abrir item.
