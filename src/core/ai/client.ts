import type { AgentAIRequest } from "./types";

class ProviderRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ProviderRequestError";
    this.statusCode = statusCode;
  }
}

function mapMessages(request: AgentAIRequest) {
  return request.conversationHistory.map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));
}

function mapAlternatingMessages(request: AgentAIRequest) {
  return request.conversationHistory
    .filter((entry) => entry.role === "user" || entry.role === "assistant")
    .map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
}

async function callOpenAI(request: AgentAIRequest): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        { role: "system", content: request.systemPrompt },
        ...mapMessages(request),
      ],
      temperature: request.temperature,
      max_tokens: request.maxOutputTokens,
      top_p: request.topP,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ProviderRequestError(
      `OpenAI request failed: ${response.status} ${detail}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "No response received.";
}

async function callAnthropic(request: AgentAIRequest): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": request.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: request.model,
      system: request.systemPrompt,
      max_tokens: request.maxOutputTokens,
      temperature: request.temperature,
      top_p: request.topP,
      messages: mapAlternatingMessages(request),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ProviderRequestError(
      `Anthropic request failed: ${response.status} ${detail}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content?.find((block) => block.type === "text");
  return textBlock?.text?.trim() ?? "No response received.";
}

async function callGoogle(request: AgentAIRequest): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: mapAlternatingMessages(request).map((entry) => ({
        role: entry.role === "assistant" ? "model" : "user",
        parts: [{ text: entry.content }],
      })),
      systemInstruction: {
        role: "system",
        parts: [{ text: request.systemPrompt }],
      },
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        topP: request.topP,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ProviderRequestError(
      `Google request failed: ${response.status} ${detail}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "No response received.";
}

async function callHuggingFace(request: AgentAIRequest): Promise<string> {
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        { role: "system", content: request.systemPrompt },
        ...mapMessages(request),
      ],
      temperature: request.temperature,
      max_tokens: request.maxOutputTokens,
      top_p: request.topP,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ProviderRequestError(
      `HuggingFace request failed: ${response.status} ${detail}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "No response received.";
}

async function callDeepSeek(request: AgentAIRequest): Promise<string> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        { role: "system", content: request.systemPrompt },
        ...mapMessages(request),
      ],
      max_tokens: request.maxOutputTokens,
      temperature: request.temperature,
      top_p: request.topP,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ProviderRequestError(
      `DeepSeek request failed: ${response.status} ${detail}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "No response received.";
}

export async function requestAIReply(request: AgentAIRequest): Promise<string> {
  if (!request.apiKey.trim()) {
    throw new ProviderRequestError(
      "Missing API key. Apply configuration and test it before sending messages.",
      400,
    );
  }

  switch (request.provider) {
    case "openai":
      return await callOpenAI(request);
    case "anthropic":
      return await callAnthropic(request);
    case "google":
      return await callGoogle(request);
    case "huggingface":
      return await callHuggingFace(request);
    case "deepseek":
      return await callDeepSeek(request);
    default:
      throw new ProviderRequestError("Unsupported AI provider.", 400);
  }
}

export { ProviderRequestError };
