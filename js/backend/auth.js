import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import {
  doc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#signup-form');
  // Sign Up
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('full-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Optional: Update display name (good for quick access)
    await updateProfile(user, {
      displayName: name,
    });

    // Save additional user info in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      createdAt: new Date(),
    });
    window.location.href = 'signin-signup.html';
  });
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  console.log(email);
  const password = document.getElementById('login-password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      window.location.href = 'index.html';
    })
    .catch((error) => {
      alert('Error: ' + error.message);
    });
});

// Track login state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Logged in as:', user.email);
    document.getElementById('logout-button').style.display = 'block';
  } else {
    console.log('Not logged in');
    document.getElementById('logout-button').style.display = 'none';
  }
});
