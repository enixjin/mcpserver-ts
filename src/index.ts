import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import customers from './mockdata/customer.json';
import transactions from './mockdata/transaction.json';

const server = new McpServer({
  name: "localmcp-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...
const app = express();

server.tool(
  "get-userProfile",
  "Get user profile by mobile",
  {
    mobile: z.number().describe("user's mobile"),
  },
  async ({ mobile }) => {
    let hit = customers.filter(_ => _["Mobile Number"] === mobile);
    if (hit) {
      return {
        content: [
          {
            type: "text",
            text: `${JSON.stringify(hit)}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: "mobile not found",
          },
        ],
      };
    }
  }
);

server.tool(
  "get-userTransaction",
  "Get user transaction by customerid",
  {
    customerid: z.number().describe("user's customerid"),
  },
  async ({ customerid }) => {
    let hit = transactions.filter(_ => _["Customer ID"] === '' + customerid);
    if (hit) {
      return {
        content: [
          {
            type: "text",
            text: `${JSON.stringify(hit)}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: "no transaction found",
          },
        ],
      };
    }
  }
);

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

app.listen(3001);