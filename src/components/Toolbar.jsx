import { useCallback } from 'react'
import styles from './Toolbar.module.css'

const ToolbarButton = ({ onClick, active, title, children }) => (
  <button
    className={`${styles.btn} ${active ? styles.active : ''}`}
    onMouseDown={(e) => { e.preventDefault(); onClick() }}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
)

const Divider = () => <span className={styles.divider} />

export function Toolbar({ editor, onExport, onRename, onToggleFocus }) {
  const chain = useCallback((fn) => () => { if (editor) fn(editor.chain().focus()); }, [editor])

  if (!editor) return null

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <ToolbarButton
          onClick={chain((c) => c.toggleBold().run())}
          active={editor.isActive('bold')}
          title="Bold"
        ><b>B</b></ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleItalic().run())}
          active={editor.isActive('italic')}
          title="Italic"
        ><i>I</i></ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleUnderline().run())}
          active={editor.isActive('underline')}
          title="Underline"
        ><u>U</u></ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleStrike().run())}
          active={editor.isActive('strike')}
          title="Strikethrough"
        ><s>S</s></ToolbarButton>
      </div>

      <Divider />

      <div className={styles.group}>
        <ToolbarButton
          onClick={chain((c) => c.toggleHeading({ level: 1 }).run())}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >H1</ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleHeading({ level: 2 }).run())}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >H2</ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleHeading({ level: 3 }).run())}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >H3</ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.setParagraph().run())}
          active={editor.isActive('paragraph')}
          title="Paragraph"
        >¶</ToolbarButton>
      </div>

      <Divider />

      <div className={styles.group}>
        <ToolbarButton
          onClick={chain((c) => c.toggleBlockquote().run())}
          active={editor.isActive('blockquote')}
          title="Quote"
        >"</ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleBulletList().run())}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >•—</ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.toggleOrderedList().run())}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >1.</ToolbarButton>
        <ToolbarButton
          onClick={chain((c) => c.setHorizontalRule().run())}
          active={false}
          title="Divider"
        >—</ToolbarButton>
      </div>

      <Divider />

      <div className={styles.group}>
        {onRename && (
          <ToolbarButton onClick={onRename} active={false} title="Rename">✎</ToolbarButton>
        )}
        {onExport && (
          <div className={styles.exportWrapper}>
            <ToolbarButton onClick={() => onExport('menu')} active={false} title="Export">↓</ToolbarButton>
          </div>
        )}
        {onToggleFocus && (
          <ToolbarButton onClick={onToggleFocus} active={false} title="Focus mode">⊡</ToolbarButton>
        )}
      </div>
    </div>
  )
}
