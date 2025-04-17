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

const chatData = [
  {
    customerid: 600001, chat: `
          顾客：  你好，我想了解一下BOSS今年新款的修身西装，浅灰色或浅褐色，44码有现货吗？  
SA：  先生您好！感谢关注BOSS 2024春夏系列～  刚到店的 新款修身款西装（浅褐色，44码）非常符合您的需求，面料是初剪羊毛，透气性极佳。  需要为您预留试穿吗？本周店内还有专属裁缝可免费修改裤长。  
顾客：  图片看着不错，我明天下午6点过来试穿。  
SA：   已为您预留！到店后找Ethan即可。温馨提示：同系列还有配套衬衫和领带，搭配购买可享9折优惠～  
顾客：你好，想了解你们店最新的男士西装系列，是否有修身款的？  
SA：您好，感谢关注Hugo Boss！2024春夏系列刚上新，推荐我们的 新款修身剪裁西装，采用意大利初剪羊毛搭配丝绸。您需要商务还是休闲场合穿着？我可以为您推荐配色。  
顾客：商务用，浅褐色有货吗？  
SA：浅褐色是经典款，目前尺码齐全。您身高和体重是？我帮您确认合身尺码。
顾客：听说你们提供西装定制，流程是怎样的？
SA：是的！Boss Made to Measure服务提供100+种面料选择，包括Super 150s羊毛和限量版花色。首先，我们会为您进行精准量体（约30分钟），然后您可以选择领型、扣位、内衬等细节。4-6周后可取衣。您有兴趣预约量体吗？  
顾客：费用大概多少？  
SA：定制西装起价￥12,800，含两次免费调整。本周预约可享2000配饰券（可用于衬衫或领带）。  
顾客：好的了解了
          `},
  {
    customerid: 600002, chat: `
          顾客：上个月买的女士衬衫洗后缩水了，你们不是说面料预缩处理过吗？  
SA：非常抱歉！Boss衬衫确实经过Sanforized防缩工艺，可能是洗涤方式有误。我们提供免费熨烫恢复服务，或为您更换同款（需保留吊牌）。您方便提供购买凭证吗？  
顾客：这是小票，我想换大一号。  
SA：已安排，新衬衫到店后会电话通知您。另附赠一份Boss面料保养手册，建议冷水手洗避免烘干。  
顾客：想送男友香水，Boss哪款最受欢迎？  
SA：男士首选 “Boss Bottled”（木质调，适合职场），或 “Boss The Scent”（性感香草琥珀调，适合约会）。今天购满1000元可享免费刻字服务，要试试吗？  
顾客：想找一套适合晚宴的女装，简约但高级。  
SA：推荐我们的 “Boss Femme 丝绒连衣裙”（凯特王妃同款），搭配水晶扣腰带 和Boss Clutch 手包。您喜欢深红还是午夜蓝？我可以为您预留全套试穿。 
顾客：好的帮我留M 码我想试试。
SA：好的帮你安排妥当了 
          `},
  {
    customerid: 600003, chat: `
                  对话1：海外顾客代购 
顾客：我在加拿大官网看到HB-3211夹克，中国店有货吗？  
SA：为您查询到亚洲版型HB-3211-CN（袖长缩短1.5cm），北京SKP店有您穿的50码。支持支付宝跨境支付+国际直邮（关税补贴30%），需要视频连线看实物吗？  
顾客：好的我有兴趣看一下。
对话2：新品咨询（男装） 
顾客：你好，我在小红书看到你们2024夏季新款亚麻西装（HB-8765），能发实物图吗？  
SA：下午好，张先生！感谢关注Boss夏季系列（附：实拍视频+细节图）。这款采用意大利透气亚麻，内衬可拆卸，适合30℃以上天气。您需要搭配同系列亚麻衬衫吗？  
顾客：视频里模特穿的米色衬衫是同一季的吗？  
SA：您眼光真好！那是 Boss Linen Shirt HB-8721（同步上新），领口有隐形纽扣设计。建议您成套试穿，本周购买可享免熨烫护理服务。需要预留您的尺码吗？  
顾客：好的可以，我大概是43码。
对话3：VIP顾客专属折扣 
顾客：我看中的那件风衣（HB-6543）能打折吗？我是金卡会员。  
SA：张先生，您是我们的重要客户这款风衣虽不参与公开促销，但我已为您申请金卡专属9折+额外积分翻倍（省¥1200）。库存仅剩2件，需要现在锁定吗？  
顾客：8.5折我就今天下单。  
SA：理解您的需求！我请示店长后可以为您做到 88折（再赠¥600护理券），这是最大权限了。您看是否接受？（附：电子优惠码）  
顾客：好的可以。
                  `}
];

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