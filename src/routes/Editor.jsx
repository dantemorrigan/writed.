import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Placeholder from '@tiptap/extension-placeholder'
import { motion } from 'framer-motion'
import { getNote, saveNote, getUser, countWords } from '../db'
import { Toolbar } from '../components/Toolbar'
import { WordCount } from '../components/WordCount'
import { Preview } from '../components/Preview'
import { ThemeToggle } from '../components/ThemeToggle'
import { Logo } from '../components/Logo'
import styles from './Editor.module.css'

export function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const [focusMode, setFocusMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewStyle, setPreviewStyle] = useState('novel')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [font, setFont] = useState('georgia')
  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ strike: false }),
      Underline,
      Strike,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      const wc = countWords(html)
      setWordCount(wc)
      // Debounced auto-save
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveNote({ ...noteRef.current, content: html, wordCount: wc })
      }, 1000)
    },
  })

  const noteRef = useRef(note)
  useEffect(() => { noteRef.current = note }, [note])

  useEffect(() => {
    async function load() {
      const [n, user] = await Promise.all([getNote(id), getUser()])
      if (!n) { navigate('/'); return }
      setNote(n)
      noteRef.current = n
      setWordCount(n.wordCount || 0)
      if (user?.font) setFont(user.font)
      if (editor && n.content) {
        editor.commands.setContent(n.content, false)
      }
    }
    if (editor) load()
  }, [id, editor, navigate])

  const handleRename = useCallback(async () => {
    const newTitle = prompt('Rename:', note?.title || '')
    if (!newTitle?.trim()) return
    const updated = await saveNote({ ...note, title: newTitle.trim() })
    setNote(updated)
  }, [note])

  const handleExport = useCallback(async (type) => {
    if (type === 'menu') { setShowExportMenu((v) => !v); return }
    setShowExportMenu(false)
    const content = editor?.getHTML() || ''
    const title = note?.title || 'document'

    if (type === 'txt') {
      const text = content.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
      downloadFile(`${title}.txt`, text, 'text/plain')
    } else if (type === 'md') {
      const text = htmlToMarkdown(content)
      downloadFile(`${title}.md`, text, 'text/markdown')
    } else if (type === 'pdf') {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const plain = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      doc.setFontSize(12)
      doc.setFont('times', 'normal')
      const lines = doc.splitTextToSize(plain, 460)
      doc.text(lines, 60, 60)
      doc.save(`${title}.pdf`)
    }
  }, [editor, note])

  const editorFontFamily = getFontFamily(font)

  if (!note) return null

  return (
    <motion.div
      className={`${styles.page} ${focusMode ? styles.focus : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {!focusMode && (
        <header className={styles.header}>
          <Logo size="sm" />
          <div className={styles.headerCenter}>
            <span className={styles.noteTitle} onClick={handleRename}>{note.title}</span>
          </div>
          <div className={styles.headerRight}>
            <button
              className={`${styles.headerBtn} ${previewMode ? styles.activeBtn : ''}`}
              onClick={() => setPreviewMode((v) => !v)}
            >
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            {previewMode && (
              <select
                className={styles.styleSelect}
                value={previewStyle}
                onChange={(e) => setPreviewStyle(e.target.value)}
              >
                <option value="novel">Novel</option>
                <option value="article">Article</option>
                <option value="story">Story</option>
              </select>
            )}
            <ThemeToggle />
          </div>
        </header>
      )}

      {!focusMode && !previewMode && (
        <Toolbar
          editor={editor}
          onRename={handleRename}
          onExport={handleExport}
          onToggleFocus={() => setFocusMode(true)}
        />
      )}

      {showExportMenu && (
        <div className={styles.exportMenu}>
          <button onClick={() => handleExport('pdf')}>Export PDF</button>
          <button onClick={() => handleExport('txt')}>Export TXT</button>
          <button onClick={() => handleExport('md')}>Export Markdown</button>
        </div>
      )}

      {focusMode && (
        <button className={styles.exitFocus} onClick={() => setFocusMode(false)}>
          Exit focus
        </button>
      )}

      {previewMode ? (
        <Preview content={editor?.getHTML() || ''} style={previewStyle} font={font} />
      ) : (
        <div className={styles.editorWrapper}>
          <EditorContent
            editor={editor}
            className={styles.editor}
            style={{ fontFamily: editorFontFamily }}
          />
        </div>
      )}

      <WordCount count={wordCount} />
    </motion.div>
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
  return map[font] || 'Georgia, serif'
}

function downloadFile(name, content, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
}

function htmlToMarkdown(html) {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_')
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}
