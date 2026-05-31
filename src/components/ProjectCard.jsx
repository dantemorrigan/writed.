import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from './ProjectCard.module.css'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProjectCard({ project, chapterCount = 0, wordCount = 0, onDelete }) {
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/project/${project.id}`} className={styles.inner}>
        <div className={styles.icon}>📁</div>
        <div className={styles.info}>
          <h3 className={styles.title}>{project.name || 'Untitled Project'}</h3>
          <div className={styles.meta}>
            <span>{chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}</span>
            <span>·</span>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </Link>
      {onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.preventDefault(); onDelete(project.id) }}
          title="Delete project"
          aria-label="Delete project"
        >
          ×
        </button>
      )}
    </motion.div>
  )
}
