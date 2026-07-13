'use client'

import {
  ArrowUp,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  FileText,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Square,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Role = 'user' | 'assistant'
type Theme = 'light' | 'dark'

interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}

interface Attachment {
  id: string
  name: string
  size: number
  content: string
}

const STORAGE_KEY = 'aklora-conversations-v1'
const THEME_KEY = 'aklora-theme'
const MAX_FILE_BYTES = 100_000

const SUGGESTIONS = [
  { label: 'Bir fikri netleştir', prompt: 'Aklımdaki fikri birlikte netleştirelim. Bana doğru soruları sor.' },
  { label: 'Metni güçlendir', prompt: 'Paylaşacağım metni daha güçlü, doğal ve ikna edici hale getir.' },
  { label: 'Plan oluştur', prompt: 'Hedefim için uygulanabilir, adım adım bir plan hazırla.' },
  { label: 'Veriyi yorumla', prompt: 'Paylaşacağım verideki önemli örüntüleri ve aksiyonları çıkar.' },
] as const

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function currentTimestamp(): number {
  return Date.now()
}

function createConversation(): Conversation {
  return { id: createId(), title: 'Yeni sohbet', messages: [], updatedAt: Date.now() }
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return 'Şimdi'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} sa`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} gün`
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(timestamp)
}

function conversationTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 38 ? `${clean.slice(0, 38)}…` : clean || 'Yeni sohbet'
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [search, setSearch] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')
  const [copiedId, setCopiedId] = useState<string>('')
  const [hydrated, setHydrated] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [activeId, conversations]
  )

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR')
    if (!term) return conversations
    return conversations.filter((conversation) =>
      conversation.title.toLocaleLowerCase('tr-TR').includes(term)
    )
  }, [conversations, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
      const nextTheme =
        savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      setTheme(nextTheme)
      document.documentElement.dataset.theme = nextTheme

      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Conversation[]
        if (Array.isArray(stored) && stored.length > 0) {
          setConversations(stored)
          setActiveId(stored[0].id)
        } else {
          const first = createConversation()
          setConversations([first])
          setActiveId(first.id)
        }
      } catch {
        const first = createConversation()
        setConversations([first])
        setActiveId(first.id)
      }
      setHydrated(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  }, [conversations, hydrated])

  useEffect(() => {
    const transcript = transcriptRef.current
    if (transcript) transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' })
  }, [activeConversation?.messages, isStreaming])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }, [input])

  function updateConversation(id: string, updater: (conversation: Conversation) => Conversation) {
    setConversations((current) => {
      const updated = current.map((conversation) =>
        conversation.id === id ? updater(conversation) : conversation
      )
      return [...updated].sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }

  function handleNewChat() {
    if (isStreaming) abortRef.current?.abort()
    const conversation = createConversation()
    setConversations((current) => [conversation, ...current])
    setActiveId(conversation.id)
    setInput('')
    setAttachments([])
    setIsSidebarOpen(false)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function handleDeleteConversation() {
    if (!activeId) return
    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== activeId)
      if (remaining.length > 0) {
        setActiveId(remaining[0].id)
        return remaining
      }
      const replacement = createConversation()
      setActiveId(replacement.id)
      return [replacement]
    })
    setIsActionsOpen(false)
  }

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem(THEME_KEY, nextTheme)
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, 3 - attachments.length)
    const validFiles = files.filter((file) => file.size <= MAX_FILE_BYTES)
    const loaded = await Promise.all(
      validFiles.map(async (file): Promise<Attachment> => ({
        id: createId(),
        name: file.name,
        size: file.size,
        content: await file.text(),
      }))
    )
    setAttachments((current) => [...current, ...loaded].slice(0, 3))
    event.target.value = ''
  }

  async function streamAssistant(conversationId: string, requestMessages: Message[]) {
    const assistantId = createId()
    const assistant: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: currentTimestamp(),
    }
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, assistant],
      updatedAt: Date.now(),
    }))

    const controller = new AbortController()
    abortRef.current = controller
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: requestMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const detail = await response.text()
        throw new Error(detail || 'Yanıt alınamadı.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === assistantId ? { ...message, content } : message
          ),
          updatedAt: Date.now(),
        }))
      }
    } catch (error) {
      const wasAborted = error instanceof DOMException && error.name === 'AbortError'
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === assistantId && !message.content
            ? { ...message, content: wasAborted ? 'Yanıt durduruldu.' : 'Şu anda yanıt oluşturamadım. Bağlantıyı kontrol edip tekrar deneyin.' }
            : message
        ),
        updatedAt: Date.now(),
      }))
    } finally {
      abortRef.current = null
      setIsStreaming(false)
    }
  }

  async function handleSend(override?: string) {
    if (isStreaming) return
    const plainText = (override ?? input).trim()
    if (!plainText && attachments.length === 0) return

    let conversation = activeConversation
    if (!conversation) {
      conversation = createConversation()
      setConversations((current) => [conversation!, ...current])
      setActiveId(conversation.id)
    }

    const attachmentContext = attachments
      .map((file) => `\n\n--- ${file.name} ---\n${file.content}`)
      .join('')
    const content = `${plainText}${attachmentContext}`.trim()
    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content,
      createdAt: currentTimestamp(),
    }
    const requestMessages = [...conversation.messages, userMessage]

    updateConversation(conversation.id, (current) => ({
      ...current,
      title: current.messages.length === 0 ? conversationTitle(plainText || attachments[0]?.name || '') : current.title,
      messages: [...current.messages, userMessage],
      updatedAt: Date.now(),
    }))

    setInput('')
    setAttachments([])
    await streamAssistant(conversation.id, requestMessages)
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  async function copyMessage(message: Message) {
    await navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    window.setTimeout(() => setCopiedId(''), 1500)
  }

  function exportConversation() {
    if (!activeConversation) return
    const markdown = activeConversation.messages
      .map((message) => `## ${message.role === 'user' ? 'Siz' : 'Aklora'}\n\n${message.content}`)
      .join('\n\n')
    const blob = new Blob([`# ${activeConversation.title}\n\n${markdown}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeConversation.title.replace(/[^a-z0-9çğıöşü]+/gi, '-').toLowerCase()}.md`
    anchor.click()
    URL.revokeObjectURL(url)
    setIsActionsOpen(false)
  }

  const hasMessages = Boolean(activeConversation?.messages.length)

  return (
    <main className="app-shell">
      <div
        className={`sidebar-scrim ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">A</div>
          <div className="brand-copy">
            <strong>Aklora</strong>
            <span>AI workspace</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setIsSidebarOpen(false)} title="Menüyü kapat">
            <X size={18} />
          </button>
        </div>

        <button className="new-chat-button" onClick={handleNewChat}>
          <Plus size={17} />
          <span>Yeni sohbet</span>
        </button>

        <label className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Sohbetlerde ara"
            aria-label="Sohbetlerde ara"
          />
          {search && (
            <button onClick={() => setSearch('')} title="Aramayı temizle" type="button">
              <X size={14} />
            </button>
          )}
        </label>

        <div className="conversation-section-label">Sohbetler</div>
        <nav className="conversation-list" aria-label="Sohbetler">
          {filteredConversations.length === 0 && <p className="empty-search">Eşleşen sohbet yok.</p>}
          {filteredConversations.map((conversation) => (
            <button
              className={`conversation-item ${conversation.id === activeId ? 'active' : ''}`}
              key={conversation.id}
              onClick={() => {
                setActiveId(conversation.id)
                setIsSidebarOpen(false)
              }}
            >
              <MessageSquare size={15} />
              <span>{conversation.title}</span>
              <time>{formatRelativeTime(conversation.updatedAt)}</time>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="owner-row" onClick={toggleTheme} title="Temayı değiştir">
            <div className="owner-avatar">MK</div>
            <div>
              <strong>Murat Kömürcü</strong>
              <span>Ürün sahibi</span>
            </div>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setIsSidebarOpen(true)} title="Menüyü aç">
            <Menu size={20} />
          </button>
          <button className="model-selector" type="button" title="Aktif model">
            <span className="status-dot" />
            <span>Aklora Core</span>
            <ChevronDown size={14} />
          </button>
          <div className="topbar-actions">
            <button className="icon-button" onClick={toggleTheme} title={theme === 'light' ? 'Karanlık tema' : 'Aydınlık tema'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="actions-menu-wrap">
              <button className="icon-button" onClick={() => setIsActionsOpen((open) => !open)} title="Sohbet seçenekleri">
                <MoreHorizontal size={20} />
              </button>
              {isActionsOpen && (
                <div className="actions-menu">
                  <button onClick={exportConversation} disabled={!hasMessages}>
                    <Download size={16} /> Dışa aktar
                  </button>
                  <button className="danger" onClick={handleDeleteConversation}>
                    <Trash2 size={16} /> Sohbeti sil
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="transcript" ref={transcriptRef}>
          {!hasMessages ? (
            <div className="welcome">
              <div className="welcome-mark"><Sparkles size={24} /></div>
              <p className="eyebrow">AKLORA</p>
              <h1>Bugün neyi çözüyoruz?</h1>
              <p className="welcome-subtitle">Düşünceni getir. Birlikte netleştirip sonuca dönüştürelim.</p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion.label} onClick={() => void handleSend(suggestion.prompt)}>
                    <span>{suggestion.label}</span>
                    <ArrowUp size={16} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-stack">
              {activeConversation?.messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-identity">
                    {message.role === 'assistant' ? <div className="assistant-avatar">A</div> : <div className="user-avatar">S</div>}
                    <span>{message.role === 'assistant' ? 'Aklora' : 'Siz'}</span>
                  </div>
                  <div className="message-content">
                    {message.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    ) : (
                      <div className="thinking"><i /><i /><i /></div>
                    )}
                  </div>
                  {message.content && (
                    <div className="message-actions">
                      <button onClick={() => void copyMessage(message)} title="Mesajı kopyala">
                        {copiedId === message.id ? <Check size={15} /> : <Clipboard size={15} />}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="composer-zone">
          <div className="composer-wrap">
            {attachments.length > 0 && (
              <div className="attachment-row">
                {attachments.map((file) => (
                  <div className="attachment-chip" key={file.id}>
                    <FileText size={15} />
                    <span>{file.name}</span>
                    <button
                      onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}
                      title="Dosyayı kaldır"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="composer">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Aklora'ya yazın…"
                rows={1}
                aria-label="Mesaj"
              />
              <div className="composer-toolbar">
                <div>
                  <input
                    ref={fileInputRef}
                    className="visually-hidden"
                    type="file"
                    accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json,text/csv"
                    multiple
                    onChange={(event) => void handleFiles(event)}
                  />
                  <button
                    className="composer-tool"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachments.length >= 3 || isStreaming}
                    title="Metin dosyası ekle"
                  >
                    <Paperclip size={18} />
                  </button>
                </div>
                {isStreaming ? (
                  <button className="send-button stop" onClick={() => abortRef.current?.abort()} title="Yanıtı durdur">
                    <Square size={14} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    className="send-button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() && attachments.length === 0}
                    title="Gönder"
                  >
                    <ArrowUp size={18} />
                  </button>
                )}
              </div>
            </div>
            <p className="composer-note">Aklora hata yapabilir. Önemli bilgileri doğrulayın.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
