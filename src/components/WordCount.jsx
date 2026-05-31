import styles from './WordCount.module.css'

export function WordCount({ count }) {
  return (
    <div className={styles.counter} aria-live="polite">
      {count} {count === 1 ? 'word' : 'words'}
    </div>
  )
}
