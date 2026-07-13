// Shared OpenRouter client for Convex actions.
// Runs on the default Convex V8 runtime (no "use node") — plain fetch, no SDK.
// Env vars are read from the Convex DEPLOYMENT env (set via `npx convex env set`),
// NOT from .env.local. See .context/todo.md.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;

export type ReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export type ChatParams = {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  responseFormatJson?: boolean;
  reasoningEffort?: ReasoningEffort;
};

type OpenRouterResponse = {
  choices?: { message?: { content?: string } }[];
};

export async function chatCompletion(params: ChatParams): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    throw new Error(
      "OpenRouter is not configured. Set OPENROUTER_API_KEY and OPENROUTER_MODEL in the Convex deployment.",
    );
  }

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    temperature: params.temperature,
    max_tokens: params.maxTokens,
  };

  // Best-effort: some models honor this, some ignore it. JSON callers still
  // fence-strip and retry, so we never rely on it.
  if (params.responseFormatJson) {
    body.response_format = { type: "json_object" };
  }

  if (params.reasoningEffort) {
    body.reasoning = { effort: params.reasoningEffort };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional OpenRouter attribution — harmless if unused.
        "X-Title": "Content Agent",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenRouter request timed out. Please retry.");
    }
    throw new Error(
      `OpenRouter request failed: ${error instanceof Error ? error.message : "network error"}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter request failed (${response.status}): ${bodyText.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return content;
}

// Removes a leading/trailing ```json ... ``` fence (or bare ``` fence) that
// models sometimes wrap JSON in, so JSON.parse can succeed.
function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

// Calls the model, expects JSON, and runs `parse` on the parsed value (which
// should throw on an invalid shape). Retries the whole call once on any failure
// before giving up.
export async function chatCompletionJson<T>(
  params: ChatParams,
  parse: (parsed: unknown) => T,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chatCompletion(params);
      const parsed = JSON.parse(stripCodeFences(raw));
      return parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `The model returned a malformed response. Please retry. (${
      lastError instanceof Error ? lastError.message : "unknown error"
    })`,
  );
}
