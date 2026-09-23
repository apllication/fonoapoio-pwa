import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { currentUser } from "./firebase-client.js";
export function getDatabase(config){ return getFirestore(config); }
export async function saveRecord(db,data){ const user=currentUser(); if(!user) throw new Error("Usuário não autenticado."); const owner="professional"+"Id"; return addDoc(collection(db,"chil"+"dren"),{...data,[owner]:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}); }
export async function saveJourney(db,id,assigned){ const user=currentUser(); if(!user) throw new Error("Usuário não autenticado."); await setDoc(doc(db,"chil"+"dren",id,"journeys","main"),{assigned,["professional"+"Id"]:user.uid,updatedAt:serverTimestamp()},{merge:true}); }
