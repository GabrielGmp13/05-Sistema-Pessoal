const campo = document.querySelector('#url')
chrome.storage.sync.get('appBaseUrl').then(({ appBaseUrl }) => { campo.value = appBaseUrl || '' })
document.querySelector('#salvar').addEventListener('click', async () => {
  try {
    const url = new URL(campo.value)
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error()
    await chrome.storage.sync.set({ appBaseUrl: url.origin })
    document.querySelector('#status').textContent = 'Endereço salvo.'
  } catch { document.querySelector('#status').textContent = 'Use uma URL HTTPS válida.' }
})
