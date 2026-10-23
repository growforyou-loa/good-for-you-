// Reading history: localStorage for everyone, mirrored to users/{uid}.readHistory for signed-in (non-anonymous) users.
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const KEY = 'gfyReadHistory', MAX = 40;
const local = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const save = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };
const key = e => e.k + ':' + e.id;
async function realUser() {
  for (let i = 0; i < 100 && !window.gfyAuth; i++) await new Promise(r => setTimeout(r, 50));
  const a = window.gfyAuth && gfyAuth.auth; if (!a) return null;
  await a.authStateReady();
  const u = a.currentUser; return u && !u.isAnonymous ? u : null;
}
async function push(l) {
  const u = await realUser(); if (!u) return;
  try { await setDoc(doc(gfyAuth.db, 'users', u.uid), { readHistory: l }, { merge: true }); } catch (e) {}
}
const merge = (a, b) => {
  const m = {}; [...a, ...b].forEach(e => { const o = m[key(e)]; if (!o || e.t > o.t) m[key(e)] = e; });
  return Object.values(m).sort((x, y) => y.t - x.t).slice(0, MAX);
};
let timer;
window.gfyHist = {
  add(e) {
    const l = local(), o = l.find(x => key(x) === key(e));
    const out = [{ ...o, ...e, t: Date.now() }, ...l.filter(x => key(x) !== key(e))].slice(0, MAX);
    save(out); push(out);
  },
  progress(id, p, n) {
    const l = local(), o = l.find(x => x.id === id && x.k !== 'shayari'); if (!o) return;
    o.p = p; o.n = n; o.t = Date.now(); save(l);
    clearTimeout(timer); timer = setTimeout(() => push(local()), 2000);
  },
  async get() {
    let out = local(); const u = await realUser();
    if (u) { try { const s = await getDoc(doc(gfyAuth.db, 'users', u.uid)); out = merge(out, (s.data() || {}).readHistory || []); save(out); push(out); } catch (e) {} }
    return out;
  },
  async clear() { save([]); const u = await realUser(); if (u) try { await setDoc(doc(gfyAuth.db, 'users', u.uid), { readHistory: [] }, { merge: true }); } catch (e) {} }
};
