/**
 * AI Service - Handles communication with the AI backend
 */

const AI_BASE_URL = process.env.NEXT_PUBLIC_COLLAB_BASE_URL || "http://localhost:3004";

export interface AIMessage {
  userId: string;
  text: string;
  ts: number;
  type?: string;
}

export interface AIAnalysisResult {
  success: boolean;
  analysis?: string;
  error?: string;
  timestamp: number;
}

/**
 * Send a message to the AI assistant
 */
export async function sendAIMessage(
  sessionId: string,
  message: string,
  context?: {
    code?: string;
    language?: string;
    error?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${AI_BASE_URL}/sessions/${sessionId}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to get AI response");
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error: any) {
    console.error("[AI Service] Error sending message:", error);
    return {
      success: false,
      error: error.message || "Failed to communicate with AI",
    };
  }
}

/**
 * Get code analysis from AI
 */
export async function analyzeCode(
  sessionId: string,
  code?: string,
  language?: string,
  userId?: string
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch(`${AI_BASE_URL}/sessions/${sessionId}/ai/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, language, userId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Analysis failed");
    }

    return data;
  } catch (error: any) {
    console.error("[AI Service] Error analyzing code:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze code",
      timestamp: Date.now(),
    };
  }
}

/**
 * Get a hint for the problem
 */
export async function getHint(
  sessionId: string,
  userId?: string
): Promise<{ success: boolean; hint?: string; error?: string }> {
  try {
    const response = await fetch(`${AI_BASE_URL}/sessions/${sessionId}/ai/hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to get hint");
    }

    return {
      success: true,
      hint: data.hint,
    };
  } catch (error: any) {
    console.error("[AI Service] Error getting hint:", error);
    return {
      success: false,
      error: error.message || "Failed to get hint",
    };
  }
}

/**
 * Debug an error with AI help
 */
export async function debugError(
  sessionId: string,
  errorMessage: string,
  code?: string,
  language?: string
): Promise<{ success: boolean; debugHelp?: string; error?: string }> {
  try {
    const response = await fetch(`${AI_BASE_URL}/sessions/${sessionId}/ai/debug`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: errorMessage, code, language }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Debug failed");
    }

    return {
      success: true,
      debugHelp: data.debugHelp,
    };
  } catch (error: any) {
    console.error("[AI Service] Error debugging:", error);
    return {
      success: false,
      error: error.message || "Failed to debug error",
    };
  }
}

/**
 * Explain a programming concept
 */
export async function explainConcept(
  concept: string,
  language?: string
): Promise<{ success: boolean; explanation?: string; error?: string }> {
  try {
    const response = await fetch(`${AI_BASE_URL}/ai/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ concept, language }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Explanation failed");
    }

    return {
      success: true,
      explanation: data.explanation,
    };
  } catch (error: any) {
    console.error("[AI Service] Error explaining concept:", error);
    return {
      success: false,
      error: error.message || "Failed to explain concept",
    };
  }
}

/**
 * Get AI chat history
 */
export async function getAIChatHistory(sessionId: string): Promise<AIMessage[]> {
  try {
    const response = await fetch(`${AI_BASE_URL}/sessions/${sessionId}/ai/history`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch history");
    }

    return data.messages || [];
  } catch (error: any) {
    console.error("[AI Service] Error fetching history:", error);
    return [];
  }
}

export default {
  sendAIMessage,
  analyzeCode,
  getHint,
  debugError,
  explainConcept,
  getAIChatHistory,
};

