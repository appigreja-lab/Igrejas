
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BIBLE_CACHE_PREFIX = 'fu_bible_cache_';

export const getCachedChapter = (book: string, chapter: number) => {
  const key = `${BIBLE_CACHE_PREFIX}${book}_${chapter}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : null;
};

export const saveChapterToCache = (book: string, chapter: number, verses: any[]) => {
  const key = `${BIBLE_CACHE_PREFIX}${book}_${chapter}`;
  localStorage.setItem(key, JSON.stringify(verses));
};

export const generateDevotional = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Gere um devocional cristão diário curto em português com: 1. Título, 2. Um versículo bíblico curto, 3. Uma reflexão de 2 parágrafos. Retorne apenas o texto formatado.",
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Não foi possível carregar o devocional no momento.";
  } catch (error) {
    console.error("Error generating devotional:", error);
    return "Busquem o Senhor enquanto se pode achar. (Isaías 55:6). Que seu dia seja abençoado!";
  }
};

export const fetchBibleChapter = async (book: string, chapter: number) => {
  // Tentar cache primeiro para suporte offline
  const cached = getCachedChapter(book, chapter);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere o texto completo do capítulo ${chapter} do livro de ${book} na versão Almeida Revista e Atualizada (ARA). Retorne em formato JSON com uma lista de objetos contendo 'n' (número do versículo) e 'text' (texto do versículo).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  n: { type: Type.INTEGER },
                  text: { type: Type.STRING }
                },
                required: ["n", "text"]
              }
            }
          },
          required: ["verses"]
        }
      }
    });
    
    const result = JSON.parse(response.text || '{"verses": []}');
    if (result.verses && result.verses.length > 0) {
      saveChapterToCache(book, chapter, result.verses);
    }
    return result.verses;
  } catch (error) {
    console.error("Error fetching Bible chapter:", error);
    // Em caso de erro (offline total), tenta retornar o cache mesmo se falhou (já tentado acima, mas por redundância)
    return cached || [];
  }
};

export const askBibleQuestion = async (question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Responda a esta pergunta bíblica ou espiritual de forma encorajadora e teologicamente sólida em português: ${question}`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text || "Desculpe, não consegui processar sua pergunta.";
  } catch (error) {
    console.error("Error asking Bible question:", error);
    return "Ocorreu um erro ao buscar sua resposta.";
  }
};

export const searchBibleVerses = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Encontre 5 versículos bíblicos relevantes para o seguinte tema ou palavra-chave: "${query}". Retorne em formato JSON com uma lista de objetos contendo 'reference' (ex: João 3:16) e 'text' (texto completo).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  reference: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["reference", "text"]
              }
            }
          },
          required: ["results"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"results": []}');
    return result.results;
  } catch (error) {
    console.error("Error searching verses:", error);
    return [];
  }
};
