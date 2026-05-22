<template>
  <main class="movie-grid-wrap">
    <div v-if="loading" class="state-message">
      <div class="spinner" aria-label="Loading…"></div>
      <p>Loading your collection…</p>
    </div>

    <div v-else-if="error" class="state-message error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4m0 4h.01"/>
      </svg>
      <h3>Could not load collection</h3>
      <p>{{ error }}</p>
      <p class="hint">
        Make sure <code>movies.xlsx</code> is in the <code>public/</code> folder,
        then restart the dev server.
      </p>
    </div>

    <div v-else-if="movies.length === 0" class="state-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <h3>No movies found</h3>
      <p>Try adjusting your search or filters.</p>
    </div>

    <template v-else>
      <div class="movie-grid">
        <MovieCard
          v-for="movie in visibleMovies"
          :key="movie.id"
          :movie="movie"
          @select="$emit('select', $event)"
        />
      </div>

      <div ref="sentinel" class="sentinel">
        <div v-if="visibleCount < movies.length" class="load-dots">
          <span></span><span></span><span></span>
        </div>
        <p v-else-if="movies.length > PAGE_SIZE" class="end-label">
          All {{ movies.length }} titles loaded
        </p>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import MovieCard from './MovieCard.vue'

const PAGE_SIZE = 40

const props = defineProps({
  movies:  { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
  error:   { type: String,  default: null },
})
defineEmits(['select'])

const visibleCount = ref(PAGE_SIZE)
const sentinel     = ref(null)
let observer       = null
let busy           = false  // prevent double-firing

const visibleMovies = computed(() =>
  props.movies.slice(0, visibleCount.value)
)

const hasMore = computed(() => visibleCount.value < props.movies.length)

function loadMore() {
  if (busy || !hasMore.value) return
  busy = true
  visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, props.movies.length)
  // After DOM updates, re-attach observer to the (now repositioned) sentinel
  nextTick(() => {
    attachObserver()
    busy = false
  })
}

function attachObserver() {
  if (observer) observer.disconnect()
  if (!sentinel.value || !hasMore.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore()
    },
    {
      root: null,          // viewport
      rootMargin: '400px', // start loading well before sentinel is visible
      threshold: 0,
    }
  )
  observer.observe(sentinel.value)
}

// Reset when movie list changes (filter / sort / search)
watch(
  () => props.movies,
  () => {
    visibleCount.value = PAGE_SIZE
    busy = false
    nextTick(attachObserver)
  },
  { flush: 'sync' }
)

onMounted(attachObserver)
onBeforeUnmount(() => { if (observer) observer.disconnect() })
</script>

<style scoped>
.movie-grid-wrap {
  padding: 1.5rem 2rem 4rem;
  min-height: 60vh;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}

.sentinel {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
}

.load-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}
.load-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.5;
  animation: pulse 1.2s ease-in-out infinite;
}
.load-dots span:nth-child(2) { animation-delay: 0.2s; }
.load-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; }
  40%           { transform: scale(1.1); opacity: 0.9; }
}

.end-label {
  font-size: 0.75rem;
  color: var(--muted2);
  letter-spacing: 0.04em;
}

.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 0.75rem;
  text-align: center;
  color: var(--muted);
}
.state-message svg {
  width: 48px; height: 48px;
  opacity: 0.4; margin-bottom: 0.5rem;
}
.state-message h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--text);
  letter-spacing: 0.05em;
}
.state-message p { font-size: 0.875rem; }
.state-message.error svg { color: #e85454; opacity: 0.8; }

.hint { font-size: 0.8rem !important; color: var(--muted2) !important; margin-top: 0.25rem; }
.hint code {
  background: var(--bg3); padding: 1px 5px;
  border-radius: 4px; font-size: 0.78rem; color: var(--accent);
}

.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.5rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .movie-grid-wrap { padding: 1rem 1rem 3rem; }
  .movie-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
}
</style>
