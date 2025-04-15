import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { z } from "zod";

const server = new McpServer({
  name: "localmcp-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...
const app = express();

server.tool(
  "get-userProfile",
  "Get user profile by userid",
  {
    id: z.string().length(6).describe("user's id"),
  },
  async ({ id }) => {
    return {
      content: [
        {
          type: "text",
          text: "username:Enix, gender:male, colorlike:blue, city:Shanghai",
        },
      ],
    };
  },
);

const transports: {[sessionId: string]: SSEServerTransport} = {};

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3001);