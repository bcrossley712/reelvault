<template>
  <div class="filter-bar">
    <div class="dropdowns">

      <!-- Category -->
      <div class="filter-group">
        <label class="filter-label" for="genre-select">Category</label>
        <select
          id="genre-select"
          :value="activeGenre"
          @change="onGenreChange"
        >
          <option value="">All</option>
          <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
        </select>
      </div>

      <!-- Sub-category — only shows when a genre is selected and has sub-genres -->
      <div class="filter-group" v-if="activeGenre && subGenres.length">
        <label class="filter-label" for="sub-select">Filter by</label>
        <select
          id="sub-select"
          :value="subGenre"
          @change="$emit('update:subGenre', $event.target.value)"
        >
          <option value="">All</option>
          <option v-for="g in subGenres" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <!-- Decade -->
      <div class="filter-group">
        <label class="filter-label" for="decade-select">Decade</label>
        <select
          id="decade-select"
          :value="decade"
          @change="$emit('update:decade', $event.target.value)"
        >
          <option value="">Any</option>
          <option v-for="d in decades" :key="d" :value="d">{{ d }}s</option>
        </select>
      </div>

      <!-- Sort -->
      <div class="filter-group">
        <label class="filter-label" for="sort-select">Sort</label>
        <select
          id="sort-select"
          :value="sortKey"
          @change="$emit('update:sortKey', $event.target.value)"
        >
          <option value="random">🎲 Random</option>
          <option value="title-asc">Title A–Z</option>
          <option value="title-desc">Title Z–A</option>
          <option value="year-desc">Newest First</option>
          <option value="year-asc">Oldest First</option>
        </select>
      </div>

      <!-- Content rating -->
      <div class="filter-group">
        <label class="filter-label" for="mpa-select">Content</label>
        <select
          id="mpa-select"
          :value="mpaTierIdx"
          @change="$emit('update:mpaTierIdx', Number($event.target.value))"
        >
          <option v-for="(tier, idx) in mpaTiers" :key="idx" :value="idx">
            {{ tier.label }}
          </option>
        </select>
      </div>

      <!-- Clear filters -->
      <div class="active-filters" v-if="hasActiveFilters">
        <button class="reset-btn" @click="$emit('reset')">Clear filters</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MPA_TIERS, DEFAULT_MPA_TIER } from '../composables/useMovies.js'

const mpaTiers = MPA_TIERS

const props = defineProps({
  genres:      { type: Array,  default: () => [] },
  subGenres:   { type: Array,  default: () => [] },
  decades:     { type: Array,  default: () => [] },
  sortKey:     { type: String, default: 'random' },
  activeGenre: { type: String, default: '' },
  subGenre:    { type: String, default: '' },
  decade:      { type: String, default: '' },
  mpaTierIdx:  { type: Number, default: DEFAULT_MPA_TIER },
})

const emit = defineEmits([
  'update:sortKey', 'update:activeGenre', 'update:subGenre',
  'update:decade', 'update:mpaTierIdx', 'reset'
])

function onGenreChange(e) {
  emit('update:activeGenre', e.target.value)
  emit('update:subGenre', '')  // reset sub-genre when primary changes
}

const hasActiveFilters = computed(() =>
  props.activeGenre !== '' ||
  props.subGenre    !== '' ||
  props.decade      !== '' ||
  props.mpaTierIdx  !== DEFAULT_MPA_TIER ||
  props.sortKey     !== 'random'
)
</script>

<style scoped>
.filter-bar {
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 60px;
  z-index: 99;
}

.dropdowns {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.6rem 1.5rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.filter-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--muted);
  white-space: nowrap;
}

select {
  background: var(--bg3);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.8rem;
  border-radius: 6px;
  padding: 0.3rem 0.65rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  max-width: 200px;
}
select:hover, select:focus { border-color: var(--accent); }

.active-filters { margin-left: auto; }

.reset-btn {
  font-family: var(--font-body);
  font-size: 0.72rem;
  color: var(--muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 0.22rem 0.7rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.reset-btn:hover { color: var(--text); border-color: var(--muted2); }

@media (max-width: 600px) {
  .filter-bar { top: 54px; }
  .dropdowns { padding: 0.55rem 1rem; gap: 0.65rem; }
  select { max-width: 130px; font-size: 0.74rem; }
}
</style>
