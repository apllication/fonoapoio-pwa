const app=document.querySelector("#app");
const installBtn=document.querySelector("#installBtn");
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true});

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
let lastRecording=null;\nlet voiceRecords=[];\nlet activeChildIndex=0;
let observationDrafts={};

function normalizeSpeech(text){return (text||"").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\\s+/g," ").trim()}
function recordingSupported(){return !!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder)}
function speechSupported(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}

function recordingPanel(a){
return '<div class="record-panel"><div class="record-title">🎙️ Sua voz</div><p>Grave a resposta para a fono ouvir depois. A análise automática é apenas um apoio e não substitui a avaliação profissional.</p><div class="record-actions"><button class="record-button" data-record type="button">🎙️ Gravar</button><span id="recordTime">0s</span></div><div id="recordStatus" class="record-status" aria-live="polite">Pronto para gravar.</div><audio id="recordAudio" controls hidden></audio><div id="voiceAnalysis" class="voice-analysis" hidden></div></div>';
}

function stopRecording(){
if(recorder&&recorder.state!=="inactive")recorder.stop();
}

async function toggleRecording(){
const button=document.querySelector("[data-record]");
const status=document.querySelector("#recordStatus");
if(!recordingSupported()){status.textContent="Este aparelho ou navegador não oferece gravação de voz.";return}
if(recorder&&recorder.state==="recording"){stopRecording();return}
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
status.textContent="Gravação pronta. A fono pode ouvir e analisar.";
analyzeVoice();
};
recorder.start();
}catch(error){status.textContent="Não foi possível acessar o microfone. Verifique a permissão do navegador.";console.warn(error)}
}

function analyzeVoice(){
const box=document.querySelector("#voiceAnalysis");
if(!box||!lastRecording)return;
const a=activities[childProgress%activities.length];
box.hidden=false;
box.innerHTML='<strong>🔎 Análise preliminar</strong><p>Áudio gravado: <b>'+lastRecording.duration+'s</b>. Para uma análise clínica de fala, a fono deve ouvir e interpretar a gravação.</p>';
if(speechSupported()){
try{
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
speechRecognition=new Recognition();
speechRecognition.lang="pt-BR";
speechRecognition.interimResults=false;
speechRecognition.maxAlternatives=1;
speechRecognition.onresult=e=>{
const transcript=e.results[0][0].transcript||"";
const normalized=normalizeSpeech(transcript);
let result="Transcrição: “"+transcript+"”";
voiceRecords.unshift({childIndex:activeChildIndex,activity:a.title,duration:lastRecording.duration,transcript,when:new Date().toLocaleString("pt-BR"),review:"Pendente"});
if(a.kind==="name"||a.kind==="rhyme"){
const expected=a.kind==="name"?"sapo":"gato";
result+="<br><span class=\"analysis-note\">A palavra esperada nesta atividade é <b>"+expected+"</b>. Isso é apenas uma comparação automática do texto reconhecido.</span>";
result+="<br>"+(normalized.includes(expected)?"🟢 Palavra esperada reconhecida.":"🟡 A palavra esperada não foi reconhecida com segurança.");
}
box.innerHTML='<strong>🔎 Análise preliminar</strong><p>'+result+'</p><small>O reconhecimento de voz pode cometer erros e não constitui diagnóstico ou avaliação fonoaudiológica.</small>';
};
speechRecognition.onerror=()=>{};
speechRecognition.start();
}catch(error){}
}
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
document.querySelector("#childActivity").innerHTML='<article class="activity-player"><div class="activity-number">ATIVIDADE '+(childProgress+1)+'</div><div class="big-icon play-icon">'+a.icon+'</div><span class="tag">'+a.area+'</span><h2>'+a.title+'</h2><p class="activity-instruction">'+a.instruction+'</p>'+content+recordingPanel(a)+'<div id="feedback" class="feedback" aria-live="polite"></div></article>';
document.querySelectorAll(".play-choice").forEach(b=>b.onclick=()=>finishChildActivity(b.dataset.answer==="certo"));
const speak=document.querySelector("[data-speak]");
if(speak)speak.onclick=()=>{if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance("O que você gosta de brincar?");u.lang="pt-BR";speechSynthesis.speak(u)}}\nconst record=document.querySelector("[data-record]");\nif(record)record.onclick=toggleRecording;
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
setTimeout(()=>{if(childProgress<activities.length){renderChildActivity()}else{document.querySelector("#childActivity").innerHTML='<article class="activity-player journey-finished"><div class="finish-icon">🎉</div><h2>Você terminou!</h2><p>Parabéns por participar da jornada de hoje.</p><button class="primary" data-restart>Fazer novamente</button></article>';document.querySelector("[data-restart]").onclick=()=>{childProgress=0;renderChildActivity();document.querySelector("#progressBar").style.width="0%";document.querySelector("#journeyLabel").textContent="0 de "+activities.length;document.querySelector("#journeyMessage").textContent="Faça com calma. Tente, escute e divirta-se!"}},450);
}

function professionalScreen(){
let list=children.map((c,i)=>"<div class=\"card patient\"><div class=\"patient-avatar\">🧒</div><div class=\"patient-info\"><strong>"+c.name+"</strong><small>"+c.age+" · Meta: "+c.goal+"</small></div><button class=\"secondary\" data-patient=\""+i+"\">Abrir perfil</button></div>").join("");\nlet acts=activities.map(a=>"<div><span>"+a.icon+"</span><span><b>"+a.title+"</b><small>"+a.area+" · "+a.goal+"</small></span></div>").join("");\nlet records=voiceRecords.length?voiceRecords.map((r,ri)=>"<div class=\"voice-record-item\"><b>🎙️ "+r.activity+"</b><small>"+r.when+" · "+r.duration+"s</small><p>"+(r.transcript||"Sem transcrição registrada.")+"</p><span class=\"review-status\">"+r.review+"</span><button class=\"secondary small-btn\" data-review=\""+ri+"\">Registrar observação</button></div>").join(""):"<p class=\"muted\">Nenhuma gravação desta demonstração ainda.</p>";\nreturn "<section class=\"screen\"><button class=\"back\" data-home>← Voltar</button><h1>Área da Fonoaudióloga</h1><p>Cadastre a criança, defina a meta e acompanhe as atividades.</p><div class=\"stats\"><div><b>"+children.length+"</b><small>Crianças</small></div><div><b>"+activities.length+"</b><small>Atividades</small></div><div><b>"+voiceRecords.length+"</b><small>Gravações</small></div></div><div class=\"section-head\"><h2>Minhas crianças</h2><button class=\"secondary\" data-add>+ Nova criança</button></div>"+list+"<div class=\"card voice-history\"><h2>🎙️ Registros de voz</h2><p>Revisão demonstrativa das tentativas. As gravações ainda não são armazenadas em servidor.</p>"+records+"</div><div class=\"card\"><strong>📚 Atividades disponíveis</strong><div class=\"mini-list\">"+acts+"</div></div></section>";\n};