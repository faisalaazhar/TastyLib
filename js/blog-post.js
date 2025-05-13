// blog-post.js
import { auth, db, storage } from './backend/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js';

async function loadBlogs() {
  const area = document.getElementById('blog-posts-area');
  if (!area) return;

  // 1️⃣ Fetch all blog docs, newest first
  const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  // 2️⃣ For each blog, build and append the HTML
  for (const blogDoc of snapshot.docs) {
    const data = blogDoc.data();
    const id = blogDoc.id;

    // format date
    let day = '';
    let month = '';
    let year = '';
    if (data.createdAt instanceof Timestamp) {
      const dt = data.createdAt.toDate();
      day = String(dt.getDate()).padStart(2, '0');
      month = dt.toLocaleString('default', { month: 'long' });
      year = dt.getFullYear();
    }

    // snippet of description
    const snippet =
      data.description.length > 150
        ? data.description.slice(0, 150) + '...'
        : data.description;

    // fetch author name
    let author = 'Unknown';
    try {
      const userSnap = await getDoc(doc(db, 'users', data.userId));
      if (userSnap.exists()) author = userSnap.data().name;
    } catch (e) {
      console.warn('Could not fetch author', e);
    }

    // category if you have one (else default)
    const category = data.category || 'Blog';

    // build the block
    const el = document.createElement('div');
    el.className = 'single-blog-area mb-80';
    el.innerHTML = `
      <div class="blog-thumbnail">
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="" />` : ''}
        <div class="post-date">
          <a href="blog-details?blogId=${id}">
            <span>${day}</span>${month} <br /> ${year}
          </a>
        </div>
      </div>
      <div class="blog-content">
        <a href="blog-details?blogId=${id}" class="post-title">${data.title}</a>
        <div class="meta-data">
          by <a href="#">${author}</a> in <a href="#">${category}</a>
        </div>
        <p>${snippet}</p>
        <a href="blog-details?blogId=${id}" class="btn delicious-btn mt-30">Read More</a>
      </div>
    `;
    area.appendChild(el);
  }
}

document.addEventListener('DOMContentLoaded', loadBlogs);

document.addEventListener('DOMContentLoaded', () => {
  const addBlogBtn = document.getElementById('add-blog-btn');
  const cancelBlogBtn = document.getElementById('cancel-post-blog');
  const formContainer = document.getElementById('blog-form-container');
  const form = document.getElementById('blog-form');

  // 1️⃣ Only show “Add blog” when logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      addBlogBtn.style.display = 'inline-block';
    } else {
      addBlogBtn.style.display = 'none';
      formContainer.style.display = 'none';
    }
  });

  // 2️⃣ Toggle the form
  addBlogBtn.addEventListener('click', (e) => {
    e.preventDefault();
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
  });
  cancelBlogBtn.addEventListener('click', (e) => {
    e.preventDefault();
    formContainer.style.display = 'none';
    addBlogBtn.scrollIntoView({ behavior: 'smooth' });
  });

  // 3️⃣ Handle form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please sign in to post a blog.');
      return;
    }

    // Collect values
    const title = document.getElementById('blog-title').value.trim();
    const desc = document.getElementById('blog-desc').value.trim();

    // Handle image upload
    let imageUrl = 'img/blog-img/1.jpg';
    const fileInput = document.getElementById('blog-image');
    const file = fileInput.files[0];
    // if (file) {
    //   const path = `blogs/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
    //   const ref = storageRef(storage, path);
    //   try {
    //     await uploadBytes(ref, file);
    //     imageUrl = await getDownloadURL(ref);
    //   } catch (err) {
    //     console.error('Blog image upload failed', err);
    //     alert('Could not upload image.');
    //     return;
    //   }
    // }

    // Save blog post
    try {
      await addDoc(collection(db, 'blogs'), {
        title,
        description: desc,
        imageUrl,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      alert('Blog posted!');
      form.reset();
      window.location.href = 'blog-post.html';
    } catch (err) {
      console.error('Error posting blog', err);
      alert('Failed to post blog.');
    }
  });
});
