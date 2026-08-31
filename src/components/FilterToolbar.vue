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
          <option :value="watchlistCategory">🔖 My Watchlist</option>
          <option v-for="genre in (pureGenreOnly ? pureGenres : genres)" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>
      </div>

      <!-- Pure only — restricts the category to titles with no other tags.
           Only relevant once a real genre is selected. -->
      <div class="filter-group" v-if="activeGenre && !isWatchlistView">
        <label class="filter-label">&nbsp;</label>
        <div class="pure-switch" role="group" aria-label="Pure genre filter">
          <button
            type="button"
            class="pure-switch-btn"
            :class="{ active: !pureGenreOnly }"
            @click="setPure(false)"
          >All</button>
          <button
            type="button"
            class="pure-switch-btn"
            :class="{ active: pureGenreOnly }"
            @click="setPure(true)"
          >
            Pure only<span v-if="pureGenreOnly && currentPureCount !== null"> ({{ currentPureCount }})</span>
          </button>
        </div>
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

      <!-- Content rating — not applicable while browsing the Watchlist,
           since watchlisted titles always show regardless of rating -->
      <div class="filter-group">
        <label class="filter-label" for="mpa-select">Content</label>
        <select
          id="mpa-select"
          :value="mpaSelectValue"
          :disabled="isWatchlistView"
          :title="isWatchlistView ? 'Not applicable to My Watchlist' : ''"
          @change="onMpaSelectChange($event.target.value)"
        >
          <option v-for="(tier, idx) in mpaTiers" :key="idx" :value="idx">
            {{ tier.label }}
          </option>
          <option value="custom">Custom…</option>
        </select>
      </div>

      <!-- Clear filters -->
      <div class="active-filters" v-if="hasActiveFilters">
        <button class="reset-btn" @click="$emit('reset')">Clear filters</button>
      </div>

    </div>

    <!-- Custom rating checkboxes — only shown when "Custom…" is selected -->
    <div class="custom-mpa-panel" v-if="useCustomMpa && !isWatchlistView">
      <label
        v-for="code in allMpaCodes"
        :key="code"
        class="mpa-checkbox"
      >
        <input
          type="checkbox"
          :checked="customMpaCodes.includes(code)"
          @change="$emit('toggle-custom-code', code)"
        />
        {{ mpaLabels[code] }}
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MPA_TIERS, DEFAULT_MPA_TIER, ALL_MPA_CODES, MPA_CODE_LABELS, WATCHLIST_CATEGORY } from '../composables/useMovies.js'

const mpaTiers   = MPA_TIERS
const allMpaCodes = ALL_MPA_CODES
const mpaLabels   = MPA_CODE_LABELS
const watchlistCategory = WATCHLIST_CATEGORY

const props = defineProps({
  genres:        { type: Array,   default: () => [] },
  subGenres:     { type: Array,   default: () => [] },
  decades:       { type: Array,   default: () => [] },
  sortKey:       { type: String,  default: 'random' },
  activeGenre:   { type: String,  default: '' },
  subGenre:      { type: String,  default: '' },
  decade:        { type: String,  default: '' },
  mpaTierIdx:    { type: Number,  default: DEFAULT_MPA_TIER },
  useCustomMpa:  { type: Boolean, default: false },
  customMpaCodes:{ type: Array,   default: () => [] },
  pureGenreOnly: { type: Boolean, default: false },
  pureGenres:    { type: Array,   default: () => [] },
  pureGenreCounts: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'update:sortKey', 'update:activeGenre', 'update:subGenre',
  'update:decade', 'select-mpa-tier', 'enable-custom-mpa',
  'toggle-custom-code', 'toggle-pure-genre', 'reset'
])

function onGenreChange(e) {
  emit('update:activeGenre', e.target.value)
  emit('update:subGenre', '')  // reset sub-genre when primary changes
}

function setPure(makePure) {
  if (makePure !== props.pureGenreOnly) emit('toggle-pure-genre')
}

// Count shown next to "Pure only" for the currently selected category.
const currentPureCount = computed(() => {
  const c = props.pureGenreCounts?.[props.activeGenre]
  return typeof c === 'number' ? c : null
})

// The <select> needs a single value; represent Custom mode with the
// string 'custom' and fall back to the numeric tier index otherwise.
const mpaSelectValue = computed(() => props.useCustomMpa ? 'custom' : props.mpaTierIdx)

function onMpaSelectChange(value) {
  if (value === 'custom') {
    emit('enable-custom-mpa')
  } else {
    emit('select-mpa-tier', Number(value))
  }
}

const isWatchlistView = computed(() => props.activeGenre === WATCHLIST_CATEGORY)

const hasActiveFilters = computed(() =>
  props.activeGenre  !== '' ||
  props.subGenre     !== '' ||
  props.decade       !== '' ||
  props.useCustomMpa ||
  props.pureGenreOnly ||
  props.mpaTierIdx   !== DEFAULT_MPA_TIER ||
  props.sortKey      !== 'random'
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
select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
select:disabled:hover { border-color: var(--border); }

.pure-switch {
  display: flex;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 2px;
}

.pure-switch-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 0.76rem;
  padding: 0.28rem 0.75rem;
  border-radius: 100px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.pure-switch-btn.active {
  background: var(--accent);
  color: var(--bg);
  font-weight: 600;
}

.pure-switch-btn:not(.active):hover { color: var(--text); }

.active-filters { margin-left: auto; }

.custom-mpa-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.9rem;
  padding: 0 1.5rem 0.7rem;
}

.mpa-checkbox {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  color: var(--text);
  cursor: pointer;
  user-select: none;
}

.mpa-checkbox input[type="checkbox"] {
  accent-color: var(--accent);
  cursor: pointer;
}

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
  .pure-switch-btn { font-size: 0.7rem; padding: 0.26rem 0.6rem; }
  .custom-mpa-panel { padding: 0 1rem 0.6rem; }
}
</style>
