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
document.querySelector("#childActivity").innerHTML='<article class="activity-player"><div class="activity-number">ATIVIDADE '+(childProgress+1)+'</div><div class="big-icon play-icon">'+a.icon+'</div><span class="tag">'+a.area+'</span><h2>'+a.title+'</h2><p class="activity-instruction">'+a.instruction+'</p>'+content+'<div id="feedback" class="feedback" aria-live="polite"></div></article>';
document.querySelectorAll(".play-choice").forEach(b=>b.onclick=()=>finishChildActivity(b.dataset.answer==="certo"));
const speak=document.querySelector("[data-speak]");
if(speak)speak.onclick=()=>{if("speechSynthesis" in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance("O que você gosta de brincar?"))}};
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
let list=children.map((c,i)=>'<div class="card patient"><div class="patient-avatar">🧒</div><div class="patient-info"><strong>'+c.name+'</strong><small>'+c.age+' · Meta: '+c.goal+'</small></div><button class="secondary" data-patient="'+i+'">Abrir perfil</button></div>').join("");
let acts=activities.map(a=>'<div><span>'+a.icon+'</span><span><b>'+a.title+'</b><small>'+a.area+' · '+a.goal+'</small></span></div>').join("");
return '<section class="screen"><button class="back" data-home>← Voltar</button><h1>Área da Fonoaudióloga</h1><p>Cadastre a criança, defina a meta e monte a jornada.</p><div class="stats"><div><b>'+children.length+'</b><small>Crianças</small></div><div><b>'+activities.length+'</b><small>Atividades</small></div><div><b>0</b><small>Dados reais</small></div></div><div class="section-head"><h2>Minhas crianças</h2><button class="secondary" data-add>+ Nova criança</button></div>'+list+'<div id="patientDetail"></div><div class="card"><strong>📚 Atividades disponíveis</strong><div class="mini-list">'+acts+'</div></div></section>';
}

function newChildForm(){
app.innerHTML='<section class="screen"><button class="back" data-home>← Voltar</button><h1>Nova criança</h1><p>Cadastro demonstrativo. Nenhum dado real deve ser inserido nesta fase.</p><div class="card form-card"><label>Nome da criança<input id="newName" placeholder="Ex.: Maria"></label><label>Idade<input id="newAge" placeholder="Ex.: 6 anos"></label><label>Objetivo inicial<select id="newGoal"><option>Linguagem e nomeação</option><option>Consciência fonológica</option><option>Comunicação</option><option>Outro objetivo</option></select></label><button class="primary" data-create>Criar perfil demonstrativo</button></div></section>';
document.querySelector("[data-home]").onclick=home;
document.querySelector("[data-create]").onclick=()=>{
const name=document.querySelector("#newName").value.trim();
const age=document.querySelector("#newAge").value.trim();
const goal=document.querySelector("#newGoal").value;
if(!name||!age){alert("Preencha nome e idade.");return}
children.push({name:name+" (demo)",age,goal,assigned:[]});
professionalScreen();bind();
};
}

function profile(i){
const c=children[i];
const checks=activities.map(a=>'<label class="activity-choice"><input type="checkbox" data-choice="'+a.title+'" '+(c.assigned.includes(a.title)?"checked":"")+'><span>'+a.icon+' <b>'+a.title+'</b><small>'+a.area+' · '+a.goal+'</small></span></label>').join("");
app.innerHTML='<section class="screen"><button class="back" data-prof>← Minhas crianças</button><div class="profile-head"><div class="profile-avatar">🧒</div><div><h1>'+c.name+'</h1><p>'+c.age+' · Meta: <b>'+c.goal+'</b></p></div></div><div class="card"><h2>🎯 Objetivo</h2><p>Definido pela profissional após avaliação. Nesta demonstração: <b>'+c.goal+'</b>.</p></div><div class="card"><h2>🧩 Montar jornada</h2><p>Selecione as atividades que farão parte da jornada.</p>'+checks+'<button class="primary" data-save-plan>Salvar jornada</button></div><div class="card"><h2>📝 Observação</h2><textarea id="note" rows="4" placeholder="Registro demonstrativo da profissional..."></textarea><button class="secondary" data-save-note>Salvar observação</button></div></section>';
document.querySelector("[data-prof]").onclick=()=>{professionalScreen();bind()};
document.querySelector("[data-save-plan]").onclick=()=>{c.assigned=[...document.querySelectorAll("[data-choice]:checked")].map(x=>x.dataset.choice);alert("Jornada salva nesta demonstração.")};
document.querySelector("[data-save-note]").onclick=()=>alert("Observação salva apenas como demonstração nesta tela.");
}

function bind(){
const homeBtn=document.querySelector("[data-home]");
if(homeBtn)homeBtn.onclick=home;
const add=document.querySelector("[data-add]");
if(add)add.onclick=newChildForm;
document.querySelectorAll("[data-patient]").forEach(b=>b.onclick=()=>profile(Number(b.dataset.patient)));
if(document.querySelector("#childActivity"))renderChildActivity();
}
function show(role){app.innerHTML=role==="child"?childScreen():professionalScreen();bind()}
function home(){location.reload()}
document.querySelectorAll("[data-role]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.role)));
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));