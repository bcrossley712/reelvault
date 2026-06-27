<template>
  <!-- ── Initial tutorial modal ── -->
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div v-if="showModal" class="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Welcome to ReelVault">
        <div class="tutorial-modal">

          <div class="tutorial-header">
            <div class="tutorial-logo">REEL<span>VAULT</span></div>
            <div class="tutorial-version">v{{ APP_VERSION }}</div>
          </div>

          <!-- What's new -->
          <div class="tutorial-section" v-if="whatsNew.length">
            <h3 class="section-title">✨ What's New</h3>
            <ul class="feature-list">
              <li v-for="item in whatsNew" :key="item">{{ item }}</li>
            </ul>
          </div>

          <!-- How to use -->
          <div class="tutorial-section">
            <h3 class="section-title">📖 How to Use ReelVault</h3>
            <ul class="feature-list">
              <li>🎲 <strong>Random</strong> — sort shuffles the whole collection for discovery</li>
              <li>🔍 <strong>Search</strong> — find by title, cast, or abbreviation (LOTR, TMNT, MCU…)</li>
              <li>📂 <strong>Category + Filter By</strong> — narrow your browse to a specific genre combination</li>
              <li>📅 <strong>Decade</strong> — browse movies by era</li>
              <li>🎚️ <strong>Content</strong> — set a parental rating filter</li>
              <li>📺 <strong>TV Shows</strong> — grouped by season; tap a card and use the dropdown</li>
              <li>🎃 <strong>Holiday movies</strong> — appear automatically in their season</li>
            </ul>
          </div>

          <div class="tutorial-actions">
            <button class="btn-tour" @click="startTour">Show me around</button>
            <button class="btn-dismiss" @click="dismiss">Got it</button>
          </div>

        </div>
      </div>
    </Transition>

    <!-- ── Guided tour tooltip ── -->
    <Transition name="tooltip-fade">
      <div
        v-if="tourActive && currentStep"
        class="tour-tooltip"
        :style="tooltipStyle"
        role="tooltip"
      >
        <div class="tour-step-badge">{{ tourIndex + 1 }} / {{ tourSteps.length }}</div>
        <p class="tour-text">{{ currentStep.text }}</p>
        <div class="tour-actions">
          <button class="tour-skip" @click="endTour">Skip</button>
          <button class="tour-next" @click="nextStep">
            {{ tourIndex < tourSteps.length - 1 ? 'Next →' : 'Done ✓' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Tour highlight overlay -->
    <div v-if="tourActive" class="tour-highlight-mask" :style="maskStyle" @click="nextStep"></div>

    <!-- Tour done toast -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="tour-toast">🎉 You're all set!</div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const APP_VERSION = '1.0'
const STORAGE_KEY = 'reelvault_tutorial_version'

const whatsNew = [
  '🎄 Holiday movies appear automatically in their season',
  '📺 TV shows grouped by season with a dropdown selector',
  '🔍 Search now understands abbreviations — try LOTR, TMNT, MCU',
  '📂 Sub-category filter narrows within your selected genre',
  '📅 Decade filter to browse by era',
  '🎲 Random sort shuffles the whole collection',
]

const showModal   = ref(false)
const tourActive  = ref(false)
const tourIndex   = ref(0)
const showToast   = ref(false)
const tooltipPos  = ref({ top: 0, left: 0, width: 0, height: 0 })

// Tour steps — each targets a CSS selector
const tourSteps = [
  {
    selector: '.search-wrap, .rv-sw, [class*="search"]',
    text: '🔍 Search by title, cast name, or try abbreviations like LOTR, TMNT, or MCU. Also works with "The" — type "Notebook" to find "The Notebook".',
  },
  {
    selector: '#genre-select, [id*="genre"]',
    text: '📂 Category — browse by genre. Selecting a category unlocks a second "Filter By" dropdown to narrow further.',
  },
  {
    selector: '#sub-select, [id*="sub"]',
    text: '🎯 Filter By — appears after you select a Category. Shows only genres that exist within your current selection.',
    optional: true,
  },
  {
    selector: '#decade-select, [id*="decade"]',
    text: '📅 Decade — filter your results by era. Combine with a genre to find "90s Action" or "2000s Comedy".',
  },
  {
    selector: '#sort-select, [id*="sort"]',
    text: '🎲 Sort — try Random to discover something new. Changes each time you select it.',
  },
  {
    selector: '#mpa-select, [id*="mpa"]',
    text: '🎚️ Content — parental rating filter. Set this to control which ratings appear in browse results.',
  },
  {
    selector: '.movie-card, .rv-card, .mc',
    text: '🎬 Tap any card to open details — synopsis, cast, location, and MPA content info. TV shows include a season selector in the modal.',
  },
]

const currentStep = computed(() => {
  if (!tourActive.value) return null
  // Skip optional steps if the element isn't visible
  const step = tourSteps[tourIndex.value]
  if (step?.optional) {
    const el = findElement(step.selector)
    if (!el) return tourSteps[tourIndex.value + 1] ?? null
  }
  return step ?? null
})

function findElement(selector) {
  const parts = selector.split(',').map(s => s.trim())
  for (const s of parts) {
    const el = document.querySelector(s)
    if (el) return el
  }
  return null
}

const tooltipStyle = computed(() => {
  const { top, left, width, height } = tooltipPos.value
  const tipW = 280
  const margin = 12

  // Prefer showing below, fall back to above
  let tipTop = top + height + margin
  if (tipTop + 160 > window.innerHeight) tipTop = top - 160 - margin

  let tipLeft = left + width / 2 - tipW / 2
  tipLeft = Math.max(12, Math.min(tipLeft, window.innerWidth - tipW - 12))

  return {
    position: 'fixed',
    top:  tipTop  + 'px',
    left: tipLeft + 'px',
    width: tipW   + 'px',
    zIndex: 1000,
  }
})

const maskStyle = computed(() => {
  const { top, left, width, height } = tooltipPos.value
  const pad = 6
  return {
    position: 'fixed',
    top:    (top  - pad) + 'px',
    left:   (left - pad) + 'px',
    width:  (width  + pad * 2) + 'px',
    height: (height + pad * 2) + 'px',
    borderRadius: '8px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
    zIndex: 999,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  }
})

function positionTooltip() {
  const step = tourSteps[tourIndex.value]
  if (!step) return
  const el = findElement(step.selector)
  if (!el) {
    // Skip this step if element not found
    if (tourIndex.value < tourSteps.length - 1) {
      tourIndex.value++
      nextTick(positionTooltip)
    } else {
      endTour()
    }
    return
  }
  const rect = el.getBoundingClientRect()
  tooltipPos.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function nextStep() {
  if (tourIndex.value < tourSteps.length - 1) {
    tourIndex.value++
    nextTick(positionTooltip)
  } else {
    endTour()
  }
}

function endTour() {
  tourActive.value = false
  showToast.value  = true
  setTimeout(() => { showToast.value = false }, 2500)
}

function startTour() {
  showModal.value  = false
  tourActive.value = true
  tourIndex.value  = 0
  nextTick(positionTooltip)
}

function dismiss() {
  showModal.value = false
  saveVersion()
}

function saveVersion() {
  try { localStorage.setItem(STORAGE_KEY, APP_VERSION) } catch {}
}

function checkVersion() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== APP_VERSION) showModal.value = true
  } catch {
    showModal.value = true
  }
}

// Handle window resize — reposition tooltip
function onResize() { if (tourActive.value) positionTooltip() }

onMounted(() => {
  checkVersion()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

// Expose for the header ? button
defineExpose({ open: () => { showModal.value = true } })
</script>

<style scoped>
/* ── Tutorial modal ── */
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0,0,0,0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.tutorial-modal {
  background: var(--bg2);
  border: 1px solid var(--border-em);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  -webkit-overflow-scrolling: touch;
}

.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

.tutorial-logo {
  font-family: var(--font-display);
  font-size: 1.8rem;
  letter-spacing: 2px;
  color: var(--accent);
}
.tutorial-logo span { color: var(--text); }

.tutorial-version {
  font-size: 0.7rem;
  color: var(--muted);
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 2px 10px;
}

.tutorial-section {
  padding: 1.1rem 1.75rem;
  border-bottom: 1px solid var(--border);
}
.tutorial-section:last-of-type { border-bottom: none; }

.section-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.feature-list li {
  font-size: 0.85rem;
  color: var(--text);
  line-height: 1.5;
}
.feature-list li strong { color: var(--accent); }

.tutorial-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem 1.5rem;
  justify-content: flex-end;
}

.btn-tour {
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-body);
  transition: opacity 0.15s;
}
.btn-tour:hover { opacity: 0.85; }

.btn-dismiss {
  background: var(--bg3);
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.55rem 1.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: var(--font-body);
  transition: color 0.15s, border-color 0.15s;
}
.btn-dismiss:hover { color: var(--text); border-color: var(--muted2); }

/* ── Tour tooltip ── */
.tour-tooltip {
  background: var(--bg2);
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 1rem 1.1rem 0.9rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

.tour-step-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.4rem;
}

.tour-text {
  font-size: 0.83rem;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 0.85rem;
}

.tour-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tour-skip {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 0.75rem;
  cursor: pointer;
  font-family: var(--font-body);
  padding: 0;
}
.tour-skip:hover { color: var(--text); }

.tour-next {
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-body);
  transition: opacity 0.15s;
}
.tour-next:hover { opacity: 0.85; }

/* ── Toast ── */
.tour-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #000;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.65rem 1.5rem;
  border-radius: 100px;
  z-index: 1001;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

/* ── Transitions ── */
.tutorial-fade-enter-active { animation: fadeUp 0.25s ease; }
.tutorial-fade-leave-active { animation: fadeUp 0.18s ease reverse; }
.tooltip-fade-enter-active  { animation: fadeUp 0.2s ease; }
.tooltip-fade-leave-active  { animation: fadeUp 0.15s ease reverse; }
.toast-fade-enter-active    { animation: fadeUp 0.2s ease; }
.toast-fade-leave-active    { animation: fadeUp 0.2s ease reverse; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Mobile ── */
@media (max-width: 600px) {
  .tutorial-modal { max-width: 100%; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .tutorial-overlay { align-items: flex-end; padding: 0; }
  .tutorial-header { padding: 1.25rem 1.25rem 0.75rem; }
  .tutorial-section { padding: 0.9rem 1.25rem; }
  .tutorial-actions { padding: 1rem 1.25rem 1.25rem; }
}
</style>
