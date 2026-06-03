<template>
  <article
    class="movie-card"
    tabindex="0"
    role="button"
    :aria-label="movie.title"
    @click="$emit('select', movie)"
    @keydown.enter="$emit('select', movie)"
    @keydown.space.prevent="$emit('select', movie)"
  >
    <div class="poster-wrap">
      <img
        v-if="movie.image && !imgError"
        :src="movie.image"
        :alt="movie.title"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="poster-fallback">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
        </svg>
        <span>{{ movie.title }}</span>
      </div>

      <!-- TV badge shows season count; movies show MPA rating -->
      <div v-if="movie.isTV" class="badge-tv">
        📺 {{ movie.seasons.length }} {{ movie.groupType }}
      </div>
      <div v-else-if="movie.mpa" class="mpa-badge" :class="`badge-${movie.mpa}`">
        {{ displayMPA(movie.mpa) }}
      </div>

      <!-- Hover overlay with genre tags -->
      <div class="card-overlay" aria-hidden="true">
        <span v-for="genre in movie.genres.slice(0, 2)" :key="genre" class="overlay-genre">{{ genre }}</span>
      </div>
    </div>

    <div class="card-info">
      <p class="card-title">{{ movie.title }}</p>
      <p class="card-meta">
        <span v-if="movie.year" class="card-year">{{ movie.year }}</span>
        <span v-if="movie.year && movie.genres.length" class="card-dot" aria-hidden="true">·</span>
        <span v-if="movie.genres.length" class="card-genre">{{ movie.genres[0] }}</span>
      </p>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  movie: { type: Object, required: true },
})
defineEmits(['select'])

const imgError = ref(false)

function displayMPA(code) {
  if (!code) return ''
  return code
    .replace('PG13', 'PG-13')
    .replace('NC17', 'NC-17')
    .replace('TVY7', 'TV-Y7')
    .replace('TVY',  'TV-Y')
    .replace('TVG',  'TV-G')
    .replace('TVPG', 'TV-PG')
    .replace('TV14', 'TV-14')
    .replace('TVMA', 'TV-MA')
}
</script>

<style scoped>
.movie-card {
  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.movie-card:hover,
.movie-card:focus-visible {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--accent);
  box-shadow: 0 8px 28px rgba(232, 184, 75, 0.12);
  outline: none;
}

.poster-wrap {
  position: relative;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: var(--bg3);
}
.poster-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s;
  display: block;
}
.movie-card:hover .poster-wrap img { transform: scale(1.06); }

.poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--muted2);
  padding: 1rem;
}
.poster-fallback svg  { width: 36px; height: 36px; opacity: 0.35; flex-shrink: 0; }
.poster-fallback span { font-size: 0.68rem; text-align: center; color: var(--muted); line-height: 1.3; }

/* TV season count badge */
.badge-tv {
  position: absolute;
  top: 7px;
  right: 7px;
  font-size: 0.58rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.03em;
  background: rgba(232, 184, 75, 0.2);
  color: var(--accent);
  border: 1px solid rgba(232, 184, 75, 0.35);
  backdrop-filter: blur(4px);
}

/* MPA rating badge */
.mpa-badge {
  position: absolute;
  top: 7px;
  right: 7px;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

/* Hover overlay */
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 15, 0.6);
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px;
  flex-wrap: wrap;
  opacity: 0;
  transition: opacity 0.22s;
}
.movie-card:hover .card-overlay,
.movie-card:focus-visible .card-overlay { opacity: 1; }

.overlay-genre {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 100px;
  background: rgba(232, 184, 75, 0.18);
  color: var(--accent);
  letter-spacing: 0.03em;
}

/* Info strip */
.card-info { padding: 0.5rem 0.6rem 0.65rem; }
.card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.15rem;
}
.card-meta { display: flex; align-items: center; gap: 0.3rem; }
.card-year  { font-size: 0.7rem; color: var(--muted); }
.card-dot   { font-size: 0.45rem; color: var(--muted2); }
.card-genre { font-size: 0.68rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
