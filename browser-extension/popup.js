document.querySelector('#salvar').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url || !/^https?:/.test(tab.url)) { document.querySelector('#status').textContent = 'Abra uma página HTTP ou HTTPS.'; return }
  await chrome.runtime.sendMessage({ type: 'salvar-pagina', url: tab.url, titulo: tab.title || '' })
  window.close()
})
document.querySelector('#configurar').addEventListener('click', () => chrome.runtime.openOptionsPage())
