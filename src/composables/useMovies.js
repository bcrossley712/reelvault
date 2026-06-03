// composables/useMovies.js

import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

// ── MPA rating hierarchy ──────────────────────────────────────────────────────
export const MPA_TIERS = [
  { label: 'All Ratings',       codes: null },
  { label: 'G only',            codes: ['G', 'TVY', 'TVG'] },
  { label: 'TV-Y through TV-G', codes: ['TVY', 'TVG', 'G'] },
  { label: 'TV-Y through PG',   codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG'] },
  { label: 'TV-Y through PG-13',codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'PG13', 'TV14'] },
  { label: 'TV-Y through R',    codes: ['TVY', 'TVG', 'TVY7', 'G', 'PG', 'TVPG', 'PG13', 'TV14', 'R'] },
  { label: 'All (incl. NC-17)', codes: null },
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

// ── TV season detection ───────────────────────────────────────────────────────
// Strips the full suffix off a title to get the bare show name.
// Captures: S1, S01, SEASON 1, PT1, PART 1, SET 1, VOL 1, BK1, COLLECTION 1
// BK (Book) is listed before VOL so "BK1 VOL1" matches BK1 as the primary label.
// Also swallows trailing disc info (D1, DISC 1, D1A) and A/B variants — those
// are irrelevant to grouping and are excluded from the dropdown label.
const STRIP_ALL_RE = /[\s_-]*(S\d{1,2}|SEASON\s*\d+|PT\.?\s*\d+|PART\.?\s*\d+|SET\.?\s*\d+|COLLECTION\s*\d+|COLL\.?\s*\d+|BK\.?\s*\d+|VOL\.?\s*\d+|VOLUME\s*\d+)(\s*(D\s*0?\d+[AB]?|DISC\s*\d+[AB]?))?(\s*[AB])?$/i

// Extracts the season sequence number for sorting
const SEASON_NUM_RE = /(?:S|SEASON\s*|PT\.?\s*|PART\.?\s*|SET\.?\s*|COLLECTION\s*|COLL\.?\s*|VOL\.?\s*|VOLUME\s*|BK\.?\s*)(\d{1,2})/i

function parseSeasonNumber(suffix) {
  if (!suffix) return 1
  const m = suffix.match(SEASON_NUM_RE)
  return m ? parseInt(m[1], 10) : 1
}

// Human-readable dropdown label — disc numbers intentionally excluded.
// rawTitle is passed so we can check for a BK number even when VOL is the
// primary regex match (e.g. "AVATAR BK1 VOL1" → Book 1, not Vol. 1)
function buildSeasonLabel(suffix, rawTitle) {
  if (!suffix) return ''
  const s = suffix.trim()

  // If the raw title contains a BK number, that takes priority as the label
  const bkMatch = rawTitle && rawTitle.match(/BK\.?\s*(\d+)/i)
  if (bkMatch) return `Book ${parseInt(bkMatch[1], 10)}`

  const m = s.match(/^(S(\d{1,2})|SEASON\s*(\d+)|PT\.?\s*(\d+)|PART\.?\s*(\d+)|SET\.?\s*(\d+)|VOL\.?\s*(\d+)|VOLUME\s*(\d+)|COLLECTION\s*(\d+)|COLL\.?\s*(\d+))/i)
  if (!m) return s
  const num = m.slice(2).find(v => v !== undefined)
  const key = m[1].toUpperCase()
  if (/^S\d/.test(key) || /^SEASON/.test(key))      return `Season ${num}`
  if (/^PT/.test(key) || /^PART/.test(key))          return `Part ${num}`
  if (/^SET/.test(key))                              return `Set ${num}`
  if (/^VOL/.test(key) || /^VOLUME/.test(key))       return `Vol. ${num}`
  if (/^COLL/.test(key))                             return `Collection ${num}`
  return s
}

// Returns the collective noun for the card badge: "Seasons", "Parts", "Books", etc.
function detectGroupType(title) {
  if (/BK\.?\s*\d+/i.test(title))                        return 'Books'
  if (/PT\.?\s*\d+|PART\.?\s*\d+/i.test(title))          return 'Parts'
  if (/SET\.?\s*\d+/i.test(title))                        return 'Sets'
  if (/VOL\.?\s*\d+|VOLUME\s*\d+/i.test(title))          return 'Vols.'
  if (/COLLECTION\s*\d+|COLL\.?\s*\d+/i.test(title))     return 'Collections'
  return 'Seasons'  // default for S1, SEASON 1, etc.
}

function detectTV(title, location) {
  const tvLoc = location && /tv\s*series|anime\/tv|cartoon\/tv/i.test(location)
  const suffixMatch = title.match(STRIP_ALL_RE)

  if (!suffixMatch && !tvLoc) {
    return { isTV: false, baseName: title, seasonNum: null, suffix: '', seasonLabel: '' }
  }

  const suffix   = suffixMatch ? suffixMatch[0] : ''
  let baseName   = suffixMatch ? title.slice(0, title.length - suffix.length).trim() : title.trim()
  // Second pass: strip any residual BK/VOL/PT/SET/PART/DISC number left in the base
  // e.g. "AVATAR BK1" → "AVATAR" after VOL1 was stripped as the primary suffix
  baseName = baseName.replace(/[\s_-]*(BK\.?\s*\d+|VOL\.?\s*\d+|PT\.?\s*\d+|PART\.?\s*\d+|SET\.?\s*\d+|DISC\s*\d+)$/i, '').trim()
  const seasonNum   = parseSeasonNumber(suffix)
  const seasonLabel = buildSeasonLabel(suffix.trim(), title)

  return { isTV: true, baseName, seasonNum, suffix: suffix.trim(), seasonLabel }
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
      const location = get(row, 'location') || ''
      const { isTV, baseName, seasonNum, suffix, seasonLabel } = detectTV(rawTitle, location)

      return {
        id:           index,
        title:        rawTitle,
        baseName:     isTV ? baseName : rawTitle,
        isTV,
        seasonNum,
        seasonSuffix: suffix,
        seasonLabel,
        groupType:    isTV ? detectGroupType(rawTitle) : '',
        genres:       parseGenres(get(row, 'genre')),
        genre:        get(row, 'genre')      || '',
        mpa:          normaliseMPA(get(row, 'mpa')),
        mpaContent:   get(row, 'mpaContent') || '',
        starring:     get(row, 'starring')   || '',
        year:         parseInt(get(row, 'year')) || null,
        location,
        image:        get(row, 'image')      || '',
        synopsis:     get(row, 'synopsis')   || '',
      }
    })
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

  // Search runs across the FULL catalog regardless of genre/MPA filters
  const searchResults = computed(() => {
    if (!search.value) return null  // null = no active search
    const q = search.value.toLowerCase()
    return allMovies.value.filter(m => {
      const base = [m.title, m.starring].join(' ').toLowerCase()
      if (m.isTV && m.seasons) {
        const seasonText = m.seasons
          .map(s => [s.title, s.starring].join(' '))
          .join(' ')
          .toLowerCase()
        return base.includes(q) || seasonText.includes(q)
      }
      return base.includes(q)
    })
  })

  // Genre + MPA filter runs on the full catalog when no search is active,
  // or is bypassed entirely when a search term is present
  const filteredMovies = computed(() => {
    // Active search — ignore genre/MPA filters, show full catalog matches
    let list = searchResults.value !== null
      ? searchResults.value
      : allMovies.value

    // Only apply genre/MPA filters when not searching
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
