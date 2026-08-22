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
