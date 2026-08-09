import { ref, watch } from 'vue'

const STORAGE_KEY = 'reelvault_watchlist'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Movies and grouped TV shows are keyed by their normalised base title
// (already computed in useMovies.js) rather than the row-index `id`,
// since the id shifts whenever the spreadsheet is re-sorted or edited —
// bad news for something meant to persist across sessions.
export function watchlistKey(movie) {
  return (movie?.baseName || movie?.title || '').toUpperCase()
}

// Per-device, per-browser watchlist — stored in localStorage, not synced
// anywhere. Each person/device building their own list is the intended use.
export function useWatchlist() {
  const watchlist = ref(loadStored())

  watch(
    watchlist,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // localStorage unavailable (private browsing, quota exceeded, etc.)
        // — fail silently rather than break the app over a saved list.
      }
    },
    { deep: true }
  )

  function isWatchlisted(movie) {
    return watchlist.value.includes(watchlistKey(movie))
  }

  function toggleWatchlist(movie) {
    const key = watchlistKey(movie)
    if (!key) return
    const idx = watchlist.value.indexOf(key)
    if (idx === -1) watchlist.value.push(key)
    else watchlist.value.splice(idx, 1)
  }

  return { watchlist, isWatchlisted, toggleWatchlist }
}
