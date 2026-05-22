// composables/useMovies.js

import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

// ── MPA rating hierarchy ──────────────────────────────────────────────────────
// Each tier label maps to a set of MPA codes it includes (cumulative / parental filter)
export const MPA_TIERS = [
  { label: 'All Ratings',       codes: null }, // null = show everything
  { label: 'G only',            codes: ['G', 'TVY', 'TVG'] },
  { label: 'TV-Y through TV-G', codes: ['TVY', 'TVG', 'G'] },
  { label: 'TV-Y through PG',   codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG'] },
  { label: 'TV-Y through PG-13',codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'PG13', 'TV14'] },
  { label: 'TV-Y through R',    codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'PG13', 'TV14', 'R'] },
  { label: 'All (incl. NC-17)', codes: null }, // same as "All Ratings" — show everything
]

// Default tier index = "TV-Y through PG-13"
export const DEFAULT_MPA_TIER = 4

// ── Column auto-detection ─────────────────────────────────────────────────────
const COLUMN_ALIASES = {
  title:      ['title'],
  genre:      ['genre', 'category'],
  // "rating" col = actual MPA rating (G/PG/R…); "mpa" col = content description text
  mpa:        ['rating', 'mpa', 'mpaa', 'rated'],
  mpaContent: ['mpa', 'content', 'content description', 'content rating', 'rating reason'],
  starring:   ['starring', 'cast', 'actors', 'star'],
  year:       ['year', 'released', 'release'],
  location:   ['location', 'shelf', 'storage', 'place', 'disc'],
  image:      ['image', 'img', 'poster', 'url', 'cover', 'photo'],
  synopsis:   ['synopsis', 'description', 'plot', 'summary', 'overview'],
}

function findColumnIndex(headers, candidates) {
  const normalised = headers.map(h => (h ?? '').toString().toLowerCase().trim())
  for (const candidate of candidates) {
    const idx = normalised.findIndex(h => h.includes(candidate))
    if (idx !== -1) return idx
  }
  return -1
}

function findColumnIndexExcluding(headers, candidates, excluded) {
  const normalised = headers.map(h => (h ?? '').toString().toLowerCase().trim())
  for (const candidate of candidates) {
    const idx = normalised.findIndex((h, i) => !excluded.has(i) && h.includes(candidate))
    if (idx !== -1) return idx
  }
  return -1
}

function parseWorksheet(data) {
  if (!data || data.length < 2) return []

  const headers = data[0].map(h => (h ?? '').toString())
  const cols = {}
  // Resolve fields in order; track used indices so content-desc doesn't reuse the MPA col
  const usedIndices = new Set()
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = findColumnIndexExcluding(headers, aliases, usedIndices)
    cols[field] = idx
    if (idx >= 0) usedIndices.add(idx)
  }

  const get = (row, field) =>
    cols[field] >= 0 ? (row[cols[field]] ?? '').toString().trim() : ''

  return data
    .slice(1)
    .filter(row => get(row, 'title'))
    .map((row, index) => ({
      id:         index,
      title:      get(row, 'title')      || 'Untitled',
      genres:     parseGenres(get(row, 'genre')),   // array of individual genres
      genre:      get(row, 'genre')      || '',      // raw string kept for display
      mpa:        normaliseMPA(get(row, 'mpa')),
      mpaContent: get(row, 'mpaContent') || '',
      starring:   get(row, 'starring')   || '',
      year:       parseInt(get(row, 'year')) || null,
      location:   get(row, 'location')   || '',
      image:      get(row, 'image')      || '',
      synopsis:   get(row, 'synopsis')   || '',
    }))
}

// Split "Action, Comedy, Drama" → ['Action', 'Comedy', 'Drama']
function parseGenres(raw) {
  if (!raw) return []
  return raw.split(',').map(g => g.trim()).filter(Boolean)
}

function normaliseMPA(raw) {
  if (!raw) return ''
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').replace('PGPG', 'PG')
}

// ── Random helpers ────────────────────────────────────────────────────────────
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const SORT_OPTIONS = ['title-asc', 'title-desc', 'year-desc', 'year-asc', 'random']

// ── Composable ────────────────────────────────────────────────────────────────
export function useMovies() {
  const allMovies  = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  // Filter state — sort always starts as random; category set after load
  const search      = ref('')
  const sortKey     = ref('random')
  const activeGenre = ref('')
  const mpaTierIdx  = ref(DEFAULT_MPA_TIER)  // index into MPA_TIERS

  // ── Load from /public/movies.xlsx ──────────────────────────────────────
  async function loadCollection() {
    loading.value = true
    error.value   = null
    try {
      const response = await fetch('/movies.xlsx')
      if (!response.ok) throw new Error(`Could not fetch movies.xlsx (${response.status})`)
      const buffer = await response.arrayBuffer()
      const wb     = XLSX.read(buffer, { type: 'array' })
      const ws     = wb.Sheets[wb.SheetNames[0]]
      const data   = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      allMovies.value = parseWorksheet(data)

      // Pick a random genre on load (from available genres)
      const g = genres.value
      if (g.length > 0) activeGenre.value = randomFrom(g)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // ── Derived: unique individual genres ──────────────────────────────────────
  const genres = computed(() => {
    const set = new Set()
    allMovies.value.forEach(m => m.genres.forEach(g => set.add(g)))
    return [...set].sort()
  })

  // ── Active MPA tier ─────────────────────────────────────────────────────────
  const activeMPACodes = computed(() => MPA_TIERS[mpaTierIdx.value].codes)

  // ── Filtered + sorted result ────────────────────────────────────────────────
  const filteredMovies = computed(() => {
    let list = allMovies.value

    // Genre filter — movie matches if ANY of its genres matches
    if (activeGenre.value)
      list = list.filter(m => m.genres.includes(activeGenre.value))

    // MPA parental filter
    if (activeMPACodes.value !== null) {
      const allowed = activeMPACodes.value
      list = list.filter(m => {
        if (!m.mpa) return true // no rating = don't exclude
        return allowed.includes(m.mpa)
      })
    }

    if (search.value) {
      const q = search.value.toLowerCase()
      list = list.filter(m =>
        [m.title, m.genre, m.starring, m.synopsis].join(' ').toLowerCase().includes(q)
      )
    }

    const sorted = [...list]
    switch (sortKey.value) {
      case 'title-asc':  sorted.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'title-desc': sorted.sort((a, b) => b.title.localeCompare(a.title)); break
      case 'year-desc':  sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)); break
      case 'year-asc':   sorted.sort((a, b) => (a.year ?? 0) - (b.year ?? 0)); break
      case 'random':     sorted.sort(() => Math.random() - 0.5); break
    }
    return sorted
  })

  return {
    allMovies, loading, error,
    search, sortKey, activeGenre, mpaTierIdx,
    genres,
    filteredMovies,
    loadCollection,
  }
}
