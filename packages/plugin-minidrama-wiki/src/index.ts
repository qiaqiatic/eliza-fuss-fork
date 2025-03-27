/*
 * @Author: weiqi
 * @Date: 2025-03-16 13:43:02
 * @LastEditors: weiqi
 * @LastEditTime: 2025-03-18 19:30:46
 * @Description: file content
 * @FilePath: /eliza-fuss-fork/packages/plugin-minidrama-wiki/src/index.ts
 */
import type { Plugin } from "@elizaos/core";
import { generateDramaScript } from "./actions";

console.log("Minidrama wiki plugin initialized successfully!");
export const miniDramaWikiPlugin: Plugin = {
    name: "Minidrama Wiki",
    description: "minidrama chatbot plugin for Eliza",
    actions: [generateDramaScript],
    evaluators: [],
    providers: [],
};

export default miniDramaWikiPlugin;
