// composables/useMovies.js

import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

// ── MPA rating hierarchy ──────────────────────────────────────────────────────
export const MPA_TIERS = [
  // NR (Not Rated) included in every tier — unsubmitted titles like children's
  // movies should always be visible. UR (Unrated) only appears in "All Ratings".
  { label: 'All Ratings',        codes: null },
  { label: 'G only',             codes: ['G', 'TVY', 'TVG', 'NR'] },
  { label: 'TV-Y through TV-G',  codes: ['TVY', 'TVG', 'G', 'NR'] },
  { label: 'TV-Y through PG',    codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'NR'] },
  { label: 'TV-Y through PG-13', codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'PG13', 'TV14', 'NR'] },
  { label: 'TV-Y through R',     codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'PG13', 'TV14', 'R', 'NR'] },
]

export const DEFAULT_MPA_TIER = 4

// ── Column auto-detection ─────────────────────────────────────────────────────
const COLUMN_ALIASES = {
  title:      ['title'],
  genre:      ['genre', 'category'],
  mpa:        ['rating', 'mpa', 'mpaa', 'rated'],
  mpaContent: ['mpa', 'content', 'content description', 'content rating', 'rating reason'],
  starring:   ['starring', 'cast', 'actors', 'star'],
  year:       ['year', 'released', 'release'],
  location:   ['location', 'shelf', 'storage', 'place', 'disc'],
  image:      ['image', 'img', 'poster', 'url', 'cover', 'photo'],
  synopsis:   ['synopsis', 'description', 'plot', 'summary', 'overview'],
}

function findColumnIndexExcluding(headers, candidates, excluded) {
  const normalised = headers.map(h => (h ?? '').toString().toLowerCase().trim())
  for (const candidate of candidates) {
    const idx = normalised.findIndex((h, i) => !excluded.has(i) && h.includes(candidate))
    if (idx !== -1) return idx
  }
  return -1
}

// ── TV season detection — dash-based convention ───────────────────────────────
// Titles must use " - S1", " - PT1", " - BK1" etc. to be treated as TV.
// Movies with numbered titles (Blade 2, Rocky 4) are never affected.
const TV_DASH_RE = /\s+-\s+(S(\d{1,2})|PT(\d{1,2})|BK(\d{1,2})|Vol\s*(\d{1,2})|Set\s*(\d{1,2})|Collection\s*(\d{1,2}))$/i

function detectTV(title) {
  const m = title.match(TV_DASH_RE)
  if (!m) return { isTV: false, baseName: title, seasonNum: null, seasonLabel: '' }

  const suffix    = m[1]                              // e.g. "S1", "PT2", "BK3"
  const baseName  = title.slice(0, title.length - m[0].length).trim()
  const num       = parseInt(m.slice(2).find(Boolean)) // first capture group with a value

  // Human-readable label for the dropdown
  const upper = suffix.toUpperCase()
  let seasonLabel
  if      (/^S\d/.test(upper))   seasonLabel = `Season ${num}`
  else if (/^PT/.test(upper))    seasonLabel = `Part ${num}`
  else if (/^BK/.test(upper))    seasonLabel = `Book ${num}`
  else if (/^VOL/i.test(upper))  seasonLabel = `Vol. ${num}`
  else if (/^SET/i.test(upper))  seasonLabel = `Set ${num}`
  else if (/^COL/i.test(upper))  seasonLabel = `Collection ${num}`
  else                           seasonLabel = suffix

  return { isTV: true, baseName, seasonNum: num, seasonLabel }
}

// ── Worksheet parsing ─────────────────────────────────────────────────────────
function parseWorksheet(data) {
  if (!data || data.length < 2) return []

  const headers = data[0].map(h => (h ?? '').toString())
  const cols = {}
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
    .map((row, index) => {
      const rawTitle = get(row, 'title') || 'Untitled'
      const { isTV, baseName, seasonNum, seasonLabel } = detectTV(rawTitle)

      return {
        id:           index,
        title:        rawTitle,
        baseName:     isTV ? baseName : rawTitle,
        isTV,
        seasonNum,
        seasonLabel,
        seasonSuffix: seasonLabel, // kept for modal compatibility
        groupType:    isTV ? detectGroupType(rawTitle) : '',
        genres:       parseGenres(get(row, 'genre')),
        genre:        get(row, 'genre')      || '',
        mpa:          normaliseMPA(get(row, 'mpa')),
        mpaContent:   get(row, 'mpaContent') || '',
        starring:     get(row, 'starring')   || '',
        year:         parseInt(get(row, 'year')) || null,
        location:     get(row, 'location')   || '',
        image:        get(row, 'image')      || '',
        synopsis:     get(row, 'synopsis')   || '',
      }
    })
}

function detectGroupType(title) {
  const m = title.match(TV_DASH_RE)
  if (!m) return 'Seasons'
  const s = m[1].toUpperCase()
  if (/^PT/.test(s))  return 'Parts'
  if (/^BK/.test(s))  return 'Books'
  if (/^VOL/i.test(s)) return 'Vols.'
  if (/^SET/i.test(s)) return 'Sets'
  if (/^COL/i.test(s)) return 'Collections'
  return 'Seasons'
}

function parseGenres(raw) {
  if (!raw) return []
  return raw.split(',').map(g => g.trim()).filter(Boolean)
}

function normaliseMPA(raw) {
  if (!raw) return ''
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').replace('PGPG', 'PG')
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Group TV seasons into a single card entry ─────────────────────────────────
function groupTVSeasons(movies) {
  const tvGroups = new Map()
  const result   = []

  for (const m of movies) {
    if (!m.isTV) {
      result.push(m)
      continue
    }
    const key = m.baseName.toUpperCase()
    if (!tvGroups.has(key)) tvGroups.set(key, [])
    tvGroups.get(key).push(m)
  }

  for (const [, seasons] of tvGroups) {
    seasons.sort((a, b) => (a.seasonNum ?? 1) - (b.seasonNum ?? 1))
    const first = seasons[0]
    result.push({
      ...first,
      title:   first.baseName,
      seasons,
      isTV:    true,
    })
  }

  return result
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useMovies() {
  const allMovies  = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  const search      = ref('')
  const sortKey     = ref('random')
  const activeGenre = ref('')
  const mpaTierIdx  = ref(DEFAULT_MPA_TIER)

  async function loadCollection() {
    loading.value = true
    error.value   = null
    try {
      const response = await fetch('movies.xlsx')
      if (!response.ok) throw new Error(`Could not fetch movies.xlsx (${response.status})`)
      const buffer = await response.arrayBuffer()
      const wb     = XLSX.read(buffer, { type: 'array' })
      const ws     = wb.Sheets[wb.SheetNames[0]]
      const data   = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      const parsed = parseWorksheet(data)
      allMovies.value = groupTVSeasons(parsed)

      const g = genres.value
      if (g.length > 0) activeGenre.value = randomFrom(g)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const genres = computed(() => {
    const set = new Set()
    allMovies.value.forEach(m => m.genres.forEach(g => set.add(g)))
    return [...set].sort()
  })

  const activeMPACodes = computed(() => MPA_TIERS[mpaTierIdx.value].codes)

  // ── Smart search ────────────────────────────────────────────────────────────
  // Supports abbreviations and reverse lookups:
  //   LOTR    → finds Lord of the Rings entries
  //   TMNT    → finds Teenage Mutant Ninja Turtles
  //   "ninja" → finds TMNT (reverse alias match)
  //   MCU/marvel/superhero → finds all Superhero-tagged titles
  const ALIASES = {
    // Franchises
    'lotr':          'lord of the rings',
    'tmnt':          'teenage mutant ninja turtles',
    'hp':            'harry potter',
    'sw':            'star wars',
    'dbz':           'dragon ball z',
    'fma':           'fullmetal alchemist',
    'mha':           'my hero academia',
    'aot':           'attack on titan',
    'bttf':          'back to the future',
    'potc':          'pirates of the caribbean',
    'hg':            'hunger games',
    'mi':            'mission impossible',
    'ff':            'fast and furious',
    'f&f':           'fast and furious',
    'jw':            'jurassic world',
    // Superhero shortcuts — all resolve to "superhero" which matches the genre tag
    'mcu':           'superhero',
    'marvel':        'superhero',
    'dc':            'superhero',
    // Common title variations
    'xmen':          'x-men',
    'x men':         'x-men',
    'spiderman':     'spider-man',
    'spider man':    'spider-man',
  }

  function expandQuery(q) {
    const lower = q.trim().toLowerCase()
    // Direct alias lookup: "lotr" → "lord of the rings"
    if (ALIASES[lower]) return [lower, ALIASES[lower]]
    // Reverse alias lookup: "ninja" → also search via "tmnt" alias value
    const reverseMatches = Object.entries(ALIASES)
      .filter(([abbr, full]) => full.includes(lower))
      .map(([abbr]) => abbr)
    return [lower, ...reverseMatches]
  }

  function movieMatchesQuery(m, terms) {
    const haystack = [m.title, m.starring, m.genre, m.baseName || '']
      .join(' ').toLowerCase()
    return terms.some(t => haystack.includes(t))
  }

  // Search runs across the FULL catalog regardless of genre/MPA filters
  const searchResults = computed(() => {
    if (!search.value) return null
    const terms = expandQuery(search.value)
    return allMovies.value.filter(m => {
      if (movieMatchesQuery(m, terms)) return true
      // Also search across all seasons for TV shows
      if (m.isTV && m.seasons) {
        return m.seasons.some(s => movieMatchesQuery(s, terms))
      }
      return false
    })
  })

  const filteredMovies = computed(() => {
    let list = searchResults.value !== null
      ? searchResults.value
      : allMovies.value

    if (searchResults.value === null) {
      if (activeGenre.value)
        list = list.filter(m => m.genres.includes(activeGenre.value))

      if (activeMPACodes.value !== null) {
        const allowed = activeMPACodes.value
        list = list.filter(m => {
          if (!m.mpa) return true
          return allowed.includes(m.mpa)
        })
      }
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
