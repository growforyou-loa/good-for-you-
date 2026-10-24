// Firebase Auth shim — replaces Netlify Identity. Exposes window.gfyAuth { open, close, on, init, logout }.
import { initializeApp } from "https://gstatic.com";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, updateProfile, signOut,
  GoogleAuthProvider, signInWithPopup, signInAnonymously
} from "https://gstatic.com";
import { getFirestore, doc, setDoc } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyCamlYyzAU79TS-xHxtrC8Pj41KnlxzLio",
  // Updated exactly to your domain growforyou.in
  authDomain: "growforyou.in", 
  projectId: "good-for-you-b4438",
  storageBucket: "good-for-you-b4438.firebasestorage.app",
  messagingSenderId: "186560832330",
  appId: "1:186560832330:web:73867603eb05a5ab9717b3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const handlers = {};
const emit = (ev, data) => (handlers[ev] || []).forEach(fn => fn(data));
const toUser = u => u && ({
  email: u.email,
  created_at: u.metadata?.creationTime,
  user_metadata: { full_name: u.displayName || '' },
  emailVerified: u.emailVerified,
  uid: u.uid,
  photoURL: u.photoURL || '',
  isAnonymous: u.isAnonymous
});

const errText = e => ({
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-login-credentials': 'Wrong email or password.',
  'auth/email-already-in-use': 'This email is already registered. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/network-request-failed': 'Network problem. Check your connection and try again.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups or use email instead.',
  'auth/account-exists-with-different-credential': 'This email is already registered with a different sign-in method.',
  'auth/unauthorized-domain': 'Sign-in is not enabled for this website address yet.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': ''
}[e.code] ?? 'Something went wrong. Please try again.');

let initialized = false, firstEvent = true, signingUp = false;
const api = {
  app, auth, db,
  errText,
  async signIn(email, pass) { await signInWithEmailAndPassword(auth, email, pass); },
  async signUp(name, email, pass) {
    signingUp = true; // hold the 'login' event until the profile + verification email are done
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) await updateProfile(cred.user, { displayName: name });
      try { await setDoc(doc(db, 'users', cred.user.uid), { name: name || '', email, createdAt: cred.user.metadata?.creationTime || '', lastLogin: new Date().toISOString() }, { merge: true }); } catch (e) {}
      try { await sendEmailVerification(cred.user); } catch (e) {}
    } finally { signingUp = false; }
    const u = toUser(auth.currentUser); if (u && !u.isAnonymous) emit('login', u);
  },
  async setPhoto(url) { await updateProfile(auth.currentUser, { photoURL: url }); },
  async anon() { await signInAnonymously(auth); },
  async google() { await signInWithPopup(auth, new GoogleAuthProvider()); },
  async reset(email) { await sendPasswordResetEmail(auth, email); },
  on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
  logout() { return signOut(auth).then(() => emit('logout')); },
  init() {
    if (initialized) return; initialized = true;
    onAuthStateChanged(auth, u => {
      const user = toUser(u);
      if (u && !u.isAnonymous && !signingUp) setDoc(doc(db, 'users', u.uid), { name: u.displayName || '', email: u.email, createdAt: u.metadata?.creationTime || '', lastLogin: new Date().toISOString() }, { merge: true }).catch(() => {});
      if (firstEvent) { firstEvent = false; emit('init', user); }
      else if (user && !signingUp) emit('login', user);
    });
  },
  currentUser: () => toUser(auth.currentUser)
};
window.gfyAuth = 
  api;
