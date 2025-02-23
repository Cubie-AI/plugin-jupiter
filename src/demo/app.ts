import "dotenv/config";
import path from "path";

import { createLogger, createRuntime, UserInputContext } from "@maiar-ai/core";

// Import providers
import { SQLiteProvider } from "@maiar-ai/memory-sqlite";
import { OpenAIProvider } from "@maiar-ai/model-openai";

// Import all plugins
import { PluginTextGeneration } from "@maiar-ai/plugin-text";

import {
  PluginTelegram,
  TelegramContext,
  TelegramPlatformContext,
} from "@maiar-ai/plugin-telegram";
import { Composer } from "telegraf";
import { z } from "zod";
import {
  JupiterTokenResponse,
  LoadJupiterTokenParams,
  PluginJupiter,
} from "..";
import { generateTelegramResponse } from "./template.js";

const logger = createLogger("app");

const memoryStore: JupiterTokenResponse[] = [];

// mock a storage function to store data
async function storeData(data: JupiterTokenResponse[]) {
  memoryStore.push(...data);
}

// mock a loader function from an external storage source
async function loadData(params: LoadJupiterTokenParams) {
  logger.info(`Loading data for ${JSON.stringify(params)}`);
  const ticker = params.ticker?.replace("$", "");
  logger.info(`Ticker: ${ticker}`);
  const filteredData = memoryStore.filter(
    (token) =>
      token.symbol === ticker ||
      token.symbol === params.ticker ||
      token.name === params.name
  );
  // logger.info(`Memory Story: ${JSON.stringify(memoryStore, null, 2)}`);
  return filteredData;
}

const composer = new Composer<TelegramContext>();
composer.on("message", async (ctx) => {
  const text = ctx.text || "";
  const message = ctx.message;
  const chatId = message.chat.id;
  const userId = ctx.from.id;
  const plugin = ctx.plugin as PluginTelegram;

  try {
    const pluginId = plugin.id;
    const userContext: UserInputContext = {
      id: `${pluginId}-${ctx.message.message_id}`,
      pluginId: pluginId,
      type: "user_input",
      action: "receiveMessage",
      content: text,
      timestamp: Date.now(),
      rawMessage: text,
      user: userId.toString(),
      messageHistory: [
        {
          role: "user",
          content: text,
          timestamp: Date.now(),
        },
      ],
      helpfulInstruction: `Message from Telegram user ${userId}`,
    };

    const platformContext: TelegramPlatformContext = {
      platform: pluginId,
      responseHandler: async (response: unknown) => {
        const { text, image } = await plugin.runtime.operations.getObject(
          z.object({
            text: z.string(),
            image: z.string().optional(),
          }),
          generateTelegramResponse(response as string),
          { temperature: 0.5 }
        );

        logger.info(`got params ${JSON.stringify({ text, image })}`);

        if (image) {
          return await ctx.replyWithPhoto(image, { caption: text });
        }

        return ctx.reply(text);
      },
      metadata: {
        chatId,
      },
    };

    try {
      await plugin.runtime.createEvent(userContext, platformContext);
      logger.debug("Successfully queued Telegram message for processing");
    } catch (error) {
      logger.error("Failed to queue Telegram message", {
        error: error instanceof Error ? error.message : String(error),
        user: userId,
        chatId,
      });
    }
  } catch (error) {
    logger.error("Error processing Telegram message", {
      error: error instanceof Error ? error.message : String(error),
      ctx: {
        chatId,
        userId,
      },
    });
  }
});

const runtime = createRuntime({
  model: new OpenAIProvider({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
  }),
  memory: new SQLiteProvider({
    dbPath: path.join(process.cwd(), "data", "conversations.db"),
  }),
  plugins: [
    new PluginTextGeneration(),
    new PluginJupiter({
      store: storeData,
      load: loadData,
    }),
    new PluginTelegram({
      token: process.env.TELEGRAM_BOT_TOKEN as string,
      composer,
    }),
  ],
});

// Start the runtime if this file is run directly
console.log("Starting agent...");
runtime.start().catch((error) => {
  console.error("Failed to start agent:", error);
  process.exit(1);
});

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  console.log("Shutting down agent...");
  await runtime.stop();
  process.exit(0);
});
