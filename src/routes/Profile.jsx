import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getUser, saveUser, getStats,
  exportAllData, importBackup, resetAllData
} from '../db'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../hooks/useTheme'
import styles from './Profile.module.css'

const FONTS = [
  { value: 'georgia', label: 'Georgia' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'iawritermono', label: 'iA Writer Mono' },
  { value: 'iawriterquattro', label: 'iA Writer Quattro' },
  { value: 'system', label: 'System Sans-serif' },
]

export function Profile() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ totalWords: 0, totalProjects: 0, totalNotes: 0 })
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    async function load() {
      const [u, s] = await Promise.all([getUser(), getStats()])
      setUser(u)
      setNewName(u?.name || '')
      setStats(s)
    }
    load()
  }, [])

  async function handleSaveName(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const updated = await saveUser({ ...user, name: newName.trim() })
    setUser(updated)
    setEditingName(false)
  }

  async function handleFontChange(font) {
    const updated = await saveUser({ ...user, font })
    setUser(updated)
  }

  async function handleExportData() {
    const data = await exportAllData()
    const json = JSON.stringify(data, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    a.download = `writed-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  async function handleImportData(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importBackup(data)
      alert('Backup imported successfully.')
      window.location.reload()
    } catch {
      alert('Failed to import backup. Please check the file.')
    }
  }

  async function handleReset() {
    if (!confirm('Reset all data? This cannot be undone.')) return
    await resetAllData()
    navigate('/onboarding')
  }

  if (!user) return null

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

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          {editingName ? (
            <form onSubmit={handleSaveName} className={styles.nameForm}>
              <input
                className={styles.nameInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.saveBtn}>Save</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setEditingName(false)}>Cancel</button>
            </form>
          ) : (
            <p className={styles.nameDisplay} onClick={() => setEditingName(true)}>
              {user.name} <span className={styles.editHint}>✎</span>
            </p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{stats.totalWords.toLocaleString()}</span>
              <span className={styles.statLabel}>words</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{stats.totalProjects}</span>
              <span className={styles.statLabel}>projects</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{stats.totalNotes}</span>
              <span className={styles.statLabel}>notes</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <div className={styles.themeRow}>
            <span className={styles.optionLabel}>Theme</span>
            <div className={styles.optionButtons}>
              <button
                className={`${styles.optBtn} ${theme === 'light' ? styles.optActive : ''}`}
                onClick={() => setTheme('light')}
              >Light</button>
              <button
                className={`${styles.optBtn} ${theme === 'dark' ? styles.optActive : ''}`}
                onClick={() => setTheme('dark')}
              >Dark</button>
            </div>
          </div>
          <div className={styles.fontRow}>
            <span className={styles.optionLabel}>Editor Font</span>
            <div className={styles.fontList}>
              {FONTS.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.fontBtn} ${user.font === f.value ? styles.optActive : ''}`}
                  onClick={() => handleFontChange(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data</h2>
          <div className={styles.dataActions}>
            <button className={styles.dataBtn} onClick={handleExportData}>Export backup (JSON)</button>
            <label className={styles.dataBtn}>
              Import backup
              <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
            </label>
            <button className={`${styles.dataBtn} ${styles.danger}`} onClick={handleReset}>
              Reset all data
            </button>
          </div>
        </section>
      </main>
    </motion.div>
  )
}
