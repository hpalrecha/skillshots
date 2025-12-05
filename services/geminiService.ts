
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizData, ContentBlock, ContentType } from '../types';

// Helper to get the AI Client dynamically
const getAiClient = () => {
    // Check Local Storage first (User Setting), then Environment Variable
    const apiKey = localStorage.getItem('skillshots_gemini_api_key') || process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please add it in the Creator Studio > Settings tab.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to convert app ContentBlocks into Gemini API "Parts"
// This allows the AI to "see" images and "read" PDFs directly.
const contentBlocksToParts = (blocks: ContentBlock[]) => {
    const parts: any[] = [];

    blocks.forEach(block => {
        if (!block.content) return;

        if (block.type === ContentType.Paragraph) {
            parts.push({ text: block.content });
        } 
        // Handle Data URLs (Uploaded Files)
        else if ((block.type === ContentType.Image || block.type === ContentType.Document) && block.content.startsWith('data:')) {
            try {
                // Format: data:image/png;base64,iVBOR...
                const [header, base64Data] = block.content.split(',');
                const mimeType = header.split(':')[1].split(';')[0];
                
                if (base64Data && mimeType) {
                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    });
                }
            } catch (e) {
                console.warn("Failed to parse data URL for AI context", e);
            }
        }
        // Handle External Links (Text Context only)
        else {
            let label = block.type === ContentType.Video ? "Video Link" : "Resource Link";
            parts.push({ text: `[${label}: ${block.title || 'Untitled'} - URL: ${block.content}]` });
        }
    });

    return parts;
};

export const generateQuiz = async (contentBlocks: ContentBlock[]): Promise<QuizData> => {
  try {
    const ai = getAiClient();
    
    // Estimate content size for question count logic (rough estimate for PDFs/Images)
    const hasMedia = contentBlocks.some(b => b.type !== ContentType.Paragraph);
    const textLength = contentBlocks.filter(b => b.type === ContentType.Paragraph).reduce((acc, b) => acc + b.content.length, 0);
    
    // If we have media (PDF/Image), we assume there's enough content for at least 5 questions
    const questionCount = hasMedia ? 5 : Math.max(3, Math.min(10, Math.ceil(textLength / 500)));

    const systemPrompt = `You are an expert tutor. Based on the provided content (which may include text, images, or PDF documents), generate a ${questionCount}-question multiple-choice quiz.
    - If a PDF or Image is provided, READ IT thoroughly and ask questions about its specific details (e.g., "According to the diagram...", "What does step 2 of the SOP say?").
    - Ensure questions cover the breadth of the material.
    - Each question must have 4 options.`;

    const parts = contentBlocksToParts(contentBlocks);
    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts }, // Send multimodal parts
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        },
      },
    });

    const jsonString = response.text || "[]";
    return JSON.parse(jsonString) as QuizData;
  } catch (error) {
    console.error("Error generating quiz via Gemini API:", error);
    if(error instanceof Error && error.message.includes("API Key")) throw error;
    throw new Error("Failed to generate quiz. If using large PDFs, ensure your internet connection is stable.");
  }
};

export const getChatbotResponse = async (prompt: string, useThinkingMode: boolean, systemInstruction?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const model = useThinkingMode ? "gemini-2.5-pro" : "gemini-2.5-flash"; // Thinking mode requires Pro
    const config: any = {};
    if (useThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 1024 };
    }
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error getting chatbot response from Gemini API:", error);
    if(error instanceof Error && error.message.includes("API Key")) return "Please configure your Gemini API Key in the Settings.";
    return "I'm sorry, I encountered an error. Please try again.";
  }
};

export const analyzeVideoContent = async (videoTitle: string): Promise<string> => {
    try {
      const ai = getAiClient();
      const prompt = `You are a helpful learning assistant. A user is watching a training video titled "${videoTitle}". Based on this title, generate a concise summary of the likely key learning points from the video. Present them as a short bulleted list.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      return response.text || "Could not analyze video.";
    } catch (error) {
        console.error("Error analyzing video content via Gemini API:", error);
        throw new Error("Failed to analyze video content.");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const ai = getAiClient();
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
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech via Gemini API:", error);
        throw new Error("Failed to generate speech.");
    }
};

// New function to ask questions specific to the topic content
export const askQuestionAboutTopic = async (contentBlocks: ContentBlock[], question: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const parts = contentBlocksToParts(contentBlocks);
    
    // Add the specific instruction and question
    const prompt = `You are a helpful tutor. Answer the student's question STRICTLY based on the provided course material (which includes the attached text, images, or PDF documents). 
    - You must read any attached PDF or Image to answer correctly.
    - If the answer is not in the material, politely say "I cannot answer this based on the current course content."
    - Keep the answer concise and helpful.
    
    Student Question: ${question}`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
    });
    return response.text || "I could not generate an answer.";
  } catch (error) {
    console.error("Error asking question about topic:", error);
    if(error instanceof Error && error.message.includes("API Key")) return "Please configure your Gemini API Key in the Settings.";
    return "Sorry, I encountered an error while processing your question.";
  }
};

export interface CourseResource {
    type: ContentType;
    url: string;
}

// New function for AI Course Creation with Context Support
export const generateCourseFromPrompt = async (prompt: string, resources: CourseResource[] = []): Promise<{
    title: string;
    category: string;
    readTime: number;
    content: ContentBlock[];
    coverImageKeyword: string;
}> => {
    try {
        const ai = getAiClient();
        let resourceContext = "";
        if (resources.length > 0) {
            resourceContext = `
            THE USER HAS PROVIDED THE FOLLOWING EXISTING RESOURCES. YOU MUST INCORPORATE THEM INTO THE COURSE STRUCTURE:
            ${resources.map((r, i) => `Resource ${i + 1}: [Type: ${r.type}] [URL: ${r.url}]`).join('\n')}
            
            INSTRUCTIONS FOR RESOURCES:
            - If a resource is a VIDEO, create a 'video' content block with the exact URL provided.
            - If a resource is an IMAGE, create an 'image' content block with the exact URL provided.
            - If a resource is a DOCUMENT/PDF, create a 'document' content block with the exact URL provided.
            - Write educational 'paragraph' blocks to introduce, explain, or summarize these resources.
            - Do not invent fake URLs for the provided resources; use the ones given.
            `;
        } else {
            resourceContext = "No specific resources provided. You may generate placeholder URLs for images/videos if needed, or focus on text content.";
        }

        const systemPrompt = `You are an expert instructional designer. Create a micro-learning course structure based on the user's input.
        
        User Topic/Request: "${prompt}"

        ${resourceContext}

        Return a JSON object with:
        1. title: A catchy, professional title.
        2. category: One of ['General', 'Health & Safety', 'Product Training', 'Soft Skills', 'Compliance', 'Engineering'].
        3. readTime: Estimated read time in minutes (number).
        4. coverImageKeyword: A single english keyword to search for a cover image (e.g. "office", "safety", "computer").
        5. content: An array of ContentBlocks. 
           - Use 'paragraph' type for educational text (at least 2 paragraphs).
           - Use 'image' type.
           - Use 'video' type.
           - Ensure the content is educational, structured, and helpful.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING },
                        readTime: { type: Type.NUMBER },
                        coverImageKeyword: { type: Type.STRING },
                        content: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: [ContentType.Paragraph, ContentType.Image, ContentType.Video, ContentType.Document] },
                                    content: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    order: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonString = response.text || "{}";
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating course from prompt:", error);
        throw error;
    }
};
