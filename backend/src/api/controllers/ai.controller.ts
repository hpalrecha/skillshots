import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { GoogleGenAI, Type, Modality } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const quizGenerationSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswerIndex: { type: Type.INTEGER },
      },
      required: ["question", "options", "correctAnswerIndex"],
    },
  };

export const generateQuiz = async (req: ExpressRequest, res: ExpressResponse) => {
  const { topicContent } = req.body;

  if (!topicContent) {
    return res.status(400).json({ message: "topicContent is required" });
  }
  
  try {
    const prompt = `Based on the following text, generate a 3-question multiple-choice quiz to test understanding. Each question should have 4 options. Text: --- ${topicContent} --- Provide the output in the specified JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizGenerationSchema,
      },
    });

    const jsonString = response.text.trim();
    res.json(JSON.parse(jsonString));
  } catch (error) {
    console.error("Error generating quiz with Gemini API:", error);
    res.status(500).json({ message: "Failed to generate quiz." });
  }
};

export const getChatbotResponse = async (req: ExpressRequest, res: ExpressResponse) => {
  const { prompt, useThinkingMode } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "prompt is required" });
  }

  try {
    const model = useThinkingMode ? "gemini-2.5-pro" : "gemini-2.5-flash";
    const config = useThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};

    const response = await ai.models.generateContent({ model, contents: prompt, config });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error getting chatbot response from Gemini API:", error);
    res.status(500).json({ message: "Failed to get chatbot response." });
  }
};

export const analyzeVideoContent = async (req: ExpressRequest, res: ExpressResponse) => {
    const { videoTitle } = req.body;

    if (!videoTitle) {
      return res.status(400).json({ message: "videoTitle is required" });
    }

    try {
      const prompt = `You are a helpful learning assistant. A user is watching a training video titled "${videoTitle}". Based on this title, generate a concise summary of the likely key learning points from the video. Present them as a short bulleted list.`;
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
      res.json({ text: response.text });
    } catch (error) {
        console.error("Error analyzing video content with Gemini API:", error);
        res.status(500).json({ message: "Failed to analyze video content." });
    }
};

export const generateSpeech = async (req: ExpressRequest, res: ExpressResponse) => {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Please read the following learning material clearly and at a moderate pace: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        res.json({ audio: base64Audio });
    } catch (error) {
        console.error("Error generating speech with Gemini API:", error);
        res.status(500).json({ message: "Failed to generate speech." });
    }
};