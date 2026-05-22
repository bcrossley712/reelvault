<template>
  <header class="app-header">
    <div class="logo">REEL<span>VAULT</span></div>

    <div class="search-wrap">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Search titles, cast, genre…"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        aria-label="Search movies"
      />
      <button
        v-if="modelValue"
        class="search-clear"
        aria-label="Clear search"
        @click="$emit('update:modelValue', '')"
      >✕</button>
    </div>

    <div class="header-count" aria-live="polite">
      {{ count }} title{{ count !== 1 ? 's' : '' }}
    </div>
  </header>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  count:      { type: Number, default: 0  },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  height: 60px;
  padding: 0 1.5rem;
  background: rgba(10, 10, 15, 0.96);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.logo {
  font-family: var(--font-display);
  font-size: 1.7rem;
  letter-spacing: 2px;
  color: var(--accent);
  white-space: nowrap;
  flex-shrink: 0;
}
.logo span { color: var(--text); }

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 480px;
}
.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--muted);
  pointer-events: none;
}
.search-input {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.875rem;
  padding: 0.48rem 2rem 0.48rem 2.1rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.search-input:focus {
  border-color: var(--accent);
  background: var(--bg2);
}
.search-input::placeholder { color: var(--muted); }

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted2);
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  padding: 3px;
  border-radius: 50%;
  transition: color 0.15s;
}
.search-clear:hover { color: var(--text); }

.header-count {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 600px) {
  .app-header { padding: 0 1rem; gap: 0.65rem; height: 54px; }
  .header-count { display: none; }
}
</style>
