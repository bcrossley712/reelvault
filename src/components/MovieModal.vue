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

          <!-- Close button -->
          <button class="modal-close" aria-label="Close" @click="$emit('close')">✕</button>

          <!-- Poster strip -->
          <div class="modal-poster-wrap">
            <img
              v-if="movie.image && !imgError"
              :src="movie.image"
              :alt="movie.title"
              class="modal-poster-img"
              @error="imgError = true"
            />
            <div v-else class="modal-poster-fallback">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"/>
              </svg>
            </div>
          </div>

          <!-- Info block -->
          <div class="modal-info">
            <div class="modal-badges">
              <span v-if="movie.mpa" class="badge-pill" :class="`badge-${movie.mpa}`">
                {{ displayMPA(movie.mpa) }}
              </span>
              <span v-if="movie.year" class="badge-pill year-pill">{{ movie.year }}</span>
              <span v-for="genre in movie.genres" :key="genre" class="badge-pill genre-pill">{{ genre }}</span>
            </div>
            <h2 class="modal-title">{{ movie.title }}</h2>
            <p v-if="movie.starring" class="modal-starring">
              <span class="starring-label">Starring</span>{{ movie.starring }}
            </p>
          </div>

          <div class="modal-divider" />

          <!-- Body: synopsis + meta -->
          <div class="modal-body">

            <!-- Synopsis with Read more -->
            <div class="synopsis-wrap">
              <p
                class="modal-synopsis"
                :class="{ truncated: !synExpanded }"
              >{{ movie.synopsis || 'No synopsis on file.' }}</p>
              <button
                v-if="movie.synopsis && isTruncatable"
                class="read-more-btn"
                @click="synExpanded = !synExpanded"
              >
                {{ synExpanded ? 'Show less' : 'Read more' }}
              </button>
            </div>

            <!-- Detail grid -->
            <dl class="detail-grid">
              <template v-if="movie.location">
                <dt>Location</dt>
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
import { ref, watch, computed } from 'vue'

const props = defineProps({
  movie: { type: Object, default: null },
})
defineEmits(['close'])

const imgError    = ref(false)
const synExpanded = ref(false)

// Rough check: synopsis longer than ~120 chars is truncatable
const isTruncatable = computed(() =>
  props.movie?.synopsis && props.movie.synopsis.length > 120
)

watch(() => props.movie, () => {
  imgError.value    = false
  synExpanded.value = false
})

function displayMPA(code) {
  if (!code) return ''
  return code
    .replace('PG13',  'PG-13')
    .replace('NC17',  'NC-17')
    .replace('TVY7',  'TV-Y7')
    .replace('TVY',   'TV-Y')
    .replace('TVG',   'TV-G')
    .replace('TVPG',  'TV-PG')
    .replace('TV14',  'TV-14')
    .replace('TVMA',  'TV-MA')
}
</script>

<style scoped>
/* ── Overlay ── */
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

/* ── Sheet ── */
.modal {
  position: relative;
  background: var(--bg2);
  border: 1px solid var(--border-em);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 860px;
  max-height: 92vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
}

/* ── Close ── */
.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid var(--border-em);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: background 0.15s;
}
.modal-close:hover { background: rgba(0, 0, 0, 0.9); }

/* ── Poster strip ── */
.modal-poster-wrap {
  width: 100%;
  height: 260px;
  flex-shrink: 0;
  background: var(--bg3);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow: hidden;
}
.modal-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  display: block;
}
.modal-poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted2);
}
.modal-poster-fallback svg { width: 56px; height: 56px; opacity: 0.25; }

/* ── Info block ── */
.modal-info {
  padding: 1.25rem 1.5rem 1rem;
}
.modal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
}
.badge-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 4px;
  letter-spacing: 0.04em;
}
.year-pill  { background: rgba(255,255,255,0.07); color: var(--muted); }
.genre-pill { background: rgba(232,184,75,0.12);  color: var(--accent); }

.modal-title {
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: 1.5px;
  color: var(--text);
  line-height: 1.05;
  margin-bottom: 0.5rem;
}
.modal-starring {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.5;
}
.starring-label {
  color: var(--accent);
  font-weight: 600;
  margin-right: 0.3rem;
}

.modal-divider {
  height: 1px;
  background: var(--border);
  margin: 0 1.5rem;
}

/* ── Body ── */
.modal-body {
  padding: 1.1rem 1.5rem 1.75rem;
}

/* Synopsis */
.synopsis-wrap { margin-bottom: 1.25rem; }

.modal-synopsis {
  font-size: 0.875rem;
  color: #c0bfb8;
  line-height: 1.85;
  margin-bottom: 0.35rem;
}
.modal-synopsis.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-body);
  transition: opacity 0.15s;
}
.read-more-btn:hover { opacity: 0.75; }

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem 2rem;
}
.detail-grid dt {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 0.15rem;
}
.detail-grid dd {
  font-size: 0.875rem;
  color: var(--text);
  font-weight: 500;
}
.location-value   { color: var(--accent); }
.mpa-content-value { color: var(--muted); font-size: 0.8rem; font-weight: 400; font-style: italic; }

/* ── Animation ── */
.modal-enter-active { animation: slideUp 0.22s ease; }
.modal-leave-active { animation: slideUp 0.15s ease reverse; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}

/* ── Mobile ── */
@media (max-width: 600px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }
  .modal {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .modal-poster-wrap { height: 200px; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .modal-title       { font-size: 1.5rem; }
  .modal-info        { padding: 1rem 1.1rem 0.75rem; }
  .modal-divider     { margin: 0 1.1rem; }
  .modal-body        { padding: 1rem 1.1rem 1.5rem; }
  .detail-grid       { grid-template-columns: 1fr; gap: 0.7rem; }
}
</style>
