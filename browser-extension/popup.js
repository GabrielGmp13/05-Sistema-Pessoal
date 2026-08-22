const botaoSalvar = document.querySelector('#salvar')
const destino = document.querySelector('#destino')
const status = document.querySelector('#status')

async function carregarConfiguracao() {
  const { appBaseUrl } = await chrome.storage.sync.get('appBaseUrl')
  if (!appBaseUrl) {
    destino.textContent = 'Endereço do app ainda não configurado.'
    status.textContent = 'Configure o domínio publicado antes do primeiro envio.'
    status.dataset.tone = 'warning'
    return
  }

  destino.textContent = `Destino: ${new URL(appBaseUrl).host}`
  botaoSalvar.disabled = false
}

botaoSalvar.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url || !/^https?:/.test(tab.url)) {
    status.textContent = 'Abra uma página HTTP ou HTTPS para enviar.'
    status.dataset.tone = 'warning'
    return
  }

  botaoSalvar.disabled = true
  status.textContent = 'Abrindo a Biblioteca...'
  delete status.dataset.tone

  try {
    const resposta = await chrome.runtime.sendMessage({
      type: 'salvar-pagina',
      url: tab.url,
      titulo: tab.title || '',
    })
    if (!resposta?.ok) throw new Error(resposta?.mensagem || 'Não foi possível abrir a Biblioteca.')
    status.textContent = 'Biblioteca aberta para revisão.'
    setTimeout(() => window.close(), 350)
  } catch (erro) {
    status.textContent = erro instanceof Error ? erro.message : 'Não foi possível abrir a Biblioteca.'
    status.dataset.tone = 'warning'
    botaoSalvar.disabled = false
  }
})

document.querySelector('#configurar').addEventListener('click', () => chrome.runtime.openOptionsPage())

void carregarConfiguracao()
