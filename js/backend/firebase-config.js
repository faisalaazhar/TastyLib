// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js';
import { initializeFirestore } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBLBT36p1HqN9xO2m3JFDFiISprwnEzRnE',
  authDomain: 'tastylib.firebaseapp.com',
  projectId: 'tastylib',
  storageBucket: 'tastylib.firebasestorage.app',
  messagingSenderId: '892135205841',
  appId: '1:892135205841:web:d4a57102fc23dce76f8ef0',
  measurementId: 'G-XRTCEN9N3G',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
