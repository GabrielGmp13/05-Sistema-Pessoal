const MENU_ID = 'salvar-sistema-pessoal'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_ID, title: 'Salvar no Sistema Pessoal', contexts: ['page', 'link', 'video'] })
})

function tipoDaUrl(url) {
  try {
    const host = new URL(url).hostname
    return host === 'youtu.be' || host.endsWith('youtube.com') ? 'video' : 'artigo'
  } catch { return 'artigo' }
}

async function abrirBiblioteca(url, titulo) {
  const { appBaseUrl } = await chrome.storage.sync.get('appBaseUrl')
  if (!appBaseUrl) { await chrome.runtime.openOptionsPage(); return }
  const destino = new URL('/biblioteca', appBaseUrl)
  destino.searchParams.set('importar', tipoDaUrl(url))
  destino.searchParams.set('url', url)
  if (titulo) destino.searchParams.set('titulo', titulo)
  await chrome.tabs.create({ url: destino.toString() })
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return
  void abrirBiblioteca(info.linkUrl || info.srcUrl || info.pageUrl || '', tab?.title || '')
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'salvar-pagina') void abrirBiblioteca(message.url, message.titulo)
})
