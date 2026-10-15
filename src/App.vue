

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import WatchlistList from './components/WatchlistList.vue'
import AddEntryForm from './components/AddEntryForm.vue'
import EditEntryForm from './components/EditEntryForm.vue'
import type { WatchlistEntry } from './types/WatchlistEntry'

// Form der JSON-Objekte aus dem Spring-Boot-Backend (id statt movieId)
type BackendWatchlistEntry = Omit<WatchlistEntry, 'movieId'> & {
  id: number
}

// Die Watchlist wird nicht mehr fest im Frontend hinterlegt.
const entries = ref<WatchlistEntry[]>([])
const loading = ref(true)
const errorMessage = ref('')

// Lokal: http://localhost:8080 | Auf Render: VITE_API_BASE_URL konfigurieren
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '')

async function loadWatchlist() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/watchlist`)

    if (!response.ok) {
      throw new Error(`Backend antwortet mit HTTP ${response.status}`)
    }

    const backendEntries = (await response.json()) as BackendWatchlistEntry[]

    // Backend-Feld "id" in das Frontend-Feld "movieId" übersetzen.
    entries.value = backendEntries.map(({ id, title, type, status, rating }) => ({
      movieId: id,
      title,
      type,
      status,
      rating
    }))
  } catch (error) {
    console.error('Fehler beim Laden der Watchlist:', error)
    errorMessage.value = 'Die Watchlist konnte nicht geladen werden. Prüfe die Backend-Verbindung.'
  } finally {
    loading.value = false
  }
}

// Beim Öffnen der Vue-App die Backend-Daten laden.
onMounted(loadWatchlist)

const search = ref('')
const selectedStatus = ref('Alle')

// Neue Einträge im Backend speichern; PostgreSQL erzeugt die ID.
const saving = ref(false)

async function addEntry(
  newEntry: Pick<WatchlistEntry, 'title' | 'type' | 'status'>,
  resetForm: () => void
) {
  if (saving.value) return

  saving.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEntry, rating: null })
    })

    if (!response.ok) {
      throw new Error(`Backend antwortet mit HTTP ${response.status}`)
    }

    const savedEntry = (await response.json()) as BackendWatchlistEntry

    entries.value.push({
      movieId: savedEntry.id,
      title: savedEntry.title,
      type: savedEntry.type,
      status: savedEntry.status,
      rating: savedEntry.rating
    })

    resetForm()
  } catch (error) {
    console.error('Fehler beim Speichern des Eintrags:', error)
    errorMessage.value = 'Der Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.'
  } finally {
    saving.value = false
  }
}

// Aktuell ausgewählter Eintrag zum Bearbeiten
const editingEntry = ref<WatchlistEntry | null>(null)

// Bearbeitung starten
function startEditing(entry: WatchlistEntry) {
  editingEntry.value = { ...entry }
}

// Änderungen speichern
function saveEditedEntry(updatedEntry: WatchlistEntry) {
  const index = entries.value.findIndex(
    entry => entry.movieId === updatedEntry.movieId
  )

  if (index === -1) return

  entries.value[index] = updatedEntry
  editingEntry.value = null
}

// Bearbeitung abbrechen
function cancelEditing() {
  editingEntry.value = null
}

// Eintrag löschen
function deleteEntry(movieId: number) {
  entries.value = entries.value.filter(
    entry => entry.movieId !== movieId
  )

  if (editingEntry.value?.movieId === movieId) {
    editingEntry.value = null
  }
}

// Bestehende Filterfunktion
const filteredEntries = computed(() => {
  return entries.value.filter((entry) => {
    const matchesSearch = entry.title
      .toLowerCase()
      .includes(search.value.trim().toLowerCase())

    const matchesStatus =
      selectedStatus.value === 'Alle' ||
      entry.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})
</script>


<template>
  <div class="app-shell">
    <header class="navbar">
      <div class="navbar-inner">
        <div class="logo">🎬 MyWatchlist</div>
        <span class="nav-text">Meine Sammlung</span>
      </div>
    </header>

    <main class="container">
      <section class="welcome">
        <h1>Meine Watchlist</h1>
        <p>
          Verwalte deine Lieblingsfilme und Serien
          an einem Ort.
        </p>
      </section>
      <AddEntryForm :saving="saving" @add="addEntry" />

      <EditEntryForm
        v-if="editingEntry"
        :key="editingEntry.movieId"
        :entry="editingEntry"
        @save="saveEditedEntry"
        @cancel="cancelEditing"
      />

      <section class="toolbar">
        <input
          v-model="search"
          type="search"
          placeholder="Film oder Serie suchen ..."
          aria-label="Watchlist durchsuchen"
          class="search-input"
        />

        <select
          v-model="selectedStatus"
          aria-label="Nach Status filtern"
          class="filter-select"
        >
          <option>Alle</option>
          <option>Geplant</option>
          <option>Am Schauen</option>
          <option>Abgeschlossen</option>
        </select>
      </section>

      <div class="section-heading">
        <h2>Deine Sammlung</h2>
        <span>{{ filteredEntries.length }} Einträge</span>
      </div>

      <p v-if="errorMessage" role="alert" class="error-message">
        {{ errorMessage }}
      </p>
      <p v-if="loading" role="status">Watchlist wird geladen ...</p>
      <WatchlistList
        v-else
        :entries="filteredEntries"
        @edit="startEditing"
        @delete="deleteEntry"
      />

    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #111827;
  color: #f4f6fc;
  font-family: Inter, Arial, sans-serif;
}

.app-shell {
  min-height: 100vh;
}

.navbar {
  background: #1c2333;
  border-bottom: 1px solid #30394a;
}

.navbar-inner {
  max-width: 1200px;
  margin: auto;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 23px;
  font-weight: bold;
  color: #a5adff;
}

.nav-text {
  color: #aab6cd;
  font-size: 14px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 44px 24px;
}

.welcome h1 {
  font-size: 36px;
  margin: 0 0 12px;
}

.welcome p {
  color: #aab6cd;
  margin-bottom: 35px;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 35px;
}

.search-input,
.filter-select {
  background: #1c2333;
  border: 1px solid #384257;
  border-radius: 9px;
  padding: 14px;
  font-size: 14px;
  color: white;
}

.search-input {
  flex: 1;
  min-width: 0;
}

.filter-select {
  min-width: 180px;
}

.search-input:focus,
.filter-select:focus {
  outline: 2px solid #727cf5;
  outline-offset: 2px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.section-heading h2 {
  font-size: 23px;
}

.section-heading span {
  color: #aab6cd;
}

.error-message {
  color: #ffb5c3;
}

@media (max-width: 600px) {
  .toolbar {
    flex-direction: column;
  }

  .welcome h1 {
    font-size: 28px;
  }
}
</style>
