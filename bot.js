// ============================================================
//  🤖  LÓGICA DO BOT + GERAÇÃO DO CRACHÁ
//  Identidade visual: Do Deserto à Ressurreição
// ============================================================
import { CONFIG } from './config.js'

export const BotState = {
  WELCOME:    'WELCOME',
  ASK_PHOTO:  'ASK_PHOTO',
  PROCESSING: 'PROCESSING',
  DONE:       'DONE',
}

export class Bot {
  constructor(onMessage, onShowUpload, onBadgeReady) {
    this.state        = BotState.WELCOME
    this.userName     = ''
    this.onMessage    = onMessage
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
        () => { this.state = BotState.ASK_PHOTO; this.onShowUpload() }
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
        const badgeDataUrl = await generateBadge(previewUrl, this.userName)
        this.state = BotState.DONE
        const doneMsg = CONFIG.messages.done.replace(/\*\{name\}\*/g, this.userName).replace(/\{name\}/g, this.userName)
        this.onMessage(doneMsg, 'bot')
        this.onBadgeReady(badgeDataUrl)
      } catch (err) {
        console.error(err)
        this.state = BotState.ASK_PHOTO
        this.onMessage(CONFIG.messages.errorNoFace, 'bot')
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
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ────────────────────────────────────────────────────────────
//  Gera o crachá com a identidade visual do retiro
//  Paleta: roxo profundo + dourado + âmbar (cruz e folhas)
// ────────────────────────────────────────────────────────────
async function generateBadge(photoDataUrl, userName) {
  const { badge, eventName, eventSubtitle } = CONFIG
  const { width, height, photoX, photoY, photoSize, photoRadius } = badge

  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // ── 1. Fundo roxo com gradiente do evento ────────────────
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0,   '#3d1f6e')
  bg.addColorStop(0.5, '#2d1260')
  bg.addColorStop(1,   '#1e0a45')
  ctx.fillStyle = bg
  roundRect(ctx, 0, 0, width, height, 20)
  ctx.fill()

  // Textura de luz sutil
  const light = ctx.createRadialGradient(width * 0.25, height * 0.2, 0, width * 0.25, height * 0.2, width * 0.8)
  light.addColorStop(0, 'rgba(120,60,180,0.35)')
  light.addColorStop(1, 'transparent')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, width, height)

  // ── 2. Faixa dourada superior ────────────────────────────
  const topBar = ctx.createLinearGradient(0, 0, width, 0)
  topBar.addColorStop(0, '#8b6020')
  topBar.addColorStop(0.5, '#d4a843')
  topBar.addColorStop(1, '#8b6020')
  ctx.fillStyle = topBar
  ctx.fillRect(0, 0, width, 5)

  // ── 3. CRUZ decorativa no canto superior direito ─────────
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#c87030'
  // Vertical
  roundRect(ctx, 490, 18, 16, 110, 6)
  ctx.fill()
  // Horizontal
  roundRect(ctx, 462, 46, 72, 16, 6)
  ctx.fill()
  ctx.restore()

  // Cruz menor (mais visível)
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#c87030'
  roundRect(ctx, 494, 22, 8, 56, 4)
  ctx.fill()
  roundRect(ctx, 470, 38, 56, 8, 4)
  ctx.fill()
  ctx.restore()

  // ── 4. Folhas decorativas (canto superior direito) ───────
  drawLeaves(ctx, 380, 30, 0.7)

  // ── 5. Cabeçalho de texto do evento ──────────────────────
  ctx.textAlign = 'center'
  ctx.font = '700 10px Lato, sans-serif'
  ctx.letterSpacing = '3px'
  ctx.fillStyle = 'rgba(212,168,67,0.7)'
  ctx.fillText('RETIRO QUARESMAL ONLINE', width / 2, 38)
  ctx.letterSpacing = '0px'

  ctx.font = 'italic 600 22px Cormorant Garamond, Georgia, serif'
  ctx.fillStyle = '#f5eedd'
  ctx.fillText('Do Deserto à Ressurreição', width / 2, 68)

  // Linha divisória dourada
  const divGrad = ctx.createLinearGradient(80, 0, width - 80, 0)
  divGrad.addColorStop(0, 'transparent')
  divGrad.addColorStop(0.3, 'rgba(212,168,67,0.6)')
  divGrad.addColorStop(0.7, 'rgba(212,168,67,0.6)')
  divGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = divGrad
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 88)
  ctx.lineTo(width - 80, 88)
  ctx.stroke()

  // Losango central na linha
  ctx.save()
  ctx.fillStyle = '#d4a843'
  ctx.translate(width / 2, 88)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-4, -4, 8, 8)
  ctx.restore()

  // ── 6. Foto do participante ───────────────────────────────
  const photo = await loadImage(photoDataUrl)
  ctx.save()
  roundRectClip(ctx, photoX, photoY, photoSize, photoSize, photoRadius)

  // Cover fit
  const asp = photo.width / photo.height
  let sx = 0, sy = 0, sw = photo.width, sh = photo.height
  if (asp > 1) { sw = photo.height; sx = (photo.width - sw) / 2 }
  else         { sh = photo.width;  sy = (photo.height - sh) / 2 }
  ctx.drawImage(photo, sx, sy, sw, sh, photoX, photoY, photoSize, photoSize)

  // Gradiente na base da foto para o nome
  const photoGrad = ctx.createLinearGradient(0, photoY + photoSize * 0.52, 0, photoY + photoSize)
  photoGrad.addColorStop(0, 'transparent')
  photoGrad.addColorStop(1, 'rgba(30,10,60,0.92)')
  ctx.fillStyle = photoGrad
  ctx.fillRect(photoX, photoY, photoSize, photoSize)
  ctx.restore()

  // Borda na foto
  ctx.strokeStyle = 'rgba(212,168,67,0.35)'
  ctx.lineWidth = 1.5
  roundRect(ctx, photoX, photoY, photoSize, photoSize, photoRadius)
  ctx.stroke()

  // ── 7. Nome do participante ───────────────────────────────
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = 18

  ctx.font = 'italic 400 14px Lato, sans-serif'
  ctx.fillStyle = 'rgba(212,168,67,0.8)'
  ctx.letterSpacing = '2px'
  ctx.fillText('PARTICIPANTE', width / 2, photoY + photoSize - 60)
  ctx.letterSpacing = '0px'

  ctx.font = '700 38px Cinzel, Georgia, serif'
  ctx.fillStyle = '#f5eedd'
  ctx.fillText(userName, width / 2, photoY + photoSize - 24)
  ctx.shadowBlur = 0

  // ── 8. Faixa inferior com data ───────────────────────────
  const footerY = photoY + photoSize + 20
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  roundRect(ctx, 40, footerY, width - 80, 64, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(212,168,67,0.2)'
  ctx.lineWidth = 1
  roundRect(ctx, 40, footerY, width - 80, 64, 12)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#d4a843'
  ctx.font = '700 11px Lato, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText('✦  27 e 28 DE MARÇO  ✦', width / 2, footerY + 28)
  ctx.letterSpacing = '0px'

  ctx.fillStyle = 'rgba(245,238,221,0.4)'
  ctx.font = 'italic 300 13px Cormorant Garamond, Georgia, serif'
  ctx.fillText('Online e ao Vivo · Ordo Amoris', width / 2, footerY + 50)

  // ── 9. Faixa dourada inferior ────────────────────────────
  ctx.fillStyle = topBar
  ctx.fillRect(0, height - 5, width, 5)

  return canvas.toDataURL('image/png')
}

// ── Desenha folhas decorativas no crachá ─────────────────
function drawLeaves(ctx, startX, startY, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha

  // Galho
  ctx.strokeStyle = '#c87030'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(startX + 80, startY)
  ctx.bezierCurveTo(startX + 90, startY + 30, startX + 80, startY + 60, startX + 60, startY + 90)
  ctx.stroke()

  // Galho horizontal
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(startX + 80, startY + 40)
  ctx.lineTo(startX + 130, startY + 20)
  ctx.stroke()

  // Folhas
  const leaves = [
    { x: startX + 128, y: startY + 18, rx: 20, ry: 12, rot: -0.4, color: '#e8922a' },
    { x: startX + 155, y: startY + 8,  rx: 16, ry: 10, rot: -0.2, color: '#d4762a' },
    { x: startX + 108, y: startY + 32, rx: 14, ry: 9,  rot: 0.5,  color: '#e09030' },
    { x: startX + 65,  y: startY + 85, rx: 16, ry: 10, rot: 0.3,  color: '#cd6e22' },
  ]

  leaves.forEach(l => {
    ctx.save()
    ctx.translate(l.x, l.y)
    ctx.rotate(l.rot)
    ctx.fillStyle = l.color
    ctx.beginPath()
    ctx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 0.5
    ctx.stroke()
    ctx.restore()
  })

  ctx.restore()
}

// ── Helpers Canvas ────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function roundRectClip(ctx, x, y, w, h, r) {
  roundRect(ctx, x, y, w, h, r)
  ctx.clip()
}
