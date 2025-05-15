// js/blog-details.js
import { auth, db } from './backend/firebase-config.js';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('blogId');
  const detailEl = document.getElementById('blog-detail-container');
  const commentsEl = document.getElementById('comments-container');
  const form = document.getElementById('blog-comment-form');
  const textarea = document.getElementById('comment-text');

  if (!blogId) {
    detailEl.innerHTML = '<p class="text-danger">No blog specified.</p>';
    return;
  }
  if (!commentsEl || !form || !textarea) {
    console.error(
      'Missing #comments-container or #blog-comment-form or #comment-text'
    );
    return;
  }

  // 1️⃣ Load blog details (existing code)
  (async function loadBlog() {
    try {
      const blogRef = doc(db, 'blogs', blogId);
      const snap = await getDoc(blogRef);
      if (!snap.exists()) throw new Error('Blog not found');
      const data = snap.data();

      // format date
      let dateStr = '';
      if (data.createdAt) {
        const dt = data.createdAt.toDate();
        dateStr = `${String(dt.getDate()).padStart(2, '0')} ${dt.toLocaleString(
          'default',
          { month: 'long' }
        )} ${dt.getFullYear()}`;
      }

      // fetch author name
      let author = 'Unknown';
      try {
        const userSnap = await getDoc(doc(db, 'users', data.userId));
        if (userSnap.exists()) author = userSnap.data().name;
      } catch {}

      detailEl.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="receipe-headline mb-4">
              <span>${dateStr}</span>
              <h2>${data.title}</h2>
              <p>by <strong>${author}</strong></p>
            </div>
            ${
              data.imageUrl
                ? `<img src="${data.imageUrl}" class="img-fluid mb-4" alt="${data.title}">`
                : ''
            }
            <p>${data.description}</p>
          </div>
        </div>
      `;
    } catch (e) {
      console.error(e);
      detailEl.innerHTML =
        '<p class="text-danger">Failed to load blog details.</p>';
    }
  })();

  // 2️⃣ Load existing comments
  async function loadComments() {
    commentsEl.innerHTML = '';
    const q = query(collection(db, 'comments'), where('blogId', '==', blogId));
    try {
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const { userId, review, createdAt } = docSnap.data();
        const date = createdAt?.toDate().toLocaleString() || '';
        let name = 'Anonymous';
        // fetch commenter name
        getDoc(doc(db, 'users', userId))
          .then((userSnap) => {
            if (userSnap.exists()) name = userSnap.data().name;
          })
          .finally(() => {
            const div = document.createElement('div');
            div.className = 'mb-3 p-2 border rounded';
            div.innerHTML = `
              <p><strong>${name}</strong> <small class="text-muted">${date}</small></p>
              <p>${review}</p>
            `;
            commentsEl.appendChild(div);
          });
      });
    } catch (err) {
      console.error('Error loading comments:', err);
      commentsEl.innerHTML =
        '<p class="text-danger">Could not load comments.</p>';
    }
  }
  loadComments();

  // 3️⃣ Handle new comment submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      return alert('Please sign in to post a comment.');
    }
    const review = textarea.value.trim();
    if (!review) {
      return alert('Comment cannot be empty.');
    }

    try {
      await addDoc(collection(db, 'comments'), {
        blogId,
        userId: auth.currentUser.uid,
        review,
        createdAt: serverTimestamp(),
      });
      textarea.value = '';
      await loadComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment.');
    }
  });
});
