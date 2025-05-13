// recipe-post.js
import { auth, db, storage } from './backend/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js';

async function loadRecipes() {
  const container = document.getElementById('recipes-container');
  const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocs(q);
    snap.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const date =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toLocaleDateString()
          : '';
      // build a Bootstrap card (col-12 col-md-6)
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 mb-4';
      col.innerHTML = `
          <a href="recipe-details?recipeId=${id}" class="text-dark" style="text-decoration:none;">
            <div class="card h-100">
              ${
                data.imageUrl
                  ? `<img src="${data.imageUrl}" class="card-img-top" alt="${data.title}">`
                  : ''
              }
              <div class="card-body">
                <h5 class="card-title">${data.title}</h5>
                <p class="card-text">
                  <small class="text-muted">${date}</small><br>
                  Prep: ${data.prepTime} mins • Cook: ${data.cookTime} mins
                </p>
              </div>
              <div class="card-footer text-right">
                <span class="badge badge-primary">${data.level}</span>
              </div>
            </div>
          </a>`;
      container.appendChild(col);
    });
  } catch (err) {
    console.error('Failed to load recipes:', err);
    container.innerHTML = '<p class="text-danger">Could not load recipes.</p>';
  }
}

// call it on load
document.addEventListener('DOMContentLoaded', loadRecipes);

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-receipe-btn');
  const cancelBtn = document.getElementById('cancel-recipe-share');
  const formContainer = document.getElementById('share-recipe-form');
  const form = document.getElementById('recipe-form');

  // 1️⃣ Show “Add Recipe” only when logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      addBtn.style.display = 'inline-block';
    } else {
      addBtn.style.display = 'none';
      formContainer.style.display = 'none';
    }
  });

  // 2️⃣ Toggle form visibility
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
  });
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    formContainer.style.display = 'none';
    addBtn.scrollIntoView({ behavior: 'smooth' });
  });

  // 3️⃣ Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ensure user is signed in
    if (!auth.currentUser) {
      alert('Please sign in to share a recipe.');
      return;
    }

    // Collect values
    const title = document.getElementById('recipe-title').value.trim();
    const level = document.getElementById('recipelevelselect').value;
    const prepTime = Number(document.getElementById('prep-time').value) || 0;
    const cookTime = Number(document.getElementById('cook-time').value) || 0;
    const servings =
      Number(document.getElementById('total-servings').value) || 0;
    const ingredients = document
      .getElementById('ingredients-list')
      .value.split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const steps = document
      .getElementById('cooking-steps')
      .value.split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    // Upload image (if any)
    // let imageUrl = 'img/bg-img/bg3.jpg';
    let imageUrl = '';
    const fileInput = document.getElementById('recipe-image');
    const file = fileInput.files[0];
    if (file) {
      const imgPath = `recipes/${auth.currentUser.uid}/${Date.now()}_${
        file.name
      }`;
      const imgRef = storageRef(storage, imgPath);
      try {
        await uploadBytes(imgRef, file);
        imageUrl = await getDownloadURL(imgRef);
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Could not upload image. Please try again.');
        return;
      }
    }

    // Write to Firestore
    try {
      await addDoc(collection(db, 'recipes'), {
        title,
        level,
        prepTime,
        cookTime,
        servings,
        ingredients,
        steps,
        imageUrl,
        totalRatings: 0,
        avgRating: 0,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      alert('Recipe shared successfully!');
      form.reset();
      window.location.href = 'recipe-post';
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert('Failed to share recipe. Please try again.');
    }
  });
});
