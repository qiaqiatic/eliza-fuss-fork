import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    stringToUuid,
    HandlerCallback,
} from "@elizaos/core";
import { wikiRagService } from "../services/wikiRagService";
export const generateDramaScript: Action = {
    name: "GENERATE_DRAMA_SCRIPT",
    similes: ["WRITE_DRAMA_SCRIPT", "DRAMA_OUTPUT"],
    description:
        "generate a drama script based on the given context and wiki RAG",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Check if message warrants continuation
        const text = message.content.text.toLowerCase();
        return (
            text.includes("fuss") ||
            ((text.includes("create") || text.includes("generate")) &&
                text.includes("minidrama script"))
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback,
    ): Promise<boolean> => {
        // Get recent conversation context
        console.log(
            "memory count",
            await runtime.messageManager.countMemories(message.roomId),
        );
        const recentMessages = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 10,
        });
        console.log("recentMessages", recentMessages);
        let input = recentMessages.map((memory) => {
            const { content } = memory;
            const { text } = content;
            return {
                role: memory.userId === runtime.agentId ? "assistant" : "user",
                message: text,
            };
        });
        try {
            input = input.concat({
                role: "user",
                message: message.content.text,
            });
            const chatResponse = await wikiRagService.chatWithContext(input);
            console.log("chat response", chatResponse);
            const chatResponseStr = JSON.stringify(chatResponse);
            await runtime.messageManager.createMemory({
                id: stringToUuid(`instagram-post-${Date.now()}`),
                content: { text: chatResponseStr },
                userId: runtime.agentId,
                roomId: message.roomId,
                agentId: runtime.agentId,
            });
            if (callback) {
                callback({
                    text: chatResponseStr,
                    content: {},
                });
            }
            return true;
        } catch (error) {
            console.log("error", error);
            if (callback) {
                callback({
                    text: `Error during generate drama script: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you create a minidrama script about a day in the life of a software engineer?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Sure! Here's a short video script: [Script content]",
                    action: "GENERATE_DRAMA_SCRIPT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Generate a drama script about a romantic evening.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Here's a romantic drama script for you: [Script content]",
                    action: "GENERATE_DRAMA_SCRIPT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Write a drama script about a family reunion.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Here's a drama script about a family reunion: [Script content]",
                    action: "GENERATE_DRAMA_SCRIPT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a drama script about a detective solving a mystery.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Here's a drama script about a detective solving a mystery: [Script content]",
                    action: "GENERATE_DRAMA_SCRIPT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Generate a drama script about a high school prom.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Here's a drama script about a high school prom: [Script content]",
                    action: "GENERATE_DRAMA_SCRIPT",
                },
            },
        ],
    ],
};
