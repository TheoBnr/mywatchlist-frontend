
<script setup lang="ts">
import { ref } from 'vue'
import type { WatchlistEntry } from '../types/WatchlistEntry'

const title = ref('')
const type = ref('Film')
const status = ref('Geplant')

const emit = defineEmits<{
  add: [entry: Pick<WatchlistEntry, 'title' | 'type' | 'status'>]
}>()

function submitEntry() {
  const cleanTitle = title.value.trim()

  if (!cleanTitle) return

  emit('add', {
    title: cleanTitle,
    type: type.value,
    status: status.value
  })

  // Formular zurücksetzen
  title.value = ''
  type.value = 'Film'
  status.value = 'Geplant'
}
</script>

<template>
  <section class="form-container">
    <h2>Neuen Eintrag hinzufügen</h2>

    <form @submit.prevent="submitEntry">
      <div class="form-group">
        <label for="title">Titel</label>
        <input
          id="title"
          v-model="title"
          type="text"
          placeholder="Film oder Serie eingeben"
          maxlength="100"
          required
        />
      </div>

      <div class="form-group">
        <label for="type">Typ</label>
        <select id="type" v-model="type">
          <option value="Film">Film</option>
          <option value="Serie">Serie</option>
        </select>
      </div>

      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" v-model="status">
          <option value="Geplant">Geplant</option>
          <option value="Am Schauen">Am Schauen</option>
          <option value="Abgeschlossen">Abgeschlossen</option>
        </select>
      </div>

      <button type="submit">+ Hinzufügen</button>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  background: #1c2333;
  border: 1px solid #30394a;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 36px;
}

h2 {
  margin-top: 0;
  margin-bottom: 22px;
  font-size: 22px;
}

form {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 170px;
}

label {
  color: #aab6cd;
  font-size: 14px;
}

input,
select {
  background: #111827;
  color: white;
  border: 1px solid #384257;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  width: 100%;
}

button {
  background: #727cf5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 13px 22px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

button:hover {
  background: #5b66e8;
}
</style>
