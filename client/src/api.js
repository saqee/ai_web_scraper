const API_BASE = "http://localhost:5003/api"

export async function scrapeUrl(url) {
  const response = await fetch(`${API_BASE}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Scrape failed")
  return data
}

export async function chatWithAgent(message) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Chat failed")
  return data
}

export async function getDocuments() {
  const response = await fetch(`${API_BASE}/documents`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Could not load documents")
  return data
}
