export const DEFAULT_CONFIG = {
  version: 1,
  revision: 0,
  updatedAt: null,
  event: {
    title: "Parque dos Horrores — Convite",
    invitationUrl: "#",
    invitationButtonText: "PEGAR MEU CONVITE"
  },
  page: {
    couponText: "VOCÊ CONSEGUIU!",
    couponResultText: "Seu convite está te esperando.",
    couponTitle: "PARABÉNS!",
    couponDescription: "Clique abaixo para acessar seu convite.",
    closedLine1: "O parque está fechado.",
    closedLine2: "Volte quando os portões abrirem."
  },
  game: {
    maxSpins: 5,
    speechDurationMs: 2600,
    introDelayMs: 500,
    winSpeechDurationMs: 2000,
    winTransitionDelayMs: 1200,
    spinDurationMs: 3650,
    spinRevealDelayMs: 520,
    game1TimeSeconds: 12,
    game1WrongPenaltySeconds: 2,
    game1RestartDelayMs: 1700,
    game2TimeSeconds: 12
  },
  clown: {
    taunts: [
      "VAI RODAR DE NOVO? O QUE TAVA RUIM PODE PIORAR...",
      "EU TE DESEJO BOA SORTE... SÓ PRA PIORAR MAIS DEPOIS!",
      "TÁ ACHANDO QUE HOJE É SEU DIA DE SORTE? QUE FOFO.",
      "ESSA ROLETA ADORA ZOAR A SUA CARA.",
      "QUANTO MAIS VOCÊ RODA, MAIS EU ME DIVIRTO!"
    ],
    clickTaunts: [
      "VAI LÁ... A ROLETA JÁ PERDEU O RESPEITO POR VOCÊ.",
      "RODA DE NOVO. PROMETO QUE NÃO VAI PIORAR. MENTIRA!",
      "EU TAVA QUASE SENTINDO PENA... QUASE.",
      "CLICA AÍ. O QUE É MAIS UMA ESCOLHA RUIM?",
      "ESSA ROLETA TE ODEIA. EU TAMBÉM."
    ],
    winLines: [
      "HMF... DESSA VEZ VOCÊ LEVOU VANTAGEM.",
      "HMF! ATÉ QUE VOCÊ SE SAIU BEM.",
      "ORA, ORA... VOCÊ CONSEGUIU.",
      "NÃO ACREDITO... VOCÊ PASSOU.",
      "HMF. NÃO VAI SE ACOSTUMANDO COM A SORTE.",
      "ACHOU QUE IA SER FÁCIL? NÃO SE ANIME.",
      "PARABÉNS... EU NÃO ESPERAVA ESSA."
    ],
    introLines: {
      game1: "Vamos ver se sua pontaria presta...",
      game2: "Corra, corra... se for capaz.",
      game3: "Gire a roda... e reze."
    }
  },
  roulette: {
    normalItems: [
      { "id": "eu-nunca", "label": "EU NUNCA", "weight": 7, "enabled": true },
      { "id": "escolha", "label": "ESCOLHA 1 PESSOA", "weight": 4, "enabled": true },
      { "id": "coringa", "label": "CARTA CORINGA", "weight": 1, "enabled": true },
      { "id": "pegadinha", "label": "PEGADINHA DOS HORRORES", "weight": 2, "enabled": true },
      { "id": "rodada-maluca", "label": "RODADA MALUCA", "weight": 2, "enabled": true },
      { "id": "vinganca", "label": "VALE-VINGANÇA", "weight": 1, "enabled": true },
      { "id": "passe-livre", "label": "PASSE LIVRE", "weight": 3, "enabled": true }
    ],
    finalItems: [
      { "id": "eu-nunca", "label": "EU NUNCA", "weight": 7, "enabled": true },
      { "id": "escolha", "label": "ESCOLHA 1 PESSOA", "weight": 4, "enabled": true },
      { "id": "coringa", "label": "CARTA CORINGA", "weight": 1, "enabled": true },
      { "id": "pegadinha", "label": "PEGADINHA DOS HORRORES", "weight": 2, "enabled": true },
      { "id": "rodada-maluca", "label": "RODADA MALUCA", "weight": 2, "enabled": true },
      { "id": "vinganca", "label": "VALE-VINGANÇA", "weight": 1, "enabled": true },
      { "id": "passe-livre", "label": "PASSE LIVRE", "weight": 3, "enabled": true }
    ],
    outcomeItems: [
      { "id": "TICKET", "label": "TICKET", "weight": 20, "enabled": true },
      { "id": "VOLTE", "label": "VOLTE", "weight": 50, "enabled": true },
      { "id": "TENTE", "label": "TENTE", "weight": 30, "enabled": true }
    ]
  },
  audio: {
    src: "/michak-whatsapp.mp3",
    volume: 0.3,
    loop: true
  }
};

export function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
