import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getAllProjects, getAllNotes, saveProject, saveNote,
  deleteProject, deleteNote, getUser
} from '../db'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { NoteCard } from '../components/NoteCard'
import { ProjectCard } from '../components/ProjectCard'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [tab, setTab] = useState('drafts')
  const navigate = useNavigate()

  const load = useCallback(async () => {
    const [u, ps, ns] = await Promise.all([getUser(), getAllProjects(), getAllNotes()])
    setUser(u)
    setProjects(ps)
    setNotes(ns)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleNewProject() {
    const name = prompt('Project name:')
    if (!name?.trim()) return
    const p = await saveProject({ name: name.trim(), status: 'draft' })
    navigate(`/project/${p.id}`)
  }

  async function handleNewNote() {
    const n = await saveNote({ title: 'Untitled', content: '', status: 'draft' })
    navigate(`/editor/${n.id}`)
  }

  async function handleDeleteProject(id) {
    if (!confirm('Delete project and all its chapters?')) return
    await deleteProject(id)
    load()
  }

  async function handleDeleteNote(id) {
    if (!confirm('Delete note?')) return
    await deleteNote(id)
    load()
  }

  const filteredProjects = projects.filter((p) => tab === 'drafts' ? p.status !== 'done' : p.status === 'done')
  const standaloneNotes = notes.filter((n) => !n.projectId && (tab === 'drafts' ? n.status !== 'done' : n.status === 'done'))

  function getProjectChapterCount(projectId) {
    return notes.filter((n) => n.projectId === projectId).length
  }

  function getProjectWordCount(projectId) {
    return notes.filter((n) => n.projectId === projectId).reduce((acc, n) => acc + (n.wordCount || 0), 0)
  }

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className={styles.header}>
        <Logo />
        <div className={styles.headerRight}>
          {user && (
            <button className={styles.userName} onClick={() => navigate('/profile')}>
              {user.name}
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleNewProject}>+ New Project</button>
          <button className={styles.secondaryBtn} onClick={handleNewNote}>+ New Note</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'drafts' ? styles.activeTab : ''}`}
            onClick={() => setTab('drafts')}
          >Drafts</button>
          <button
            className={`${styles.tab} ${tab === 'done' ? styles.activeTab : ''}`}
            onClick={() => setTab('done')}
          >Completed</button>
        </div>

        {filteredProjects.length === 0 && standaloneNotes.length === 0 && (
          <div className={styles.empty}>
            <p>Nothing here yet.</p>
            <p className={styles.emptyHint}>Start a new project or note above.</p>
          </div>
        )}

        {filteredProjects.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <div className={styles.grid}>
              <AnimatePresence>
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    chapterCount={getProjectChapterCount(p.id)}
                    wordCount={getProjectWordCount(p.id)}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {standaloneNotes.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notes</h2>
            <div className={styles.grid}>
              <AnimatePresence>
                {standaloneNotes.map((n) => (
                  <NoteCard key={n.id} note={n} onDelete={handleDeleteNote} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}
      </main>
    </motion.div>
  )
}
