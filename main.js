// ============================================================
//  🚀  PONTO DE ENTRADA — conecta Bot + UI
// ============================================================
import { CONFIG } from './config.js'
import { Bot, BotState } from './bot.js'
import {
  renderMessage,
  renderTextInput,
  renderUploadButton,
  showBadge,
} from './ui.js'

// ── Elementos do DOM ──────────────────────────────────────
const messagesContainer = document.getElementById('messages-container')
const inputArea = document.getElementById('input-area')
const headerName = document.getElementById('event-name-header')
const footerText = document.getElementById('footer-text')

// Atualiza o nome do evento no header
headerName.textContent = CONFIG.eventName
if (footerText) footerText.textContent = `Ordo Amoris · ${CONFIG.eventSubtitle}`

// ── Instancia o Bot ───────────────────────────────────────
const bot = new Bot(
  // onMessage
  (content, sender) => {
    renderMessage(content, sender, messagesContainer)
  },

  // onShowUpload — mostra botão de foto
  () => {
    renderUploadButton(inputArea, (file) => {
      bot.handlePhoto(file)
      // Enquanto processa, limpa a área de input
      inputArea.innerHTML = '<p style="text-align:center;color:var(--c-text3);font-size:13px;padding:14px 0">Gerando seu crachá...</p>'
    })
  },

  // onBadgeReady — mostra o crachá no painel direito
  (dataUrl) => {
    showBadge(dataUrl)
    // Volta para input de texto para o usuário poder recomeçar
    setTimeout(() => {
      renderTextInput(inputArea, (text) => bot.handleText(text))
    }, 1000)
  }
)

// ── Renderiza o input de texto inicial ───────────────────
renderTextInput(inputArea, (text) => bot.handleText(text))

// ── Inicia o bot ─────────────────────────────────────────
bot.start()
