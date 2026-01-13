import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAIResponse = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Please configure your API_KEY to use the AI assistant.";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are Zhiwai Assistant, a helpful and friendly university companion for students. You help with schedules, campus info, and studying tips. Keep answers concise.",
      }
    });
    
    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the network right now.";
  }
};