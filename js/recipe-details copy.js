// details.js
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
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

async function loadRecipeDetail() {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get('recipeId');
  const container = document.getElementById('recipe-detail-container');
  if (!recipeId) {
    container.innerHTML = '<p class="text-danger">No recipe specified.</p>';
    return;
  }

  try {
    const docRef = doc(db, 'recipes', recipeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      container.innerHTML = '<p class="text-danger">Recipe not found.</p>';
      return;
    }
    const d = snap.data();
    const date =
      d.createdAt instanceof Timestamp
        ? d.createdAt.toDate().toLocaleDateString()
        : '';
    // build the detail markup
    container.innerHTML = `
<div class="row">
  <div class="col-md-8">
    <div class="receipe-headline mb-4">
      <span>${date}</span>
      <h2>${d.title}</h2>
      <div class="receipe-duration">
        <h6>Prep: ${d.prepTime} mins</h6>
        <h6>Cook: ${d.cookTime} mins</h6>
        <h6>Yields: ${d.servings} Servings</h6>
      </div>
    </div>
    ${
      d.imageUrl
        ? `<img src="${d.imageUrl}" class="img-fluid mb-4" alt="${d.title}">`
        : ''
    }
    <h4>Steps</h4>
    ${d.steps
      .map(
        (step, i) => `
      <div class="single-preparation-step d-flex mb-3">
        <h4>${String(i + 1).padStart(2, '0')}.</h4>
        <p class="ml-3">${step}</p>
      </div>
    `
      )
      .join('')}
  </div>

  <div class="col-md-4">
    <div class="ingredients mb-4">
      <h4>Ingredients</h4>
      ${d.ingredients
        .map(
          (ing, idx) => `
      <div class="custom-control custom-checkbox">
        <input type="checkbox"
               class="custom-control-input"
               id="ingCheck${idx}">
        <label class="custom-control-label" for="ingCheck${idx}">
          ${ing}
        </label>
      </div>
      `
        )
        .join('')}
    </div>
    <div class="mb-4">
      <span class="badge badge-primary">${d.level}</span>
      <span class="ml-2"><strong>Rating:</strong> ${
        d.avgRating?.toFixed(1) || '–'
      } (${d.totalRatings || 0})</span>
    </div>
  </div>
</div>`;
  } catch (err) {
    console.error('Error fetching recipe:', err);
    container.innerHTML = '<p class="text-danger">Failed to load recipe.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadRecipeDetail);

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get('recipeId');
  const form = document.getElementById('recipe-comment-form');
  const listContainer = document.getElementById('comments-container');

  if (!recipeId) return;

  // Load all existing ratings/reviews for this recipe
  async function loadRatings() {
    listContainer.innerHTML = '';
    const q = query(
      collection(db, 'rating'),
      where('recipeId', '==', recipeId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const { review, score, createdAt } = docSnap.data();
      const date = createdAt?.toDate().toLocaleString() || '';
      const entry = document.createElement('div');
      entry.className = 'mb-3 p-2 border rounded';
      entry.innerHTML = `
        <strong>${score}★</strong> <small class="text-muted">${date}</small>
        <p>${review}</p>
      `;
      listContainer.appendChild(entry);
    });
  }

  await loadRatings();

  // Handle new rating+review submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert('Please sign in to post a review.');
      return;
    }

    // get form values
    const score = parseFloat(document.getElementById('recipe-rating').value);
    const review = document.getElementById('recipe-comment').value.trim();
    if (!score || score < 1 || score > 5 || !review) {
      return alert('Enter a rating (1–5) and a comment.');
    }

    try {
      await runTransaction(db, async (tx) => {
        // a) add new rating doc
        tx.set(doc(collection(db, 'rating')), {
          recipeId,
          userId: auth.currentUser.uid,
          score,
          review,
          createdAt: serverTimestamp(),
        });

        // b) update recipe aggregates
        const recipeRef = doc(db, 'recipes', recipeId);
        const snap = await tx.get(recipeRef);
        if (!snap.exists()) throw 'Recipe not found';

        const data = snap.data();
        const oldCount = data.totalRatings || 0;
        const oldAvg = data.avgRating || 0;
        const newCount = oldCount + 1;
        const newAvg = (oldAvg * oldCount + score) / newCount;

        tx.update(recipeRef, {
          totalRatings: newCount,
          avgRating: newAvg,
        });
      });

      form.reset();
      await loadRatings();
      alert('Your review has been posted!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('There was a problem posting your review.');
    }
  });
});
