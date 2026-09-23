const app=document.querySelector("#app");
const installBtn=document.querySelector("#installBtn");
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true});

const activities=[
{title:"Diga o nome",area:"Linguagem",icon:"🐸",goal:"Nomeação"},
{title:"Rimas",area:"Consciência fonológica",icon:"🎵",goal:"Percepção de rimas"},
{title:"Turnos de conversa",area:"Comunicação",icon:"💬",goal:"Participação comunicativa"}
];
let children=[
{name:"Ana (demo)",age:"5 anos",goal:"Linguagem e nomeação",assigned:["Diga o nome","Turnos de conversa"]},
{name:"Pedro (demo)",age:"7 anos",goal:"Consciência fonológica",assigned:["Rimas"]}
];

function childScreen(){
return '<section class="screen"><button class="back" data-home>← Voltar</button><h1>Minha Jornada</h1><p>Olá! Hoje temos uma atividade preparada pela sua fono.</p><div class="child-welcome"><span>🌟</span><div><strong>Vamos brincar?</strong><p>Faça com calma. Tente, escute e divirta-se!</p></div></div><h2>Atividade de hoje</h2><div class="activity-big"><div class="big-icon">🐸</div><div><span class="tag">Linguagem</span><h2>Diga o nome</h2><p>Olhe a figura. Você consegue dizer o nome dela?</p><button class="primary" data-done>Consegui!</button></div></div><div class="card"><strong>⭐ Minha jornada</strong><p>Atividades concluídas hoje: <b id="count">0</b></p><div class="progress"><span id="progressBar"></span></div></div></section>';
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
const checks=activities.map((a)=>'<label class="activity-choice"><input type="checkbox" data-choice="'+a.title+'" '+(c.assigned.includes(a.title)?"checked":"")+'><span>'+a.icon+' <b>'+a.title+'</b><small>'+a.area+' · '+a.goal+'</small></span></label>').join("");
app.innerHTML='<section class="screen"><button class="back" data-prof>← Minhas crianças</button><div class="profile-head"><div class="profile-avatar">🧒</div><div><h1>'+c.name+'</h1><p>'+c.age+' · Meta: <b>'+c.goal+'</b></p></div></div><div class="card"><h2>🎯 Objetivo</h2><p>Definido pela profissional após avaliação. Nesta demonstração: <b>'+c.goal+'</b>.</p></div><div class="card"><h2>🧩 Montar jornada</h2><p>Selecione as atividades que farão parte da jornada.</p>'+checks+'<button class="primary" data-save-plan>Salvar jornada</button></div><div class="card"><h2>📝 Observação</h2><textarea id="note" rows="4" placeholder="Registro demonstrativo da profissional..."></textarea><button class="secondary" data-save-note>Salvar observação</button></div></section>';
document.querySelector("[data-prof]").onclick=()=>{professionalScreen();bind()};
document.querySelector("[data-save-plan]").onclick=()=>{c.assigned=[...document.querySelectorAll("[data-choice]:checked")].map(x=>x.dataset.choice);alert("Jornada salva nesta demonstração.")};
document.querySelector("[data-save-note]").onclick=()=>alert("Observação salva apenas como demonstração nesta tela.");
}

function bind(){
document.querySelector("[data-home]").onclick=home;
const done=document.querySelector("[data-done]");
if(done)done.onclick=()=>{done.textContent="✓ Muito bem!";done.disabled=true;document.querySelector("#count").textContent="1";document.querySelector("#progressBar").style.width="100%"};
const add=document.querySelector("[data-add]");
if(add)add.onclick=newChildForm;
document.querySelectorAll("[data-patient]").forEach(b=>b.onclick=()=>profile(Number(b.dataset.patient)));
}
function show(role){app.innerHTML=role==="child"?childScreen():professionalScreen();bind()}
function home(){location.reload()}
document.querySelectorAll("[data-role]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.role)));
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));