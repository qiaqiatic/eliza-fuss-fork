import { type Character, ModelProviderName } from "@elizaos/core";
import twitterPlugin from "@elizaos-plugins/client-fuss-twitter";
export const defaultCharacter: Character = {
    name: "Fuss",
    username: "fuss",
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
