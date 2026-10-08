import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

let client = null;

// Express/Node is the MCP HOST in this project.
// It launches the MCP server as a child process.
export async function getMcpClient() {
  if (client) return client;

  client = new Client({
    name: "mern-ai-host",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp/server.js"],
    cwd: process.cwd(),
    stderr: "inherit",
  });

  await client.connect(transport);
  return client;
}

// Convert MCP tool descriptions to Ollama's function-tool format.
export async function getToolsForOllama() {
  const mcpClient = await getMcpClient();
  const { tools } = await mcpClient.listTools();

  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description || "",
      parameters: tool.inputSchema,
    },
  }));
}

// Execute the MCP tool chosen by the LLM.
export async function callMcpTool(name, args) {
  const mcpClient = await getMcpClient();

  const result = await mcpClient.callTool({
    name,
    arguments: args,
  });

  const text = (result.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return {
    isError: Boolean(result.isError),
    text,
  };
}
