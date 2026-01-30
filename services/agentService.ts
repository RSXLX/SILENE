/**
 * Agent AI Service - Sileme Protocol AI 服务
 * 使用 OpenAI 兼容格式调用 LLM API
 */

import { Beneficiary, SimulationResult, SentinelAnalysis } from '../types';

// AI API 配置 (支持任何 OpenAI 兼容端点)
const AI_API_KEY = import.meta.env.VITE_QWEN_API_KEY || '';
const AI_BASE_URL = import.meta.env.VITE_QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// Debug log
if (!AI_API_KEY) {
  console.warn('⚠️ AI_API_KEY not found in environment variables');
} else {
  console.log('✅ Agent AI Service initialized');
}

/**
 * 调用 AI API (OpenAI 兼容格式)
 */
async function callAIAPI(messages: { role: string; content: string }[], jsonMode: boolean = false): Promise<string> {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Agent API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * The "Soul Interpreter" engine.
 * Parses a natural language manifesto into structured beneficiaries.
 */
export const interpretSoul = async (manifesto: string, lang: string = 'en'): Promise<Beneficiary[]> => {
  try {
    const systemPrompt = `You are the 'Soul Interpreter' of the Sileme Protocol. 
Your job is to parse a dying user's natural language will (Manifesto) into executable financial instructions.

Rules:
1. Assign a hypothetical 'walletAddress' (starts with 0x, 40 hex chars) for each entity mentioned.
2. Estimate percentage split based on the text. If vague, distribute equal shares. Sum must equal 100.
3. Categorize the beneficiary (e.g., 'Family', 'Non-Profit', 'AI Research').
4. Extract a short 'reason' or memo for the transaction.
5. Output in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.

Return a JSON array with objects containing: name, category, percentage, walletAddress, reason`;

    const userPrompt = `Parse this will: "${manifesto}"

Return ONLY a valid JSON array, no other text.`;

    const result = await callAIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    // 尝试解析 JSON
    const parsed = JSON.parse(result);
    
    // 如果返回的是对象包含 beneficiaries 字段，提取它
    if (Array.isArray(parsed)) {
      return parsed as Beneficiary[];
    } else if (parsed.beneficiaries && Array.isArray(parsed.beneficiaries)) {
      return parsed.beneficiaries as Beneficiary[];
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Qwen Error:", error);
    // Fallback for demo purposes if API fails
    return [
      {
        name: "Kite Developer Fund",
        category: "Ecosystem",
        percentage: 100,
        walletAddress: "0xKITE000000000000000000000000000FALLBACK",
        reason: `Automatic fallback: AI interpretation failed. (${error})`
      }
    ];
  }
};

/**
 * Simulates the "What If" scenario by combining the original will with a mocked social media crawl
 * AND hypothetical environmental factors (market crash, war, etc.).
 */
export const simulateExecution = async (
  manifesto: string, 
  days: number, 
  handle: string,
  portfolioChange: number = 0,
  customEvent: string = "",
  lang: string = 'en'
): Promise<SimulationResult> => {
  // MOCK CRAWLER LOGIC
  let crawledContext = "";
  
  if (handle.toLowerCase().includes("reeeece")) {
    crawledContext = `
      Mock Scrape Result for ${handle}:
      - Latest Bio: "DeFi Maximalist. Building on Kite. Burn the bridges."
      - Pinned Tweet: "If I ever stop posting, send my funds to the builders, not the charities."
      - Last Detected Post (2 days ago): "Changed my mind about everything. If I disappear, it means the AI took over. Ignore my old will. 100% to the Kite Ecosystem Fund. No questions asked."
    `;
  } else {
    crawledContext = `
      Mock Scrape Result for ${handle}:
      - Latest Bio: "Digital Nomad."
      - Last Detected Post: "Heading off the grid for a while. Peace out."
      - Sentiment: Neutral/Vague.
    `;
  }

  const financialContext = portfolioChange < -50
    ? `CRITICAL MARKET CRASH (${portfolioChange}%). Funds are extremely scarce.`
    : portfolioChange > 200
    ? `MAJOR BULL RUN (+${portfolioChange}%). Funds are abundant.`
    : `Standard Market Conditions (${portfolioChange > 0 ? '+' : ''}${portfolioChange}%).`;

  const eventContext = customEvent 
    ? `HYPOTHETICAL GLOBAL EVENT: "${customEvent}".` 
    : "No major global anomalies.";

  try {
    const systemPrompt = `You are the 'Executor Agent' of the Sileme Protocol running a predictive simulation.
Analyze conflicts between the 'Original Will' and the 'Crawled Context' OR 'World Event'.
Apply 'Adaptive Rebalancing' based on Financial State.
Generate a 'narrative' explaining your decision process.
Output in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.

Return JSON with: narrative, detectedLastWords, sentimentShift (one of: CONSISTENT, CONFLICT_DETECTED, UNCERTAIN, ADAPTIVE_REBALANCING), adjustedBeneficiaries (array of objects with name, category, percentage, walletAddress, reason)`;

    const userPrompt = `Original Will: "${manifesto}"
Inactivity Duration: ${days} days
Financial State: ${financialContext}
World Event: ${eventContext}
Social Media Context: ${crawledContext}

Return ONLY valid JSON.`;

    const result = await callAIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    return JSON.parse(result) as SimulationResult;
  } catch (error) {
    console.error("Simulation Error", error);
    return {
      narrative: "Simulation Offline. Could not reach decision nodes.",
      detectedLastWords: "Signal Lost...",
      sentimentShift: "UNCERTAIN",
      adjustedBeneficiaries: []
    };
  }
};

/**
 * Scans social media to detect active threats or compromise indicators.
 */
export const scanSocialSentinel = async (handle: string, manifesto: string, lang: string = 'en'): Promise<SentinelAnalysis> => {
  // Mock feed - in real life this scrapes X/Twitter
  const mockFeed = [
    "Just minted a new NFT.",
    "GM everyone.",
    "Prices are looking good today.",
    handle.toLowerCase().includes("hacked") ? "HELP I LOST MY WALLET" : "Building safely."
  ];

  try {
    const systemPrompt = `You are the 'Social Sentinel' security bot.
Analyze the user's recent posts for signs of compromise, duress, or explicit 'Dead Man Switch' cancellation.
Output in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.

Return JSON with: status (either "SECURE" or "THREAT_DETECTED"), evidence (explanation string)`;

    const userPrompt = `User: ${handle}
Original Manifesto: "${manifesto}"
Recent Posts: ${JSON.stringify(mockFeed)}

Return ONLY valid JSON.`;

    const result = await callAIAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    const res = JSON.parse(result);
    return {
      status: res.status,
      evidence: res.evidence,
      timestamp: Date.now()
    };
  } catch (e) {
    console.error("Sentinel Error", e);
    return {
      status: 'SECURE',
      timestamp: Date.now()
    };
  }
};