<template>
  <div id="app-root">
    <AppHeader
      v-model="search"
      :count="filteredMovies.length"
    />

    <FilterToolbar
      :genres="genres"
      v-model:sort-key="sortKey"
      v-model:active-genre="activeGenre"
      v-model:mpa-tier-idx="mpaTierIdx"
      @reset="resetFilters"
    />

    <MovieGrid
      :movies="filteredMovies"
      :loading="loading"
      :error="error"
      @select="selectedMovie = $event"
    />

    <MovieModal
      :movie="selectedMovie"
      @close="selectedMovie = null"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AppHeader     from './components/AppHeader.vue'
import FilterToolbar from './components/FilterToolbar.vue'
import MovieGrid     from './components/MovieGrid.vue'
import MovieModal    from './components/MovieModal.vue'
import { useMovies, DEFAULT_MPA_TIER } from './composables/useMovies.js'

const {
  loading, error,
  search, sortKey, activeGenre, mpaTierIdx,
  genres,
  filteredMovies,
  loadCollection,
} = useMovies()

const selectedMovie = ref(null)

function resetFilters() {
  search.value = ''
  sortKey.value = 'random'
  activeGenre.value = ''
  mpaTierIdx.value = DEFAULT_MPA_TIER
}

watch(selectedMovie, val => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(loadCollection)
</script>

<style>
#app-root { min-height: 100vh; }
</style>
