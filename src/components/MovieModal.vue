<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="movie"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="movie.title"
        @click.self="$emit('close')"
        @keydown.esc="$emit('close')"
      >
        <div class="modal">
          <div class="modal-hero">
            <div class="modal-poster">
              <img
                v-if="movie.image && !imgError"
                :src="movie.image"
                :alt="movie.title"
                @error="imgError = true"
              />
              <div v-else class="poster-fallback">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"/>
                </svg>
              </div>
            </div>

            <div class="modal-info">
              <div class="modal-badges">
                <span v-if="movie.mpa" class="badge-pill mpa-pill" :class="`badge-${movie.mpa}`">
                  {{ displayMPA(movie.mpa) }}
                </span>
                <span v-if="movie.year" class="badge-pill year-pill">{{ movie.year }}</span>
                <span v-for="genre in movie.genres" :key="genre" class="badge-pill genre-pill">{{ genre }}</span>
              </div>

              <h2 class="modal-title">{{ movie.title }}</h2>

              <p v-if="movie.starring" class="modal-starring">
                <span class="starring-label">Starring</span>
                {{ movie.starring }}
              </p>
            </div>

            <button class="modal-close" aria-label="Close" @click="$emit('close')">✕</button>
          </div>

          <div class="modal-body">
            <p v-if="movie.synopsis" class="modal-synopsis">{{ movie.synopsis }}</p>
            <p v-else class="modal-synopsis muted">No synopsis on file.</p>

            <dl class="detail-grid">
              <template v-if="movie.location">
                <dt>Collection Location</dt>
                <dd class="location-value">📦 {{ movie.location }}</dd>
              </template>
              <template v-if="movie.year">
                <dt>Year</dt>
                <dd>{{ movie.year }}</dd>
              </template>
              <template v-if="movie.genre">
                <dt>Genre</dt>
                <dd>{{ movie.genre }}</dd>
              </template>
              <template v-if="movie.mpa">
                <dt>MPA Rating</dt>
                <dd>{{ displayMPA(movie.mpa) }}</dd>
              </template>
              <template v-if="movie.mpaContent">
                <dt>MPA Content</dt>
                <dd class="mpa-content-value">{{ movie.mpaContent }}</dd>
              </template>
            </dl>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  movie: { type: Object, default: null },
})
defineEmits(['close'])

const imgError = ref(false)

watch(() => props.movie, () => { imgError.value = false })

function displayMPA(code) {
  if (!code) return ''
  return code
    .replace('PG13', 'PG-13')
    .replace('NC17', 'NC-17')
    .replace('TVY7', 'TV-Y7')
    .replace('TVY', 'TV-Y')
    .replace('TVG', 'TV-G')
    .replace('TVPG', 'TV-PG')
    .replace('TV14', 'TV-14')
    .replace('TVMA', 'TV-MA')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  background: var(--bg2);
  border: 1px solid var(--border-em);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 900px;
  max-height: 92vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-hero {
  display: flex;
  min-height: 320px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow: hidden;
  position: relative;
}

.modal-poster {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg3);
}
.modal-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted2);
}
.poster-fallback svg { width: 56px; height: 56px; opacity: 0.3; }

.modal-info {
  flex: 1;
  padding: 2rem 2rem 1.75rem;
  background: var(--bg3);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.modal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}
.badge-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.04em;
}
.year-pill  { background: rgba(255,255,255,0.07); color: var(--muted); }
.genre-pill { background: rgba(232,184,75,0.12); color: var(--accent); }

.modal-title {
  font-family: var(--font-display);
  font-size: 2.6rem;
  letter-spacing: 1.5px;
  color: var(--text);
  line-height: 1.05;
  margin-bottom: 0.6rem;
}
.modal-starring {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.5;
}
.starring-label {
  color: var(--accent);
  font-weight: 600;
  margin-right: 0.3rem;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid var(--border-em);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  transition: background 0.15s;
}
.modal-close:hover { background: rgba(0, 0, 0, 0.9); }

.modal-body {
  padding: 1.75rem 2rem 2.25rem;
}

.modal-synopsis {
  font-size: 0.925rem;
  color: #c0bfb8;
  line-height: 1.85;
  margin-bottom: 1.5rem;
}
.modal-synopsis.muted { color: var(--muted); font-style: italic; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem 2rem;
}
.detail-grid dt {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 0.2rem;
}
.detail-grid dd {
  font-size: 0.9rem;
  color: var(--text);
  font-weight: 500;
}
.location-value { color: var(--accent); }
.mpa-content-value { color: var(--muted); font-size: 0.82rem; font-weight: 400; font-style: italic; }

.modal-enter-active { animation: fadeUp 0.22s ease; }
.modal-leave-active { animation: fadeUp 0.15s ease reverse; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 700px) {
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal {
    max-width: 100%;
    max-height: 94vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .modal-hero { flex-direction: column; min-height: auto; }
  .modal-poster { width: 100%; height: 220px; }
  .modal-info { padding: 1.25rem 1.25rem 1rem; }
  .modal-title { font-size: 1.8rem; }
  .modal-body { padding: 1.25rem 1.25rem 2rem; }
  .detail-grid { grid-template-columns: 1fr; gap: 0.75rem; }
}
</style>
