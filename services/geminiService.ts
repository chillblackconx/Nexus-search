import { GoogleGenAI, Chat } from "@google/genai";
import type { GroundingChunk, SearchResult } from '../types';

export const createChatWithGoogleSearch = (): Chat => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // The config for the tool must be passed when the chat is created.
  const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        tools: [{ googleSearch: {} }],
      },
  });
  return chat;
};

export const continueChat = async (chat: Chat, query: string): Promise<SearchResult> => {
  try {
    const response = await chat.sendMessage({ message: query });
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources: sources as GroundingChunk[] };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching from the Gemini API.");
  }
};
