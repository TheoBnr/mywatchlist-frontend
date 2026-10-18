

<script setup lang="ts">
import { ref } from 'vue'
import type { WatchlistEntry } from '../types/WatchlistEntry'

const props = defineProps<{
  entry: WatchlistEntry
  fieldErrors: Record<string, string>
  updating: boolean
}>()

const emit = defineEmits<{
  save: [entry: WatchlistEntry]
  cancel: []
}>()

// Bisherige Werte übernehmen
const title = ref(props.entry.title)
const type = ref(props.entry.type)
const status = ref(props.entry.status)

// Bewertung als Zahl oder leeren Wert speichern
const ratingInput = ref<number | ''>(
  props.entry.rating ?? ''
)

function saveChanges() {
  const cleanTitle = title.value.trim()

  if (!cleanTitle) return

  // Leeres Eingabefeld bedeutet: keine Bewertung
  const rating =
    ratingInput.value === ''
      ? null
      : Number(ratingInput.value)

  // Bewertung validieren
  if (
    rating !== null &&
    (!Number.isInteger(rating) || rating < 1 || rating > 10)
  ) {
    alert('Bitte eine Bewertung zwischen 1 und 10 eingeben.')
    return
  }

  // Aktualisierten Eintrag an App.vue senden
  emit('save', {
    ...props.entry,
    title: cleanTitle,
    type: type.value,
    status: status.value,
    rating
  })
}
</script>


<template>
  <section class="edit-panel">
    <h2>Eintrag bearbeiten</h2>
    <p
      v-if="Object.keys(fieldErrors).length > 0"
      class="form-error"
      role="alert"
    >
      Bitte korrigiere die markierten Eingabefelder.
    </p>
    <form @submit.prevent="saveChanges">
      <div class="form-group">
        <label for="edit-title">Titel</label>
        <input
          id="edit-title"
          v-model="title"
          type="text"
          maxlength="200"
          required
          :aria-invalid="Boolean(fieldErrors.title)"
          :aria-describedby="fieldErrors.title ? 'edit-title-error' : undefined"
        />
        <p
          v-if="fieldErrors.title"
          id="edit-title-error"
          class="field-error"
        >
          {{ fieldErrors.title }}
        </p>
      </div>

      <div class="form-group">
        <label for="edit-type">Typ</label>
        <select id="edit-type" v-model="type">
          <option value="Film">Film</option>
          <option value="Serie">Serie</option>
        </select>
        <p v-if="fieldErrors.type" class="field-error">
          {{ fieldErrors.type }}
        </p>
      </div>

      <div class="form-group">
        <label for="edit-status">Status</label>
        <select id="edit-status" v-model="status">
          <option value="Geplant">Geplant</option>
          <option value="Am Schauen">Am Schauen</option>
          <option value="Abgeschlossen">
            Abgeschlossen
          </option>
        </select>
        <p v-if="fieldErrors.status" class="field-error">
          {{ fieldErrors.status }}
        </p>
      </div>


      <div class="form-group">
        <label for="edit-rating">
          Bewertung (1–10)
        </label>

        <input
          id="edit-rating"
          v-model.number="ratingInput"
          type="number"
          min="1"
          max="10"
          step="1"
          placeholder="Keine Bewertung"
        />
        <p v-if="fieldErrors.rating" class="field-error">
          {{ fieldErrors.rating }}
        </p>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="save-button"
          :disabled="updating"
        >
          {{ updating ? 'Speichert ...' : 'Speichern' }}
        </button>

        <button
          type="button"
          class="cancel-button"
          @click="emit('cancel')"
        >
          Abbrechen
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.edit-panel {
  background: #242d43;
  border: 1px solid #727cf5;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 30px;
}

h2 {
  margin: 0 0 24px;
  font-size: 22px;
}

form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.form-actions {
  display: flex;
  align-items: end;
  gap: 12px;
}

button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.save-button {
  background: #727cf5;
  color: white;
}

.cancel-button {
  background: #384257;
  color: white;
}

@media (max-width: 600px) {
  form {
    grid-template-columns: 1fr;
  }
}
.field-error,
.form-error {
  color: #ffb5c3;
  font-size: 14px;
}

.field-error {
  margin: 4px 0 0;
}

.form-error {
  margin-bottom: 16px;
}

input[aria-invalid="true"],
select[aria-invalid="true"] {
  border-color: #ff7b94;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
