// ============================================================
//  💬  RENDERIZADOR DO CHAT
// ============================================================

let typingEl = null

// ── Renderiza uma mensagem no chat ────────────────────────
export function renderMessage(content, sender, container) {
  // Remove typing indicator anterior
  if (content && content.type === 'remove_typing') {
    removeTyping(container)
    return
  }

  // Mostra typing indicator
  if (content && content.type === 'typing') {
    showTyping(container, sender)
    return
  }

  const wrap = document.createElement('div')
  wrap.classList.add('message', sender)

  // Avatar
  const avatar = document.createElement('div')
  avatar.classList.add('msg-avatar')
  avatar.innerHTML = sender === 'bot'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
         <circle cx="12" cy="8" r="3" fill="currentColor"/>
         <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
         <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
         <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
       </svg>`

  // Bubble
  const bubble = document.createElement('div')
  bubble.classList.add('msg-bubble')

  if (content && content.type === 'image') {
    // Mensagem com imagem
    const imgWrap = document.createElement('div')
    imgWrap.classList.add('msg-image')
    const img = document.createElement('img')
    img.src = content.src
    img.alt = 'Foto enviada'
    imgWrap.appendChild(img)
    bubble.appendChild(imgWrap)
  } else {
    // Mensagem de texto (suporta *bold* e quebras de linha)
    bubble.innerHTML = formatText(String(content))
  }

  wrap.appendChild(avatar)
  wrap.appendChild(bubble)
  container.appendChild(wrap)
  scrollToBottom(container)
}

// ── Typing indicator ──────────────────────────────────────
function showTyping(container, sender) {
  removeTyping(container)
  const wrap = document.createElement('div')
  wrap.classList.add('message', sender)
  wrap.id = 'typing-indicator'

  const avatar = document.createElement('div')
  avatar.classList.add('msg-avatar')
  avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3" fill="currentColor"/>
    <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`

  const bubble = document.createElement('div')
  bubble.classList.add('msg-bubble', 'typing-indicator')
  bubble.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `

  wrap.appendChild(avatar)
  wrap.appendChild(bubble)
  container.appendChild(wrap)
  typingEl = wrap
  scrollToBottom(container)
}

function removeTyping(container) {
  const el = container.querySelector('#typing-indicator')
  if (el) el.remove()
  typingEl = null
}

// ── Renderiza input de texto ──────────────────────────────
export function renderTextInput(inputArea, onSend) {
  inputArea.innerHTML = ''
  const row = document.createElement('div')
  row.classList.add('text-input-row')

  const input = document.createElement('input')
  input.type = 'text'
  input.classList.add('text-input')
  input.placeholder = 'Digite sua resposta...'
  input.autofocus = true

  const btn = document.createElement('button')
  btn.classList.add('btn-send')
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`

  const send = () => {
    const val = input.value.trim()
    if (val) { onSend(val); input.value = '' }
  }

  btn.addEventListener('click', send)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send() })

  row.appendChild(input)
  row.appendChild(btn)
  inputArea.appendChild(row)
  input.focus()
}

// ── Renderiza botão de upload de foto ────────────────────
export function renderUploadButton(inputArea, onFileChosen) {
  inputArea.innerHTML = ''

  const btn = document.createElement('button')
  btn.classList.add('btn-upload')
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Escolher foto do dispositivo
  `

  btn.addEventListener('click', () => {
    const fileInput = document.getElementById('file-input')
    fileInput.value = ''
    fileInput.click()
  })

  const fileInput = document.getElementById('file-input')
  fileInput.onchange = (e) => {
    const file = e.target.files[0]
    if (file) onFileChosen(file)
  }

  inputArea.appendChild(btn)
}

// ── Mostra o crachá no painel de preview ──────────────────
export function showBadge(dataUrl) {
  const placeholder = document.getElementById('preview-placeholder')
  const wrapper     = document.getElementById('canvas-wrapper')
  const canvas      = document.getElementById('badge-canvas')
  const btnDownload = document.getElementById('btn-download')
  const btnShare    = document.getElementById('btn-share')

  placeholder.style.display = 'none'
  wrapper.style.display = 'flex'

  const img = new Image()
  img.onload = () => {
    canvas.width  = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
  }
  img.src = dataUrl

  // Download
  btnDownload.onclick = () => {
    const a = document.createElement('a')
    a.download = 'cracha-evento.png'
    a.href = dataUrl
    a.click()
  }

  // Compartilhar (Web Share API ou fallback de download)
  btnShare.onclick = async () => {
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'cracha.png', { type: 'image/png' })
        await navigator.share({ files: [file], title: 'Meu Crachá do Evento' })
      } catch { /* usuário cancelou */ }
    } else {
      // Fallback: abre em nova aba
      window.open(dataUrl, '_blank')
    }
  }
}

// ── Helpers ───────────────────────────────────────────────
function scrollToBottom(container) {
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight
  })
}

function formatText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/\n/g,             '<br/>')
}
