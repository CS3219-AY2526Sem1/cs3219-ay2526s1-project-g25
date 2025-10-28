import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini AI
const apiKey = process.env.GOOGLE_AI_API_KEY || "";

if (!apiKey) {
  console.warn("[AI Service] Warning: GOOGLE_AI_API_KEY not found. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Conversation history per session (in-memory for now, can be moved to Redis later)
const sessionConversations = new Map();

/**
 * Get or create conversation history for a session
 */
function getConversationHistory(sessionId) {
  if (!sessionConversations.has(sessionId)) {
    sessionConversations.set(sessionId, []);
  }
  return sessionConversations.get(sessionId);
}

/**
 * Generate AI response with context awareness
 * @param {string} sessionId - The collaboration session ID
 * @param {string} userMessage - The user's message
 * @param {object} context - Additional context (code, language, question, etc.)
 * @returns {Promise<string>} AI response
 */
export async function generateAIResponse(sessionId, userMessage, context = {}) {
  try {
    // Check if API key is configured
    if (!apiKey) {
      throw new Error("AI service is not configured. Please set GOOGLE_AI_API_KEY in your environment variables.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Build system context
    let systemContext = `You are an AI coding assistant helping two users collaborate on solving interview coding problems in real-time. 
You are helpful, concise, and provide clear explanations.

IMPORTANT GUIDELINES:
- Provide hints and guidance without giving away complete solutions immediately
- Help debug errors and explain concepts
- Suggest optimizations and better approaches
- Keep responses concise but informative
- Use code examples when helpful
- Be encouraging and supportive
`;

    // Add session context if available
    if (context.code) {
      systemContext += `\n\nCURRENT CODE:\n\`\`\`${context.language || 'plaintext'}\n${context.code}\n\`\`\`\n`;
    }

    if (context.question) {
      systemContext += `\n\nQUESTION BEING SOLVED:\nTitle: ${context.question.title || 'N/A'}\nDescription: ${context.question.description || 'N/A'}\nDifficulty: ${context.question.difficulty || 'N/A'}\n`;
    }

    if (context.error) {
      systemContext += `\n\nERROR OUTPUT:\n${context.error}\n`;
    }

    // Get conversation history
    const history = getConversationHistory(sessionId);

    // Build the prompt with history
    let fullPrompt = systemContext + "\n\n";
    
    // Add last few messages from history (keep last 10 for context window management)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n\n`;
    }

    fullPrompt += `User: ${userMessage}\n\nAssistant:`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const aiMessage = response.text();

    // Store in conversation history
    history.push({ role: 'user', text: userMessage });
    history.push({ role: 'assistant', text: aiMessage });

    // Keep history size manageable (last 50 messages)
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    return aiMessage;

  } catch (error) {
    console.error("[AI Service] Error generating response:", error);
    
    // Provide more helpful error messages
    if (error.message.includes("API_KEY")) {
      throw new Error("AI service API key is invalid. Please check your configuration.");
    } else if (error.message.includes("quota") || error.message.includes("429")) {
      throw new Error("AI service quota exceeded. Please try again later.");
    } else if (error.message.includes("configuration")) {
      throw error; // Re-throw configuration errors as-is
    } else {
      throw new Error("Failed to generate AI response: " + error.message);
    }
  }
}

/**
 * Analyze code and provide feedback
 * @param {string} sessionId - The collaboration session ID
 * @param {string} code - The code to analyze
 * @param {string} language - Programming language
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeCode(sessionId, code, language = "python") {
  try {
    if (!apiKey) {
      throw new Error("AI service is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log(`[AI Service] Analyzing code in language: ${language}`);
    
    const prompt = `You are analyzing ${language.toUpperCase()} code. The code provided is definitely ${language} code.

Analyze the following ${language} code and provide:
1. Code quality assessment (1-10)
2. Time complexity
3. Space complexity
4. Potential bugs or issues
5. Optimization suggestions
6. Best practices recommendations

CODE:
\`\`\`${language}
${code}
\`\`\`

Please provide your analysis in a structured, concise format.`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    return {
      success: true,
      analysis,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("[AI Service] Error analyzing code:", error);
    return {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Get hints for solving a problem
 * @param {string} sessionId - The collaboration session ID
 * @param {object} question - Question details
 * @param {string} currentCode - Current code attempt
 * @returns {Promise<string>} Hint
 */
export async function getHint(sessionId, question, currentCode = "") {
  try {
    if (!apiKey) {
      throw new Error("AI service is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `Provide a helpful hint (not the complete solution) for this coding problem:

PROBLEM: ${question.title}
DESCRIPTION: ${question.description}
DIFFICULTY: ${question.difficulty}
`;

    if (currentCode) {
      prompt += `\nCURRENT ATTEMPT:\n\`\`\`\n${currentCode}\n\`\`\`\n`;
      prompt += "\nBased on their current attempt, what's the next step or what's missing?";
    } else {
      prompt += "\nProvide a hint about the approach to solve this problem.";
    }

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("[AI Service] Error generating hint:", error);
    throw new Error("Failed to generate hint: " + error.message);
  }
}

/**
 * Debug code execution error
 * @param {string} sessionId - The collaboration session ID
 * @param {string} code - The code that failed
 * @param {string} error - Error message
 * @param {string} language - Programming language
 * @returns {Promise<string>} Debug help
 */
export async function debugError(sessionId, code, error, language) {
  try {
    if (!apiKey) {
      throw new Error("AI service is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Help debug this ${language} code that's producing an error:

CODE:
\`\`\`${language}
${code}
\`\`\`

ERROR:
${error}

Please:
1. Explain what's causing the error
2. Suggest how to fix it
3. Provide corrected code snippet if applicable

Be concise and focus on the specific error.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("[AI Service] Error debugging:", error);
    throw new Error("Failed to debug error: " + error.message);
  }
}

/**
 * Clear conversation history for a session
 * @param {string} sessionId - The collaboration session ID
 */
export function clearConversationHistory(sessionId) {
  sessionConversations.delete(sessionId);
}

/**
 * Explain a code concept
 * @param {string} concept - The concept to explain
 * @param {string} language - Programming language context
 * @returns {Promise<string>} Explanation
 */
export async function explainConcept(concept, language = "general") {
  try {
    if (!apiKey) {
      throw new Error("AI service is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Explain the concept of "${concept}" in the context of ${language} programming.
Provide a clear, concise explanation with a simple code example if applicable.
Keep it beginner-friendly but technically accurate.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("[AI Service] Error explaining concept:", error);
    throw new Error("Failed to explain concept: " + error.message);
  }
}

export default {
  generateAIResponse,
  analyzeCode,
  getHint,
  debugError,
  clearConversationHistory,
  explainConcept
};

