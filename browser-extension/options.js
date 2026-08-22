const campo = document.querySelector('#url')
chrome.storage.sync.get('appBaseUrl').then(({ appBaseUrl }) => { campo.value = appBaseUrl || '' })
document.querySelector('#salvar').addEventListener('click', async () => {
  try {
    const url = new URL(campo.value.trim())
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error()
    await chrome.storage.sync.set({ appBaseUrl: url.origin })
    document.querySelector('#status').textContent = `Endereço salvo: ${url.host}`
    delete document.querySelector('#status').dataset.tone
  } catch {
    document.querySelector('#status').textContent = 'Use a URL HTTPS publicada, sem caminho adicional.'
    document.querySelector('#status').dataset.tone = 'warning'
  }
})
