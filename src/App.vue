<template>
  <div id="app-root">
    <AppHeader
      v-model="search"
      :count="filteredMovies.length"
      @help="tutorialRef?.open()"
    />

    <FilterToolbar
      :genres="genres"
      :sub-genres="subGenres"
      :decades="decades"
      v-model:sort-key="sortKey"
      v-model:active-genre="activeGenre"
      v-model:sub-genre="subGenre"
      v-model:decade="decade"
      :mpa-tier-idx="mpaTierIdx"
      :use-custom-mpa="useCustomMPA"
      :custom-mpa-codes="customMPACodes"
      @select-mpa-tier="selectMPATier"
      @enable-custom-mpa="enableCustomMPA"
      @toggle-custom-code="toggleCustomMPACode"
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

    <TutorialModal ref="tutorialRef" />
    <UpdateToast />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AppHeader     from './components/AppHeader.vue'
import FilterToolbar from './components/FilterToolbar.vue'
import MovieGrid     from './components/MovieGrid.vue'
import MovieModal    from './components/MovieModal.vue'
import TutorialModal from './components/TutorialModal.vue'
import UpdateToast   from './components/UpdateToast.vue'
import { useMovies, DEFAULT_MPA_TIER } from './composables/useMovies.js'

const {
  loading, error,
  search, sortKey, activeGenre, subGenre, decade, mpaTierIdx,
  useCustomMPA, customMPACodes, selectMPATier, enableCustomMPA, toggleCustomMPACode,
  genres, subGenres, decades,
  filteredMovies,
  loadCollection,
} = useMovies()

const selectedMovie = ref(null)
const tutorialRef   = ref(null)

function resetFilters() {
  search.value        = ''
  sortKey.value       = 'random'
  activeGenre.value   = ''
  subGenre.value      = ''
  decade.value        = ''
  mpaTierIdx.value    = DEFAULT_MPA_TIER
  useCustomMPA.value  = false
}

watch(selectedMovie, val => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(loadCollection)
</script>

<style>
#app-root { min-height: 100vh; }
</style>
