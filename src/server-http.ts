import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const server = new McpServer({
  name: "movie-mcp",
  version: "1.0.0",
});

const app = express();
app.use(express.json());
const PORT = 3000;

server.registerTool(
  "search_movie",
  {
    description: "Search a movie by title using the OMDb API",
    inputSchema: {
    title: z.string(),
    },
  },
  
  async ({ title }) => {
  const apiKey = process.env.OMDB_API_KEY;

  const response = await fetch(
    `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}`
  );

  const movie = await response.json();

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(movie, null, 2),
      },
    ],
  };
}
);

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);

  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`🚀 Movie MCP HTTP Server running at http://localhost:${PORT}/mcp`);
});