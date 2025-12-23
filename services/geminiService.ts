import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDesignAdvice = async (userQuery: string): Promise<string> => {
  try {
    const productCatalog = PRODUCTS.map(p => `${p.name} (${p.category}): $${p.price}/${p.unit} - ${p.description}`).join('\n');
    
    const prompt = `
      You are an expert interior design assistant for "Oak & Stone", a cabinet and flooring company.
      
      Here is our product catalog:
      ${productCatalog}

      The user has asked: "${userQuery}"

      Please provide a helpful, professional recommendation from our catalog based on their query. 
      Focus on color coordination and style. Keep the response concise (under 100 words).
      If they ask about something we don't sell, politely redirect them to our cabinets or flooring.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't generate a recommendation at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently having trouble connecting to our design database. Please browse our catalog manually or try again later.";
  }
};