import cors from "cors"
import "dotenv/config"
import express from "express"
import { connectDB } from "./config/db.js"
import { getMcpClient } from "./mcp/client.js"
import chatRoutes from "./routes/chatRoutes.js"
import documentRoutes from "./routes/documentRoutes.js"
import scrapeRoutes from "./routes/scrapeRoutes.js"

const app = express()

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
)
app.use(express.json({ limit: "1mb" }))

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "AI web scraper server is running" })
})

app.use("/api/scrape", scrapeRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/documents", documentRoutes)

const port = process.env.PORT || 5000

async function start() {
  await connectDB()
  await getMcpClient()

  app.listen(port, () => {
    console.log(`🚀 API running at http://localhost:${port}`)
  })
}

start().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})
