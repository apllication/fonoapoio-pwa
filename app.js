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
  {title:"Diga o nome",area:"Linguagem",icon:"🐸",goal:"Nomeação",kind:"name",instruction:"Olhe a figura e fale o nome dela."},
  {title:"Rimas",area:"Consciência fonológica",icon:"🎵",goal:"Percepção de rimas",kind:"rhyme",instruction:"Qual palavra combina com o som final?"},
  {title:"Turnos de conversa",area:"Comunicação",icon:"💬",goal:"Participação comunicativa",kind:"turn",instruction:"Agora é sua vez! Responda e depois deixe a outra pessoa falar."}
];

let children=[
  {name:"Ana (demo)",age:"5 anos",goal:"Linguagem e nomeação",assigned:["Diga o nome","Turnos de conversa"]},
  {name:"Pedro (demo)",age:"7 anos",goal:"Consciência fonológica",assigned:["Rimas"]}
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
  const current=activities[childProgress%activities.length];
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
  const a=activities[childProgress%activities.length];
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

function childScreen(){
  return '<section class="screen child-screen"><button class="back" data-home>← Voltar</button><div class="child-title"><span class="sparkle">🌟</span><div><span class="eyebrow">Minha Jornada</span><h1>Vamos brincar?</h1><p>Hoje você tem atividades preparadas pela sua fono.</p></div></div><div id="childActivity"></div><div class="card child-progress-card"><div class="progress-top"><strong>⭐ Minha jornada</strong><span id="journeyLabel">0 de '+activities.length+'</span></div><div class="progress"><span id="progressBar"></span></div><p id="journeyMessage">Faça com calma. Tente, escute e divirta-se!</p></div></section>';
}

function renderChildActivity(){
  const a=activities[childProgress%activities.length];
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
  if(bar)bar.style.width=Math.min(childProgress/activities.length*100,100)+"%";
  if(label)label.textContent=Math.min(childProgress,activities.length)+" de "+activities.length;
  if(message)message.textContent=childProgress>=activities.length?"Jornada de demonstração concluída!":"Pronto para a próxima?";
  setTimeout(()=>{
    if(childProgress<activities.length){renderChildActivity()}
    else{
      document.querySelector("#childActivity").innerHTML='<article class="activity-player journey-finished"><div class="finish-icon">🎉</div><h2>Você terminou!</h2><p>Parabéns por participar da jornada de hoje.</p><button class="primary" data-restart>Fazer novamente</button></article>';
      document.querySelector("[data-restart]").onclick=()=>{
        childProgress=0;renderChildActivity();
        document.querySelector("#progressBar").style.width="0%";
        document.querySelector("#journeyLabel").textContent="0 de "+activities.length;
        document.querySelector("#journeyMessage").textContent="Faça com calma. Tente, escute e divirta-se!";
      };
    }
  },450);
}

function newChildForm(){
  app.innerHTML='<section class="screen"><button class="back" data-professional>← Voltar</button><div class="card form-card"><h1>Nova criança</h1><p>Esta versão ainda usa dados demonstrativos, armazenados somente durante a sessão.</p><label>Nome<input id="childName" maxlength="80" autocomplete="off" placeholder="Nome da criança"></label><label>Idade<select id="childAge"><option>3 anos</option><option>4 anos</option><option>5 anos</option><option>6 anos</option><option>7 anos</option><option>8 anos</option><option>9 anos</option><option>10 anos</option></select></label><label>Objetivo inicial<select id="childGoal"><option>Linguagem e nomeação</option><option>Consciência fonológica</option><option>Comunicação</option><option>Outro objetivo</option></select></label><button class="primary" data-create-child>Criar perfil demonstrativo</button></div></section>';
}

function childProfile(index){
  activeChildIndex=index;
  const c=children[index];
  const assigned=new Set(c.assigned||[]);
  const choices=activities.map(a=>'<label class="activity-choice"><input type="checkbox" data-activity="'+a.title+'" '+(assigned.has(a.title)?"checked":"")+'><span>'+a.icon+' <b>'+a.title+'</b><small>'+a.area+' · '+a.goal+'</small></span></label>').join("");
  const history=voiceRecords.filter(r=>r.childIndex===index);
  const historyHtml=history.length?history.map((r,ri)=>{
    const realIndex=voiceRecords.indexOf(r);
    return '<div class="voice-record-item"><b>🎙️ '+r.activity+'</b><small>'+r.when+' · '+r.duration+'s</small><p>'+(r.transcript||"Sem transcrição registrada.")+'</p><span class="review-status">'+(r.review||"Pendente")+'</span><button class="secondary small-btn" data-review="'+realIndex+'">Registrar observação</button></div>';
  }).join(""):'<p class="muted">Nenhuma tentativa registrada para esta criança.</p>';

  app.innerHTML='<section class="screen"><button class="back" data-professional>← Área da fono</button><div class="profile-head"><div class="profile-avatar">🧒</div><div><h1>'+c.name+'</h1><p>'+c.age+' · Meta: '+c.goal+'</p></div></div><div class="card"><h2>🎯 Objetivo e jornada</h2><p>Selecione as atividades que a fono deseja disponibilizar para esta criança.</p><div id="activityChoices">'+choices+'</div><button class="primary" data-save-journey>Salvar jornada</button><span id="saveStatus" class="save-status" aria-live="polite"></span></div><div class="card voice-history"><h2>🎙️ Histórico de voz</h2><p>'+history.length+' tentativa(s) registrada(s) nesta demonstração.</p>'+historyHtml+'</div></section>';
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
  document.querySelectorAll("[data-professional]").forEach(b=>showProfessional);
  bindAssessment();
  document.querySelector("[data-assessment-home]")?.addEventListener("click",()=>{app.innerHTML=assessmentScreen();bindScreen();});
  document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>b.dataset.role==="child"?showChild():showProfessional());
  document.querySelectorAll("[data-patient]").forEach(b=>b.onclick=()=>childProfile(Number(b.dataset.patient)));
  document.querySelectorAll("[data-review]").forEach(b=>b.onclick=()=>reviewVoice(Number(b.dataset.review)));
  const add=document.querySelector("[data-add]");
  if(add)add.onclick=newChildForm;
  const create=document.querySelector("[data-create-child]");
  if(create)create.onclick=()=>{
    const name=document.querySelector("#childName").value.trim();
    if(!name){alert("Informe o nome da criança.");return;}
    children.push({name:name+" (demo)",age:document.querySelector("#childAge").value,goal:document.querySelector("#childGoal").value,assigned:[]});
    showProfessional();
  };
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

function showChild(){
  childProgress=0;
  app.innerHTML=childScreen();
  bindScreen();
  renderChildActivity();
}

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