import { openDB } from 'idb'

const DB_NAME = 'writed'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' })
        }
      },
      async blocked() {
        console.warn('DB blocked')
      },
    })

    // Request persistent storage
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {})
    }
  }
  return dbPromise
}

// User
export async function getUser() {
  const db = await getDB()
  const users = await db.getAll('user')
  return users[0] || null
}

export async function saveUser(user) {
  const db = await getDB()
  const existing = await getUser()
  const now = new Date().toISOString()
  const record = {
    id: existing?.id || crypto.randomUUID(),
    name: user.name,
    theme: user.theme || 'light',
    font: user.font || 'iawriter',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  await db.put('user', record)
  return record
}

// Projects
export async function getAllProjects() {
  const db = await getDB()
  return db.getAll('projects')
}

export async function getProject(id) {
  const db = await getDB()
  return db.get('projects', id)
}

export async function saveProject(project) {
  const db = await getDB()
  const now = new Date().toISOString()
  const record = {
    ...project,
    id: project.id || crypto.randomUUID(),
    createdAt: project.createdAt || now,
    updatedAt: now,
  }
  await db.put('projects', record)
  return record
}

export async function deleteProject(id) {
  const db = await getDB()
  // Delete all notes in this project
  const notes = await db.getAll('notes')
  const projectNotes = notes.filter((n) => n.projectId === id)
  await Promise.all(projectNotes.map((n) => db.delete('notes', n.id)))
  await db.delete('projects', id)
}

// Notes
export async function getAllNotes() {
  const db = await getDB()
  return db.getAll('notes')
}

export async function getNote(id) {
  const db = await getDB()
  return db.get('notes', id)
}

export async function saveNote(note) {
  const db = await getDB()
  const now = new Date().toISOString()
  const content = note.content || ''
  const wordCount = countWords(content)
  const record = {
    ...note,
    id: note.id || crypto.randomUUID(),
    wordCount,
    createdAt: note.createdAt || now,
    updatedAt: now,
  }
  await db.put('notes', record)
  return record
}

export async function deleteNote(id) {
  const db = await getDB()
  await db.delete('notes', id)
}

// Helpers
export function countWords(text) {
  // Strip HTML tags
  const plain = text.replace(/<[^>]*>/g, ' ')
  const words = plain.trim().split(/\s+/).filter(Boolean)
  return words.length
}

// Stats
export async function getStats() {
  const notes = await getAllNotes()
  const projects = await getAllProjects()
  const totalWords = notes.reduce((acc, n) => acc + (n.wordCount || 0), 0)
  const standaloneNotes = notes.filter((n) => !n.projectId)
  return {
    totalWords,
    totalProjects: projects.length,
    totalNotes: standaloneNotes.length,
  }
}

// Export all data
export async function exportAllData() {
  const user = await getUser()
  const projects = await getAllProjects()
  const notes = await getAllNotes()
  return { user, projects, notes, exportedAt: new Date().toISOString() }
}

// Import backup
export async function importBackup(data) {
  const db = await getDB()
  if (data.user) await db.put('user', data.user)
  if (data.projects) {
    await Promise.all(data.projects.map((p) => db.put('projects', p)))
  }
  if (data.notes) {
    await Promise.all(data.notes.map((n) => db.put('notes', n)))
  }
}

// Reset all data
export async function resetAllData() {
  const db = await getDB()
  await db.clear('user')
  await db.clear('projects')
  await db.clear('notes')
}
