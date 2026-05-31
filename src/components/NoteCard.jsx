import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './NoteCard.module.css'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function NoteCard({ note, onDelete }) {
  const preview = note.content
    ? note.content.replace(/<[^>]*>/g, ' ').trim().slice(0, 80)
    : 'Empty note'

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/editor/${note.id}`} className={styles.inner}>
        <h3 className={styles.title}>{note.title || 'Untitled'}</h3>
        <p className={styles.preview}>{preview}</p>
        <div className={styles.meta}>
          <span className={styles.words}>{note.wordCount || 0} words</span>
          <span className={styles.date}>{formatDate(note.updatedAt)}</span>
        </div>
      </Link>
      {onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.preventDefault(); onDelete(note.id) }}
          title="Delete note"
          aria-label="Delete note"
        >
          ×
        </button>
      )}
    </motion.div>
  )
}
