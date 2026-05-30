'use server'

export interface PDFParseResult {
  json: any; // The structured JSON content extracted by Gemini
  version: string;
  size: number;
  name: string;
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
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const rawText = parsed.text || '';

    if (!rawText.trim()) {
      return { success: false, error: 'Failed to extract any text from this PDF file.' };
    }

    // 2. Load the system prompt from prompt.txt resource file
    const fs = require('fs');
    const path = require('path');
    const promptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'src', 'app', 'prompt.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

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

    const responseData = await response.json();
    const rawJsonString = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonString) {
      throw new Error('No content returned from Gemini API.');
    }

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
  } catch (err: any) {
    console.error('PDF parsing/Gemini error:', err);
    return {
      success: false,
      error: err.message || 'Failed to parse and transform PDF file.',
    };
  }
}

export async function queryDocumentAction(jsonData: any, query: string): Promise<{ success: boolean; answer?: string; error?: string }> {
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

    const responseData = await response.json();
    const answer = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      throw new Error('No answer returned from Gemini.');
    }

    return {
      success: true,
      answer,
    };
  } catch (err: any) {
    console.error('Query error:', err);
    return {
      success: false,
      error: err.message || 'Failed to query the document.',
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
    const fs = require('fs');
    const path = require('path');
    const promptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'src', 'app', 'image_prompt.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

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

    const responseData = await response.json();
    const rawJsonString = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonString) {
      throw new Error('No content returned from Gemini API.');
    }

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
  } catch (err: any) {
    console.error('Image parsing/Gemini error:', err);
    return {
      success: false,
      error: err.message || 'Failed to parse and transform image file.',
    };
  }
}

export async function getLoadingMessagesAction(): Promise<string[]> {
  try {
    const fs = require('fs');
    const path = require('path');
    const searchPaths = [
      path.join(/*turbopackIgnore: true*/ process.cwd(), 'loading_messages'),
      path.join(/*turbopackIgnore: true*/ process.cwd(), 'loading_messages.txt'),
      path.join(/*turbopackIgnore: true*/ process.cwd(), 'src', 'app', 'loading_messages'),
      path.join(/*turbopackIgnore: true*/ process.cwd(), 'src', 'app', 'loading_messages.txt'),
    ];

    for (const filePath of searchPaths) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
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



