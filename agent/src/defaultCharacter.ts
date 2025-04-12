import { type Character, ModelProviderName, UUID } from "@elizaos/core";
import twitterPlugin from "@elizaos-plugins/client-fuss-twitter";
export const defaultCharacter: Character = {
    id: process.env.FUSS_AGENT_ID as UUID,
    name: "Fuss-" + process.env.FUSS_AGENT_TYPE,
    username: "fuss-" + process.env.FUSS_AGENT_TYPE,
    plugins: [twitterPlugin],
    modelProvider: ModelProviderName.FUSS,
    settings: {
        secrets: {
            role: "",
        },
        voice: {
            model: "en_US-hfc_female-medium",
        },
    },
    system: "",
    bio: [],
    lore: [],
    messageExamples: [],
    postExamples: [],
    topics: [],
    style: {
        all: [],
        chat: [],
        post: [],
    },
    adjectives: [],
    extends: [],
};
