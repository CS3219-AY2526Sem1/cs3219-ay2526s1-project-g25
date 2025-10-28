import { z } from "zod";
import { 
  generateAIResponse, 
  analyzeCode, 
  getHint, 
  debugError,
  explainConcept 
} from "../services/aiService.js";
import { redisRepo } from "../repos/redisRepo.js";

/**
 * Validation schema for AI chat message
 */
const aiChatSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    code: z.string().optional(),
    language: z.string().optional(),
    error: z.string().optional(),
  }).optional(),
});

/**
 * Send a message to AI and get response
 * POST /sessions/:id/ai/chat
 */
export const chatWithAI = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Verify session exists
    const session = await redisRepo.getJson(`collab:session:${sessionId}`);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const parsed = aiChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { message, context } = parsed.data;

    // Get current code if not provided in context
    let fullContext = context || {};
    if (!fullContext.code) {
      const doc = await redisRepo.getJson(`collab:document:${sessionId}`);
      if (doc) {
        fullContext.code = doc.text;
      }
    }

    // Get question info if available
    if (session.questionId) {
      fullContext.question = {
        title: session.questionTitle || session.topic,
        description: session.questionDescription || "",
        difficulty: session.difficulty
      };
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(sessionId, message, fullContext);

    // Store AI message in chat history
    const aiMsg = {
      userId: "ai-assistant",
      text: aiResponse,
      ts: Date.now(),
      type: "ai"
    };
    await redisRepo.pushToList(`collab:ai-chat:${sessionId}`, aiMsg);

    return res.status(200).json({
      success: true,
      message: aiResponse,
      timestamp: aiMsg.ts
    });

  } catch (error) {
    console.error("[AI Controller] Chat error:", error);
    return res.status(500).json({ 
      error: "AI service error", 
      details: error.message 
    });
  }
};

/**
 * Analyze code quality and provide feedback
 * POST /sessions/:id/ai/analyze
 */
export const analyzeSessionCode = async (req, res) => {
  try {
    const sessionId = req.params.id;
    console.log(`[AI Controller] analyzeSessionCode called for session ${sessionId}`);
    
    // Verify session exists
    const session = await redisRepo.getJson(`collab:session:${sessionId}`);
    if (!session) {
      console.error(`[AI Controller] Session ${sessionId} not found in Redis`);
      return res.status(404).json({ error: "Session not found" });
    }

    // Get current code - try multiple sources
    let doc = await redisRepo.getJson(`collab:document:${sessionId}`);
    console.log(`[AI Controller] Document from Redis:`, doc ? 'exists' : 'null');
    let code = doc?.text || req.body.code || "";
    
    // Get current language from request body or Redis storage
    let language = req.body.language;
    if (!language) {
      // Try to get language from Redis storage
      const langData = await redisRepo.getJson(`collab:language:${sessionId}`);
      language = langData?.language || "python";
      console.log(`[AI Controller] Got language from Redis storage: ${language}`);
    } else {
      language = language;
    }

    console.log(`[AI Controller] Code length from Redis: ${code.length}`);
    console.log(`[AI Controller] Language for analysis: ${language}`);

    // If no code from Redis, try to get from YJS in-memory storage
    if (!code || code.trim() === "") {
      console.log(`[AI Controller] No code in Redis, trying YJS storage...`);
      try {
        const { rooms } = await import("../ws/yjsGateway.js");
        console.log(`[AI Controller] YJS rooms Map size: ${rooms.size}`);
        console.log(`[AI Controller] Looking for room with sessionId: ${sessionId}`);
        const room = rooms.get(sessionId);
        
        if (room && room.doc) {
          console.log(`[AI Controller] Room found, getting text from YJS...`);
          
          // Try multiple field names (code is what CodePane uses)
          const possibleFields = ['code', 'monaco', 'text', 'content', 'doc'];
          let foundCode = '';
          
          for (const field of possibleFields) {
            try {
              const ytext = room.doc.getText(field);
              const text = ytext.toString();
              console.log(`[AI Controller] YJS field '${field}' has length: ${text.length}`);
              if (text.trim() !== '') {
                foundCode = text;
                console.log(`[AI Controller] Found code in field '${field}'`);
                break;
              }
            } catch (e) {
              // Field doesn't exist, try next
            }
          }
          
          // Also try to get the document state
          try {
            const state = Y.encodeStateAsUpdate(room.doc);
            console.log(`[AI Controller] YJS document state size: ${state.length} bytes`);
            
            // Try to get all text fields
            console.log(`[AI Controller] Inspecting YJS document structure...`);
          } catch (e) {
            console.error(`[AI Controller] Error inspecting document:`, e);
          }
          
          code = foundCode;
          console.log(`[AI Controller] Final code from YJS storage (length: ${code.length})`);
          
          // Save it to Redis for future access
          if (code && code.trim() !== '') {
            console.log(`[AI Controller] Saving code to Redis...`);
            await redisRepo.setJson(`collab:document:${sessionId}`, {
              text: code,
              version: Date.now()
            });
            console.log(`[AI Controller] Saved to Redis successfully`);
          } else {
            console.log(`[AI Controller] No code found in YJS document`);
          }
        } else {
          console.log(`[AI Controller] No room found in YJS storage for session ${sessionId}`);
          console.log(`[AI Controller] Available sessions in YJS:`, Array.from(rooms.keys()));
        }
      } catch (err) {
        console.error("[AI Controller] Could not access YJS storage:", err);
      }
    }

    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "No code to analyze. Please write some code in the editor first." });
    }

    // Analyze code
    const analysis = await analyzeCode(sessionId, code, language);

    return res.status(200).json(analysis);

  } catch (error) {
    console.error("[AI Controller] Analyze error:", error);
    return res.status(500).json({ 
      error: "Analysis failed", 
      details: error.message 
    });
  }
};

/**
 * Get a hint for the current problem
 * POST /sessions/:id/ai/hint
 */
export const getHintForSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Verify session exists
    const session = await redisRepo.getJson(`collab:session:${sessionId}`);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get current code
    const doc = await redisRepo.getJson(`collab:document:${sessionId}`);
    const code = doc?.text || "";

    // Build question context
    const question = {
      title: session.questionTitle || session.topic,
      description: session.questionDescription || "",
      difficulty: session.difficulty
    };

    // Get hint
    const hint = await getHint(sessionId, question, code);

    // Store hint in AI chat history
    const hintMsg = {
      userId: "ai-assistant",
      text: `💡 **Hint:** ${hint}`,
      ts: Date.now(),
      type: "ai-hint"
    };
    await redisRepo.pushToList(`collab:ai-chat:${sessionId}`, hintMsg);

    return res.status(200).json({
      success: true,
      hint,
      timestamp: hintMsg.ts
    });

  } catch (error) {
    console.error("[AI Controller] Hint error:", error);
    return res.status(500).json({ 
      error: "Failed to generate hint", 
      details: error.message 
    });
  }
};

/**
 * Debug an error
 * POST /sessions/:id/ai/debug
 */
export const debugSessionError = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Verify session exists
    const session = await redisRepo.getJson(`collab:session:${sessionId}`);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { error, code, language } = req.body;

    if (!error) {
      return res.status(400).json({ error: "Error message is required" });
    }

    // Get current code if not provided
    const codeToDebug = code || (await redisRepo.getJson(`collab:document:${sessionId}`))?.text || "";
    const lang = language || "python";

    // Debug error
    const debugHelp = await debugError(sessionId, codeToDebug, error, lang);

    // Store debug help in AI chat history
    const debugMsg = {
      userId: "ai-assistant",
      text: `🐛 **Debug Help:**\n${debugHelp}`,
      ts: Date.now(),
      type: "ai-debug"
    };
    await redisRepo.pushToList(`collab:ai-chat:${sessionId}`, debugMsg);

    return res.status(200).json({
      success: true,
      debugHelp,
      timestamp: debugMsg.ts
    });

  } catch (error) {
    console.error("[AI Controller] Debug error:", error);
    return res.status(500).json({ 
      error: "Debug failed", 
      details: error.message 
    });
  }
};

/**
 * Explain a programming concept
 * POST /ai/explain
 */
export const explainProgrammingConcept = async (req, res) => {
  try {
    const { concept, language } = req.body;

    if (!concept) {
      return res.status(400).json({ error: "Concept is required" });
    }

    const explanation = await explainConcept(concept, language || "general");

    return res.status(200).json({
      success: true,
      explanation,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error("[AI Controller] Explain error:", error);
    return res.status(500).json({ 
      error: "Explanation failed", 
      details: error.message 
    });
  }
};

/**
 * Get AI chat history for a session
 * GET /sessions/:id/ai/history
 */
export const getAIChatHistory = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Verify session exists
    const session = await redisRepo.getJson(`collab:session:${sessionId}`);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const aiChatHistory = await redisRepo.getList(`collab:ai-chat:${sessionId}`) || [];

    return res.status(200).json({
      success: true,
      messages: aiChatHistory,
      count: aiChatHistory.length
    });

  } catch (error) {
    console.error("[AI Controller] History error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch history", 
      details: error.message 
    });
  }
};

export default {
  chatWithAI,
  analyzeSessionCode,
  getHintForSession,
  debugSessionError,
  explainProgrammingConcept,
  getAIChatHistory
};

