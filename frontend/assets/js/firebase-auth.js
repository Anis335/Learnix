import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, reauthenticateWithPopup, signOut, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoQUxfVi0M5IgHwPFvTilvVfpmflf_xdI",
  authDomain: "studyhub-portal.firebaseapp.com",
  projectId: "studyhub-portal",
  storageBucket: "studyhub-portal.firebasestorage.app",
  messagingSenderId: "31685151584",
  appId: "1:31685151584:web:033d4c4f2b3adc4cc72c05"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

/* Every document lives under users/{uid}/... so each Google account has its own separate database. */
const stateRef = uid => doc(db, "users", uid, "private", "appState");
const privateRef = uid => collection(db, "users", uid, "private");
const chatsRef = uid => collection(db, "users", uid, "chats");
const notesRef = uid => collection(db, "users", uid, "notes");
const need = () => { const u = auth.currentUser; if (!u) throw new Error("Sign in required"); return u; };
const clean = v => JSON.parse(JSON.stringify(v));
let deleting = false;

async function deleteAllIn(colRef) {
  const snap = await getDocs(colRef);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

window.learnixAuth = {
  auth, db,
  get user() { return auth.currentUser; },
  get deleting() { return deleting; },

  async signIn() {
    try { return await signInWithPopup(auth, provider); }
    catch (e) {
      if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw e;
    }
  },
  signOut: () => signOut(auth),

  async loadState() {
    const u = need();
    const s = await getDoc(stateRef(u.uid));
    if (!s.exists()) return null;           /* brand-new account: caller creates a fresh database */
    const state = s.data().state || {};
    const ns = await getDocs(notesRef(u.uid));
    state.notes = ns.docs.map(d => ({ id: d.id, ...d.data() }));
    return state;
  },

  async saveState(state) {
    if (deleting) return;
    const u = need();
    const payload = clean(state);
    const notes = Array.isArray(payload.notes) ? payload.notes : [];
    delete payload.notes;
    const now = new Date().toISOString();
    await setDoc(stateRef(u.uid), { state: payload, updatedAt: now });
    await Promise.all(notes.map(n => setDoc(doc(notesRef(u.uid), String(n.id)), {
      title: String(n.title || "Untitled").slice(0, 120),
      subject: String(n.subject || "General").slice(0, 80),
      body: String(n.body || ""),
      language: String(n.language || "English").slice(0, 40),
      updatedAt: now
    })));
    const existing = await getDocs(notesRef(u.uid));
    const keep = new Set(notes.map(n => String(n.id)));
    await Promise.all(existing.docs.filter(d => !keep.has(d.id)).map(d => deleteDoc(d.ref)));
  },

  async listChats() {
    const u = need();
    const snap = await getDocs(query(chatsRef(u.uid), orderBy("updatedAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async saveChat(chat) {
    if (deleting) return;
    const u = need();
    if (!chat || !chat.id) throw new Error("Chat ID is required");
    await setDoc(doc(chatsRef(u.uid), chat.id), {
      title: String(chat.title || "New chat").slice(0, 100),
      messages: Array.isArray(chat.messages) ? chat.messages.slice(-40).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", text: String(m.text || "").slice(0, 20000) })) : [],
      updatedAt: new Date().toISOString()
    });
  },
  async deleteChat(id) { const u = need(); await deleteDoc(doc(chatsRef(u.uid), id)); },
  async deleteAllChats() { const u = need(); await deleteAllIn(chatsRef(u.uid)); },

  /* Permanently removes the user's whole database and then the Google-linked Firebase account. */
  async deleteAccountData() {
    let u = need();
    deleting = true;                          /* stops any pending save from re-creating data */
    try {
      try { await reauthenticateWithPopup(u, provider); }   /* Firebase requires a fresh sign-in before deleting an account */
      catch (e) { if (e && e.code === "auth/user-mismatch") throw new Error("Please choose the same Google account you are signed in with."); throw e; }
      u = need();
      const uid = u.uid;
      await Promise.all([deleteAllIn(chatsRef(uid)), deleteAllIn(notesRef(uid)), deleteAllIn(privateRef(uid))]);
      await deleteUser(u);
    } catch (e) { deleting = false; throw e; }
  }
};

onAuthStateChanged(auth, async user => {
  let detail;
  if (!user) detail = { user: null };
  else {
    try { detail = { user, state: await window.learnixAuth.loadState() }; }
    catch (error) { detail = { user, state: null, error: error.message || "Could not load your data." }; }
  }
  window.__learnixAuthDetail = detail;        /* lets pages that load later see the current sign-in state */
  window.dispatchEvent(new CustomEvent("learnix-auth", { detail }));
});

getRedirectResult(auth).catch(() => {});
window.googleAuthSignIn = () => window.learnixAuth.signIn();
