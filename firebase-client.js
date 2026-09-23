// Integração opcional do Firebase para o FonoApoio UBS.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, browserLocalPersistence, setPersistence, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let auth=null;
let db=null;
let configured=false;

function validConfig(config){
  if(!config || typeof config!=="object") return false;
  const required=["apiKey","authDomain","projectId","messagingSenderId","appId"];
  return required.every(key=>typeof config[key]==="string" && config[key].trim() && !config[key].includes("COLOQUE_AQUI") && !config[key].includes("SEU-PROJETO"));
}

export async function initFirebase(){
  const config=window.FONOApoioFirebaseConfig;
  if(!validConfig(config)) return {configured:false,auth:null};
  try{
    const app=initializeApp(config);
    auth=getAuth(app);
    db=getFirestore(app);
    await setPersistence(auth,browserLocalPersistence);
    configured=true;
    return {configured:true,auth,db};
  }catch(error){
    console.error("Falha ao iniciar Firebase",error);
    return {configured:false,auth:null,error};
  }
}
export function currentUser(){ return auth?.currentUser || null; }
export function observeAuth(callback){ return auth ? onAuthStateChanged(auth,callback) : ()=>{}; }
export async function login(email,password){ if(!auth) throw new Error("Firebase não configurado."); return signInWithEmailAndPassword(auth,email,password); }
export async function register(email,password){ if(!auth) throw new Error("Firebase não configurado."); return createUserWithEmailAndPassword(auth,email,password); }
export async function logout(){ if(auth) await signOut(auth); }
export async function loadChildren(){ if(!db || !auth?.currentUser) return []; const snap=await getDocs(query(collection(db,"children"),where("professionalId","==",auth.currentUser.uid))); return snap.docs.map(d=>({id:d.id,...d.data()})); }
export async function saveChild(child){ if(!db || !auth?.currentUser) throw new Error("Usuário não autenticado."); const ref=await addDoc(collection(db,"children"),{...child,professionalId:auth.currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}); return {id:ref.id}; }
export async function saveJourney(childId,assigned){ if(!db || !auth?.currentUser) throw new Error("Usuário não autenticado."); const ref=doc(db,"children",childId); await setDoc(ref,{assigned,updatedAt:serverTimestamp()},{merge:true}); }


