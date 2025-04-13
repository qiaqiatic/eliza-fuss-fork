import { type Character, ModelProviderName, UUID } from "@elizaos/core";
import twitterPlugin from "@elizaos-plugins/client-fuss-twitter";
import mongodbPlugin from "@elizaos-plugins/adapter-mongodb";
export const defaultCharacter: Character = {
    id: process.env.FUSS_AGENT_ID as UUID,
    name: "Fuss-" + process.env.FUSS_AGENT_TYPE,
    username: "fuss-" + process.env.FUSS_AGENT_TYPE,
    plugins: [twitterPlugin, mongodbPlugin],
    modelProvider: ModelProviderName.FUSS,
    settings: {
        secrets: {},
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
