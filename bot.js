// ============================================================
//  🤖  LÓGICA DO BOT + GERAÇÃO DO CRACHÁ
// ============================================================
import { CONFIG } from './config.js'

export const BotState = {
  WELCOME: 'WELCOME',
  ASK_PHOTO: 'ASK_PHOTO',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
}

export class Bot {
  constructor(onMessage, onShowUpload, onBadgeReady) {
    this.state = BotState.WELCOME
    this.userName = ''
    this.onMessage = onMessage
    this.onShowUpload = onShowUpload
    this.onBadgeReady = onBadgeReady
  }

  start() {
    setTimeout(() => {
      const text = CONFIG.messages.welcome.replace('{eventName}', CONFIG.eventName)
      this.onMessage(text, 'bot')
    }, 700)
  }

  handleText(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    if (this.state === BotState.WELCOME) {
      this.userName = trimmed
      this.onMessage(trimmed, 'user')
      this._delayedBotMessage(
        CONFIG.messages.askPhoto.replace(/\{name\}/g, this.userName),
        900,
        () => {
          this.state = BotState.ASK_PHOTO
          this.onShowUpload()
        }
      )
      return
    }

    if (this.state === BotState.DONE) {
      this.onMessage(trimmed, 'user')
      this.state = BotState.WELCOME
      this.userName = ''
      this._delayedBotMessage(CONFIG.messages.restart, 600)
      return
    }
  }

  async handlePhoto(file) {
    if (this.state !== BotState.ASK_PHOTO) return

    this.state = BotState.PROCESSING
    const previewUrl = await readFileAsDataURL(file)
    this.onMessage({ type: 'image', src: previewUrl }, 'user')

    this._delayedBotMessage(CONFIG.messages.processing, 300, async () => {
      try {
        const badgeDataUrl = await generateBadge(previewUrl)
        this.state = BotState.DONE

        const doneMsg = CONFIG.messages.done
          .replace(/\*\{name\}\*/g, this.userName)
          .replace(/\{name\}/g, this.userName)

        this.onMessage(doneMsg, 'bot')
        this.onBadgeReady(badgeDataUrl)
      } catch (err) {
        console.error(err)
        this.state = BotState.ASK_PHOTO
        this.onMessage('Não consegui gerar o crachá. Verifique se o arquivo "badge-base.png" foi enviado para o GitHub na raiz do projeto.', 'bot')
        this.onShowUpload()
      }
    })
  }

  _delayedBotMessage(text, delay, afterCallback) {
    this.onMessage({ type: 'typing' }, 'bot')
    setTimeout(() => {
      this.onMessage({ type: 'remove_typing' }, 'bot')
      this.onMessage(text, 'bot')
      if (afterCallback) afterCallback()
    }, delay + 1000)
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function generateBadge(photoDataUrl) {
  const width = 1080
  const height = 1920

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  // Fundo-base oficial
  const baseImage = await loadImage('./badge-base.png')
  ctx.drawImage(baseImage, 0, 0, width, height)

  // Foto do participante
  const photo = await loadImage(photoDataUrl)

  // Área circular da foto
  const centerX = width / 2
  const centerY = 900
  const radius = 308

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const diameter = radius * 2

  // Escala para preencher o círculo inteiro
  const scale = Math.max(diameter / photo.width, diameter / photo.height)
  const drawWidth = photo.width * scale
  const drawHeight = photo.height * scale

  // Centraliza horizontalmente
  const dx = centerX - drawWidth / 2

  // PRIORIDADE PARA O TOPO:
  // sobe menos a imagem, preservando cabeça e rosto
  // ajuste fino: quanto menor esse valor, mais mostra a parte de cima
  const topOffset = 0.12
  const dy = centerY - radius - ((drawHeight - diameter) * topOffset)

  ctx.drawImage(photo, dx, dy, drawWidth, drawHeight)

  ctx.restore()

  return canvas.toDataURL('image/png')
}
