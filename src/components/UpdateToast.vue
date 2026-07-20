<template>
  <div v-if="needRefresh" class="update-toast" role="status">
    <span class="update-message">A new version of ReelVault is available.</span>
    <div class="update-actions">
      <button class="update-btn" @click="refresh">Refresh</button>
      <button class="dismiss-btn" aria-label="Dismiss" @click="dismiss">✕</button>
    </div>
  </div>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    // The service worker only checks for updates on its own schedule
    // (page load / navigation). If the PWA is left open for a long time,
    // force a periodic check so updates aren't missed indefinitely.
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000) // hourly
  },
})

function refresh() {
  updateServiceWorker(true) // activates the new SW and reloads
}

function dismiss() {
  needRefresh.value = false
}
</script>

<style scoped>
.update-toast {
  position: fixed;
  left: 50%;
  bottom: 1.25rem;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: var(--bg2);
  border: 1px solid var(--bg3);
  color: var(--text);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  max-width: calc(100vw - 2rem);
}

.update-message {
  font-size: 0.85rem;
}

.update-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.update-btn {
  background: var(--accent);
  color: var(--bg);
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.update-btn:hover { filter: brightness(1.08); }

.dismiss-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
}

.dismiss-btn:hover { color: var(--text); }

@media (max-width: 480px) {
  .update-toast {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
    left: 1rem;
    right: 1rem;
    transform: none;
  }
  .update-actions { justify-content: flex-end; }
}
</style>
