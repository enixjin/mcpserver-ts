import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { convertWordToMarkdown } from "./convertService";

const server = new McpServer({
  name: "localmcp-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...
const app = express();

server.tool(
  "get-requirement",
  "Get requirement document",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: await convertWordToMarkdown("./UserStory.docx"),
        },
      ],
    };
  }
);

server.tool(
  "get-frontend-code",
  "Get frontend HTML Javascript code",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: getHtml(),
        },
      ],
    };
  }
)



const transports: { [sessionId: string]: SSEServerTransport } = {};

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

const getHtml = () => `
<!DOCTYPE html>
<html>
  <head>
    <title>Model Context Protocol</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="/sse"></script>
  </body>
</html>
`;

app.listen(3001);