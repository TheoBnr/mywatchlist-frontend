import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'

type BackendEntry = {
  id: number
  title: string
  type: string
  status: string
  rating: number | null
}

const interstellar: BackendEntry = {
  id: 7,
  title: 'Interstellar',
  type: 'Film',
  status: 'Geplant',
  rating: null
}

const dark: BackendEntry = {
  id: 8,
  title: 'Dark',
  type: 'Serie',
  status: 'Abgeschlossen',
  rating: 9
}

// Simuliert eine erfolgreiche Antwort des Spring-Boot-Backends.
function successResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data
  }
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('MyWatchlist – Frontend', () => {
  it('lädt und zeigt gespeicherte Filme und Serien über GET an', async () => {
    fetchMock.mockResolvedValueOnce(successResponse([interstellar, dark]))

    const wrapper = mount(App)
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/watchlist$/))
    expect(wrapper.findAll('.watchlist-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Interstellar')
    expect(wrapper.text()).toContain('Dark')
  })

  it('filtert die Watchlist nach Filmtitel, unabhängig von Groß- und Kleinschreibung', async () => {
    fetchMock.mockResolvedValueOnce(successResponse([interstellar, dark]))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[aria-label="Watchlist durchsuchen"]').setValue('dArK')

    expect(wrapper.findAll('.watchlist-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Dark')
    expect(wrapper.text()).not.toContain('Interstellar')
  })

  it('filtert die Watchlist nach Status', async () => {
    fetchMock.mockResolvedValueOnce(successResponse([interstellar, dark]))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('select[aria-label="Nach Status filtern"]').setValue('Geplant')

    expect(wrapper.findAll('.watchlist-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Interstellar')
    expect(wrapper.text()).not.toContain('Dark')
  })

  it('sendet einen neuen Film per POST und zeigt ihn nach erfolgreicher Speicherung an', async () => {
    const newEntry: BackendEntry = {
      id: 11,
      title: 'Inception',
      type: 'Film',
      status: 'Geplant',
      rating: null
    }
    fetchMock
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(successResponse(newEntry))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('#title').setValue('Inception')
    await wrapper.get('.form-container form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/watchlist$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Inception',
          type: 'Film',
          status: 'Geplant',
          rating: null
        })
      })
    )
    expect(wrapper.findAll('.watchlist-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Inception')
    expect((wrapper.get('#title').element as HTMLInputElement).value).toBe('')
  })

  it('sendet Änderungen per PUT und aktualisiert den angezeigten Eintrag', async () => {
    const updatedEntry: BackendEntry = {
      ...interstellar,
      status: 'Abgeschlossen',
      rating: 10
    }
    fetchMock
      .mockResolvedValueOnce(successResponse([interstellar]))
      .mockResolvedValueOnce(successResponse(updatedEntry))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.edit-button').trigger('click')
    await wrapper.get('#edit-status').setValue('Abgeschlossen')
    await wrapper.get('#edit-rating').setValue('10')
    await wrapper.get('.edit-panel form').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/watchlist\/7$/),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          title: 'Interstellar',
          type: 'Film',
          status: 'Abgeschlossen',
          rating: 10
        })
      })
    )
    expect(wrapper.get('.watchlist-card').text()).toContain('Abgeschlossen')
    expect(wrapper.get('.watchlist-card').text()).toContain('10/10')
  })

  it('löscht einen Eintrag per DELETE erst nach erfolgreicher Serverantwort', async () => {
    fetchMock
      .mockResolvedValueOnce(successResponse([interstellar]))
      .mockResolvedValueOnce({ ok: true, status: 204 })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.delete-button').trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/watchlist\/7$/),
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(wrapper.findAll('.watchlist-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('Keine Einträge gefunden')
  })

  it('zeigt bei fehlgeschlagenem POST eine Fehlermeldung und behält die Eingabe', async () => {
    fetchMock
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce({ ok: false, status: 500 })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('#title').setValue('Inception')
    await wrapper.get('.form-container form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('konnte nicht gespeichert werden')
    expect((wrapper.get('#title').element as HTMLInputElement).value).toBe('Inception')
    expect(wrapper.findAll('.watchlist-card')).toHaveLength(0)
  })

  it('zeigt Backend-Validierungsfehler direkt am Titelfeld an', async () => {
    fetchMock
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Ungültige Eingaben.',
          errors: {
            title: 'Der Titel darf nicht leer sein.'
          }
        })
      })

    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('#title').setValue('Inception')
    await wrapper.get('.form-container form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('#title-error').text())
      .toBe('Der Titel darf nicht leer sein.')

    expect(wrapper.get('#title').attributes('aria-invalid'))
      .toBe('true')

    expect((wrapper.get('#title').element as HTMLInputElement).value)
      .toBe('Inception')

    expect(wrapper.findAll('.watchlist-card')).toHaveLength(0)
  })

  it('zeigt Validierungsfehler beim Bearbeiten und behält die Eingabe', async () => {
    fetchMock
      .mockResolvedValueOnce(successResponse([interstellar]))
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Ungültige Eingaben.',
          errors: {
            title: 'Der Titel ist ungültig.'
          }
        })
      })

    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('.edit-button').trigger('click')
    await wrapper.get('#edit-title').setValue('Neuer Titel')
    await wrapper.get('.edit-panel form').trigger('submit')
    await flushPromises()

    // Fehlermeldung am Eingabefeld
    expect(wrapper.get('#edit-title-error').text())
      .toBe('Der Titel ist ungültig.')

    // Feld als ungültig gekennzeichnet
    expect(wrapper.get('#edit-title').attributes('aria-invalid'))
      .toBe('true')

    // Bearbeitungsformular bleibt geöffnet
    expect(wrapper.find('.edit-panel').exists()).toBe(true)

    // Eingabe bleibt erhalten
    expect(
      (wrapper.get('#edit-title').element as HTMLInputElement).value
    ).toBe('Neuer Titel')

    // Gespeicherter Eintrag bleibt unverändert
    expect(wrapper.get('.watchlist-card').text())
      .toContain('Interstellar')
  })

  it('begrenzt die Titellänge in beiden Formularen auf 200 Zeichen', async () => {
    fetchMock.mockResolvedValueOnce(successResponse([interstellar]))

    const wrapper = mount(App)
    await flushPromises()

    // Formular zum Hinzufügen
    const addTitle = wrapper.get('#title')

    expect(addTitle.attributes('maxlength')).toBe('200')

    // Bearbeitungsformular öffnen
    await wrapper.get('.edit-button').trigger('click')

    const editTitle = wrapper.get('#edit-title')

    expect(editTitle.attributes('maxlength')).toBe('200')
  })

})
