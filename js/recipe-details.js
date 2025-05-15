// recipe-details.js
import { auth, db } from './backend/firebase-config.js';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get('recipeId');
  const detailContainer = document.getElementById('recipe-detail-container');
  const commentsDiv = document.getElementById('comments-container');
  const form = document.getElementById('recipe-comment-form');

  if (!recipeId) {
    detailContainer.innerHTML =
      '<p class="text-danger">No recipe specified.</p>';
    return;
  }
  if (!commentsDiv || !form) {
    console.error(
      '#comments-container or #recipe-comment-form missing in HTML'
    );
    return;
  }

  // 1️⃣ Load and render recipe details
  async function loadRecipe() {
    try {
      const ref = doc(db, 'recipes', recipeId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Recipe not found');
      const d = snap.data();

      const date = d.createdAt?.toDate().toLocaleDateString() || '';
      detailContainer.innerHTML = `
<div class="row">
  <div class="col-md-8">
    <div class="receipe-headline mb-4">
      <span>${date}</span>
      <h2>${d.title}</h2>
      <div class="receipe-duration">
        <h6>Prep: ${d.prepTime} mins</h6>
        <h6>Cook: ${d.cookTime} mins</h6>
        <h6>Serves: ${d.servings}</h6>
      </div>
    </div>
    ${d.imageUrl ? `<img src="${d.imageUrl}" class="img-fluid mb-4">` : ''}
    <h4>Steps</h4>
    ${d.steps
      .map(
        (s, i) => `
      <div class="single-preparation-step d-flex mb-3">
        <h4>${String(i + 1).padStart(2, '0')}.</h4>
        <p class="ml-3">${s}</p>
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
          <input type="checkbox" class="custom-control-input" id="ing${idx}">
          <label class="custom-control-label" for="ing${idx}">${ing}</label>
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
    } catch (e) {
      console.error(e);
      detailContainer.innerHTML =
        '<p class="text-danger">Failed to load recipe.</p>';
    }
  }

  // 2️⃣ Load and render all existing reviews
  async function loadReviews() {
    commentsDiv.innerHTML = '';
    const q = query(
      collection(db, 'rating'),
      where('recipeId', '==', recipeId)
    );
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      const { userId, score, review, createdAt } = docSnap.data();
      let userName = 'Anonymous';

      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          userName = userSnap.data().name || userName;
        }
      } catch (e) {
        console.warn('Failed to fetch user:', e);
      }

      const date = createdAt?.toDate().toLocaleString() || '';
      const div = document.createElement('div');
      div.className = 'mb-3 p-2 border rounded';
      div.innerHTML = `
        <p><strong>${userName}</strong> — <small class="text-muted">${date}</small></p>
        <p><strong>${score}★</strong></p>
        <p>${review}</p>
      `;
      commentsDiv.appendChild(div);
    }
  }

  // 3️⃣ Handle new review submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please sign in to post a review.');
      return;
    }
    const score = parseFloat(form.querySelector('#recipe-rating').value);
    const review = form.querySelector('#recipe-comment').value.trim();
    if (!(score >= 1 && score <= 5) || !review) {
      return alert('Enter rating 1–5 and a comment.');
    }

    try {
      await runTransaction(db, async (tx) => {
        const recipeRef = doc(db, 'recipes', recipeId);

        // 1) Read recipe first
        const rSnap = await tx.get(recipeRef);
        if (!rSnap.exists()) throw 'Recipe missing';
        const data = rSnap.data();
        const oldCount = data.totalRatings || 0;
        const oldAvg = data.avgRating || 0;
        const newCount = oldCount + 1;
        const newAvg = (oldAvg * oldCount + score) / newCount;

        // 2) Write the new rating
        const newRatingRef = doc(collection(db, 'rating'));
        tx.set(newRatingRef, {
          recipeId,
          userId: auth.currentUser.uid,
          score,
          review,
          createdAt: serverTimestamp(),
        });

        // 3) Write the recipe update
        tx.update(recipeRef, {
          totalRatings: newCount,
          avgRating: newAvg,
        });
      });

      form.reset();
      await loadReviews();
      await loadRecipe(); // refresh displayed avgRating
      alert('Review posted!');
    } catch (err) {
      console.error(err);
      alert('Could not post review.');
    }
  });

  // run on load
  loadRecipe();
  loadReviews();
});
