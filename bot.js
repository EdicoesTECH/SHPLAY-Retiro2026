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
      this.onMessage(CONFIG.messages.welcome, 'bot')
    }, 500)
  }

  handleText(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    if (this.state === BotState.WELCOME) {
      this.userName = trimmed
      this.onMessage(trimmed, 'user')
      this._delayedBotMessage(
        CONFIG.messages.askPhoto.replace(/\{name\}/g, this.userName),
        700,
        () => {
          this.state = BotState.ASK_PHOTO
          this.onShowUpload()
        }
      )
      return
    }

    if (this.state === BotState.DONE) {
      this.onMessage(trimmed, 'user')
      this.userName = ''
      this.state = BotState.WELCOME
      this._delayedBotMessage(CONFIG.messages.restart, 500)
    }
  }

  async handlePhoto(file) {
    if (this.state !== BotState.ASK_PHOTO) return
    this.state = BotState.PROCESSING

    const previewUrl = await readFileAsDataURL(file)
    this.onMessage({ type: 'image', src: previewUrl }, 'user')

    this._delayedBotMessage(CONFIG.messages.processing, 250, async () => {
      try {
        const badgeDataUrl = await generateBadge(previewUrl, this.userName)
        this.state = BotState.DONE
        this.onMessage(CONFIG.messages.done.replace(/\{name\}/g, this.userName), 'bot')
        this.onBadgeReady(badgeDataUrl)
      } catch (error) {
        console.error(error)
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
    }, delay + 900)
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
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

async function generateBadge(photoDataUrl, userName) {
  const { badge, eventName, eventSubtitle, eventDate } = CONFIG
  const { width, height, safeX, safeY, safeW, photoX, photoY, photoW, photoH, photoRadius } = badge

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#1b122d')
  bg.addColorStop(0.52, '#291741')
  bg.addColorStop(1, '#120c21')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const glowTop = ctx.createRadialGradient(width * 0.2, 120, 50, width * 0.2, 120, 520)
  glowTop.addColorStop(0, 'rgba(223,190,119,0.26)')
  glowTop.addColorStop(1, 'rgba(223,190,119,0)')
  ctx.fillStyle = glowTop
  ctx.fillRect(0, 0, width, 700)

  const glowBottom = ctx.createRadialGradient(width * 0.85, height * 0.9, 80, width * 0.85, height * 0.9, 420)
  glowBottom.addColorStop(0, 'rgba(120,76,180,0.28)')
  glowBottom.addColorStop(1, 'rgba(120,76,180,0)')
  ctx.fillStyle = glowBottom
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  roundRect(ctx, 42, 42, width - 84, height - 84, 44)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.lineWidth = 2
  roundRect(ctx, 42, 42, width - 84, height - 84, 44)
  ctx.stroke()

  drawBranch(ctx, width - 170, 120)

  // Header
  ctx.textAlign = 'center'
  ctx.fillStyle = '#dfbe77'
  ctx.font = '700 30px Inter, sans-serif'
  drawSpacedText(ctx, 'RETIRO QUARESMAL ONLINE', width / 2, safeY + 36, 5)

  ctx.fillStyle = '#f7efe3'
  ctx.font = '600 84px "Cormorant Garamond", serif'
  const titleLines = wrapText(ctx, eventName, safeW, 2)
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, safeY + 122 + idx * 84)
  })

  const subY = safeY + 220
  ctx.strokeStyle = 'rgba(223,190,119,0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(140, subY)
  ctx.lineTo(width - 140, subY)
  ctx.stroke()
  ctx.fillStyle = '#dfbe77'
  ctx.beginPath()
  ctx.arc(width / 2, subY, 6, 0, Math.PI * 2)
  ctx.fill()

  // Copy block above photo
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '500 36px Inter, sans-serif'
  ctx.fillText('O teu caminho para a cura', width / 2, 320)

  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.font = '500 26px Inter, sans-serif'
  ctx.fillText('Uma arte oficial para compartilhar sua travessia', width / 2, 366)

  // Photo area
  const photo = await loadImage(photoDataUrl)
  ctx.save()
  roundRectClip(ctx, photoX, photoY, photoW, photoH, photoRadius)
  drawCoverImage(ctx, photo, photoX, photoY, photoW, photoH)

  const overlay = ctx.createLinearGradient(0, photoY + photoH * 0.58, 0, photoY + photoH)
  overlay.addColorStop(0, 'rgba(18,12,33,0.05)')
  overlay.addColorStop(1, 'rgba(18,12,33,0.88)')
  ctx.fillStyle = overlay
  ctx.fillRect(photoX, photoY, photoW, photoH)
  ctx.restore()

  ctx.strokeStyle = 'rgba(223,190,119,0.28)'
  ctx.lineWidth = 3
  roundRect(ctx, photoX, photoY, photoW, photoH, photoRadius)
  ctx.stroke()

  // Name block over photo
  ctx.textAlign = 'center'
  ctx.fillStyle = '#dfbe77'
  ctx.font = '700 26px Inter, sans-serif'
  drawSpacedText(ctx, 'PARTICIPANTE', width / 2, photoY + photoH - 138, 4)

  fitText(ctx, userName.toUpperCase(), {
    maxWidth: photoW - 120,
    initialSize: 82,
    minSize: 42,
    weight: '700',
    family: 'Inter, sans-serif',
  })
  ctx.fillStyle = '#fff7ea'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 24
  const lines = wrapText(ctx, userName.toUpperCase(), photoW - 120, 2)
  lines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, photoY + photoH - 58 - (lines.length - 1 - idx) * 76)
  })
  ctx.shadowBlur = 0

  // Footer card
  const cardY = 1476
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 84, cardY, 912, 250, 34)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.lineWidth = 2
  roundRect(ctx, 84, cardY, 912, 250, 34)
  ctx.stroke()

  ctx.fillStyle = '#dfbe77'
  ctx.font = '700 28px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Uma travessia guiada para começar sua cura', 132, cardY + 64)

  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.font = '500 31px Inter, sans-serif'
  const footerLines = wrapText(ctx, eventSubtitle, 760, 3)
  footerLines.forEach((line, idx) => {
    ctx.fillText(line, 132, cardY + 118 + idx * 38)
  })

  ctx.fillStyle = '#f7efe3'
  ctx.font = '600 38px "Cormorant Garamond", serif'
  ctx.fillText('Começar minha travessia', 132, cardY + 210)

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(223,190,119,0.95)'
  ctx.font = '700 26px Inter, sans-serif'
  ctx.fillText(eventDate, width - 132, cardY + 210)

  return canvas.toDataURL('image/png')
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const frameRatio = w / h
  let sx = 0, sy = 0, sw = img.width, sh = img.height

  if (imgRatio > frameRatio) {
    sh = img.height
    sw = sh * frameRatio
    sx = (img.width - sw) / 2
  } else {
    sw = img.width
    sh = sw / frameRatio
    sy = (img.height - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function fitText(ctx, text, { maxWidth, initialSize, minSize, weight, family }) {
  let size = initialSize
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) return size
    size -= 2
  }
  ctx.font = `${weight} ${minSize}px ${family}`
  return minSize
}

function wrapText(ctx, text, maxWidth, maxLines = 2) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines

  const trimmed = lines.slice(0, maxLines)
  while (ctx.measureText(trimmed[maxLines - 1] + '…').width > maxWidth && trimmed[maxLines - 1].includes(' ')) {
    trimmed[maxLines - 1] = trimmed[maxLines - 1].split(' ').slice(0, -1).join(' ')
  }
  trimmed[maxLines - 1] += '…'
  return trimmed
}

function drawSpacedText(ctx, text, x, y, spacing = 0) {
  const chars = [...text]
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1)
  let currentX = x - total / 2

  chars.forEach((ch, i) => {
    ctx.fillText(ch, currentX + widths[i] / 2, y)
    currentX += widths[i] + spacing
  })
}

function drawBranch(ctx, x, y) {
  ctx.save()
  ctx.strokeStyle = 'rgba(201,138,67,0.58)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.bezierCurveTo(x + 50, y + 80, x + 70, y + 160, x + 20, y + 260)
  ctx.stroke()

  const leaves = [
    [x + 72, y + 110, 54, 28, -0.45, '#df9b56'],
    [x + 100, y + 84, 40, 22, -0.18, '#c87b3f'],
    [x + 48, y + 154, 36, 20, 0.4, '#d39a5a'],
    [x + 18, y + 218, 42, 22, 0.22, '#b86c35'],
  ]

  leaves.forEach(([lx, ly, rx, ry, rot, color]) => {
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(rot)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  ctx.restore()
}

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
