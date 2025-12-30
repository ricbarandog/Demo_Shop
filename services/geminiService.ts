
import { GoogleGenAI } from "@google/genai";
// Fixed: Changed incorrect import 'PRODUCTS' to 'INITIAL_PRODUCTS'
import { INITIAL_PRODUCTS } from '../constants';

export const getDesignAdvice = async (userQuery: string): Promise<string> => {
  try {
    // Always use a named parameter for apiKey and use process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Correctly reference INITIAL_PRODUCTS
    const productCatalog = INITIAL_PRODUCTS.map(p => `${p.name} (${p.category}): $${p.price}/${p.unit} - ${p.description}`).join('\n');
    
    const prompt = `
      You are an expert interior design assistant for "Oak & Stone", a cabinet and flooring company.
      
      Here is our product catalog:
      ${productCatalog}

      The user has asked: "${userQuery}"

      Please provide a helpful, professional recommendation from our catalog based on their query. 
      Focus on color coordination and style. Keep the response concise (under 100 words).
      If they ask about something we don't sell, politely redirect them to our cabinets or flooring.
    `;

    // Use 'gemini-3-flash-preview' for basic text/Q&A tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access the .text property directly (not a method).
    return response.text || "I'm sorry, I couldn't generate a recommendation at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently having trouble connecting to our design database. Please browse our catalog manually or try again later.";
  }
};
