
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import hash from 'object-hash';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CodeSnippet } from '@/components/code-snippet';
import { CopyButton } from '@/components/copy-button';
import { cn, formatDate } from '@/lib/utils';
import {
  Loader2,
  Monitor,
  Smartphone,
  Sparkles,
  History,
  ShieldCheck,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Code,
  MousePointer,
  CheckCircle,
  Rocket,
  Info,
  MessageCircle,
  Heart,
  Star,
  ThumbsUp,
  Plus,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWidgetStepContext } from './widget-step-context';

const DEFAULT_WIDGET_VERSION = 'latest';
const ALLOWED_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
const ALLOWED_HEADER_ICONS = ['none', 'chat', 'star', 'lightbulb', 'thumbs-up'] as const;
const ALLOWED_HEADER_LAYOUTS = ['text-only', 'icon-left', 'icon-top'] as const;
const ALLOWED_LAUNCHER_VARIANTS = ['label', 'icon'] as const;
const LAUNCHER_ICON_OPTIONS: Array<{
  value: string;
  label: string;
  icon: LucideIcon;
  preview: string;
}> = [
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles, preview: '✨' },
  { value: 'message-circle', label: 'Chat bubble', icon: MessageCircle, preview: '💬' },
  { value: 'star', label: 'Star', icon: Star, preview: '★' },
  { value: 'heart', label: 'Heart', icon: Heart, preview: '❤' },
  { value: 'thumbs-up', label: 'Thumbs up', icon: ThumbsUp, preview: '👍' },
];
const CAPTCHAS = ['none', 'turnstile', 'hcaptcha'] as const;
const SNIPPET_PLATFORMS = ['website', 'react', 'vue', 'react-native', 'flutter', 'wordpress', 'shopify'] as const;
const SNIPPET_LANGUAGES: Record<(typeof SNIPPET_PLATFORMS)[number], string> = {
  website: 'html',
  react: 'tsx',
  vue: 'html',
  'react-native': 'tsx',
  flutter: 'dart',
  wordpress: 'php',
  shopify: 'liquid',
};

const CAPTCHA_GUIDES: Record<'turnstile' | 'hcaptcha', { title: string; steps: string[]; href: string; cta: string }> = {
  turnstile: {
    title: 'How to get your Turnstile site key',
    steps: [
      'Log in to Cloudflare and open the Turnstile dashboard.',
      'Create a new site, choose “Invisible” or “Managed” based on your UX, and save.',
      'Copy the generated site key and paste it here. Keep the secret key safe in your backend.',
    ],
    href: 'https://developers.cloudflare.com/turnstile/get-started/',
    cta: 'Cloudflare Turnstile docs',
  },
  hcaptcha: {
    title: 'How to get your hCaptcha site key',
    steps: [
      'Sign in to the hCaptcha dashboard and create a new site.',
      'Pick the integration type (usually “Checkbox” for web widgets) and configure allowed domains.',
      'Copy the site key from the dashboard and paste it here. Store the secret key in your server.',
    ],
    href: 'https://docs.hcaptcha.com/configuration',
    cta: 'hCaptcha configuration guide',
  },
};

const FRAMEWORK_OPTIONS: Array<{ value: (typeof SNIPPET_PLATFORMS)[number]; label: string }> = [
  { value: 'website', label: 'Website' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'react-native', label: 'React Native' },
  { value: 'flutter', label: 'Flutter' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'shopify', label: 'Shopify' },
];

export type EmbedMode = 'modal' | 'inline' | 'trigger';

export interface WidgetConfig {
  embedMode: EmbedMode;
  position?: typeof ALLOWED_POSITIONS[number];
  target?: string;
  buttonText?: string;
  primaryColor?: string;
  backgroundColor?: string;
  requireEmail?: boolean;
  enableType?: boolean;
  enableRating?: boolean;
  enableScreenshot?: boolean;
  screenshotRequired?: boolean;
  enablePriority?: boolean;
  enableTags?: boolean;
  enableAttachment?: boolean;
  attachmentMaxMB?: number;
  successTitle?: string;
  successDescription?: string;
  requireCaptcha?: boolean;
  captchaProvider?: 'turnstile' | 'hcaptcha' | 'none';
  turnstileSiteKey?: string;
  hcaptchaSiteKey?: string;
  scale?: number;
  headerIcon?: typeof ALLOWED_HEADER_ICONS[number];
  headerLayout?: typeof ALLOWED_HEADER_LAYOUTS[number];
  launcherVariant?: typeof ALLOWED_LAUNCHER_VARIANTS[number];
  launcherIcon?: string;
  spacing?: number;
  modalWidth?: number;
  inlineBorder?: string;
  inlineShadow?: string;
  rateLimitCount?: number;
  rateLimitWindowSec?: number;
}

interface WidgetConfigRow {
  id: string;
  channel: string;
  version: number;
  label: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  config: Record<string, any>;
}

interface WidgetPreset {
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  preview_image_url?: string | null;
  config: Record<string, any>;
}

let widgetPresetCache: WidgetPreset[] | null = null;
let widgetPresetPromise: Promise<WidgetPreset[]> | null = null;

async function fetchWidgetPresets(): Promise<WidgetPreset[]> {
  // Check module cache first
  if (widgetPresetCache) {
    return widgetPresetCache;
  }

  // Check sessionStorage cache
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem('feedbacks-widget-presets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 300000) { // 5min TTL
          widgetPresetCache = parsed.data;
          return parsed.data;
        }
      }
    } catch {}
  }

  if (widgetPresetPromise) {
    return widgetPresetPromise;
  }
  widgetPresetPromise = (async () => {
    try {
      const res = await fetch('/api/widget-presets', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load presets');
      }
      const body = await res.json();
      const items = Array.isArray(body?.items) ? body.items : [];
      widgetPresetCache = items;

      // Cache in sessionStorage
      if (typeof window !== 'undefined' && widgetPresetCache) {
        try {
          sessionStorage.setItem('feedbacks-widget-presets', JSON.stringify({
            data: widgetPresetCache,
            timestamp: Date.now()
          }));
        } catch {}
      }

      return items;
    } catch (error) {
      widgetPresetCache = null;
      throw error;
    } finally {
      widgetPresetPromise = null;
    }
  })();
  return widgetPresetPromise;
}

export function invalidateWidgetPresetCache() {
  widgetPresetCache = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('feedbacks-widget-presets');
    } catch {}
  }
}

export interface WidgetInstallationExperienceProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  widgetVersion?: string;
  initialStep?: WidgetStep;
  projectSummary?: React.ReactNode;
}

export type WidgetStep = 'setup' | 'appearance' | 'fields' | 'protection' | 'publish';

const DEFAULT_WIDGET_STEP: WidgetStep = 'setup';
const WIDGET_STEPS: WidgetStep[] = ['setup', 'appearance', 'fields', 'protection', 'publish'];

const DEFAULT_CONFIG: WidgetConfig = {
  embedMode: 'inline',
  position: 'bottom-right',
  buttonText: 'Feedback',
  primaryColor: '#6366F1',
  backgroundColor: '',
  requireEmail: false,
  enableType: true,
  enableRating: true,
  enableScreenshot: false,
  screenshotRequired: false,
  enablePriority: false,
  enableTags: false,
  enableAttachment: false,
  attachmentMaxMB: 5,
  successTitle: 'Thank you!',
  successDescription: 'We appreciate you taking the time to share your thoughts.',
  requireCaptcha: false,
  captchaProvider: 'none',
  scale: 1,
  headerIcon: 'none',
  headerLayout: 'text-only',
  launcherVariant: 'label',
  launcherIcon: 'sparkles',
  spacing: 24,
  modalWidth: 480,
  inlineBorder: '1px solid rgba(15,23,42,0.08)',
  inlineShadow: '0 16px 40px rgba(15,23,42,0.12)',
  rateLimitCount: 5,
  rateLimitWindowSec: 60,
};

const MODE_PRESETS: Array<{ mode: EmbedMode; title: string; description: string; helper?: string }> = [
  {
    mode: 'inline',
    title: 'Inline Section',
    description: 'Embed form in page',
    helper: 'Perfect for docs, help centers, and support hubs.',
  },
  {
    mode: 'modal',
    title: 'Floating Modal',
    description: 'Launcher button + modal',
    helper: 'Ideal for marketing sites and SaaS dashboards.',
  },
  {
    mode: 'trigger',
    title: 'Attach to Button',
    description: 'Use your own button',
    helper: 'Works with nav menus, floating action buttons, and custom UI.',
  },
];

const DEFAULT_MODAL_PRESETS: WidgetPreset[] = [
  {
    slug: 'floating-classic',
    name: 'Floating bubble',
    description: 'Rounded launcher with a text label for clarity.',
    category: 'modal',
    preview_image_url: null,
    config: {
      embedMode: 'modal',
      launcherVariant: 'label',
      launcherIcon: 'sparkles',
      buttonText: 'Feedback',
          scale: 1,
      position: 'bottom-right',
    },
  },
  {
    slug: 'floating-icon',
    name: 'Icon floating modal',
    description: 'Compact icon-only bubble that keeps screens tidy.',
    category: 'modal',
    preview_image_url: null,
    config: {
      embedMode: 'modal',
      launcherVariant: 'icon',
      launcherIcon: 'sparkles',
      buttonText: '',
          scale: 1,
      position: 'bottom-right',
    },
  },
];

const INLINE_STYLE_PRESETS: Array<{ label: string; border: string; shadow: string }> = [
  {
    label: 'None',
    border: 'none',
    shadow: 'none',
  },
  {
    label: 'Subtle card',
    border: '1px solid rgba(15,23,42,0.08)',
    shadow: '0 16px 40px rgba(15,23,42,0.12)',
  },
  {
    label: 'Elevated',
    border: '1px solid rgba(15,23,42,0.12)',
    shadow: '0 32px 70px rgba(15,23,42,0.18)',
  },
];

const PREVIEW_MIN_HEIGHT_DESKTOP = 700;
const PREVIEW_MIN_HEIGHT_MOBILE = 240;
function mergeConfig(base: WidgetConfig, incoming: Record<string, any> | null | undefined): WidgetConfig {
  if (!incoming || typeof incoming !== 'object') return base;
  const merged: WidgetConfig = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in base)) {
      (merged as any)[key] = value;
      continue;
    }
    if (value === undefined) continue;
    (merged as any)[key] = value as any;
  }
  return merged;
}

function normalizeTarget(value: string | undefined, fallback: string) {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') return fallback;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function buildRuntimeConfig(config: WidgetConfig, projectKey: string) {
  const result: Record<string, any> = {
    projectKey,
    embedMode: config.embedMode,
  };
  if (config.embedMode === 'modal') result.position = config.position || 'bottom-right';
  if (config.embedMode === 'inline' && config.target) result.target = config.target;
  if (config.embedMode === 'trigger' && config.target) result.target = config.target;
  if (config.buttonText && config.embedMode === 'modal') result.buttonText = config.buttonText;
  if (config.primaryColor) result.primaryColor = config.primaryColor;
  if (config.backgroundColor) result.backgroundColor = config.backgroundColor;
  if (config.requireEmail) result.requireEmail = true;
  if (config.enableType === false) result.enableType = false;
  if (config.enableRating === false) result.enableRating = false;
  if (config.enableScreenshot) result.enableScreenshot = true;
  if (config.screenshotRequired) result.screenshotRequired = true;
  if (config.enablePriority) result.enablePriority = true;
  if (config.enableTags) result.enableTags = true;
  if (config.enableAttachment) {
    result.enableAttachment = true;
    if (config.attachmentMaxMB) result.attachmentMaxMB = config.attachmentMaxMB;
  }
  if (config.successTitle) result.successTitle = config.successTitle;
  if (config.successDescription) result.successDescription = config.successDescription;
  if (config.requireCaptcha) result.requireCaptcha = true;
  if (config.captchaProvider && config.captchaProvider !== 'none') {
    result.captchaProvider = config.captchaProvider;
    if (config.captchaProvider === 'turnstile' && config.turnstileSiteKey) {
      result.turnstileSiteKey = config.turnstileSiteKey;
    }
    if (config.captchaProvider === 'hcaptcha' && config.hcaptchaSiteKey) {
      result.hcaptchaSiteKey = config.hcaptchaSiteKey;
    }
  }
  if (config.scale && config.scale !== 1) result.scale = Number(config.scale.toFixed(2));
  if (config.headerIcon && config.headerIcon !== 'none') result.headerIcon = config.headerIcon;
  if (config.headerLayout && config.headerLayout !== 'text-only') result.headerLayout = config.headerLayout;
  if (config.embedMode === 'modal' && config.launcherVariant && config.launcherVariant !== 'label') {
    result.launcherVariant = config.launcherVariant;
  }
  if (config.embedMode === 'modal' && config.launcherIcon) {
    result.launcherIcon = config.launcherIcon;
  }
  if (typeof config.spacing === 'number') result.spacing = config.spacing;
  if (typeof config.modalWidth === 'number') result.modalWidth = config.modalWidth;
  if (config.inlineBorder) result.inlineBorder = config.inlineBorder;
  if (config.inlineShadow) result.inlineShadow = config.inlineShadow;
  if (typeof config.rateLimitCount === 'number') result.rateLimitCount = config.rateLimitCount;
  if (typeof config.rateLimitWindowSec === 'number') result.rateLimitWindowSec = config.rateLimitWindowSec;
  return result;
}

function formatConfig(config: Record<string, any>) {
  return JSON.stringify(config, null, 2);
}

function buildSnippets(config: WidgetConfig, projectKey: string, widgetVersion: string) {
  const runtime = buildRuntimeConfig(config, projectKey);
  const jsHref = `https://app.feedbacks.dev/cdn/widget/${widgetVersion}.js`;
  const cssHref = `https://app.feedbacks.dev/cdn/widget/${widgetVersion}.css`;
  const configString = formatConfig(runtime);

  const anchors: string[] = [];
  if (config.embedMode === 'inline') anchors.push(`<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#', '')}"></div>`);
  if (config.embedMode === 'trigger') anchors.push(`<button id="${normalizeTarget(config.target, '#feedback-button').replace('#', '')}">Give Feedback</button>`);

  const website = [
    `<!-- Include widget assets -->`,
    `<link rel="stylesheet" href="${cssHref}">`,
    `<script src="${jsHref}"></script>`,
    '',
    ...anchors,
    '<script>',
    `  new FeedbacksWidget(${configString.replace(/\n/g, '\n  ')});`,
    '</script>',
  ].join('\n');

  const react = `import Script from "next/script";\nimport { useEffect } from "react";\n\nexport default function FeedbackWidget() {\n  useEffect(() => {\n    if (typeof window !== 'undefined' && (window as any).FeedbacksWidget) {\n      new (window as any).FeedbacksWidget(${configString});\n    }\n  }, []);\n\n  return (\n    <>\n      <link rel="stylesheet" href="${cssHref}" />\n      <Script src="${jsHref}" strategy="afterInteractive" />\n      ${config.embedMode === 'inline' ? `<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#', '')}" />` : config.embedMode === 'trigger' ? `<button id="${normalizeTarget(config.target, '#feedback-button').replace('#', '')}">Give Feedback</button>` : ''}\n    </>\n  );\n}`;

  const vue = `<!-- main.vue -->\n<template>\n  <link rel="stylesheet" href="${cssHref}" />\n  ${config.embedMode === 'inline' ? `<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#', '')}"></div>` : config.embedMode === 'trigger' ? `<button id="${normalizeTarget(config.target, '#feedback-button').replace('#', '')}">Give Feedback</button>` : ''}\n</template>\n\n<script setup>\nimport { onMounted } from 'vue'\n\nonMounted(() => {\n  new window.FeedbacksWidget(${configString})\n})\n</script>\n\n<!-- Include once in index.html -->\n<script src="${jsHref}"></script>`;

  const reactNative = `// React Native example using WebView\nimport { WebView } from 'react-native-webview';\n\nexport default function FeedbackWidget() {\n  const html = \
\`<link rel=\"stylesheet\" href=\"${cssHref}\" />\n<script src=\"${jsHref}\"></script>\n<div id=\"root\"></div>\n<script>new FeedbacksWidget(${configString});</script>\`;
  return <WebView originWhitelist={["*"]} source={{ html }} />;\n}`;

  const flutter = `// Flutter (webview_flutter) pseudo-code\n// Load an HTML string similar to the React Native example above.\n// Instantiate new FeedbacksWidget(${configString.replace(/\n/g, ' ')}) inside the WebView.`;

  const wordpress = `<!-- functions.php -->\nfunction feedbacks_assets() {\n  wp_enqueue_style('feedbacks-css', '${cssHref}');\n  wp_enqueue_script('feedbacks-js', '${jsHref}', array(), null, true);\n  wp_add_inline_script('feedbacks-js', 'new FeedbacksWidget(${configString});');\n}\nadd_action('wp_enqueue_scripts', 'feedbacks_assets');`;

  const shopify = `{% comment %} theme.liquid {% endcomment %}\n<link rel="stylesheet" href="${cssHref}">\n<script src="${jsHref}"></script>\n<script>document.addEventListener('DOMContentLoaded', function(){ new FeedbacksWidget(${configString}); });</script>`;

  return new Map<string, string>([
    ['website', website],
    ['react', react],
    ['vue', vue],
    ['react-native', reactNative],
    ['flutter', flutter],
    ['wordpress', wordpress],
    ['shopify', shopify],
  ]);
}
function buildPreviewHtml(config: WidgetConfig, projectKey: string, widgetVersion: string) {
  // Respect selected experience; we enhance modal with a view toggle via messages
  const runtime = buildRuntimeConfig(config, projectKey);
  if (runtime.embedMode === 'inline') runtime.target = '#inline-anchor';
  if (runtime.embedMode === 'trigger') runtime.target = '#trigger-anchor';
  const jsHref = `/cdn/widget/${widgetVersion}.js`;
  const cssHref = `/cdn/widget/${widgetVersion}.css`;
  const runtimeJson = JSON.stringify(runtime).replace(/</g, '\\u003c');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="${cssHref}" />
    <style>
      :root { font-family: 'Inter', system-ui, sans-serif; }
      body { margin: 0; background: transparent; color: #0f172a; overflow: hidden; }
      #preview-root { position: relative; width: min(760px, 100%); margin: 0 auto; padding: 0; }
      /* Show anchors for inline/trigger modes */
      #inline-anchor {
        display: ${runtime.embedMode === 'inline' ? 'block' : 'none'};
        width: 100%;
      }
      #trigger-anchor {
        display: ${runtime.embedMode === 'trigger' ? 'inline-flex' : 'none'};
        margin-top: 8px;
        padding: 10px 18px;
        border-radius: 9999px;
        border: 1px solid rgba(15,23,42,0.1);
        background: rgba(255,255,255,0.9);
        color: #0f172a;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      }
      .feedbacks-button {
        font-size: 13px !important;
        font-weight: 600 !important;
        padding: 0 24px !important;
        min-height: 48px !important;
        border-radius: 9999px !important;
        white-space: nowrap !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      /* Preview-only: avoid inner scroll in modal, let parent iframe grow */
      .feedbacks-modal { max-height: none !important; }
      .feedbacks-overlay {
        align-items: flex-start !important;
        justify-content: center !important;
        padding-top: 32px !important;
      }
      @media (min-width: 768px) {
        .feedbacks-overlay { padding-top: 48px !important; }
      }
    </style>
  </head>
  <body>
    <div id="preview-root">
      <div id="inline-anchor"></div>
      <button id="trigger-anchor">Open feedback</button>
    </div>
    <script src="${jsHref}"></script>
    <script>
      (function(){
        const initial = ${runtimeJson};
        let view = 'launcher'; // 'launcher' | 'form'
        let lastConfig = initial;
        let fallbackLoaded = false;

        function ensureWidgetLoaded(cb, attempt) {
          const tries = typeof attempt === 'number' ? attempt : 0;
          try {
            if (typeof window !== 'undefined' && window.FeedbacksWidget) {
              cb();
              return;
            }
          } catch (error) {}

          if (!fallbackLoaded) {
            fallbackLoaded = true;
            try {
              var css = document.createElement('link');
              css.rel = 'stylesheet';
              css.href = 'https://app.feedbacks.dev/cdn/widget/${widgetVersion}.css';
              document.head.appendChild(css);
            } catch (error) {}
            try {
              var script = document.createElement('script');
              script.src = 'https://app.feedbacks.dev/cdn/widget/${widgetVersion}.js';
              script.onload = function () {
                try {
                  if (typeof window !== 'undefined' && window.FeedbacksWidget) {
                    cb();
                  }
                } catch (error) {}
              };
              document.head.appendChild(script);
            } catch (error) {}
          }

          if (tries > 40) {
            cb();
            return;
          }

          setTimeout(function () {
            ensureWidgetLoaded(cb, tries + 1);
          }, 120);
        }
        function waitForWidgetContent(cfg, callback, attempts = 0) {
          const maxAttempts = 50; // 50 * 20ms = 1000ms max wait
          const checkInterval = 20;

          // Check if widget content is rendered based on embed mode
          var hasContent = false;
          if (cfg.embedMode === 'inline') {
            hasContent = document.querySelector('#inline-anchor .feedbacks-inline-container, #inline-anchor .feedbacks-form') !== null;
          } else if (cfg.embedMode === 'trigger') {
            hasContent = document.querySelector('#trigger-anchor') !== null && document.querySelector('#trigger-anchor').textContent.trim().length > 0;
          } else if (cfg.embedMode === 'modal') {
            hasContent = document.querySelector('.feedbacks-button') !== null;
          }

          if (hasContent || attempts >= maxAttempts) {
            callback();
          } else {
            setTimeout(function() {
              waitForWidgetContent(cfg, callback, attempts + 1);
            }, checkInterval);
          }
        }

        function mount(cfg){
          try { document.querySelectorAll('.feedbacks-overlay').forEach(el => el.remove()); } catch(e){}
          try { document.querySelectorAll('.feedbacks-inline-container').forEach(el => el.remove()); } catch(e){}
          try { const existing = document.querySelector('.feedbacks-button'); if (existing) existing.remove(); } catch(e){}
          lastConfig = cfg;
          if (cfg.embedMode === 'inline') cfg.target = '#inline-anchor';
          if (cfg.embedMode === 'trigger') cfg.target = '#trigger-anchor';
          const inlineAnchor = document.getElementById('inline-anchor');
          if (inlineAnchor) inlineAnchor.style.display = cfg.embedMode === 'inline' ? 'block' : 'none';
          const triggerAnchor = document.getElementById('trigger-anchor');
          if (triggerAnchor) triggerAnchor.style.display = cfg.embedMode === 'trigger' ? 'inline-flex' : 'none';
          try {
            document.body.dataset.feedbacksLauncher = cfg.embedMode === 'modal' ? (cfg.launcherVariant || 'label') : 'label';
            if (cfg.launcherIcon) document.body.dataset.launcherIcon = cfg.launcherIcon;
            else delete document.body.dataset.launcherIcon;
          } catch (error) {}
          if (triggerAnchor && triggerAnchor.dataset.previewBound !== 'true') {
            triggerAnchor.dataset.previewBound = 'true';
            triggerAnchor.addEventListener('click', function(){ setTimeout(postHeight, 200); setTimeout(postHeight, 480); });
          }
          try {
            if (typeof window !== 'undefined' && window.FeedbacksWidget) {
              new window.FeedbacksWidget(cfg);
            }
          } catch (error) {
            console.error('Feedbacks widget preview failed to mount', error);
          }
          if (cfg.embedMode === 'modal') {
            if (view === 'form') {
              setTimeout(function(){ try { document.querySelector('.feedbacks-button')?.dispatchEvent(new Event('click', { bubbles: true })); } catch(e){} }, 100);
            } else {
              closeModal();
            }
          }

          // Wait for widget content to be rendered before calculating height
          waitForWidgetContent(cfg, function() {
            postHeight();
          });
        }
        function closeModal(){
          try {
            var closeBtn = document.querySelector('.feedbacks-overlay [data-feedbacks-close], .feedbacks-overlay .feedbacks-close');
            if (closeBtn && typeof closeBtn.dispatchEvent === 'function') {
              if (typeof closeBtn.click === 'function') {
                closeBtn.click();
                return;
              }
              closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              return;
            }
            var overlay = document.querySelector('.feedbacks-overlay');
            if (overlay && typeof overlay.dispatchEvent === 'function') {
              overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            }
          } catch(error) {}
        }
        function postHeight(){
          try {
            var root = document.getElementById('preview-root');
            var rect = root && typeof root.getBoundingClientRect === 'function' ? root.getBoundingClientRect() : null;
            var height = rect ? Math.ceil(rect.height) : Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight);

            if (view === 'form' && lastConfig && lastConfig.embedMode === 'modal') {
              var modal = document.querySelector('.feedbacks-modal');
              if (modal && typeof modal.getBoundingClientRect === 'function') {
                var modalRect = modal.getBoundingClientRect();
                if (modalRect) {
                  var modalHeight = modalRect.height || (modalRect.bottom - modalRect.top);
                  var modalTop = Math.max(0, modalRect.top);
                  var modalTotal = Math.ceil((modalHeight || 0) + modalTop + 48);
                  if (modalTotal > height) height = modalTotal;
                }
              }
              if (height < 480) {
                var modalOverlay = document.querySelector('.feedbacks-overlay');
                if (modalOverlay && typeof modalOverlay.getBoundingClientRect === 'function') {
                  var modalOverlayStyle = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(modalOverlay) : null;
                  var modalOverlayVisible = !modalOverlayStyle || (modalOverlayStyle.visibility !== 'hidden' && modalOverlayStyle.display !== 'none' && Number(modalOverlayStyle.opacity || 1) > 0.01);
                  var modalOverlayRect = modalOverlay.getBoundingClientRect();
                  if (modalOverlayVisible && modalOverlayRect) {
                    var modalOverlayHeight = modalOverlayRect.height || (modalOverlayRect.bottom - modalOverlayRect.top);
                    if (modalOverlayHeight > 0) {
                      var modalOverlayTop = Math.max(0, modalOverlayRect.top);
                      var modalOverlayTotal = Math.ceil((modalOverlayHeight || 0) + modalOverlayTop + 48);
                      if (modalOverlayTotal > height) height = modalOverlayTotal;
                    }
                  }
                }
              }
            }

            // Only apply overlay calculations when actually viewing form in modal mode
            if (view === 'form' && lastConfig && lastConfig.embedMode === 'modal') {
              var overlay = document.querySelector('.feedbacks-overlay');
              if (overlay && typeof overlay.getBoundingClientRect === 'function') {
                var overlayStyle = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(overlay) : null;
                var overlayVisible = !overlayStyle || (overlayStyle.visibility !== 'hidden' && overlayStyle.display !== 'none' && Number(overlayStyle.opacity || 1) > 0.01);
                var overlayRect = overlay.getBoundingClientRect();
                if (overlayVisible && overlayRect) {
                  var overlayHeight = overlayRect.height || (overlayRect.bottom - overlayRect.top);
                  if (overlayHeight > 0) {
                    var overlayTop = Math.max(0, overlayRect.top);
                    var overlayTotal = Math.ceil((overlayHeight || 0) + overlayTop + 48);
                    if (overlayTotal > height) height = overlayTotal;
                  }
                }
              }
            }

            if (height < 320) height = 320;
            parent.postMessage({ type: 'widget-preview:height', height: height }, '*');
          } catch (e) {
            parent.postMessage({ type: 'widget-preview:height', height: Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight) }, '*');
          }
        }
        window.addEventListener('message', function(ev){
          if (!ev || !ev.data) return;
          if (ev.data.type === 'widget-preview:update') {
            setTimeout(function(){ ensureWidgetLoaded(function(){ mount(ev.data.config || initial); setTimeout(postHeight, 120); setTimeout(postHeight, 300); setTimeout(postHeight, 650); }); }, 50);
          }
          if (ev.data.type === 'widget-preview:view') {
            view = ev.data.view === 'form' ? 'form' : 'launcher';
            // Send state change notification to prevent delayed timers firing inappropriately
            parent.postMessage({ type: 'widget-preview:state', view: view }, '*');
            try {
              const current = lastConfig && lastConfig.embedMode ? lastConfig.embedMode : initial.embedMode;
              if (current === 'modal') {
                if (view === 'form') {
                  setTimeout(function(){ try { document.querySelector('.feedbacks-button')?.dispatchEvent(new Event('click', { bubbles: true })); } catch(e){} }, 60);
                  setTimeout(postHeight, 200);
                } else {
                  closeModal();
                  setTimeout(postHeight, 120);
                }
              } else {
                closeModal();
              }
            } catch(e){}
            setTimeout(postHeight, 160);
          }
        });
        window.addEventListener('load', function(){ ensureWidgetLoaded(function(){ mount(initial); setTimeout(postHeight, 150); setTimeout(postHeight, 400); setTimeout(postHeight, 800); }); });
        new MutationObserver(function(){ setTimeout(postHeight, 60); }).observe(document.body, { childList: true, subtree: true });
      })();
    </script>
  </body>
</html>`;
}

type PreviewViewport = 'desktop' | 'mobile';
type WidgetPreviewProps = {
  config: WidgetConfig;
  projectKey: string;
  widgetVersion: string;
  viewport: PreviewViewport;
  onViewportChange: (viewport: PreviewViewport) => void;
};

function WidgetPreview({ config, projectKey, widgetVersion, viewport, onViewportChange }: WidgetPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(viewport === 'mobile' ? PREVIEW_MIN_HEIGHT_MOBILE : PREVIEW_MIN_HEIGHT_DESKTOP);
  const [previewView, setPreviewView] = useState<'launcher' | 'form'>('launcher');
  const previousEmbedModeRef = useRef<EmbedMode>(config.embedMode);
  useEffect(() => {
    if (config.embedMode !== 'modal' && previewView !== 'launcher') {
      setPreviewView('launcher');
    }
  }, [config.embedMode, previewView]);
  useEffect(() => {
    const previous = previousEmbedModeRef.current;
    if (previous === 'modal' && config.embedMode !== 'modal') {
      const min = viewport === 'mobile' ? PREVIEW_MIN_HEIGHT_MOBILE : PREVIEW_MIN_HEIGHT_DESKTOP;
      setHeight(min);
      setPreviewView('launcher');
    }
    previousEmbedModeRef.current = config.embedMode;
  }, [config.embedMode, viewport]);
  const previewHtml = useMemo(() => buildPreviewHtml(config, projectKey, widgetVersion), [config, projectKey, widgetVersion]);

  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      if (!ev.data || ev.data.type !== 'widget-preview:height') return;
      if (typeof ev.data.height === 'number') {
        const min = viewport === 'mobile' ? PREVIEW_MIN_HEIGHT_MOBILE : PREVIEW_MIN_HEIGHT_DESKTOP;
        const max = viewport === 'mobile' ? 960 : 1280;
        setHeight(Math.min(max, Math.max(min, ev.data.height)));
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [viewport]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'widget-preview:update', config: buildRuntimeConfig(config, projectKey) }, '*');
      if (config.embedMode === 'modal') {
        win.postMessage({ type: 'widget-preview:view', view: previewView }, '*');
      } else {
        win.postMessage({ type: 'widget-preview:view', view: 'launcher' }, '*');
      }
    } catch {}
  }, [config, projectKey, previewView]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Live Preview</CardTitle>
          <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Mode: {config.embedMode === 'inline' ? 'Inline' : config.embedMode === 'modal' ? 'Modal' : 'Trigger'}
          </Badge>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-xs">
          <Monitor className={cn('h-3 w-3', viewport === 'desktop' ? 'text-foreground' : 'text-muted-foreground')} />
          <Switch
            checked={viewport === 'mobile'}
            onCheckedChange={(checked) => {
              const next = checked ? 'mobile' : 'desktop';
              onViewportChange(next as PreviewViewport);
            }}
            className="mx-1"
          />
          <Smartphone className={cn('h-3 w-3', viewport === 'mobile' ? 'text-foreground' : 'text-muted-foreground')} />
        </div>
      </div>
      {config.embedMode === 'modal' && (
        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex rounded-full border bg-muted p-1">
            <button
              type="button"
              className={cn('px-3 py-1 rounded-full', previewView === 'launcher' ? 'bg-background text-foreground' : 'text-muted-foreground')}
              onClick={() => setPreviewView('launcher')}
            >
              Launcher
            </button>
            <button
              type="button"
              className={cn('px-3 py-1 rounded-full', previewView === 'form' ? 'bg-background text-foreground' : 'text-muted-foreground')}
              onClick={() => setPreviewView('form')}
            >
              Form (opens on click)
            </button>
          </div>
        </div>
      )}
      <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Widget Preview"
          srcDoc={previewHtml}
          style={{ border: '0', width: '100%', height, maxHeight: viewport === 'mobile' ? 960 : 1280 }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Preview uses your live widget runtime. Visit the <Link href={`/widget-demo?apiKey=${encodeURIComponent(projectKey)}`} className="underline" target="_blank" rel="noreferrer">standalone demo</Link> for full-screen testing.
      </div>
    </div>
  );
}

function PresetCard({ preset, onApply, active }: { preset: WidgetPreset; onApply: (preset: WidgetPreset) => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onApply(preset)}
      className={cn(
        'group relative flex flex-col items-start gap-1.5 rounded-lg border bg-card p-3 text-left text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm sm:p-4',
        active
          ? 'border-primary/70 bg-primary/10 shadow-[0_14px_36px_rgba(99,102,241,0.2)]'
          : 'border-border hover:border-primary/40 hover:bg-primary/5'
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="text-[11px] font-semibold sm:text-sm">{preset.name}</div>
        {active && <Badge variant="default" className="text-[10px] uppercase tracking-[0.12em]">Selected</Badge>}
      </div>
      {preset.description && (
        <p className="text-[10px] text-muted-foreground leading-snug sm:text-xs">{preset.description}</p>
      )}
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">Tap to apply</span>
    </button>
  );
}
export function WidgetInstallationExperience({ projectId, projectKey, projectName, widgetVersion = DEFAULT_WIDGET_VERSION, initialStep, projectSummary }: WidgetInstallationExperienceProps) {
  const widgetStepContext = useWidgetStepContext();
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [defaultConfigRow, setDefaultConfigRow] = useState<WidgetConfigRow | null>(null);
  const [history, setHistory] = useState<WidgetConfigRow[]>([]);
  const [presets, setPresets] = useState<WidgetPreset[]>([]);
  const normalizedInitialStep = initialStep && WIDGET_STEPS.includes(initialStep) ? initialStep : DEFAULT_WIDGET_STEP;
  const [localStep, setLocalStep] = useState<WidgetStep>(normalizedInitialStep);
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SNIPPET_PLATFORMS[number]>('website');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  const [showAdvancedExperience, setShowAdvancedExperience] = useState<boolean>(false);
  const [openCaptchaGuide, setOpenCaptchaGuide] = useState<'turnstile' | 'hcaptcha' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const tabsRef = useRef<HTMLDivElement>(null);
  const previousButtonLabelRef = useRef<string>('Feedback');
const CARD_HEADER = 'p-3 sm:p-6';
const CARD_CONTENT = 'p-3 pt-0 sm:p-6 sm:pt-0';

  const steps = [
    { id: 'setup', label: 'Setup' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'fields', label: 'Fields' },
    { id: 'protection', label: 'Protection' },
    { id: 'publish', label: 'Publish' },
  ];
  const stepOrder = steps.map((step) => step.id);
  const activeTab = (widgetStepContext?.step ?? localStep) as WidgetStep;
  const setActiveTab = useCallback((step: WidgetStep, options?: { skipUrl?: boolean }) => {
    if (widgetStepContext) {
      widgetStepContext.setStep(step, options);
      return;
    }
    setLocalStep(step);
    if (!options?.skipUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('section', 'widget-installation');
      params.set('widgetStep', step);
      const url = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', url);
    }
  }, [widgetStepContext]);
  const currentStepIndex = Math.max(0, stepOrder.indexOf(activeTab));

  useEffect(() => {
    if (!initialStep) {
      return;
    }
    if (!WIDGET_STEPS.includes(initialStep)) {
      return;
    }
    setActiveTab(initialStep, { skipUrl: true });
  }, [initialStep, setActiveTab]);
  const normalizedConfig = useMemo(() => mergeConfig(DEFAULT_CONFIG, config as Record<string, any>), [config]);
  const currentHash = useMemo(() => hash(normalizedConfig), [normalizedConfig]);
  const savedHash = useMemo(() => {
    const saved = (defaultConfigRow?.config as Record<string, any>) || {};
    return hash(mergeConfig(DEFAULT_CONFIG, saved));
  }, [defaultConfigRow]);
  const hasPublishedConfig = !!defaultConfigRow;
  const isDirty = !hasPublishedConfig || currentHash !== savedHash;
  const captchaProvider = config.captchaProvider || 'none';
  const captchaRequiresKey = !!config.requireCaptcha && captchaProvider !== 'none';
  const captchaKeyMissing = captchaRequiresKey && (
    (captchaProvider === 'turnstile' && !(config.turnstileSiteKey && config.turnstileSiteKey.trim())) ||
    (captchaProvider === 'hcaptcha' && !(config.hcaptchaSiteKey && config.hcaptchaSiteKey.trim()))
  );
  const hasBlockingValidation = captchaKeyMissing;

  const loadPresets = useCallback(async () => {
    try {
      const items = await fetchWidgetPresets();
      if (Array.isArray(items)) setPresets(items);
    } catch {}
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/widget-config`);
      if (!res.ok) throw new Error('Failed to load config');
      const body = await res.json();
      const fallbackRow: WidgetConfigRow | null = body?.defaultConfig ? {
        id: body.defaultConfig.id,
        channel: body.defaultConfig.channel,
        version: body.defaultConfig.version,
        label: body.defaultConfig.label,
        isDefault: true,
        createdAt: body.defaultConfig.createdAt,
        updatedAt: body.defaultConfig.updatedAt,
        config: body.defaultConfig.config || {},
      } : null;
      setDefaultConfigRow(fallbackRow);
      setHistory(Array.isArray(body?.configs) ? body.configs.map((item: any) => ({
        id: item.id,
        channel: item.channel,
        version: item.version,
        label: item.label,
        isDefault: !!item.isDefault,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        config: item.config || {},
      })) : []);
      const next = mergeConfig(DEFAULT_CONFIG, body?.config || fallbackRow?.config || {});
      if (fallbackRow?.config?.target && typeof fallbackRow.config.target === 'string') {
        next.target = fallbackRow.config.target;
      }
      if (next.buttonText && next.buttonText.trim()) {
        previousButtonLabelRef.current = next.buttonText;
      } else {
        previousButtonLabelRef.current = 'Feedback';
      }
      setConfig(next);
      setStatusMessage('');
    } catch (e: any) {
      console.error(e);
      setStatusMessage('Unable to load saved configuration');
      previousButtonLabelRef.current = 'Feedback';
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadConfig();
    loadPresets();
  }, [loadConfig, loadPresets]);

  useEffect(() => {
    setOpenCaptchaGuide(null);
  }, [config.captchaProvider]);

  useEffect(() => {
    if (saving) return;
    if (hasBlockingValidation) {
      setStatusMessage('Add your CAPTCHA site key before saving.');
      return;
    }
    if (!hasPublishedConfig) {
      setStatusMessage('Publish to activate your default configuration');
      return;
    }
    if (isDirty) {
      setStatusMessage('Unsaved changes');
      return;
    }
    setStatusMessage('');
  }, [hasBlockingValidation, hasPublishedConfig, isDirty, saving]);

  useEffect(() => {
    if (config.launcherVariant !== 'icon' && config.buttonText && config.buttonText.trim()) {
      previousButtonLabelRef.current = config.buttonText;
    }
  }, [config.buttonText, config.launcherVariant]);

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig((prev) => {
      const next: WidgetConfig = { ...prev, ...updates };

      if (typeof updates.buttonText === 'string' && updates.buttonText.trim()) {
        previousButtonLabelRef.current = updates.buttonText;
      }

      if (next.embedMode === 'inline') {
        next.target = normalizeTarget(next.target, '#feedback-widget');
      } else if (next.embedMode === 'trigger') {
        next.target = normalizeTarget(next.target, '#feedback-button');
      } else {
        next.target = undefined;
      }

      if (next.embedMode !== 'modal') {
        next.launcherVariant = 'label';
        if (!next.buttonText) {
          const fallbackLabel = previousButtonLabelRef.current || prev.buttonText || 'Feedback';
          next.buttonText = fallbackLabel;
        }
        return next;
      }

      if (next.launcherVariant === 'icon') {
        if (prev.buttonText && prev.buttonText.trim()) {
          previousButtonLabelRef.current = prev.buttonText;
        }
        next.buttonText = '';
        if (!next.launcherIcon) {
          next.launcherIcon = prev.launcherIcon || 'sparkles';
        }
      } else {
        const fallback = previousButtonLabelRef.current || prev.buttonText || 'Feedback';
        if (!next.buttonText) {
          next.buttonText = fallback;
        }
      }

      return next;
    });
  };

  const handleModeChange = (mode: EmbedMode) => {
    setConfig((prev) => {
      const next: WidgetConfig = { ...prev, embedMode: mode };
      if (mode === 'inline') {
        next.target = normalizeTarget(prev.target, '#feedback-widget');
      } else if (mode === 'trigger') {
        next.target = normalizeTarget(prev.target, '#feedback-button');
      } else {
        next.target = undefined;
      }
      if (mode === 'modal') {
        const storedLabel = previousButtonLabelRef.current || prev.buttonText || 'Feedback';
        next.launcherVariant = prev.launcherVariant || 'label';
        if (next.launcherVariant === 'icon') {
          if (prev.buttonText && prev.buttonText.trim()) {
            previousButtonLabelRef.current = prev.buttonText;
          }
          next.buttonText = '';
          next.launcherIcon = prev.launcherIcon || 'sparkles';
        } else {
          next.buttonText = prev.buttonText && prev.buttonText.trim() ? prev.buttonText : storedLabel;
        }
      } else {
        if (prev.buttonText && prev.buttonText.trim()) {
          previousButtonLabelRef.current = prev.buttonText;
        }
        next.launcherVariant = 'label';
        next.buttonText = previousButtonLabelRef.current || prev.buttonText || 'Feedback';
      }
      return next;
    });
  };

  const applyPreset = (preset: WidgetPreset) => {
    if (config.buttonText && config.buttonText.trim()) {
      previousButtonLabelRef.current = config.buttonText;
    }
    const next = mergeConfig(DEFAULT_CONFIG, preset.config);
    if (next.embedMode === 'inline') next.target = normalizeTarget(next.target, '#feedback-widget');
    if (next.embedMode === 'trigger') next.target = normalizeTarget(next.target, '#feedback-button');
    if (next.embedMode !== 'modal') {
      next.launcherVariant = 'label';
      if (!next.buttonText) {
        next.buttonText = previousButtonLabelRef.current || 'Feedback';
      }
    } else if (next.launcherVariant === 'icon') {
      next.buttonText = '';
      if (!next.launcherIcon) next.launcherIcon = 'sparkles';
    } else if (!next.buttonText) {
      next.buttonText = previousButtonLabelRef.current || 'Feedback';
    }
    setConfig(next);
    if (next.launcherVariant === 'label' && next.buttonText && next.buttonText.trim()) {
      previousButtonLabelRef.current = next.buttonText;
    }
    setStatusMessage(`Preset applied · ${preset.name}`);
  };

  const scrollTabsIntoView = useCallback(() => {
    if (!tabsRef.current) return;
    tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activateStep = useCallback((stepId: string) => {
    const normalizedStep = (WIDGET_STEPS.includes(stepId as WidgetStep) ? stepId : DEFAULT_WIDGET_STEP) as WidgetStep;
    if (activeTab === normalizedStep) {
      return;
    }
    setActiveTab(normalizedStep);
    requestAnimationFrame(scrollTabsIntoView);
  }, [activeTab, scrollTabsIntoView, setActiveTab]);

  const goToStep = useCallback((direction: 'prev' | 'next') => {
    const nextIndex = direction === 'next'
      ? Math.min(stepOrder.length - 1, currentStepIndex + 1)
      : Math.max(0, currentStepIndex - 1);
    activateStep(stepOrder[nextIndex]);
  }, [activateStep, currentStepIndex, stepOrder]);
  const hasPrev = currentStepIndex > 0;
  const hasNext = currentStepIndex < stepOrder.length - 1;
  const handlePrev = useCallback(() => goToStep('prev'), [goToStep]);
  const handleNext = useCallback(() => goToStep('next'), [goToStep]);

  const resetToSaved = () => {
    // Prefer last published; if not available, reset to defaults but keep current mode
    let next: WidgetConfig;
    if (defaultConfigRow?.config) {
      next = mergeConfig(DEFAULT_CONFIG, defaultConfigRow.config || {});
      if (defaultConfigRow.config.target) next.target = defaultConfigRow.config.target;
      setStatusMessage('Reverted to last published settings');
    } else {
      next = { ...DEFAULT_CONFIG, embedMode: config.embedMode };
      if (config.embedMode === 'inline') next.target = normalizeTarget(config.target, '#feedback-widget');
      if (config.embedMode === 'trigger') next.target = normalizeTarget(config.target, '#feedback-button');
      setStatusMessage('Reset to defaults (preserved mode)');
    }
    setConfig(next);
    previousButtonLabelRef.current = next.buttonText && next.buttonText.trim() ? next.buttonText : 'Feedback';
    // Reset auxiliary UI state
    setSelectedPlatform('website');
    setViewport('desktop');
    requestAnimationFrame(scrollTabsIntoView);
  };
  const resetToDefaults = () => {
    const next = { ...DEFAULT_CONFIG, embedMode: config.embedMode };
    if (config.embedMode === 'inline') next.target = normalizeTarget(config.target, '#feedback-widget');
    if (config.embedMode === 'trigger') next.target = normalizeTarget(config.target, '#feedback-button');
    setConfig(next);
    previousButtonLabelRef.current = next.buttonText && next.buttonText.trim() ? next.buttonText : 'Feedback';
    setSelectedPlatform('website');
    setViewport('desktop');
    setStatusMessage('Reset to defaults (preserved mode)');
    requestAnimationFrame(scrollTabsIntoView);
  };
  const handleSave = async () => {
    scrollTabsIntoView();
    setSaving(true);
    setStatusMessage('Saving...');
    try {
      const res = await fetch(`/api/projects/${projectId}/widget-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'default',
          label: `Version ${defaultConfigRow ? defaultConfigRow.version + 1 : 1}`,
          config,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const body = await res.json();
      if (body?.saved) {
        const savedRow: WidgetConfigRow = {
          id: body.saved.id,
          channel: body.saved.channel,
          version: body.saved.version,
          label: body.saved.label,
          isDefault: true,
          createdAt: body.saved.createdAt,
          updatedAt: body.saved.updatedAt,
          config: body.config || config,
        };
        setDefaultConfigRow(savedRow);
        setHistory((prev) => [savedRow, ...prev.filter((row) => row.id !== savedRow.id)].slice(0, 10));
        setStatusMessage('Saved - This configuration is now live');
      } else {
        setStatusMessage('Saved');
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const snippets = useMemo(() => buildSnippets(config, projectKey, widgetVersion), [config, projectKey, widgetVersion]);

  const filteredPresets = useMemo(() => {
    if (!presets.length) return [] as WidgetPreset[];
    return presets.filter((preset) => {
      const presetMode = (preset.config?.embedMode as (EmbedMode | 'any') | undefined) ?? 'modal';
      if (presetMode === 'any') return true;
      return presetMode === config.embedMode;
    });
  }, [presets, config.embedMode]);

  const presetGallery = useMemo(() => {
    if (config.embedMode !== 'modal') {
      return filteredPresets;
    }
    const ordered = new Map<string, WidgetPreset>();
    DEFAULT_MODAL_PRESETS.forEach((preset) => ordered.set(preset.slug, preset));
    filteredPresets.forEach((preset) => ordered.set(preset.slug, preset));
    return Array.from(ordered.values());
  }, [filteredPresets, config.embedMode]);

  const activePresetSlug = useMemo(() => {
    if (!presetGallery.length) return null;
    for (const preset of presetGallery) {
      if (hash(mergeConfig(DEFAULT_CONFIG, preset.config)) === currentHash) {
        return preset.slug;
      }
    }
    return null;
  }, [presetGallery, currentHash]);

  const inlinePresetActive = useMemo(() => {
    const borderValue = config.inlineBorder || 'none';
    const shadowValue = config.inlineShadow || 'none';
    return INLINE_STYLE_PRESETS.find((preset) => preset.border === borderValue && preset.shadow === shadowValue)?.label || null;
  }, [config.inlineBorder, config.inlineShadow]);

  const experienceSummary = useMemo(() => {
    switch (config.embedMode) {
      case 'modal':
        return config.launcherVariant === 'icon' ? 'Modal · icon bubble launcher' : 'Modal · labeled launcher';
      case 'inline':
        return 'Inline · embeds inside your layout';
      case 'trigger':
        return 'Trigger · attaches to your button';
      default:
        return 'Modal experience';
    }
  }, [config.embedMode, config.launcherVariant]);

  const targetSummary = useMemo(() => {
    if (config.embedMode === 'inline') {
      return `Inline target · ${normalizeTarget(config.target, '#feedback-widget').replace('#', '')}`;
    }
    if (config.embedMode === 'trigger') {
      return `Trigger id · ${normalizeTarget(config.target, '#feedback-button').replace('#', '')}`;
    }
    return 'Launcher position · ' + (config.position || 'bottom-right');
  }, [config.embedMode, config.position, config.target]);

  const selectedPlatformLabel = useMemo(() => {
    const match = FRAMEWORK_OPTIONS.find((option) => option.value === selectedPlatform);
    return match ? match.label : selectedPlatform.replace('-', ' ');
  }, [selectedPlatform]);

  const inlinePreviewStyle = useMemo<CSSProperties>(() => ({
    border: config.inlineBorder || '1px solid rgba(15,23,42,0.08)',
    boxShadow: config.inlineShadow || 'none',
    background: config.backgroundColor || '#ffffff',
  }), [config.inlineBorder, config.inlineShadow, config.backgroundColor]);

  const sections = (
    <div ref={tabsRef} className="space-y-6 sm:space-y-8">
      <StepNavigation
        steps={steps}
        currentIndex={currentStepIndex}
        onPrev={handlePrev}
        onNext={activeTab === 'publish' ? handleSave : handleNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        variant="top"
        nextLabel={activeTab === 'publish' ? (saving ? 'Saving...' : 'Save & publish') : 'Next'}
        nextDisabled={activeTab === 'publish' ? saving || loading || !isDirty || hasBlockingValidation : !hasNext}
        showNext={activeTab === 'publish' ? true : hasNext}
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) => activateStep(value)}
        className="w-full"
      >
        <TabsList className="mb-6 hidden w-full gap-1.5 sm:grid sm:grid-cols-2 sm:gap-2 lg:flex lg:flex-nowrap lg:justify-center">
          {steps.map((step, index) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              className="flex h-11 items-center justify-center rounded-lg border border-border bg-background px-2 text-[10px] font-medium tracking-normal transition data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary sm:flex-1 sm:px-3 sm:text-xs lg:flex-1 lg:text-[11px]"
            >
              {index + 1}. {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="setup" className="space-y-6 sm:space-y-8">
          <Card>
            <CardHeader className={CARD_HEADER}>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Choose an experience</CardTitle>
              <CardDescription>Select how the widget should appear on your site.</CardDescription>
            </CardHeader>
            <CardContent className={CARD_CONTENT}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {MODE_PRESETS.map((item) => {
                  const active = config.embedMode === item.mode;
                  return (
                    <button
                      type="button"
                      key={item.mode}
                      onClick={() => handleModeChange(item.mode)}
                      aria-pressed={active}
                      className={cn(
                        'flex min-w-0 flex-1 flex-col items-start gap-1 rounded-md border px-2 py-2 text-left text-[10px] leading-tight transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:py-3 lg:text-[11px]',
                        active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
                      )}
                    >
                      <div className="flex-1 space-y-0.5">
                        <div className="font-medium text-[10px] leading-tight sm:text-[11px] lg:text-sm truncate">{item.title}</div>
                        <p className="text-[9px] text-muted-foreground leading-tight sm:text-[10px] lg:text-xs">{item.description}</p>
                        {item.helper && (
                          <p className="text-[9px] text-muted-foreground/80 leading-tight sm:text-[10px] lg:text-xs">
                            {item.helper}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>


        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Select your platform</CardTitle>
            <CardDescription>This controls the snippet we generate for you in the Publish step.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'space-y-3')}>
            <div className="flex flex-wrap gap-2">
              {SNIPPET_PLATFORMS.map((platform) => (
                <Button
                  key={platform}
                  type="button"
                  size="sm"
                  variant={selectedPlatform === platform ? 'default' : 'outline'}
                  className="capitalize px-3 py-1.5 text-[11px] sm:text-sm"
                  onClick={() => setSelectedPlatform(platform)}
                >
                  {platform.replace('-', ' ')}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">We&#39;ll tailor the installation snippet and guidance based on this choice.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Presets</CardTitle>
            <CardDescription>Start from a curated look and fine-tune afterwards.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'space-y-2')}>
            {presetGallery.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin sm:grid sm:grid-cols-2 sm:gap-3">
                {presetGallery.map((preset) => (
                  <PresetCard key={preset.slug} preset={preset} onApply={applyPreset} active={activePresetSlug === preset.slug} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-[11px] text-muted-foreground sm:text-sm">
                {presets.length === 0 ? 'Presets will appear here once configured in Supabase.' : 'Switch experiences to see presets tailored for that embed mode.'}
              </div>
            )}
            {config.embedMode === 'modal' && config.launcherVariant === 'icon' && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/80">Launcher icon</span>
                  <Badge variant="outline" className="border-primary/60 bg-primary/15 text-[10px] uppercase tracking-[0.24em] text-primary">
                    Icon mode
                  </Badge>
                </div>
                <p className="text-[10px] leading-snug text-primary/80 sm:text-xs">
                  Pick the glyph for your floating bubble. The live preview updates as soon as you choose a new icon.
                </p>
                <Select
                  value={config.launcherIcon || 'sparkles'}
                  onValueChange={(value) => updateConfig({ launcherIcon: value, launcherVariant: 'icon' })}
                >
                  <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAUNCHER_ICON_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="text-sm">{option.label}</span>
                            <span className="text-base leading-none">{option.preview}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Match the widget to your visual language.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'grid gap-4 md:grid-cols-2')}>
            <div className="space-y-2">
              <Label>Primary accent</Label>
              <div className="flex items-center gap-2">
                <Input value={config.primaryColor || ''} onChange={(event) => updateConfig({ primaryColor: event.target.value })} placeholder="#6366F1" />
                <input type="color" value={config.primaryColor || '#6366F1'} onChange={(event) => updateConfig({ primaryColor: event.target.value })} className="h-10 w-14 rounded-md border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Form background</Label>
              <div className="flex items-center gap-2">
                <Input value={config.backgroundColor || ''} onChange={(event) => updateConfig({ backgroundColor: event.target.value })} placeholder="#ffffff" />
                <input type="color" value={config.backgroundColor || '#ffffff'} onChange={(event) => updateConfig({ backgroundColor: event.target.value })} className="h-10 w-14 rounded-md border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select value={config.headerLayout} onValueChange={(value) => updateConfig({ headerLayout: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_HEADER_LAYOUTS.map((layout) => (
                    <SelectItem key={layout} value={layout}>{layout.replace('-', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Header accent</Label>
              <Select value={config.headerIcon} onValueChange={(value) => updateConfig({ headerIcon: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Icon" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_HEADER_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>{icon.replace('-', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spacing</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={16} max={40} step={2} value={config.spacing || 24} onChange={(event) => updateConfig({ spacing: Number(event.target.value) })} className="flex-1" />
                <span className="text-xs tabular-nums w-12 text-right">{config.spacing || 24}px</span>
              </div>
            </div>
            {config.embedMode === 'modal' && (
              <div className="space-y-2">
                <Label>Modal width</Label>
                <div className="flex items-center gap-3">
                  <input type="range" min={360} max={720} step={20} value={config.modalWidth || 480} onChange={(event) => updateConfig({ modalWidth: Number(event.target.value) })} className="flex-1" />
                  <span className="text-xs tabular-nums w-14 text-right">{config.modalWidth || 480}px</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Scale</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={0.7} max={1.2} step={0.05} value={config.scale || 1} onChange={(event) => updateConfig({ scale: Number(event.target.value) })} className="flex-1" />
                <span className="text-xs tabular-nums w-12 text-right">{(config.scale || 1).toFixed(2)}x</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Advanced styling</CardTitle>
            <CardDescription>Fine-tune inline embeds with visual presets and custom values.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'space-y-4')}>
            <div className="flex flex-wrap gap-2">
              {INLINE_STYLE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant={inlinePresetActive === preset.label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig({ inlineBorder: preset.border, inlineShadow: preset.shadow })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Inline border</Label>
                <Input value={config.inlineBorder || ''} onChange={(event) => updateConfig({ inlineBorder: event.target.value })} placeholder="1px solid rgba(15,23,42,0.08)" />
              </div>
              <div className="space-y-2">
                <Label>Inline shadow</Label>
                <Input value={config.inlineShadow || ''} onChange={(event) => updateConfig({ inlineShadow: event.target.value })} placeholder="0 16px 40px rgba(15,23,42,0.12)" />
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs font-medium text-muted-foreground">Live style preview</div>
              <div className="mt-3 rounded-lg bg-background p-4" style={inlinePreviewStyle}>
                <div className="text-xs font-semibold text-muted-foreground">This is how the inline widget shell will look.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="fields" className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Inputs & behavior</CardTitle>
            <CardDescription>Show the right amount of friction before submitting feedback.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'grid gap-4 md:grid-cols-2')}>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3">
              <div>
                <div className="text-sm font-medium">Require email</div>
                <p className="text-xs text-muted-foreground">Force responders to include a contact address.</p>
              </div>
              <Switch checked={!!config.requireEmail} onCheckedChange={(value) => updateConfig({ requireEmail: value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3">
              <div>
                <div className="text-sm font-medium">Feedback type picker</div>
                <p className="text-xs text-muted-foreground">Let users classify feedback as bug, idea, or praise.</p>
              </div>
              <Switch checked={config.enableType !== false} onCheckedChange={(value) => updateConfig({ enableType: value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3">
              <div>
                <div className="text-sm font-medium">Screenshot upload</div>
                <p className="text-xs text-muted-foreground">Allow users to attach a browser screenshot.</p>
              </div>
              <Switch checked={!!config.enableScreenshot} onCheckedChange={(value) => updateConfig({ enableScreenshot: value })} />
            </div>
            <div className="md:col-span-2 border-t border-dashed border-border/60 pt-3">
              <DisclosureToggle open={showAdvancedFields} onToggle={() => setShowAdvancedFields((v) => !v)} label="advanced settings" />
            </div>
            {showAdvancedFields && (
            <>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3">
              <div>
                <div className="text-sm font-medium">Rating scale</div>
                <p className="text-xs text-muted-foreground">Collect optional 1-5 star ratings alongside comments.</p>
              </div>
              <Switch checked={config.enableRating !== false} onCheckedChange={(value) => updateConfig({ enableRating: value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-1">
                  Require screenshot
                  <span title="Active only when screenshot uploads are enabled"><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
                </div>
                <p className="text-xs text-muted-foreground">Ensure bug reports include visual context when screenshots are on.</p>
                {!config.enableScreenshot && (
                  <p className="mt-1 text-xs text-destructive/80">Enable screenshot uploads above to require them from submitters.</p>
                )}
              </div>
              <Switch checked={!!config.screenshotRequired} disabled={!config.enableScreenshot} onCheckedChange={(value) => updateConfig({ screenshotRequired: value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3">
              <div>
                <div className="text-sm font-medium">Priority selector</div>
                <p className="text-xs text-muted-foreground">Capture how urgent the feedback feels.</p>
              </div>
              <Switch checked={!!config.enablePriority} onCheckedChange={(value) => updateConfig({ enablePriority: value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Tags input</div>
                <p className="text-xs text-muted-foreground">Let respondents suggest categories to triage later.</p>
              </div>
              <Switch checked={!!config.enableTags} onCheckedChange={(value) => updateConfig({ enableTags: value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3 md:col-span-2">
              <div>
                <div className="text-sm font-medium">File attachments</div>
                <p className="text-xs text-muted-foreground">Accept supplementary files (PNG, JPG, PDF).</p>
              </div>
              <Switch checked={!!config.enableAttachment} onCheckedChange={(value) => updateConfig({ enableAttachment: value })} />
            </div>
            {config.enableAttachment && (
              <div className="space-y-2 md:col-span-2">
                <Label>Attachment size limit (MB)</Label>
                <Select value={String(config.attachmentMaxMB || 5)} onValueChange={(value) => updateConfig({ attachmentMaxMB: Number(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 MB</SelectItem>
                    <SelectItem value="5">5 MB</SelectItem>
                    <SelectItem value="10">10 MB</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Higher caps are great for detailed reports but may slow uploads on poor networks.</p>
              </div>
            )}
            </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Success messaging</CardTitle>
            <CardDescription>Customize the thank-you screen after submission.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'grid gap-4')}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={config.successTitle || ''} onChange={(event) => updateConfig({ successTitle: event.target.value })} placeholder="Thank you!" />
            </div>
            <div className="space-y-2">
              <Label>Body copy</Label>
              <textarea value={config.successDescription || ''} onChange={(event) => updateConfig({ successDescription: event.target.value })} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="We appreciate you taking the time to share your thoughts." />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="protection" className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Spam & abuse controls</CardTitle>
            <CardDescription>Keep noise out while preserving great feedback.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'grid gap-4 md:grid-cols-2')}>
            <div className="rounded-lg border p-3 flex items-center justify-between md:col-span-2">
              <div>
                <div className="text-sm font-medium flex items-center gap-1">
                  Require CAPTCHA
                  <span title="Enforce CAPTCHA on submit (Turnstile or hCaptcha)."><Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
                </div>
              </div>
              <Switch
                checked={!!config.requireCaptcha}
                onCheckedChange={(value) =>
                  updateConfig({
                    requireCaptcha: value,
                    captchaProvider: value
                      ? (config.captchaProvider && config.captchaProvider !== 'none' ? config.captchaProvider : 'turnstile')
                      : 'none',
                  })
                }
              />
            </div>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={config.captchaProvider || 'none'} onValueChange={(value) => updateConfig({ captchaProvider: value as any, requireCaptcha: value !== 'none' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPTCHAS.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider === 'none' ? 'Disabled' : provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {config.requireCaptcha && (
                  <p className="text-xs text-muted-foreground">Choose your provider, then paste the corresponding site key.</p>
                )}
              </div>
            </div>
            {config.captchaProvider === 'turnstile' && (
              <>
                <div className="space-y-2">
                  <Label>Turnstile site key</Label>
                  <Input value={config.turnstileSiteKey || ''} onChange={(event) => updateConfig({ turnstileSiteKey: event.target.value })} placeholder="0xAAAA..." aria-invalid={captchaKeyMissing && captchaProvider === 'turnstile'} />
                  {captchaKeyMissing && captchaProvider === 'turnstile' && (
                    <p className="text-xs text-destructive/80">Add a valid Cloudflare Turnstile site key to enable submissions.</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <ProviderGuide
                    open={openCaptchaGuide === 'turnstile'}
                    onToggle={() => setOpenCaptchaGuide((current) => (current === 'turnstile' ? null : 'turnstile'))}
                    guide={CAPTCHA_GUIDES.turnstile}
                  />
                </div>
              </>
            )}
            {config.captchaProvider === 'hcaptcha' && (
              <>
                <div className="space-y-2">
                  <Label>hCaptcha site key</Label>
                  <Input value={config.hcaptchaSiteKey || ''} onChange={(event) => updateConfig({ hcaptchaSiteKey: event.target.value })} placeholder="10000000-ffff-ffff-ffff-000000000001" aria-invalid={captchaKeyMissing && captchaProvider === 'hcaptcha'} />
                  {captchaKeyMissing && captchaProvider === 'hcaptcha' && (
                    <p className="text-xs text-destructive/80">Enter your hCaptcha site key before publishing.</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <ProviderGuide
                    open={openCaptchaGuide === 'hcaptcha'}
                    onToggle={() => setOpenCaptchaGuide((current) => (current === 'hcaptcha' ? null : 'hcaptcha'))}
                    guide={CAPTCHA_GUIDES.hcaptcha}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Rate limiting</CardTitle>
            <CardDescription>Throttle how frequently feedback can be submitted per user.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'grid gap-4 md:grid-cols-2')}>
            <div className="space-y-2">
              <Label>Submissions per window</Label>
              <Input type="number" min={1} max={200} value={config.rateLimitCount || 5} onChange={(event) => updateConfig({ rateLimitCount: Number(event.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Window (seconds)</Label>
              <Input type="number" min={5} max={3600} value={config.rateLimitWindowSec || 60} onChange={(event) => updateConfig({ rateLimitWindowSec: Number(event.target.value) })} />
            </div>
          </CardContent>
        </Card>
        <AlertCard />
      </TabsContent>
      <TabsContent value="publish" className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">Integration snippets</CardTitle>
            <CardDescription>Copy-paste for your selected platform.</CardDescription>
          </CardHeader>
          <CardContent className={CARD_CONTENT}>
            <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as any)} className="w-full">
              <TabsList className="w-full overflow-x-auto  gap-2">
                {FRAMEWORK_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="px-2.5 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-sm">
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {FRAMEWORK_OPTIONS.map((option) => (
                <TabsContent key={option.value} value={option.value} className="pt-3">
                  <div className="mb-2 text-xs text-muted-foreground">Platform: <span className="font-medium text-foreground">{option.label}</span></div>
                  <CodeSnippet code={snippets.get(option.value) || ''} language={SNIPPET_LANGUAGES[option.value]} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">Install guide</CardTitle>
            <CardDescription>Simple, mode-specific steps to ship confidently.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'space-y-3')}>
            {config.embedMode === 'modal' && (
              <ol className="space-y-3 text-[11px] sm:text-sm">
                <li className="flex items-start gap-2"><Code className="h-4 w-4 mt-0.5 text-primary" /> Add the script and stylesheet shown above.</li>
                <li className="flex items-start gap-2"><MousePointer className="h-4 w-4 mt-0.5 text-primary" /> A floating button appears at bottom-right. Tweak label/position below if needed.</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary" /> Save & publish your configuration.</li>
                <li className="flex items-start gap-2"><Rocket className="h-4 w-4 mt-0.5 text-primary" /> Verify in the widget demo and on your site.</li>
              </ol>
            )}
            {config.embedMode === 'inline' && (
              <ol className="space-y-3 text-[11px] sm:text-sm">
                <li className="flex items-start gap-2"><Code className="h-4 w-4 mt-0.5 text-primary" /> Add the script and stylesheet shown above.</li>
                <li className="flex items-start gap-2">
                  <MousePointer className="h-4 w-4 mt-0.5 text-primary" />
                  <div className="flex-1">Place <code>&lt;div id=&quot;{normalizeTarget(config.target, '#feedback-widget').replace('#','')}&quot;/&gt;</code> where the form should render.</div>
                  <CopyButton className="h-11 px-2 text-[11px]" text={`<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#','')}"/>`} />
                </li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary" /> Save & publish your configuration.</li>
                <li className="flex items-start gap-2"><Rocket className="h-4 w-4 mt-0.5 text-primary" /> Verify in the widget demo and on your site.</li>
              </ol>
            )}
            {config.embedMode === 'trigger' && (
              <ol className="space-y-3 text-[11px] sm:text-sm">
                <li className="flex items-start gap-2"><Code className="h-4 w-4 mt-0.5 text-primary" /> Add the script and stylesheet shown above.</li>
                <li className="flex items-start gap-2">
                  <MousePointer className="h-4 w-4 mt-0.5 text-primary" />
                  <div className="flex-1">Give your button the id <code>{normalizeTarget(config.target, '#feedback-button')}</code> or add <code>data-feedbacks-trigger</code>.</div>
                  <CopyButton className="h-11 px-2 text-[11px]" text={`<button id="${normalizeTarget(config.target, '#feedback-button').replace('#','')}">Give feedback</button>`} />
                </li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary" /> Save & publish your configuration.</li>
                <li className="flex items-start gap-2"><Rocket className="h-4 w-4 mt-0.5 text-primary" /> Verify in the widget demo and on your site.</li>
              </ol>
            )}
            <div className="rounded-lg border bg-muted/30 p-2.5 text-[11px] text-muted-foreground sm:p-3 sm:text-xs">
              Need a different platform? Switch the selection in Setup — snippets update instantly.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={CARD_HEADER}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">Experience details</CardTitle>
                <CardDescription>Fine-tune options for the current embed mode.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'space-y-5')}>
            {config.embedMode === 'modal' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Launcher position</Label>
                    <Select value={config.position} onValueChange={(value) => updateConfig({ position: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWED_POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos.replace('-', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Button label</Label>
                    <Input value={config.buttonText || ''} onChange={(event) => updateConfig({ buttonText: event.target.value })} placeholder="Feedback" />
                  </div>
                </div>
                <div className="border-t border-dashed border-border/60 pt-3">
                  <DisclosureToggle open={showAdvancedExperience} onToggle={() => setShowAdvancedExperience((v) => !v)} label="launcher tips" />
                  {showAdvancedExperience && (
                    <p className="mt-3 text-xs text-muted-foreground">Floating button updates instantly in the preview. Position defaults to bottom right for the polished concierge look.</p>
                  )}
                </div>
              </div>
            )}

            {config.embedMode === 'inline' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Container ID</Label>
                  <Input value={normalizeTarget(config.target, '#feedback-widget').replace('#', '')} onChange={(event) => updateConfig({ target: `#${event.target.value}` })} placeholder="feedback-widget" />
                </div>
                <div className="border-t border-dashed border-border/60 pt-3">
                  <DisclosureToggle open={showAdvancedExperience} onToggle={() => setShowAdvancedExperience((v) => !v)} label="embed instructions" />
                  {showAdvancedExperience && (
                    <div className="mt-3 space-y-3">
                      <CodeSnippet code={`<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#', '')}"></div>`} language="html" />
                      <p className="text-xs text-muted-foreground">Drop the div anywhere in your layout. The widget renders directly inside it—no wrapper shell needed.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {config.embedMode === 'trigger' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Button ID</Label>
                  <Input value={normalizeTarget(config.target, '#feedback-button').replace('#', '')} onChange={(event) => updateConfig({ target: `#${event.target.value}` })} placeholder="feedback-button" />
                </div>
                <div className="border-t border-dashed border-border/60 pt-3">
                  <DisclosureToggle open={showAdvancedExperience} onToggle={() => setShowAdvancedExperience((v) => !v)} label="trigger setup" />
                  {showAdvancedExperience && (
                    <div className="mt-3 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <CodeSnippet code={`<button id="${normalizeTarget(config.target, '#feedback-button').replace('#', '')}">Give feedback</button>`} language="html" />
                        <CodeSnippet code={`<button data-feedbacks-trigger>Open feedback</button>`} language="html" />
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground">How it works</p>
                        <p>Give any element the chosen id or <code>data-feedbacks-trigger</code> attribute. The widget script discovers it automatically after load.</p>
                        <p>If the button renders after hydration, instantiate <code>new FeedbacksWidget</code> once the element exists.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle>Recent versions</CardTitle>
            <CardDescription>Track how your install evolves.</CardDescription>
          </CardHeader>
          <CardContent className={cn(CARD_CONTENT, 'space-y-3')}>
            {history.length === 0 && <p className="text-sm text-muted-foreground">Publish your first configuration to see history here.</p>}
            {history.map((row, idx) => (
              <div key={row.id} className={cn('flex flex-col gap-1 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between', idx === 0 ? 'border-primary/40 bg-primary/5' : 'border-border')}>
                <div>
                  <div className="font-medium">{row.label}</div>
                  <p className="text-xs text-muted-foreground">Version {row.version} · {row.updatedAt ? formatDate(row.updatedAt) : 'Pending'}</p>
                </div>
                <Badge variant={idx === 0 ? 'default' : 'secondary'}>{idx === 0 ? 'Current' : 'Past'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="pt-1 text-[11px] text-muted-foreground" hidden={activeTab !== 'publish'}>
          Project ID <code className="rounded bg-background px-1 py-0.5 font-mono text-[10px]">{projectId}</code>
          · Last published {defaultConfigRow?.updatedAt ? formatDate(defaultConfigRow.updatedAt) : 'Not yet published'}
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Widget installation</h2>
          <p className="text-sm text-muted-foreground">Fine-tune, preview, and publish the experience for {projectName}.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>Reset</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => resetToSaved()}>Reset to Last Published</DropdownMenuItem>
              <DropdownMenuItem onClick={() => resetToDefaults()}>Reset to Defaults</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} disabled={loading || saving || !isDirty || hasBlockingValidation}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : isDirty ? 'Save & publish' : 'Saved'}
          </Button>
        </div>
      </div>
      {statusMessage && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><History className="h-3 w-3" />{statusMessage}</div>
      )}

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="space-y-5 sm:space-y-6">
          {loading ? (
            <Card className="h-[520px] animate-pulse" />
          ) : (
            sections
          )}
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-end gap-2 sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading} className="h-11 px-3 text-xs">Reset</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => resetToSaved()}>Reset to Last Published</DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetToDefaults()}>Reset to Defaults</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleSave}
              disabled={loading || saving || !isDirty || hasBlockingValidation}
              size="sm"
              className="h-11 px-3 text-xs"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {saving ? 'Saving...' : isDirty ? 'Save & publish' : 'Saved'}
            </Button>
          </div>
          {projectSummary}
          <WidgetPreview config={config} projectKey={projectKey} widgetVersion={widgetVersion} viewport={viewport} onViewportChange={setViewport} />
        </div>
      </div>
      <StepNavigation
        steps={steps}
        currentIndex={currentStepIndex}
        onPrev={handlePrev}
        onNext={activeTab === 'publish' ? handleSave : handleNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        variant="bottom"
        nextLabel={activeTab === 'publish' ? (saving ? 'Saving...' : 'Save & publish') : 'Next'}
        nextDisabled={activeTab === 'publish' ? saving || loading || !isDirty || hasBlockingValidation : !hasNext}
        showNext={activeTab === 'publish' ? true : hasNext}
      />

    </div>
  );
}


function ProviderGuide({ open, onToggle, guide }: { open: boolean; onToggle: () => void; guide: { title: string; steps: string[]; href: string; cta: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
      >
        <span className="text-left">{guide.title}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open ? 'rotate-180 text-foreground' : '')} />
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <ol className="list-decimal space-y-1.5 pl-4">
            {guide.steps.map((step, index) => (
              <li key={index} className="leading-snug">{step}</li>
            ))}
          </ol>
          <Link href={guide.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            {guide.cta}
          </Link>
        </div>
      )}
    </div>
  );
}

function DisclosureToggle({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  const disclosureId = `disclosure-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const actionLabel = `Show ${label.toLowerCase()}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={disclosureId}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
    >
      <span>{actionLabel}</span>
      {open ? (
        <Minus className="h-4 w-4 transition-transform" />
      ) : (
        <Plus className="h-4 w-4 transition-transform" />
      )}
    </button>
  );
}

function StepNavigation({
  steps,
  currentIndex,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  variant = 'bottom',
  nextLabel = 'Next',
  nextDisabled,
  showNext = true,
}: {
  steps: Array<{ id: string; label: string }>;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  variant?: 'top' | 'bottom';
  nextLabel?: string;
  nextDisabled?: boolean;
  showNext?: boolean;
}) {
  const disableNext = typeof nextDisabled === 'boolean' ? nextDisabled : !hasNext;
  const showArrow = nextLabel === 'Next';
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        variant === 'top' ? 'mt-3 mb-6' : 'mt-6'
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Step {currentIndex + 1} of {steps.length}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev}
          className={cn(
            'flex h-9 items-center gap-2 rounded-lg border-border/70 px-3 text-[11px] font-semibold uppercase tracking-[0.18em]',
            variant === 'top' ? 'md:text-[12px]' : ''
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        {showNext && (
          <Button
            type="button"
            size="sm"
            onClick={onNext}
            disabled={disableNext}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold uppercase tracking-[0.18em]',
              variant === 'top' ? 'md:text-[12px]' : ''
            )}
          >
            {nextLabel}
            {showArrow && <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function AlertCard() {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Best practices</CardTitle>
        <CardDescription>Balance security with submission friction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground p-4 pt-0 sm:p-6 sm:pt-0">
        <p>Consider enabling CAPTCHA for public widgets embedded on marketing pages. Rate limits apply per IP-adjust for highly trafficked products.</p>
        <p>Attachments and screenshots are stored in your Supabase storage bucket <code className="rounded bg-muted px-1.5 py-0.5 text-xs">feedback_attachments</code>. Remember to configure retention policies.</p>
      </CardContent>
    </Card>
  );
}


















