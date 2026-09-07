import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import {
  buildFeedbackApiUrl,
  buildRuntimeWidgetConfig,
  buildWidgetScriptUrl,
  generateInstallSnippets,
  getWidgetExpectation,
  getWidgetModeLabel,
} from '@feedbacks/shared'
import { env } from '@/lib/env'
import type { Project } from '@/lib/types'

export const AGENT_SETUP_TOKEN_TTL_MS = 30 * 60 * 1000

export interface AgentSetupTokenPayload {
  scope: 'project_setup_packet'
  tokenId: string
  projectId: string
  userId: string
  projectKey: string
  expiresAt: string
}

export interface AgentSetupPacket {
  project: {
    id: string
    name: string
    publicKey: string
    domain: string | null
    allowedOrigins: string[]
  }
  widget: {
    version: 'latest'
    endpoint: string
    scriptUrl: string
    mode: string
    expectedResult: string
    recommendedSnippet: string
    frameworkSnippets: {
      react: string
      vue: string
    }
  }
  verification: {
    url: string
    instructions: string[]
  }
  docs: {
    install: string
    mcp: string
  }
  agentInstructions: string[]
  safety: string[]
}

function setupSecret() {
  return env.AGENT_SETUP_TOKEN_SECRET || env.SUPABASE_SERVICE_ROLE_KEY
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', setupSecret()).update(encodedPayload).digest('base64url')
}

export function createAgentSetupToken(payload: Omit<AgentSetupTokenPayload, 'scope' | 'tokenId' | 'expiresAt'>) {
  const fullPayload: AgentSetupTokenPayload = {
    ...payload,
    scope: 'project_setup_packet',
    tokenId: randomUUID(),
    expiresAt: new Date(Date.now() + AGENT_SETUP_TOKEN_TTL_MS).toISOString(),
  }
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload))
  return {
    token: `${encodedPayload}.${signPayload(encodedPayload)}`,
    payload: fullPayload,
  }
}

export function verifyAgentSetupToken(token: string): AgentSetupTokenPayload {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    throw new Error('Invalid setup token')
  }

  const expectedSignature = signPayload(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid setup token signature')
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AgentSetupTokenPayload
  if (payload.scope !== 'project_setup_packet') {
    throw new Error('Invalid setup token scope')
  }
  if (!payload.tokenId || !payload.projectId || !payload.userId || !payload.projectKey || !payload.expiresAt) {
    throw new Error('Invalid setup token payload')
  }
  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new Error('Setup token has expired')
  }

  return payload
}

export function buildAgentSetupPacket(project: Project, projectKey: string, appOrigin = env.NEXT_PUBLIC_APP_ORIGIN): AgentSetupPacket {
  const savedConfig = project.settings?.widget_config || {}
  const snippets = generateInstallSnippets({
    projectKey,
    savedConfig,
    appOrigin,
  })
  const runtimeConfig = buildRuntimeWidgetConfig(projectKey, savedConfig, { appOrigin })
  const websiteSnippet = snippets.find((snippet) => snippet.label === 'Website')?.code || ''
  const reactSnippet = snippets.find((snippet) => snippet.label === 'React')?.code || ''
  const vueSnippet = snippets.find((snippet) => snippet.label === 'Vue')?.code || ''

  return {
    project: {
      id: project.id,
      name: project.name,
      publicKey: projectKey,
      domain: project.domain || null,
      allowedOrigins: project.domain ? [`https://${project.domain.replace(/^https?:\/\//, '')}`] : [],
    },
    widget: {
      version: 'latest',
      endpoint: buildFeedbackApiUrl(appOrigin),
      scriptUrl: buildWidgetScriptUrl(appOrigin),
      mode: getWidgetModeLabel(runtimeConfig),
      expectedResult: getWidgetExpectation(runtimeConfig),
      recommendedSnippet: websiteSnippet,
      frameworkSnippets: {
        react: reactSnippet,
        vue: vueSnippet,
      },
    },
    verification: {
      url: `${appOrigin}/projects/${project.id}/verify`,
      instructions: [
        'Install the recommended Website snippet in the app shell or global HTML.',
        'Run the app locally and confirm the feedback UI appears.',
        'Submit one test report from a real page and confirm the request succeeds.',
        'Ask the user to confirm the report appears in the project inbox unless authenticated MCP access is available.',
      ],
    },
    docs: {
      install: `${appOrigin}/`,
      mcp: `${appOrigin}/projects/${project.id}?tab=api`,
    },
    agentInstructions: [
      'Use the Website snippet unless the app has a clear React or Vue wrapper integration point.',
      'Keep the first install minimal before changing advanced widget settings.',
      'Do not expose private server secrets in browser code.',
      'After installing, run the app, send one test feedback item, and report whether the request succeeds.',
    ],
    safety: [
      'This packet contains a browser-safe project key, not a server secret.',
      'This packet link expires quickly and should not be committed to the user repository.',
      'If verification succeeds here but not in the target app, inspect snippet placement first.',
    ],
  }
}
