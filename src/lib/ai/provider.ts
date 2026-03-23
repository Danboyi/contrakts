import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const DEFAULT_OPENAI_MODEL = 'gpt-5-mini'
const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-6'

export type AiProvider = 'openai' | 'anthropic'

type ProviderPreference = 'auto' | AiProvider

type AiTextRequest = {
  systemPrompt: string
  userPrompt: string
  maxOutputTokens: number
}

type StreamAiTextRequest = AiTextRequest & {
  onDelta?: (delta: string) => void | Promise<void>
}

let openAiClient: OpenAI | null = null
let anthropicClient: Anthropic | null = null

function isConfigured(value: string | undefined) {
  return Boolean(value && !value.includes('placeholder'))
}

function getProviderPreference(): ProviderPreference {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase()

  if (raw === 'openai' || raw === 'anthropic') {
    return raw
  }

  return 'auto'
}

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!isConfigured(apiKey)) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey })
  }

  return openAiClient
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!isConfigured(apiKey)) {
    throw new Error('ANTHROPIC_API_KEY is not configured.')
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey })
  }

  return anthropicClient
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL
}

function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL
}

function ensureTextResponse(text: string | undefined) {
  const trimmed = text?.trim()
  if (!trimmed) {
    throw new Error('AI returned an empty response.')
  }

  return trimmed
}

async function generateOpenAiText({
  systemPrompt,
  userPrompt,
  maxOutputTokens,
}: AiTextRequest) {
  const response = await getOpenAiClient().responses.create({
    model: getOpenAiModel(),
    instructions: systemPrompt,
    input: userPrompt,
    max_output_tokens: maxOutputTokens,
  })

  return ensureTextResponse(response.output_text)
}

async function generateAnthropicText({
  systemPrompt,
  userPrompt,
  maxOutputTokens,
}: AiTextRequest) {
  const message = await getAnthropicClient().messages.create({
    model: getAnthropicModel(),
    max_tokens: maxOutputTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected AI response format.')
  }

  return ensureTextResponse(content.text)
}

async function streamOpenAiText({
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  onDelta,
}: StreamAiTextRequest) {
  const stream = await getOpenAiClient().responses.create({
    model: getOpenAiModel(),
    instructions: systemPrompt,
    input: userPrompt,
    max_output_tokens: maxOutputTokens,
    stream: true,
  })

  let fullText = ''

  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') {
      fullText += event.delta
      if (event.delta) {
        await onDelta?.(event.delta)
      }
    }
  }

  return ensureTextResponse(fullText)
}

async function streamAnthropicText({
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  onDelta,
}: StreamAiTextRequest) {
  const response = await getAnthropicClient().messages.create({
    model: getAnthropicModel(),
    max_tokens: maxOutputTokens,
    system: systemPrompt,
    stream: true,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  let fullText = ''

  for await (const chunk of response) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      fullText += chunk.delta.text
      if (chunk.delta.text) {
        await onDelta?.(chunk.delta.text)
      }
    }
  }

  return ensureTextResponse(fullText)
}

export function getConfiguredAiProvider(): AiProvider | null {
  const hasOpenAi = isConfigured(process.env.OPENAI_API_KEY)
  const hasAnthropic = isConfigured(process.env.ANTHROPIC_API_KEY)
  const preferred = getProviderPreference()

  if (preferred === 'openai') {
    if (hasOpenAi) {
      return 'openai'
    }
    if (hasAnthropic) {
      return 'anthropic'
    }
    return null
  }

  if (preferred === 'anthropic') {
    if (hasAnthropic) {
      return 'anthropic'
    }
    if (hasOpenAi) {
      return 'openai'
    }
    return null
  }

  if (hasOpenAi) {
    return 'openai'
  }

  if (hasAnthropic) {
    return 'anthropic'
  }

  return null
}

export function getAiNotConfiguredMessage() {
  return (
    'AI features require OPENAI_API_KEY or ANTHROPIC_API_KEY. ' +
    'OpenAI is preferred when both are configured.'
  )
}

export function mapAiProviderError(error: unknown) {
  const message =
    error instanceof Error ? error.message : 'AI request failed. Please try again.'
  const normalized = message.toLowerCase()

  if (
    normalized.includes('invalid_api_key') ||
    normalized.includes('incorrect api key') ||
    normalized.includes('authentication') ||
    normalized.includes('unauthorized')
  ) {
    return 'Invalid AI API key. Check your OpenAI or Anthropic configuration.'
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('overloaded') ||
    normalized.includes('too many requests') ||
    normalized.includes('429')
  ) {
    return 'AI is busy right now. Please try again in a moment.'
  }

  return message
}

export async function generateAiText(request: AiTextRequest) {
  const provider = getConfiguredAiProvider()

  if (!provider) {
    throw new Error(getAiNotConfiguredMessage())
  }

  const text =
    provider === 'openai'
      ? await generateOpenAiText(request)
      : await generateAnthropicText(request)

  return { provider, text }
}

export async function streamAiText(request: StreamAiTextRequest) {
  const provider = getConfiguredAiProvider()

  if (!provider) {
    throw new Error(getAiNotConfiguredMessage())
  }

  const text =
    provider === 'openai'
      ? await streamOpenAiText(request)
      : await streamAnthropicText(request)

  return { provider, text }
}
