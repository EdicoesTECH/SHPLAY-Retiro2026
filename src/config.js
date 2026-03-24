// ============================================================
//  ⚙️  CONFIGURAÇÃO — Retiro Quaresmal "Do Deserto à Ressurreição"
// ============================================================
export const CONFIG = {
  eventName:     'Do Deserto à Ressurreição',
  eventSubtitle: 'Retiro Quaresmal Online · 27 e 28 de Março',
  eventColor:      '#7a3fa8',
  eventColorLight: '#d4a843',
  eventColorGold:  '#f0cc70',
  eventColorAmber: '#e8922a',

  messages: {
    welcome:
      'Bem-vindo(a) à tua travessia. ✝️\n\nEu sou o guia do *Do Deserto à Ressurreição* e estou aqui para criar o seu crachá oficial do retiro.\n\nPrimeiro, me diz: **qual é o teu nome?**',

    askPhoto:
      '*{name}*, que alegria tê-lo(a) nesta jornada! 🌿\n\nAgora envie uma **foto sua** para eu criar o seu crachá personalizado. Pode ser uma selfie com boa iluminação.\n\nClique abaixo para escolher a foto:',

    processing:
      '✨ Preparando a tua credencial...',

    done:
      '🙏 Pronto, *{name}*!\n\nO seu crachá está criado. Salve e compartilhe com quem você gostaria de ver nesta travessia.',

    errorNoFace:
      'Hmm, não consegui processar essa foto 🌿\n\nTente uma com melhor iluminação e rosto bem visível. Pode tentar novamente?',

    restart:
      'Vamos recomeçar a travessia! Qual é o seu nome?',
  },

  badge: {
    width: 600,
    height: 780,
    photoX: 60,
    photoY: 160,
    photoSize: 480,
    photoRadius: 16,
  },
}
