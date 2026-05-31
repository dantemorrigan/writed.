import styles from './Preview.module.css'

const STYLE_PRESETS = {
  novel: { fontFamily: 'Georgia, serif', lineHeight: '1.9', fontSize: '1.05rem' },
  article: { fontFamily: '-apple-system, sans-serif', lineHeight: '1.7', fontSize: '1rem' },
  story: { fontFamily: "'Playfair Display', Georgia, serif", lineHeight: '1.85', fontSize: '1.05rem' },
}

export function Preview({ content, style = 'novel', font }) {
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.novel
  const fontFamily = font ? getFontFamily(font) : preset.fontFamily

  return (
    <div className={styles.page}>
      <div
        className={styles.content}
        style={{ fontFamily, lineHeight: preset.lineHeight, fontSize: preset.fontSize }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

function getFontFamily(font) {
  const map = {
    iawritermono: '"iA Writer Mono", "Courier New", monospace',
    iawriterquattro: '"iA Writer Quattro", Georgia, serif',
    georgia: 'Georgia, serif',
    playfair: '"Playfair Display", Georgia, serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }
  return map[font] || map.georgia
}
