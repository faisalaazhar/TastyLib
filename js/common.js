import { auth, db } from './backend/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import {
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById('user-signin-btn');
    const userDropdownName = document.getElementById('userdropdown-name');
    const userBtn = document.getElementById('user-btn');

    if (user) {
      // Fetch full name from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log(userDoc);
      const name = userDoc.exists() ? userDoc.data().name : 'User';

      if (userBtn) userBtn.style.display = 'block';
      if (loginBtn) loginBtn.style.display = 'none';
      if (userDropdownName) userDropdownName.innerHTML = `Welcome</br>${name}!`;
    } else {
      if (userBtn) userBtn.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'block';
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = 'index.html'; // redirect to home
      });
    });
  }
});
