'use server'

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';

const PARSING_DIR = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  'src',
  'lib',
  'parsing'
);
const PDF_PROMPT_PATH = path.join(PARSING_DIR, 'prompt.txt');
const IMAGE_PROMPT_PATH = path.join(PARSING_DIR, 'image_prompt.txt');
const LOADING_MESSAGES_PATH = path.join(PARSING_DIR, 'loading_messages.txt');

export interface PDFParseResult {
  json: unknown; // The structured JSON content extracted by Gemini
  version: string;
  size: number;
  name: string;
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function readGeminiText(response: Response): Promise<string> {
  const responseData = (await response.json()) as GeminiGenerateContentResponse;
  const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No content returned from Gemini API.');
  }

  return text;
}

export async function parsePDFAction(formData: FormData): Promise<{ success: boolean; data?: PDFParseResult; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not defined in the environment. Please add GEMINI_API_KEY=your_key_here to a .env.local file in your root directory.'
      };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file uploaded.' };
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: 'Uploaded file is not a PDF.' };
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 15MB limit.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract raw text from PDF
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const rawText = parsed.text || '';

    if (!rawText.trim()) {
      return { success: false, error: 'Failed to extract any text from this PDF file.' };
    }

    // 2. Load the system prompt from prompt.txt resource file
    const systemPrompt = readFileSync(PDF_PROMPT_PATH, 'utf8');

    // 3. Call Gemini API to transform the text into structured JSON
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}

Document Text:
${rawText}`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const rawJsonString = await readGeminiText(response);

    // Parse the JSON string from Gemini
    const structuredJson = JSON.parse(rawJsonString);

    return {
      success: true,
      data: {
        json: structuredJson,
        version: 'unknown',
        size: file.size,
        name: file.name,
      },
    };
  } catch (err: unknown) {
    console.error('PDF parsing/Gemini error:', err);
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to parse and transform PDF file.'),
    };
  }
}

export async function queryDocumentAction(jsonData: unknown, query: string): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not defined in the environment. Please add GEMINI_API_KEY=your_key_here to a .env.local file in your root directory.'
      };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant analyzing a structured JSON document. 
Here is the document data in JSON format:
${JSON.stringify(jsonData, null, 2)}

User Question:
${query}

Answer the user's question accurately and concisely based on the JSON document data. If the answer is not present, explain what is missing.`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const answer = await readGeminiText(response);

    return {
      success: true,
      answer,
    };
  } catch (err: unknown) {
    console.error('Query error:', err);
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to query the document.'),
    };
  }
}

export async function parseImageAction(formData: FormData): Promise<{ success: boolean; data?: PDFParseResult; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not defined in the environment. Please add GEMINI_API_KEY=your_key_here to a .env.local file in your root directory.'
      };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file uploaded.' };
    }

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!isImage) {
      return { success: false, error: 'Uploaded file is not a supported image.' };
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 15MB limit.' };
    }

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Load the system prompt from image_prompt.txt resource file
    const systemPrompt = readFileSync(IMAGE_PROMPT_PATH, 'utf8');

    // Call Gemini API (multimodal) to transform the image into structured JSON
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: systemPrompt
            }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const rawJsonString = await readGeminiText(response);

    // Parse the JSON string from Gemini
    const structuredJson = JSON.parse(rawJsonString);

    return {
      success: true,
      data: {
        json: structuredJson,
        version: 'unknown',
        size: file.size,
        name: file.name,
      },
    };
  } catch (err: unknown) {
    console.error('Image parsing/Gemini error:', err);
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to parse and transform image file.'),
    };
  }
}

export async function parseTextAction(formData: FormData): Promise<{ success: boolean; data?: PDFParseResult; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not defined in the environment. Please add GEMINI_API_KEY=your_key_here to a .env.local file in your root directory.'
      };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file uploaded.' };
    }

    if (file.type !== 'text/plain' && !file.name.toLowerCase().endsWith('.txt')) {
      return { success: false, error: 'Uploaded file is not a TXT file.' };
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 15MB limit.' };
    }

    const rawText = await file.text();

    if (!rawText.trim()) {
      return { success: false, error: 'Failed to extract any text from this TXT file.' };
    }

    // Load the system prompt from prompt.txt resource file
    const systemPrompt = readFileSync(PDF_PROMPT_PATH, 'utf8');

    // Call Gemini API to transform the text into structured JSON
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}

Document Text:
${rawText}`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const rawJsonString = await readGeminiText(response);

    // Parse the JSON string from Gemini
    const structuredJson = JSON.parse(rawJsonString);

    return {
      success: true,
      data: {
        json: structuredJson,
        version: 'unknown',
        size: file.size,
        name: file.name,
      },
    };
  } catch (err: unknown) {
    console.error('TXT parsing/Gemini error:', err);
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to parse and transform TXT file.'),
    };
  }
}

export async function getLoadingMessagesAction(): Promise<string[]> {
  try {
    const searchPaths = [
      LOADING_MESSAGES_PATH,
    ];

    for (const filePath of searchPaths) {
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          return lines;
        }
      }
    }
  } catch (err) {
    console.error('Failed to read loading_messages:', err);
  }

  // Fallback defaults
  return [
    'Refracting light through glossy panels...',
    'Inflating dynamic glass bubbles...',
    'Consulting the neural network pathways...',
    'Analyzing text hierarchy under crystal clear glass...',
    'Organizing structured data into clean JSON grids...'
  ];
}