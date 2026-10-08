import { ollama, getChatModel } from "../services/ollama.js";
import { callMcpTool, getToolsForOllama } from "../mcp/client.js";

// Agent loop:
// LLM sees tools -> chooses a tool -> JS executes it -> tool result goes
// back to LLM -> LLM can choose another tool or produce final answer.
export async function runAgent(userMessage) {
  const tools = await getToolsForOllama();

  const messages = [
    {
      role: "system",
      content: `
You are a web research assistant.

Available MCP tools:
- scrape_and_store: use when the user gives a public URL and wants it scraped/learned.
- search_knowledge: use when the user asks about information already stored in the local knowledge base.

Rules:
1. Never claim a page was scraped unless scrape_and_store succeeded.
2. Prefer search_knowledge for knowledge-base questions.
3. If evidence is missing, say the knowledge base does not contain enough information.
4. Keep answers clear and beginner friendly.
      `.trim(),
    },
    { role: "user", content: userMessage },
  ];

  const steps = [];

  // Maximum 6 tool rounds prevents accidental infinite loops.
  for (let round = 0; round < 6; round++) {
    const response = await ollama.chat({
      model: getChatModel(),
      messages,
      tools,
      stream: false,
    });

    const assistantMessage = response.message;
    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls || [];

    // No tool request = final answer is ready.
    if (toolCalls.length === 0) {
      return {
        answer: assistantMessage.content || "No answer returned.",
        steps,
      };
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const args = toolCall.function.arguments || {};

      steps.push({ type: "tool_call", tool: toolName, args });

      const toolResult = await callMcpTool(toolName, args);

      steps.push({
        type: "tool_result",
        tool: toolName,
        result: toolResult.text,
        isError: toolResult.isError,
      });

      // The LLM needs the tool's observation before deciding the next step.
      messages.push({
        role: "tool",
        tool_name: toolName,
        content: toolResult.text,
      });
    }
  }

  return {
    answer:
      "The agent reached the maximum number of tool rounds. Please make the request more specific.",
    steps,
  };
}
