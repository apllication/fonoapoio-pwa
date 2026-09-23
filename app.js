import { initFirebase, currentUser, observeAuth, login, register, logout } from "./firebase-client.js";

let fonoFirebaseReady=false;
let fonoAuthUser=null;
let fonoAuthInitialized=false;

async function setupFirebaseAuth(){
  if(fonoAuthInitialized) return;
  fonoAuthInitialized=true;
  const result=await initFirebase();
  fonoFirebaseReady=result.configured;
  if(!fonoFirebaseReady) return;
  observeAuth(user=>{ fonoAuthUser=user||null; });
}

const PROFESSIONAL_CODE="mav";
const PROFESSIONAL_PASSWORD="256185";

function authScreen(message=""){
  app.innerHTML='<section class="screen"><button class="back" data-home>← Voltar</button><div class="card form-card"><span class="eyebrow">Acesso profissional</span><h1>Área da fonoaudióloga</h1><p>Entre com seu código e senha para acessar a área profissional.</p><label>Código<input id="authCode" type="text" autocomplete="username" placeholder="Seu código"></label><label>Senha<input id="authPassword" type="password" autocomplete="current-password" placeholder="Sua senha"></label><button class="primary" data-login>Entrar</button><div id="authStatus" class="save-status" aria-live="polite">\${message}</div><p class="muted">Acesso local de demonstração. Para uso com dados reais de crianças, será necessário ativar uma autenticação segura no servidor.</p></div></section>';
  bindScreen();
  const status=document.querySelector("#authStatus");
  document.querySelector("[data-login]").onclick=()=>{
    const code=document.querySelector("#authCode").value.trim().toLowerCase();
    const password=document.querySelector("#authPassword").value;
    if(code===PROFESSIONAL_CODE && password===PROFESSIONAL_PASSWORD){
      sessionStorage.setItem("fonoProfessionalAccess","1");
      showProfessional();
    }else{
      status.textContent="Código ou senha incorretos.";
    }
  };
}
const app=document.querySelector("#app");
const installBtn=document.querySelector("#installBtn");
let deferredPrompt=null;

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn?.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true});

const activities=[
 {title:"Nomeando animais",area:"Linguagem",icon:"🐶",goal:"Vocabulário e nomeação",kind:"name",age:"3–5 anos",instruction:"Diga o nome do animal e, se conseguir, conte uma característica."},
 {title:"Categorias",area:"Linguagem",icon:"🧺",goal:"Classificação de palavras",kind:"name",age:"4–7 anos",instruction:"Separe as palavras em grupos que combinam."},
 {title:"Complete a frase",area:"Linguagem",icon:"🧩",goal:"Construção de frases",kind:"turn",age:"4–7 anos",instruction:"Complete a frase com uma palavra que faça sentido."},
 {title:"Quem, onde e o quê?",area:"Linguagem",icon:"📖",goal:"Compreensão e narrativa",kind:"turn",age:"5–8 anos",instruction:"Conte quem aparece, onde está e o que aconteceu."},
 {title:"Conte uma história",area:"Linguagem",icon:"📚",goal:"Narrativa",kind:"turn",age:"5–9 anos",instruction:"Conte uma pequena história com começo, meio e fim."},
 {title:"Rimas",area:"Consciência fonológica",icon:"🎵",goal:"Percepção de rimas",kind:"rhyme",age:"5–7 anos",instruction:"Escolha a palavra que combina com o som final."},
 {title:"Bate-palmas",area:"Consciência fonológica",icon:"👏",goal:"Segmentação silábica",kind:"rhyme",age:"4–7 anos",instruction:"Fale a palavra e bata palmas para cada sílaba."},
 {title:"Qual começa igual?",area:"Consciência fonológica",icon:"🔤",goal:"Identificação de som inicial",kind:"rhyme",age:"5–8 anos",instruction:"Encontre a palavra que começa com o mesmo som."},
 {title:"Junte os sons",area:"Consciência fonológica",icon:"🧠",goal:"Fusão de sons",kind:"rhyme",age:"6–8 anos",instruction:"Junte os sons apresentados e descubra a palavra."},
 {title:"Caça às letras",area:"Leitura e escrita",icon:"🔎",goal:"Reconhecimento de letras",kind:"name",age:"5–7 anos",instruction:"Encontre a letra solicitada pela fono."},
 {title:"Som e letra",area:"Leitura e escrita",icon:"🔤",goal:"Relação entre fala e escrita",kind:"name",age:"6–8 anos",instruction:"Diga o som relacionado à letra apresentada."},
 {title:"Leia a palavra",area:"Leitura e escrita",icon:"📚",goal:"Leitura de palavras",kind:"name",age:"6–9 anos",instruction:"Leia a palavra em voz alta."},
 {title:"Complete a palavra",area:"Leitura e escrita",icon:"✏️",goal:"Escrita de palavras",kind:"name",age:"6–9 anos",instruction:"Complete a palavra com a letra que falta."},
 {title:"Minha vez, sua vez",area:"Comunicação social",icon:"💬",goal:"Turnos comunicativos",kind:"turn",age:"4–8 anos",instruction:"Espere sua vez, responda e deixe o outro participar."},
 {title:"Pergunte e responda",area:"Comunicação social",icon:"❓",goal:"Interação comunicativa",kind:"turn",age:"5–9 anos",instruction:"Faça uma pergunta e responda à pergunta do outro."},
 {title:"Consertando a conversa",area:"Comunicação social",icon:"🔧",goal:"Reparo comunicativo",kind:"turn",age:"5–9 anos",instruction:"Se a pessoa não entender, tente explicar de outro jeito."},
 {title:"Como eu me sinto?",area:"Comunicação social",icon:"🙂",goal:"Expressão de emoções",kind:"turn",age:"4–8 anos",instruction:"Conte como você se sente e explique o motivo."},
 {title:"Fale com calma",area:"Fluência",icon:"🌬️",goal:"Consciência da comunicação",kind:"turn",age:"5–10 anos",instruction:"Converse com tranquilidade, seguindo a orientação individual da fono."},
 {title:"Voz confortável",area:"Voz",icon:"🎙️",goal:"Consciência vocal",kind:"turn",age:"6–10 anos",instruction:"Produza uma frase em uma voz confortável, sem forçar."},
 {title:"Consciência da boca",area:"Orofacial",icon:"👄",goal:"Consciência orofacial",kind:"turn",age:"4–8 anos",instruction:"Faça somente os movimentos previamente orientados pela fono."},
 {title:"Nomeie e descreva",area:"Vocabulário",icon:"🧸",goal:"Descrição",kind:"name",age:"5–9 anos",instruction:"Diga o nome e duas características do objeto."},
 {title:"Explique como fazer",area:"Linguagem",icon:"🛠️",goal:"Linguagem funcional",kind:"turn",age:"6–10 anos",instruction:"Explique para outra pessoa como realizar uma tarefa simples."},
 {title:"Antes e depois",area:"Linguagem",icon:"⏳",goal:"Sequência temporal",kind:"turn",age:"5–9 anos",instruction:"Conte o que aconteceu primeiro e o que aconteceu depois."},
 {title:"Palavra diferente",area:"Vocabulário",icon:"🕵️",goal:"Categorias e significado",kind:"name",age:"6–10 anos",instruction:"Encontre a palavra que não pertence ao grupo e explique por quê."},
 {title:"Sinônimos e sentidos",area:"Vocabulário",icon:"🔄",goal:"Flexibilidade lexical",kind:"name",age:"7–10 anos",instruction:"Encontre outra palavra que tenha sentido parecido."},
 {title:"Compreendi?",area:"Compreensão",icon:"👂",goal:"Compreensão auditiva",kind:"turn",age:"5–10 anos",instruction:"Escute a orientação e explique com suas palavras o que deve fazer."},
 {title:"Descrição misteriosa",area:"Linguagem",icon:"🕵️‍♀️",goal:"Descrição e inferência",kind:"turn",age:"6–10 anos",instruction:"Descreva um objeto sem dizer o nome para a outra pessoa descobrir."},
 {title:"História em sequência",area:"Linguagem",icon:"🧩",goal:"Organização narrativa",kind:"turn",age:"5–9 anos",instruction:"Organize os acontecimentos e conte a história na ordem."},
 {title:"Ouça e escolha a figura",area:"Pré-leitura",icon:"👂",goal:"Compreensão auditiva e associação",kind:"name",age:"3–6 anos",instruction:"Escute a palavra falada pela fono e escolha a figura correspondente.",readingLevel:"nao-le"},
 {title:"História com imagens",area:"Pré-leitura",icon:"🖼️",goal:"Narrativa e compreensão",kind:"turn",age:"3–6 anos",instruction:"Observe as imagens, coloque na ordem e conte o que aconteceu.",readingLevel:"nao-le"},
 {title:"Bata palmas para a palavra",area:"Pré-leitura",icon:"👏",goal:"Consciência silábica",kind:"rhyme",age:"4–7 anos",instruction:"Fale a palavra e bata palmas para cada parte.",readingLevel:"nao-le"},
 {title:"Caça ao som inicial",area:"Pré-leitura",icon:"🔊",goal:"Consciência fonológica",kind:"rhyme",age:"4–7 anos",instruction:"Escute o som inicial e escolha a figura que começa igual.",readingLevel:"nao-le"},
 {title:"Junte as sílabas",area:"Começando a ler",icon:"🧩",goal:"Fusão silábica",kind:"rhyme",age:"5–8 anos",instruction:"Junte as sílabas apresentadas e descubra a palavra.",readingLevel:"comecando"},
 {title:"Ligue letra e som",area:"Começando a ler",icon:"🔤",goal:"Relação letra-som",kind:"name",age:"5–8 anos",instruction:"Escolha a letra que representa o som apresentado.",readingLevel:"comecando"},
 {title:"Leia palavras simples",area:"Leitura",icon:"📖",goal:"Leitura de palavras",kind:"name",age:"6–9 anos",instruction:"Leia a palavra em voz alta para a fono.",readingLevel:"palavras"},
 {title:"Leia e responda",area:"Leitura",icon:"📚",goal:"Compreensão leitora",kind:"turn",age:"7–12 anos",instruction:"Leia uma frase ou pequeno texto e responda às perguntas.",readingLevel:"textos"}
];

let children=[
  {name:"Ana (demo)",age:"5 anos",goal:"Linguagem e nomeação",readingLevel:"nao-le",accessCode:"1111",assigned:["Ouça e escolha a figura","História com imagens","Bata palmas para a palavra","Caça ao som inicial"]},
  {name:"Pedro (demo)",age:"7 anos",goal:"Consciência fonológica",readingLevel:"comecando",accessCode:"2222",assigned:["Junte as sílabas","Ligue letra e som"]}
];

let childProgress=0;
let recorder=null;
let recordingChunks=[];
let recordingStartedAt=0;
let recordingUrl=null;
let speechRecognition=null;
let lastRecording=null;
let voiceRecords=[];
let activeChildIndex=0;
let childJourneyActivities=[];
let observationDrafts={};

function normalizeSpeech(text){
  return (text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
}

function recordingSupported(){
  return !!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
}

function speechSupported(){
  return !!(window.SpeechRecognition||window.webkitSpeechRecognition);
}

function recordingPanel(){
  return '<div class="record-panel"><div class="record-title">🎙️ Sua voz</div><p>Grave a resposta para a fono ouvir depois. A análise automática é apenas um apoio e não substitui a avaliação profissional.</p><div class="record-actions"><button class="record-button" data-record type="button">🎙️ Gravar</button><span id="recordTime">0s</span></div><div id="recordStatus" class="record-status" aria-live="polite">Pronto para gravar.</div><audio id="recordAudio" controls hidden></audio><div id="voiceAnalysis" class="voice-analysis" hidden></div></div>';
}

function stopRecording(){
  if(recorder&&recorder.state!=="inactive")recorder.stop();
}

async function toggleRecording(){
  const button=document.querySelector("[data-record]");
  const status=document.querySelector("#recordStatus");
  if(!recordingSupported()){
    status.textContent="Este aparelho ou navegador não oferece gravação de voz.";
    return;
  }
  if(recorder&&recorder.state==="recording"){stopRecording();return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    recordingChunks=[];
    recorder=new MediaRecorder(stream);
    recordingStartedAt=Date.now();
    button.textContent="⏹️ Parar gravação";
    button.classList.add("recording");
    status.textContent="Gravando... fale normalmente.";
    recorder.ondataavailable=e=>{if(e.data.size)recordingChunks.push(e.data)};
    recorder.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(recordingChunks,{type:recorder.mimeType||"audio/webm"});
      if(recordingUrl)URL.revokeObjectURL(recordingUrl);
      recordingUrl=URL.createObjectURL(blob);
      lastRecording={blob,duration:Math.max(1,Math.round((Date.now()-recordingStartedAt)/1000))};
      const audio=document.querySelector("#recordAudio");
      audio.src=recordingUrl;
      audio.hidden=false;
      button.textContent="🎙️ Gravar novamente";
      button.classList.remove("recording");
      status.textContent="Gravação pronta. A fono pode ouvir e revisar.";
      analyzeVoice();
    };
    recorder.start();
  }catch(error){
    status.textContent="Não foi possível acessar o microfone. Verifique a permissão do navegador.";
    console.warn(error);
  }
}

function saveVoiceRecord(transcript){
  const current=childJourneyActivities[childProgress];
  voiceRecords.unshift({
    childIndex:activeChildIndex,
    activity:current.title,
    duration:lastRecording?.duration||0,
    transcript:transcript||"",
    when:new Date().toLocaleString("pt-BR"),
    review:"Pendente"
  });
}

function analyzeVoice(){
  const box=document.querySelector("#voiceAnalysis");
  if(!box||!lastRecording)return;
  const a=childJourneyActivities[childProgress];
  box.hidden=false;
  box.innerHTML='<strong>🔎 Análise preliminar</strong><p>Áudio gravado: <b>'+lastRecording.duration+'s</b>. A interpretação clínica deve ser feita pela fonoaudióloga.</p>';
  if(!speechSupported()){
    saveVoiceRecord("");
    box.innerHTML+='<small>Transcrição automática indisponível neste navegador. A gravação pode ser ouvida pela fono.</small>';
    return;
  }
  try{
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    speechRecognition=new Recognition();
    speechRecognition.lang="pt-BR";
    speechRecognition.interimResults=false;
    speechRecognition.maxAlternatives=1;
    speechRecognition.onresult=e=>{
      const transcript=e.results?.[0]?.[0]?.transcript||"";
      saveVoiceRecord(transcript);
      const normalized=normalizeSpeech(transcript);
      let result="Transcrição: “"+transcript+"”";
      if(a.kind==="name"||a.kind==="rhyme"){
        const expected=a.kind==="name"?"sapo":"gato";
        result+='<br><span class="analysis-note">A palavra usada como referência nesta demonstração é <b>'+expected+'</b>. Isso é apenas uma comparação automática do texto reconhecido.</span>';
        result+="<br>"+(normalized.includes(expected)?"🟢 Palavra de referência reconhecida.":"🟡 A palavra de referência não foi reconhecida com segurança.");
      }
      box.innerHTML='<strong>🔎 Análise preliminar</strong><p>'+result+'</p><small>O reconhecimento de voz pode cometer erros e não constitui diagnóstico ou avaliação fonoaudiológica.</small>';
    };
    speechRecognition.onerror=()=>{
      saveVoiceRecord("");
      box.innerHTML='<strong>🔎 Análise preliminar</strong><p>Gravação: <b>'+lastRecording.duration+'s</b>.</p><small>Não foi possível obter uma transcrição automática. A fono pode ouvir a gravação.</small>';
    };
    speechRecognition.start();
  }catch(error){
    saveVoiceRecord("");
  }
}

function homeScreen(){
  return '<section class="hero"><span class="eyebrow">Projeto gratuito</span><h1>FonoApoio UBS</h1><p>Um espaço simples para aproximar <b>criança e fonoaudióloga</b> por meio de atividades planejadas.</p></section><section class="roles" aria-labelledby="roles-title"><h2 id="roles-title">Escolha seu acesso</h2><button class="role-card role-child" data-role="child"><span>🧒</span><div><strong>Sou criança</strong><small>Minha Jornada de atividades</small></div></button><button class="role-card role-pro" data-role="professional"><span>🩺</span><div><strong>Sou fonoaudióloga</strong><small>Planejar, acompanhar e registrar</small></div></button></section><section class="notice"><strong>Um projeto de apoio</strong><p>O aplicativo não diagnostica e não substitui avaliação, atendimento ou decisão clínica da profissional.</p></section>';
}

function childAccessScreen(message=""){
  app.innerHTML='<section class="screen"><button class="back" data-home>← Voltar</button><div class="card form-card"><span class="eyebrow">Acesso da criança</span><h1>Quem vai fazer a jornada?</h1><p>Digite seu nome e o código de acesso entregue pela fono.</p><label>Nome da criança<input id="childAccessName" maxlength="100" autocomplete="off" placeholder="Seu nome"></label><label>Código de acesso<input id="childAccessCode" type="password" inputmode="numeric" maxlength="6" placeholder="Código"></label><button class="primary" type="button" id="childLoginButton">Entrar na minha jornada</button><div id="childAccessStatus" class="save-status" aria-live="polite">'+message+'</div><p class="muted">O código ajuda a proteger a jornada de cada criança.</p></div></section>';
  bindScreen();
  document.querySelector("#childLoginButton").onclick=()=>{
    const name=document.querySelector("#childAccessName").value.trim().toLowerCase();
    const code=document.querySelector("#childAccessCode").value.trim();
    const status=document.querySelector("#childAccessStatus");
    const index=children.findIndex(c=>(c.name||"").trim().toLowerCase()===name && String(c.accessCode||"")===code);
    if(index<0){status.textContent="Nome ou código de acesso incorretos.";return;}
    activeChildIndex=index;
    childJourneyActivities=(children[index].assigned||[]).map(title=>activities.find(x=>x.title===title)).filter(Boolean);
    childProgress=0;
    app.innerHTML=childScreen();
    bindScreen();
    if(childJourneyActivities.length)renderChildActivity();else document.querySelector("#childActivity").innerHTML='<article class="activity-player"><div class="finish-icon">🩺</div><h2>Jornada ainda não preparada</h2><p>A fono ainda não escolheu as atividades para você. Peça ajuda para ela preparar sua jornada.</p></article>';
  };
}
function childScreen(){
  const c=children[activeChildIndex]||{};
  return '<section class="screen child-screen"><button class="back" data-home>← Sair</button><div class="child-title"><span class="sparkle">🌟</span><div><span class="eyebrow">Minha Jornada</span><h1>Olá, '+c.name+'!</h1><p>Estas são as atividades preparadas pela sua fono.</p></div></div><div id="childActivity"></div><div class="card child-progress-card"><div class="progress-top"><strong>⭐ Minha jornada</strong><span id="journeyLabel">0 de '+childJourneyActivities.length+'</span></div><div class="progress"><span id="progressBar"></span></div><p id="journeyMessage">Faça com calma. Tente, escute e divirta-se!</p></div></section>';
}

function renderChildActivity(){
  const a=childJourneyActivities[childProgress];
  if(!a)return;
  const content=a.kind==="name"
    ?'<div class="play-choices"><button class="play-choice" data-answer="certo">🐸<span>Sapo</span></button><button class="play-choice" data-answer="outro">🐶<span>Cachorro</span></button></div>'
    :a.kind==="rhyme"
    ?'<div class="play-choices"><button class="play-choice" data-answer="certo">🐱<span>Gato</span></button><button class="play-choice" data-answer="outro">🚗<span>Carro</span></button></div>'
    :'<div class="conversation-box"><span class="talk-icon">💬</span><p><b>Fono:</b> “O que você gosta de brincar?”</p><button class="primary" data-speak>🔊 Escutar</button></div>';

  document.querySelector("#childActivity").innerHTML='<article class="activity-player"><div class="activity-number">ATIVIDADE '+(childProgress+1)+'</div><div class="big-icon play-icon">'+a.icon+'</div><span class="tag">'+a.area+'</span><h2>'+a.title+'</h2><p class="activity-instruction">'+a.instruction+'</p>'+content+recordingPanel()+'<div id="feedback" class="feedback" aria-live="polite"></div></article>';
  document.querySelectorAll(".play-choice").forEach(b=>b.onclick=()=>finishChildActivity(b.dataset.answer==="certo"));
  const speak=document.querySelector("[data-speak]");
  if(speak)speak.onclick=()=>{if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance("O que você gosta de brincar?");u.lang="pt-BR";speechSynthesis.speak(u)}};
  const record=document.querySelector("[data-record]");
  if(record)record.onclick=toggleRecording;
}

function finishChildActivity(correct){
  const feedback=document.querySelector("#feedback");
  if(feedback){feedback.className="feedback show";feedback.innerHTML=correct?"🌟 Muito bem! Você participou!":"💛 Boa tentativa! Vamos continuar juntos."}
  document.querySelectorAll(".play-choice").forEach(b=>b.disabled=true);
  childProgress++;
  const bar=document.querySelector("#progressBar");
  const label=document.querySelector("#journeyLabel");
  const message=document.querySelector("#journeyMessage");
  if(bar)bar.style.width=Math.min(childProgress/childJourneyActivities.length*100,100)+"%";
  if(label)label.textContent=Math.min(childProgress,childJourneyActivities.length)+" de "+childJourneyActivities.length;
  if(message)message.textContent=childProgress>=childJourneyActivities.length?"Jornada concluída!":"Pronto para a próxima?";
  setTimeout(()=>{
    if(childProgress<childJourneyActivities.length){renderChildActivity()}
    else{
      document.querySelector("#childActivity").innerHTML='<article class="activity-player journey-finished"><div class="finish-icon">🎉</div><h2>Você terminou!</h2><p>Parabéns por participar da jornada de hoje.</p><button class="primary" data-restart>Fazer novamente</button></article>';
      document.querySelector("[data-restart]").onclick=()=>{
        childProgress=0;renderChildActivity();
        document.querySelector("#progressBar").style.width="0%";
        document.querySelector("#journeyLabel").textContent="0 de "+childJourneyActivities.length;
        document.querySelector("#journeyMessage").textContent="Faça com calma. Tente, escute e divirta-se!";
      };
    }
  },450);
}

function newChildForm(){
  app.innerHTML='<section class="screen"><button class="back" data-professional>← Voltar</button><div class="card form-card"><span class="eyebrow">Cadastro</span><h1>Nova criança</h1><p>Cadastro inicial para organizar o acompanhamento.</p><label>Nome completo<input id="childName" maxlength="100" autocomplete="off" placeholder="Nome da criança"></label><label>Data de nascimento<input id="childBirthDate" type="date"></label><label>Idade<select id="childAge"><option>3 anos</option><option>4 anos</option><option>5 anos</option><option>6 anos</option><option>7 anos</option><option>8 anos</option><option>9 anos</option><option>10 anos</option><option>11 anos</option><option>12 anos</option></select></label><label>Responsável<input id="childGuardian" maxlength="100" placeholder="Nome do responsável"></label><label>Contato do responsável<input id="childContact" maxlength="40" placeholder="Telefone ou outro contato"></label><label>Escola / turma<input id="childSchool" maxlength="120" placeholder="Opcional"></label><label>Origem do encaminhamento<input id="childReferral" maxlength="120" placeholder="UBS, escola, pediatria..."></label><label>Código de acesso da criança<input id="childAccessCode" inputmode="numeric" maxlength="6" pattern="[0-9]{4,6}" placeholder="Ex.: 1234" required></label><label>Nível de leitura<select id="childReadingLevel"><option value="nao-le">🌱 Ainda não lê</option><option value="comecando">🌿 Está começando a ler</option><option value="palavras">📖 Lê palavras</option><option value="textos">📚 Lê frases e textos</option></select></label><label>Objetivo inicial<select id="childGoal"><option>Linguagem e nomeação</option><option>Compreensão de linguagem</option><option>Consciência fonológica</option><option>Fala / sons da fala</option><option>Leitura e escrita</option><option>Comunicação social</option><option>Fluência</option><option>Voz</option><option>Orofacial</option><option>Outro objetivo</option></select></label><label>Observações iniciais<textarea id="childNotes" rows="5" maxlength="1000" placeholder="Informações relevantes..."></textarea></label><button class="primary" type="button" id="createChildButton">Criar cadastro</button><span id="createChildStatus" class="save-status" aria-live="polite"></span></div></section>';
  bindScreen();
  const button=document.querySelector("#createChildButton");
  if(!button)return;
  button.onclick=()=>{
    const name=document.querySelector("#childName").value.trim();
    const accessCode=document.querySelector("#childAccessCode").value.trim();
    const status=document.querySelector("#createChildStatus");
    if(!name){
      status.textContent="Informe o nome da criança.";
      document.querySelector("#childName").focus();
      return;
    }
    if(!/^\d{4,6}$/.test(accessCode)){ status.textContent="Crie um código numérico de 4 a 6 dígitos."; return; }
    children.push({
      name,
      accessCode,
      birthDate:document.querySelector("#childBirthDate").value,
      age:document.querySelector("#childAge").value,
      guardian:document.querySelector("#childGuardian").value.trim(),
      contact:document.querySelector("#childContact").value.trim(),
      school:document.querySelector("#childSchool").value.trim(),
      referral:document.querySelector("#childReferral").value.trim(),
      goal:document.querySelector("#childGoal").value,
      readingLevel:document.querySelector("#childReadingLevel").value,
      notes:document.querySelector("#childNotes").value.trim(),
      assigned:activities.filter(a=>a.readingLevel===document.querySelector("#childReadingLevel").value).slice(0,4).map(a=>a.title)
    });
    status.textContent="✓ Cadastro criado com sucesso.";
    setTimeout(showProfessional,300);
  };
}
function childProfile(index){
  activeChildIndex=index;
  const c=children[index];
  const assigned=new Set(c.assigned||[]);
  const choices=activities.map(a=>'<label class="activity-choice"><input type="checkbox" data-activity="'+a.title+'" '+(assigned.has(a.title)?"checked":"")+'><span>'+a.icon+' <b>'+a.title+'</b><small>'+a.area+' · '+a.goal+' · '+a.age+'</small><em>'+a.instruction+'</em></span></label>').join("");
  const info='<div class="card"><h2>👤 Cadastro</h2><p><b>Nascimento:</b> '+(c.birthDate||"Não informado")+'</p><p><b>Responsável:</b> '+(c.guardian||"Não informado")+'</p><p><b>Contato:</b> '+(c.contact||"Não informado")+'</p><p><b>Escola:</b> '+(c.school||"Não informado")+'</p><p><b>Encaminhamento:</b> '+(c.referral||"Não informado")+'</p><p><b>Nível de leitura:</b> '+({"nao-le":"Ainda não lê","comecando":"Está começando a ler","palavras":"Lê palavras","textos":"Lê frases e textos"}[c.readingLevel]||"Não informado")+'</p><p><b>Observações:</b> '+(c.notes||"Nenhuma")+'</p></div>';
  app.innerHTML='<section class="screen"><button class="back" data-professional>← Área da fono</button><div class="profile-head"><div class="profile-avatar">🧒</div><div><span class="eyebrow">Perfil da criança</span><h1>'+c.name+'</h1><p>'+c.age+' · Meta: '+c.goal+'</p></div></div>'+info+'<div class="card"><h2>🎯 Objetivo e jornada</h2><p>Escolha as atividades que serão disponibilizadas para esta criança.</p><div id="activityChoices">'+choices+'</div><button class="primary" data-save-journey>Salvar jornada</button><span id="saveStatus" class="save-status" aria-live="polite"></span></div></section>';
  bindScreen();
}
function reviewVoice(index){
  const r=voiceRecords[index];
  if(!r)return;
  const current=observationDrafts[index]||"";
  const note=window.prompt("Observação da fono para este registro:",current);
  if(note===null)return;
  observationDrafts[index]=note.trim();
  r.review=note.trim()||"Revisado";
  professionalScreen();
}

const assessmentModules=[["anamnese","Anamnese"],["audicao","Audição"],["receptiva","Linguagem receptiva"],["expressiva","Linguagem expressiva"],["fala","Fala / sons da fala"],["fonologica","Consciência fonológica"],["leitura","Leitura e escrita"],["social","Comunicação social"],["fluencia","Fluência"],["voz","Voz"],["orofacial","Motricidade/orofacial"],["alimentacao","Alimentação/deglutição"],["sintese","Síntese clínica"],["encaminhamentos","Encaminhamentos"],["plano","Plano terapêutico e reavaliação"]];
let assessmentData={};
function assessmentScreen(){
 const cards=assessmentModules.map(m=>'<button class="card assessment-module" data-assessment-module="'+m[0]+'"><strong>'+m[1]+'</strong><small>Registrar observações e evidências</small></button>').join("");
 return '<section class="screen"><button class="back" data-professional-home>← Área profissional</button><span class="eyebrow">Avaliação profissional</span><h1>Avaliação estruturada</h1><p>Registro de apoio para a fonoaudióloga. Não substitui testes padronizados, seus manuais ou julgamento clínico.</p><div class="assessment-grid">'+cards+'</div></section>';
}
function assessmentModuleScreen(id){
 const m=assessmentModules.find(x=>x[0]===id); if(!m)return assessmentScreen();
 const d=assessmentData[id]||{};
 return '<section class="screen"><button class="back" data-assessment-home>← Voltar</button><span class="eyebrow">Domínio de avaliação</span><h1>'+m[1]+'</h1><p>Registre somente o que foi observado ou documentado.</p><label>Resultado / observação<textarea id="assessmentObservation" rows="7" placeholder="Descreva a evidência observada...">'+(d.observation||"")+'</textarea></label><label>Interpretação clínica<textarea id="assessmentInterpretation" rows="5" placeholder="Interpretação da fono...">'+(d.interpretation||"")+'</textarea></label><label>Conduta / próximos passos<textarea id="assessmentPlan" rows="4" placeholder="Conduta definida...">'+(d.plan||"")+'</textarea></label><button class="primary" data-assessment-save="'+id+'">Salvar domínio</button><div id="assessmentSaveStatus" class="save-status"></div></section>';
}
function bindAssessment(){
 document.querySelectorAll("[data-assessment-module]").forEach(b=>b.onclick=()=>{app.innerHTML=assessmentModuleScreen(b.dataset.assessmentModule);bindScreen();});
 document.querySelector("[data-professional-home]")?.addEventListener("click",showProfessional);
 document.querySelector("[data-assessment-home]")?.addEventListener("click",()=>{app.innerHTML=assessmentScreen();bindScreen();});
 document.querySelector("[data-assessment-save]")?.addEventListener("click",()=>{const id=document.querySelector("[data-assessment-save]").dataset.assessmentSave;assessmentData[id]={observation:document.querySelector("#assessmentObservation").value,interpretation:document.querySelector("#assessmentInterpretation").value,plan:document.querySelector("#assessmentPlan").value};document.querySelector("#assessmentSaveStatus").textContent="✓ Salvo nesta demonstração.";});
}
function professionalScreen(){
  const list=children.map((c,i)=>'<div class="card patient"><div class="patient-avatar">🧒</div><div class="patient-info"><strong>'+c.name+'</strong><small>'+c.age+' · Meta: '+c.goal+'</small></div><button class="secondary" data-patient="'+i+'">Abrir perfil</button></div>').join("");
  const assessmentButton="<button class=\"primary\" data-assessment-home>Abrir avaliação estruturada</button>";
  const acts=activities.map(a=>'<div><span>'+a.icon+'</span><span><b>'+a.title+'</b><small>'+a.area+' · '+a.goal+'</small></span></div>').join("");
  const records=voiceRecords.length?voiceRecords.map((r,ri)=>'<div class="voice-record-item"><b>🎙️ '+r.activity+'</b><small>'+r.when+' · '+r.duration+'s</small><p>'+(r.transcript||"Sem transcrição registrada.")+'</p><span class="review-status">'+(r.review||"Pendente")+'</span><button class="secondary small-btn" data-review="'+ri+'">Registrar observação</button></div>').join(""):'<p class="muted">Nenhuma gravação desta demonstração ainda.</p>';
  const user=currentUser();
  const account=user?'<div class="card"><strong>🔐 Acesso seguro</strong><p>Conectada como <b>'+user.email+'</b>.</p><button class="secondary" data-logout>Sair</button></div>':"";
  return account+assessmentButton+'<section class="screen"><button class="back" data-home>← Voltar</button><h1>Área da Fonoaudióloga</h1><p>Cadastre a criança, defina a meta e acompanhe as atividades.</p><div class="stats"><div><b>'+children.length+'</b><small>Crianças</small></div><div><b>'+activities.length+'</b><small>Atividades</small></div><div><b>'+voiceRecords.length+'</b><small>Gravações</small></div></div><div class="section-head"><h2>Minhas crianças</h2><button class="secondary" data-add>+ Nova criança</button></div>'+list+'<div class="card voice-history"><h2>🎙️ Registros de voz</h2><p>Revisão demonstrativa. As gravações ainda não são armazenadas em servidor.</p>'+records+'</div><div class="card"><strong>📚 Atividades disponíveis</strong><div class="mini-list">'+acts+'</div></div></section>';
}

function bindScreen(){
  document.querySelectorAll("[data-home]").forEach(b=>b.onclick=showHome);
  document.querySelectorAll("[data-professional]").forEach(b=>b.onclick=showProfessional);
  bindAssessment();
  document.querySelector("[data-assessment-home]")?.addEventListener("click",()=>{app.innerHTML=assessmentScreen();bindScreen();});
  document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>b.dataset.role==="child"?showChild():showProfessional());
  document.querySelectorAll("[data-patient]").forEach(b=>b.onclick=()=>childProfile(Number(b.dataset.patient)));
  document.querySelectorAll("[data-review]").forEach(b=>b.onclick=()=>reviewVoice(Number(b.dataset.review)));
  const add=document.querySelector("[data-add]");
  if(add)add.onclick=newChildForm;

  const logoutButton=document.querySelector("[data-logout]");
  if(logoutButton)logoutButton.onclick=async()=>{await logout();showHome();};
  const save=document.querySelector("[data-save-journey]");
  if(save)save.onclick=()=>{
    children[activeChildIndex].assigned=[...document.querySelectorAll("[data-activity]:checked")].map(x=>x.dataset.activity);
    const status=document.querySelector("#saveStatus");
    if(status)status.textContent="✓ Salvo nesta demonstração.";
  };
}

function showHome(){
  childProgress=0;
  app.innerHTML=homeScreen();
  bindScreen();
}

function showChild(){ childProgress=0; childJourneyActivities=[]; childAccessScreen(); }

function showProfessional(){
  if(sessionStorage.getItem("fonoProfessionalAccess")!=="1"){
    authScreen();
    return;
  }
  app.innerHTML=professionalScreen();
  bindScreen();
}

showHome();
setupFirebaseAuth();