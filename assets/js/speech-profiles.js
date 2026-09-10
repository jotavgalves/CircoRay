const PROFILES = {
  normal: {
    tap: [
      "EI. TIRA A MÃO DE MIM.",
      "VOCÊ GOSTA MESMO DE PROVOCAR, NÉ?",
      "CONTINUA TOCANDO. UMA HORA EU RESPONDO.",
      "EU TÔ DE OLHO EM VOCÊ.",
      "SE EU FOSSE VOCÊ, PARAVA POR AÍ.",
      "VOCÊ VEIO JOGAR OU ME IRRITAR?"
    ],
    rapid: [
      "TRÊS VEZES? TÁ PEDINDO PROBLEMA.",
      "PARA DE ME CUTUCAR.",
      "MAIS UMA E EU MUDO AS REGRAS.",
      "VOCÊ NÃO SABE A HORA DE PARAR?"
    ],
    rare: [
      "SETE TOQUES. VOCÊ REALMENTE NÃO TEM MEDO.",
      "ACHOU O SEGREDO. NÃO CONTA PRA NINGUÉM.",
      "VOCÊ NÃO DEVERIA TER FEITO ISSO.",
      "AGORA EU VOU LEMBRAR DE VOCÊ."
    ],
    win: [
      "GANHOU E AINDA VEIO ME PERTURBAR?",
      "NÃO SE ACOSTUME.",
      "UMA VITÓRIA E JÁ FICOU CORAJOSO?"
    ],
    lose: [
      "PERDEU E VEIO PEDIR CARINHO?",
      "EU AVISEI.",
      "VOLTOU PRA APANHAR MAIS UM POUCO?"
    ]
  },
  hardcore: {
    tap: [
      "EU JÁ SEI COMO VOCÊ SE MOVE.",
      "VOCÊ SEMPRE VOLTA PARA O MESMO LUGAR.",
      "CONTINUA. EU GOSTO QUANDO VOCÊ ACHA QUE CONTROLA ALGUMA COISA.",
      "VOCÊ NÃO ESTÁ ME TESTANDO. EU ESTOU TESTANDO VOCÊ.",
      "EU POSSO ESPERAR. VOCÊ É QUEM VAI ERRAR.",
      "CADA TOQUE SEU ME CONTA MAIS SOBRE VOCÊ."
    ],
    rapid: [
      "AGORA EU SEI QUE VOCÊ ESTÁ NERVOSO.",
      "RÁPIDO DEMAIS. PREVISÍVEL DEMAIS.",
      "VOCÊ ESTÁ ME DANDO EXATAMENTE O QUE EU QUERO.",
      "NÃO PRECISA TER PRESSA. VOCÊ VAI ERRAR SOZINHO."
    ],
    rare: [
      "QUANTO MAIS VOCÊ INSISTE, MAIS FÁCIL FICA TE LER.",
      "VOCÊ NÃO ESTÁ APRENDENDO O JOGO. O JOGO ESTÁ APRENDENDO VOCÊ.",
      "AGORA EU JÁ SEI O QUE VOCÊ FAZ QUANDO FICA COM MEDO.",
      "BONITO. REPETE ISSO QUANDO EU ESTIVER CORRENDO ATRÁS DE VOCÊ."
    ],
    win: [
      "VOCÊ VENCEU UMA PARTE. NÃO CONFUNDA ISSO COM SAIR DAQUI.",
      "MELHOROU. QUE PENA.",
      "VOCÊ AINDA ACHA QUE ESSA VITÓRIA É SUA?"
    ],
    lose: [
      "EU DISSE QUE VOCÊ IA ERRAR.",
      "PREVISÍVEL.",
      "EU NEM PRECISEI ME APRESSAR."
    ]
  },
  fury: {
    tap: [
      "TIRA A MÃO DE MIM.",
      "EU MANDEI VOCÊ PARAR.",
      "VOCÊ QUERIA MINHA ATENÇÃO? AGORA TEM.",
      "ME TOCA DE NOVO. EU QUERO VER.",
      "VOCÊ ME IRRITOU.",
      "PARA DE ME TESTAR, DESGRAÇA."
    ],
    rapid: [
      "VOCÊ NÃO ENTENDE QUANDO É PRA PARAR?",
      "CONTINUA. EU VOU PIORAR ISSO PRA VOCÊ.",
      "AGORA NÃO TEM MAIS BRINCADEIRA.",
      "VOCÊ PEDIU. NÃO RECLAMA DEPOIS.",
      "EU NÃO PRECISO SER JUSTO."
    ],
    rare: [
      "AGORA EU VOU JOGAR TAMBÉM.",
      "VOCÊ PASSOU DO LIMITE.",
      "EU POSSO QUEBRAR AS REGRAS QUANDO EU QUISER.",
      "VOCÊ NÃO VAI SAIR DAQUI DO JEITO QUE ENTROU.",
      "EU NÃO TERMINEI COM VOCÊ."
    ],
    win: [
      "VOCÊ ACHOU MESMO QUE TINHA ACABADO?",
      "GANHOU? OLHA DE NOVO.",
      "EU AINDA NÃO DEIXEI VOCÊ IR.",
      "NÃO COMEMORA. EU AINDA ESTOU AQUI."
    ],
    lose: [
      "EU TE AVISEI.",
      "ACABOU.",
      "EU SABIA QUE VOCÊ IA QUEBRAR.",
      "OLHA PRA MIM. EU DISSE QUE IA TE PEGAR."
    ]
  }
};

let lastByKey = new Map();

export function getSpeechMode(){
  const test = new URLSearchParams(location.search).get("test") || "";
  if (document.body?.classList.contains("cr-hardcore-fury") || window.__circorayHardcoreFury === true || test.startsWith("fury")) return "fury";
  if (document.body?.classList.contains("cr-hardcore-armed") || document.getElementById("cr-hardcore")?.classList.contains("open") || test.startsWith("hardcore")) return "hardcore";
  return "normal";
}

export function pickSpeech(category="tap", forcedMode){
  const mode = forcedMode || getSpeechMode();
  const pool = PROFILES[mode]?.[category] || PROFILES[mode]?.tap || PROFILES.normal.tap;
  const key = `${mode}:${category}`;
  const previous = lastByKey.get(key);
  const choices = pool.filter(line => line !== previous);
  const source = choices.length ? choices : pool;
  const line = source[Math.floor(Math.random() * source.length)] || "";
  lastByKey.set(key, line);
  return line;
}

export function getSpeechProfile(mode=getSpeechMode()){
  return PROFILES[mode] || PROFILES.normal;
}

export function initSpeechProfiles(){
  window.CIRCO_SPEECH = {
    mode: getSpeechMode,
    pick: pickSpeech,
    profile: getSpeechProfile
  };
}
