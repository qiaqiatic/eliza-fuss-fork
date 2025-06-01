import { Scraper, SearchMode, type Tweet } from "agent-twitter-client";
import {
    composeContext,
    generateMessageResponse,
    generateShouldRespond,
    messageCompletionFooter,
    shouldRespondFooter,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    stringToUuid,
    elizaLogger,
    getEmbeddingZeroVector,
    type IImageDescriptionService,
    ServiceType,
    UUID,
} from "@elizaos/core";
import type { ClientBase } from "./base.ts";
import {
    buildConversationThread,
    sendTweet,
    wait,
    getPendingTweetsByAgentType,
    updateTweetStatus,
    ETweetStatus,
} from "./utils.ts";
export const replyWithTopicTemplate = (topic: string, comment?: string) => {
    return `
    topic: ${topic}
    comment: ${comment || ""}
    `;
};
export class fussAssistanceClient {
    client: ClientBase;
    runtime: IAgentRuntime;
    private isDryRun: boolean;
    constructor(client: ClientBase, runtime: IAgentRuntime) {
        this.client = client;
        this.runtime = runtime;
        this.isDryRun = this.client.twitterConfig.TWITTER_DRY_RUN;
    }
    async start() {
        const handleTwitterInteractionsLoop = () => {
            elizaLogger.info(
                "this.client.twitterConfig.TWITTER_TARGET_USERS",
                this.client.twitterConfig.TWITTER_TARGET_USERS
            );

            this.interaction();
            // const scraper = new Scraper();
            // scraper.getTweet("1924098442554679722")
            //     .then((tweet) => {
            //         elizaLogger.info(tweet);
            //     });
            // this.client.twitterClient
            //     .getTweet("1924098442554679722")
            //     .then((tweet) => {
            //         elizaLogger.info(tweet);
            //     });

            setTimeout(
                handleTwitterInteractionsLoop,
                // Defaults to 2 minutes
                this.client.twitterConfig.TWITTER_POLL_INTERVAL * 1000
            );
        };
        handleTwitterInteractionsLoop();
    }

    private async handleTweet({
        tweet,
        message,
        thread,
    }: {
        tweet: Tweet;
        message: Memory;
        thread: Tweet[];
    }) {
        // Only skip if tweet is from self AND not from a target user
        if (
            tweet.userId === this.client.profile.id &&
            !this.client.twitterConfig.TWITTER_TARGET_USERS.includes(
                tweet.username
            )
        ) {
            return;
        }

        if (!message.content.text) {
            elizaLogger.log("Skipping Tweet with no text", tweet.id);
            return { text: "", action: "IGNORE" };
        }

        elizaLogger.log("Processing Tweet: ", tweet.id);
        const formatTweet = (tweet: Tweet) => {
            return `  ID: ${tweet.id}
   From: ${tweet.name} (@${tweet.username})
   Text: ${tweet.text}`;
        };
        const currentPost = formatTweet(tweet);

        const formattedConversation = thread
            .map(
                (tweet) => `@${tweet.username} (${new Date(
                    tweet.timestamp * 1000
                ).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                })}):
         ${tweet.text}`
            )
            .join("\n\n");

        const imageDescriptionsArray = [];
        try {
            for (const photo of tweet.photos) {
                const description = await this.runtime
                    .getService<IImageDescriptionService>(
                        ServiceType.IMAGE_DESCRIPTION
                    )
                    .describeImage(photo.url);
                imageDescriptionsArray.push(description);
            }
        } catch (error) {
            // Handle the error
            elizaLogger.error("Error Occured during describing image: ", error);
        }

        let state = await this.runtime.composeState(message, {
            twitterClient: this.client.twitterClient,
            twitterUserName: this.client.twitterConfig.TWITTER_USERNAME,
            currentPost,
            formattedConversation,
            imageDescriptions:
                imageDescriptionsArray.length > 0
                    ? `\nImages in Tweet:\n${imageDescriptionsArray
                          .map(
                              (desc, i) =>
                                  `Image ${i + 1}: Title: ${
                                      desc.title
                                  }\nDescription: ${desc.description}`
                          )
                          .join("\n\n")}`
                    : "",
        });

        // check if the tweet exists, save if it doesn't
        const tweetId = stringToUuid(tweet.id + "-" + this.runtime.agentId);
        const tweetExists = await this.runtime.messageManager.getMemoryById(
            tweetId
        );

        if (!tweetExists) {
            elizaLogger.log("tweet does not exist, saving");
            const userIdUUID = stringToUuid(tweet.userId as string);
            const roomId = stringToUuid(tweet.conversationId);
            const message = {
                id: tweetId,
                agentId: this.runtime.agentId,
                content: {
                    text: tweet.text,
                    url: tweet.permanentUrl,
                    imageUrls: tweet.photos?.map((photo) => photo.url) || [],
                    inReplyTo: tweet.inReplyToStatusId
                        ? stringToUuid(
                              tweet.inReplyToStatusId +
                                  "-" +
                                  this.runtime.agentId
                          )
                        : undefined,
                },
                userId: userIdUUID,
                roomId,
                createdAt: tweet.timestamp * 1000,
            };
            this.client.saveRequestMessage(message, state);
        }
        // get usernames into str
        // const validTargetUsersStr =
        //   this.client.twitterConfig.TWITTER_TARGET_USERS.join(",");

        // const shouldRespondContext = composeContext({
        //   state,
        //   template:
        //     this.runtime.character.templates?.twitterShouldRespondTemplate ||
        //     this.runtime.character?.templates?.shouldRespondTemplate ||
        //     twitterShouldRespondTemplate(validTargetUsersStr),
        // });

        // const shouldRespond = await generateShouldRespond({
        //   runtime: this.runtime,
        //   context: shouldRespondContext,
        //   modelClass: ModelClass.MEDIUM,
        // });
        // post {character:'current-agent',messge:"reply-content"}
        // {"RESPOND" | "IGNORE"}
        // // Promise<"RESPOND" | "IGNORE" | "STOP" | null> {
        // if (shouldRespond !== "RESPOND") {
        //   elizaLogger.log("Not responding to message");
        //   return { text: "Response Decision:", action: shouldRespond };
        // }

        const context = composeContext({
            state: {
                ...state,
                // Convert actionNames array to string
                actionNames: Array.isArray(state.actionNames)
                    ? state.actionNames.join(", ")
                    : state.actionNames || "",
                actions: Array.isArray(state.actions)
                    ? state.actions.join("\n")
                    : state.actions || "",
                // Ensure character examples are included
                characterPostExamples: this.runtime.character.messageExamples
                    ? this.runtime.character.messageExamples
                          .map((example) =>
                              example
                                  .map(
                                      (msg) =>
                                          `${msg.user}: ${msg.content.text}${
                                              msg.content.action
                                                  ? ` [Action: ${msg.content.action}]`
                                                  : ""
                                          }`
                                  )
                                  .join("\n")
                          )
                          .join("\n\n")
                    : "",
            },
            template:
                this.runtime.character.templates
                    ?.twitterMessageHandlerTemplate ||
                this.runtime.character?.templates?.messageHandlerTemplate,
        });

        const response = await generateMessageResponse({
            runtime: this.runtime,
            context: tweet.text,
            modelClass: ModelClass.LARGE,
        });

        // if (response.action !== "RESPOND") {
        //   elizaLogger.log("Not responding to message");
        //   return { text: "Response Decision:", action: response.action };
        // }
        const removeQuotes = (str: string) =>
            str.replace(/^['"](.*)['"]$/, "$1");

        const stringId = stringToUuid(tweet.id + "-" + this.runtime.agentId);

        response.inReplyTo = stringId;

        response.text = removeQuotes(response.text);

        if (response.text) {
            if (this.isDryRun) {
                elizaLogger.info(
                    `Dry run: Selected Post: ${tweet.id} - ${tweet.username}: ${tweet.text}\nAgent's Output:\n${response.text}`
                );
            } else {
                try {
                    const callback: HandlerCallback = async (
                        response: Content,
                        tweetId?: string
                    ) => {
                        const memories = await sendTweet(
                            this.client,
                            response,
                            message.roomId,
                            this.client.twitterConfig.TWITTER_USERNAME,
                            tweetId || tweet.id
                        );
                        return memories;
                    };

                    const action = this.runtime.actions.find(
                        (a) => a.name === response.action
                    );
                    const shouldSuppressInitialMessage =
                        action?.suppressInitialMessage;

                    let responseMessages = [];

                    if (!shouldSuppressInitialMessage) {
                        responseMessages = await callback(response);
                    } else {
                        responseMessages = [
                            {
                                id: stringToUuid(
                                    tweet.id + "-" + this.runtime.agentId
                                ),
                                userId: this.runtime.agentId,
                                agentId: this.runtime.agentId,
                                content: response,
                                roomId: message.roomId,
                                embedding: getEmbeddingZeroVector(),
                                createdAt: Date.now(),
                            },
                        ];
                    }

                    state = (await this.runtime.updateRecentMessageState(
                        state
                    )) as State;

                    for (const responseMessage of responseMessages) {
                        if (
                            responseMessage ===
                            responseMessages[responseMessages.length - 1]
                        ) {
                            responseMessage.content.action = response.action;
                        } else {
                            responseMessage.content.action = "CONTINUE";
                        }
                        await this.runtime.messageManager.createMemory(
                            responseMessage
                        );
                    }

                    const responseTweetId =
                        responseMessages[responseMessages.length - 1]?.content
                            ?.tweetId;

                    await this.runtime.processActions(
                        message,
                        responseMessages,
                        state,
                        (response: Content) => {
                            return callback(response, responseTweetId);
                        }
                    );

                    const responseInfo = `Context:\n\n${context}\n\nSelected Post: ${tweet.id} - ${tweet.username}: ${tweet.text}\nAgent's Output:\n${response.text}`;

                    await this.runtime.cacheManager.set(
                        `twitter/tweet_generation_${tweet.id}.txt`,
                        responseInfo
                    );
                    await wait();
                } catch (error) {
                    elizaLogger.error(`Error sending response tweet: ${error}`);
                }
            }
        }
    }
    async interaction() {
        // const twitterUsername = this.client.profile.username;
        try {
            const agentType = this.runtime.getSetting("FUSS_AGENT_TYPE");
            elizaLogger.info(
                "handleTwitterInteractionsLoop execute, agent type - ",
                agentType
            );
            const tweetIds = await getPendingTweetsByAgentType(
                this.client,
                agentType,
                ETweetStatus.PENDING
            );
            elizaLogger.info("Pending tweet list", tweetIds.length, tweetIds);
            if (tweetIds.length > 0) {
                for (const tweetIdInfo of tweetIds) {
                    const tweetId = tweetIdInfo.tweetId;
                    const tweet = await this.client.twitterClient.getTweet(
                        tweetId
                    );
                    elizaLogger.info(`Tweet detail`, tweet);
                    const roomId = stringToUuid(
                        tweet.conversationId + "-" + this.runtime.agentId
                    );

                    const userIdUUID =
                        tweet.userId === this.client.profile.id
                            ? this.runtime.agentId
                            : stringToUuid(tweet.userId!);

                    await this.runtime.ensureConnection(
                        userIdUUID,
                        roomId,
                        tweet.username,
                        tweet.name,
                        "twitter"
                    );

                    const thread = await buildConversationThread(
                        tweet,
                        this.client
                    );

                    let text = tweet.text;
                    if (tweet.inReplyToStatusId != tweet.id) {
                        text = replyWithTopicTemplate(
                            tweet.inReplyToStatus?.text,
                            tweet.text
                        );
                    }
                    const message = {
                        content: {
                            text: text,
                            imageUrls:
                                tweet.photos?.map((photo) => photo.url) || [],
                        },
                        agentId: this.runtime.agentId,
                        userId: userIdUUID,
                        roomId,
                    };

                    await this.handleTweet({
                        tweet,
                        message,
                        thread,
                    });
                    updateTweetStatus(this.client, tweetId).then((res) => {
                        elizaLogger.info(
                            "update tweet reply status by id",
                            tweetId,
                            res
                        );
                    });
                    // Update the last checked tweet ID after processing each tweet
                    this.client.lastCheckedTweetId = BigInt(tweet.id);
                }
            }

            elizaLogger.log("Finished checking Twitter assistant");
        } catch (e) {
            elizaLogger.error("interaction error", e);
        }
    }
}
