import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { saveUser } from '../db'
import styles from './Onboarding.module.css'

export function Onboarding() {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('light')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    await saveUser({ name: name.trim(), theme })
    document.body.setAttribute('data-theme', theme)
    navigate('/')
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className={styles.logo}>Writed<span className={styles.dot}>.</span></h1>
        <p className={styles.tagline}>A quiet place for your words.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>What should we call you?</label>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={40}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Choose your theme</label>
            <div className={styles.themeRow}>
              <button
                type="button"
                className={`${styles.themeBtn} ${styles.light} ${theme === 'light' ? styles.selected : ''}`}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
              <button
                type="button"
                className={`${styles.themeBtn} ${styles.dark} ${theme === 'dark' ? styles.selected : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submit} disabled={!name.trim()}>
            Start writing →
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
