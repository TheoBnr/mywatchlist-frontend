

<script setup lang="ts">
import type { WatchlistEntry } from '../types/WatchlistEntry'

defineProps<{
  entries: WatchlistEntry[]
}>()

const emit = defineEmits<{
  edit: [entry: WatchlistEntry]
  delete: [movieId: number]
}>()

function confirmDelete(entry: WatchlistEntry) {
  if (window.confirm(`"${entry.title}" wirklich löschen?`)) {
    emit('delete', entry.movieId)
  }
}
</script>


<template>
  <div v-if="entries.length === 0" class="empty-state">
    <h2>Keine Einträge gefunden</h2>
    <p>Versuche einen anderen Suchbegriff oder Filter.</p>
  </div>

  <div v-else class="watchlist">
    <article
      v-for="entry in entries"
      :key="entry.movieId"
      class="watchlist-card"
    >
      <div class="poster">
        <span>{{ entry.type === 'Film' ? '🎬' : '📺' }}</span>
      </div>

      <div class="card-content">
        <div class="card-heading">
          <span class="type">{{ entry.type }}</span>
          <span
            class="status"
            :class="{
              completed: entry.status === 'Abgeschlossen',
              watching: entry.status === 'Am Schauen'
            }"
          >
            {{ entry.status }}
          </span>
        </div>

        <h2>{{ entry.title }}</h2>

        <p class="rating">
          <template v-if="entry.rating !== null">
            ⭐ {{ entry.rating }}/10
          </template>
          <template v-else>
            Noch keine Bewertung
          </template>
        </p>

        <div class="card-actions">
          <button
            type="button"
            class="edit-button"
            @click="emit('edit', entry)"
          >
            Bearbeiten
          </button>

          <button
            type="button"
            class="delete-button"
            @click="confirmDelete(entry)"
          >
            Löschen
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.watchlist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.watchlist-card {
  background: #1c2333;
  border: 1px solid #30394a;
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.watchlist-card:hover {
  transform: translateY(-5px);
  border-color: #727cf5;
}

.poster {
  height: 180px;
  background: linear-gradient(135deg, #303b5c, #151c2e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 65px;
}

.card-content {
  padding: 18px;
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.type {
  color: #aab6cd;
  font-size: 12px;
}

.status {
  color: #d5baff;
  background: #413158;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 11px;
}

.status.completed {
  background: #194a3a;
  color: #7ce5b0;
}

.status.watching {
  background: #544225;
  color: #ffd58c;
}

h2 {
  margin: 16px 0;
  font-size: 20px;
  color: #fff;
}

.rating {
  color: #b8c3d7;
  font-size: 14px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  background: #1c2333;
  border-radius: 14px;
}

.empty-state h2 {
  margin-bottom: 10px;
}

.empty-state p {
  color: #aab6cd;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.card-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.edit-button {
  background: #384567;
  color: white;
}

.edit-button:hover {
  background: #50618d;
}

.delete-button {
  background: #572b37;
  color: #ffb5c3;
}

.delete-button:hover {
  background: #763746;
}
</style>
