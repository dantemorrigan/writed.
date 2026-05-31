import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getProject, getAllNotes, saveNote, deleteNote, saveProject } from '../db'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { NoteCard } from '../components/NoteCard'
import styles from './ProjectView.module.css'

export function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [chapters, setChapters] = useState([])
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')

  const load = useCallback(async () => {
    const [p, allNotes] = await Promise.all([getProject(id), getAllNotes()])
    if (!p) { navigate('/'); return }
    setProject(p)
    setNewName(p.name)
    setChapters(allNotes.filter((n) => n.projectId === id))
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  async function handleAddChapter() {
    const n = await saveNote({
      title: `Chapter ${chapters.length + 1}`,
      content: '',
      status: 'draft',
      projectId: id,
    })
    navigate(`/editor/${n.id}`)
  }

  async function handleDeleteChapter(noteId) {
    if (!confirm('Delete chapter?')) return
    await deleteNote(noteId)
    load()
  }

  async function handleRename(e) {
    e.preventDefault()
    if (!newName.trim()) return
    await saveProject({ ...project, name: newName.trim() })
    setProject((p) => ({ ...p, name: newName.trim() }))
    setEditing(false)
  }

  async function handleToggleStatus() {
    const next = project.status === 'done' ? 'draft' : 'done'
    await saveProject({ ...project, status: next })
    setProject((p) => ({ ...p, status: next }))
  }

  const totalWords = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0)

  if (!project) return null

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className={styles.header}>
        <Logo />
        <ThemeToggle />
      </header>

      <main className={styles.main}>
        <button className={styles.back} onClick={() => navigate('/')}>← Dashboard</button>

        <div className={styles.titleRow}>
          {editing ? (
            <form onSubmit={handleRename} className={styles.renameForm}>
              <input
                className={styles.renameInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.renameOk}>✓</button>
              <button type="button" className={styles.renameCancel} onClick={() => setEditing(false)}>✕</button>
            </form>
          ) : (
            <h1 className={styles.title} onClick={() => setEditing(true)}>{project.name}</h1>
          )}
          <button className={styles.statusBtn} onClick={handleToggleStatus}>
            {project.status === 'done' ? 'Mark as Draft' : 'Mark as Done'}
          </button>
        </div>

        <p className={styles.stats}>{chapters.length} chapters · {totalWords} words</p>

        <button className={styles.addBtn} onClick={handleAddChapter}>+ Add Chapter</button>

        <div className={styles.chapters}>
          <AnimatePresence>
            {chapters.map((c, i) => (
              <div key={c.id} className={styles.chapterRow}>
                <span className={styles.chapterNum}>{i + 1}</span>
                <div className={styles.chapterCard}>
                  <NoteCard note={c} onDelete={handleDeleteChapter} />
                </div>
              </div>
            ))}
          </AnimatePresence>
          {chapters.length === 0 && (
            <div className={styles.empty}>No chapters yet. Add the first one above.</div>
          )}
        </div>
      </main>
    </motion.div>
  )
}
