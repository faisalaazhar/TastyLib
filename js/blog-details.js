// js/blog-details.js
import { db } from './backend/firebase-config.js';
import {
  doc,
  getDoc,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('blog-detail-container');
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('blogId');

  if (!blogId) {
    container.innerHTML = '<p class="text-danger">No blog specified.</p>';
    return;
  }

  try {
    // Fetch the blog document
    const blogRef = doc(db, 'blogs', blogId);
    const blogSnap = await getDoc(blogRef);

    if (!blogSnap.exists()) {
      container.innerHTML = '<p class="text-danger">Blog not found.</p>';
      return;
    }

    const data = blogSnap.data();

    // Format the creation date
    let dateStr = '';
    if (data.createdAt instanceof Timestamp) {
      const dt = data.createdAt.toDate();
      const day = String(dt.getDate()).padStart(2, '0');
      const month = dt.toLocaleString('default', { month: 'long' });
      const year = dt.getFullYear();
      dateStr = `${day} ${month} ${year}`;
    }

    // Fetch author name
    let author = 'Unknown';
    try {
      const userRef = doc(db, 'users', data.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) author = userSnap.data().name;
    } catch {
      // ignore errors
    }

    // Build and inject the detail markup
    container.innerHTML = `
      <div class="row">
        <div class="col-md-12">
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
  } catch (err) {
    console.error('Error loading blog details:', err);
    container.innerHTML =
      '<p class="text-danger">Failed to load blog details.</p>';
  }
});
