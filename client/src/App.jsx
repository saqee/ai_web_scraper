import React, { useEffect, useState } from "react"
import { chatWithAgent, getDocuments, scrapeUrl } from "./api.js"

export default function App() {
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [loadingScrape, setLoadingScrape] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)

  async function refreshDocuments() {
    try {
      setDocuments(await getDocuments())
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    refreshDocuments()
  }, [])

  async function handleScrape(event) {
    event.preventDefault()
    if (!url.trim()) return

    setLoadingScrape(true)
    try {
      const result = await scrapeUrl(url.trim())
      alert(`Stored ${result.chunksStored} chunks.`)
      setUrl("")
      await refreshDocuments()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoadingScrape(false)
    }
  }

  async function handleChat(event) {
    event.preventDefault()
    const cleanMessage = message.trim()
    if (!cleanMessage) return

    setMessages((old) => [...old, { role: "user", text: cleanMessage }])
    setMessage("")
    setLoadingChat(true)

    try {
      const result = await chatWithAgent(cleanMessage)
      setMessages((old) => [
        ...old,
        { role: "assistant", text: result.answer, steps: result.steps },
      ])
      await refreshDocuments()
    } catch (error) {
      setMessages((old) => [
        ...old,
        { role: "assistant", text: `Error: ${error.message}` },
      ])
    } finally {
      setLoadingChat(false)
    }
  }

  return (
    <main className="page">
      <header>
        <p className="eyebrow">MERN + OLLAMA</p>
        <h1>AI Web Scraper + RAG + MCP Agent</h1>
        <p>
          Cheerio scrapes. MongoDB stores chunks. Ollama creates embeddings and
          answers. MCP exposes tools. The agent chooses the tools.
        </p>
      </header>

      <section className="grid">
        <div className="card">
          <h2>1. Add a webpage</h2>
          <form onSubmit={handleScrape}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
            />
            <button disabled={loadingScrape}>
              {loadingScrape ? "Scraping..." : "Scrape + Store for RAG"}
            </button>
          </form>

          <h3>Knowledge base</h3>
          <div className="documents">
            {documents.length === 0 ? (
              <p className="muted">Nothing stored yet.</p>
            ) : (
              documents.map((doc) => (
                <article className="document" key={doc.url}>
                  <strong>{doc.title || "Untitled page"}</strong>
                  <small>{doc.chunks} chunks</small>
                  <span>{doc.url}</span>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="card chat-card">
          <h2>2. Ask the agent</h2>
          <div className="chat">
            {messages.length === 0 && (
              <div className="empty">
                Try: “What does my stored page say about pricing?”
                <br />
                Or give the agent a URL and ask it to learn that page.
              </div>
            )}

            {messages.map((item, index) => (
              <div className={`message ${item.role}`} key={index}>
                <b>{item.role === "user" ? "You" : "Agent"}</b>
                <p>{item.text}</p>

                {item.steps?.length > 0 && (
                  <details>
                    <summary>See agent tool steps</summary>
                    <pre>{JSON.stringify(item.steps, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}

            {loadingChat && (
              <div className="message assistant">
                <b>Agent</b>
                <p>Thinking / using tools...</p>
              </div>
            )}
          </div>

          <form onSubmit={handleChat}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              rows="4"
            />
            <button disabled={loadingChat}>
              {loadingChat ? "Working..." : "Send"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
