import { messageHash } from "@injectivelabs/sdk-ts";

const baseUrl = "http://34.209.204.175:8000";

export const wikiRagService = {
    async chatWithContext(
        data: { message: string; role: string }[],
    ): Promise<{ detail: { loc: any[]; msg: string; type: string }[] }> {
        console.log("chat_with_assistant_list_message input", data);
        const response = await fetch(
            `${baseUrl}/chat_with_assistant_list_message`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: data }),
            },
        );
        if (!response.ok) {
            throw new Error("Failed to fetch wiki-rag");
        }
        const apiResponseJson = await response.json();
        return apiResponseJson;
    },
};
