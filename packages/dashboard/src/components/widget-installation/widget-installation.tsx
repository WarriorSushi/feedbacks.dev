
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
import { Loader2, Monitor, Smartphone, Sparkles, History, ShieldCheck, Palette, ChevronLeft, ChevronRight, Code, MousePointer, CheckCircle, Rocket, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const DEFAULT_WIDGET_VERSION = 'latest';
const ALLOWED_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
const ALLOWED_SHAPES = ['rounded', 'pill', 'square'] as const;
const ALLOWED_HEADER_ICONS = ['none', 'chat', 'star', 'lightbulb', 'thumbs-up'] as const;
const ALLOWED_HEADER_LAYOUTS = ['text-only', 'icon-left', 'icon-top'] as const;
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

const FRAMEWORK_OPTIONS: Array<{ value: (typeof SNIPPET_PLATFORMS)[number]; label: string }> = [
  { value: 'website', label: 'Website' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'react-native', label: 'React Native' },
  { value: 'flutter', label: 'Flutter' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'shopify', label: 'Shopify' },
];

const PLATFORM_INSTRUCTIONS: Record<(typeof SNIPPET_PLATFORMS)[number], string[]> = {
  website: [
    'Paste the snippet just before the closing </body> tag on your site.',
    'Make sure any inline container id or trigger button id exists in the HTML.',
  ],
  react: [
    'Add this helper component to your app and render it once in your layout.',
    'The widget script loads after hydration, so render inline targets or trigger buttons in the component tree.',
  ],
  vue: [
    'Include the script in index.html and run the init code inside onMounted.',
    'Ensure the container or trigger id is present when the component mounts.',
  ],
  'react-native': [
    'Drop this snippet into a WebView for your mobile app.',
    'Swap the inline HTML if you need to customise colours or ids.',
  ],
  flutter: [
    'Load the HTML snippet inside webview_flutter or a similar widget.',
    'Adjust the inline HTML if you need to customise ids or styling.',
  ],
  wordpress: [
    'Register the scripts in your theme or plugin, for example in functions.php.',
    'If you are attaching to an existing button, add the chosen id in your theme markup.',
  ],
  shopify: [
    'Add the script to theme.liquid so it loads on every page.',
    'Include the init snippet in the template where you want the widget to appear.',
  ],
};



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
  modalShape?: typeof ALLOWED_SHAPES[number];
  headerIcon?: typeof ALLOWED_HEADER_ICONS[number];
  headerLayout?: typeof ALLOWED_HEADER_LAYOUTS[number];
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

export interface WidgetInstallationExperienceProps {
  projectId: string;
  projectKey: string;
  projectName: string;
  widgetVersion?: string;
  initialStep?: WidgetStep;
}

export type WidgetStep = 'setup' | 'appearance' | 'fields' | 'protection' | 'publish';

const DEFAULT_WIDGET_STEP: WidgetStep = 'setup';
const WIDGET_STEPS: WidgetStep[] = ['setup', 'appearance', 'fields', 'protection', 'publish'];

const DEFAULT_CONFIG: WidgetConfig = {
  embedMode: 'modal',
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
  modalShape: 'rounded',
  headerIcon: 'none',
  headerLayout: 'text-only',
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
    description: 'Embed the form directly inside your page layout.',
    helper: 'Perfect for docs, help centers, and support hubs.',
  },
  {
    mode: 'modal',
    title: 'Floating Modal',
    description: 'Premium launcher button that opens a layered experience.',
    helper: 'Ideal for marketing sites and SaaS dashboards.',
  },
  {
    mode: 'trigger',
    title: 'Attach to an existing button',
    description: 'Use your own CTA or icon and let us power the modal.',
    helper: 'Works with nav menus, floating action buttons, and custom UI.',
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

const PREVIEW_MIN_HEIGHT_DESKTOP = 360;
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
  return value.startsWith('#') ? value : `#${value}`;
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
  if (config.modalShape) result.modalShape = config.modalShape;
  if (config.headerIcon && config.headerIcon !== 'none') result.headerIcon = config.headerIcon;
  if (config.headerLayout && config.headerLayout !== 'text-only') result.headerLayout = config.headerLayout;
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
          postHeight();
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
            var height = 0;
            if (view === 'form' && lastConfig && lastConfig.embedMode === 'modal') {
              var modal = document.querySelector('.feedbacks-modal');
              if (modal && typeof modal.getBoundingClientRect === 'function') {
                var modalRect = modal.getBoundingClientRect();
                if (modalRect) {
                  var modalHeight = modalRect.height || (modalRect.bottom - modalRect.top);
                  var modalTop = Math.max(0, modalRect.top);
                  height = Math.ceil(modalHeight + modalTop + 48);
                }
              }
              if (!height) {
                var overlay = document.querySelector('.feedbacks-overlay');
                if (overlay && typeof overlay.getBoundingClientRect === 'function') {
                  var overlayRect = overlay.getBoundingClientRect();
                  if (overlayRect) {
                    height = Math.ceil((overlayRect.height || overlayRect.bottom || 0) + 48);
                  }
                }
              }
            }
            if (!height) {
              var root = document.getElementById('preview-root');
              var rect = root && typeof root.getBoundingClientRect === 'function' ? root.getBoundingClientRect() : null;
              height = rect ? Math.ceil(rect.height) : Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight);
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
            setTimeout(function(){ ensureWidgetLoaded(function(){ mount(ev.data.config || initial); setTimeout(postHeight, 150); }); }, 50);
          }
          if (ev.data.type === 'widget-preview:view') {
            view = ev.data.view === 'form' ? 'form' : 'launcher';
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
        window.addEventListener('load', function(){ ensureWidgetLoaded(function(){ mount(initial); postHeight(); }); });
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
  useEffect(() => {
    setHeight(viewport === 'mobile' ? PREVIEW_MIN_HEIGHT_MOBILE : PREVIEW_MIN_HEIGHT_DESKTOP);
  }, [viewport]);
  useEffect(() => {
    if (config.embedMode !== 'modal' && previewView !== 'launcher') {
      setPreviewView('launcher');
    }
  }, [config.embedMode, previewView]);
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
              setHeight(next === 'mobile' ? PREVIEW_MIN_HEIGHT_MOBILE : PREVIEW_MIN_HEIGHT_DESKTOP);
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
        'group relative flex flex-col items-start gap-1.5 rounded-lg border bg-card p-3 text-left text-[11px] font-medium transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm sm:p-4',
        active ? 'border-primary shadow-lg ring-1 ring-primary/40' : 'border-border'
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="text-[11px] font-semibold sm:text-sm">{preset.name}</div>
        {active && <Badge variant="default">Applied</Badge>}
      </div>
      {preset.description && (
        <p className="text-[10px] text-muted-foreground leading-snug sm:text-xs">{preset.description}</p>
      )}
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">Tap to apply</span>
    </button>
  );
}
export function WidgetInstallationExperience({ projectId, projectKey, projectName, widgetVersion = DEFAULT_WIDGET_VERSION, initialStep }: WidgetInstallationExperienceProps) {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [defaultConfigRow, setDefaultConfigRow] = useState<WidgetConfigRow | null>(null);
  const [history, setHistory] = useState<WidgetConfigRow[]>([]);
  const [presets, setPresets] = useState<WidgetPreset[]>([]);
  const normalizedInitialStep = initialStep && WIDGET_STEPS.includes(initialStep) ? initialStep : DEFAULT_WIDGET_STEP;
  const [activeTab, setActiveTab] = useState<string>(normalizedInitialStep);
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SNIPPET_PLATFORMS[number]>('website');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  const [showAdvancedStyling, setShowAdvancedStyling] = useState<boolean>(false);
  const [showAdvancedExperience, setShowAdvancedExperience] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const tabsRef = useRef<HTMLDivElement>(null);
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
  const currentStepIndex = Math.max(0, stepOrder.indexOf(activeTab));

  useEffect(() => {
    if (!initialStep) {
      return;
    }
    if (!WIDGET_STEPS.includes(initialStep)) {
      return;
    }
    setActiveTab(initialStep);
  }, [initialStep]);
  const currentHash = useMemo(() => hash(config || {}), [config]);
  const savedHash = useMemo(() => hash((defaultConfigRow?.config as Record<string, any>) || {}), [defaultConfigRow]);
  const isDirty = currentHash !== savedHash;

  const loadPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/widget-presets');
      if (!res.ok) return;
      const body = await res.json();
      if (Array.isArray(body.items)) setPresets(body.items);
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
      setConfig(next);
      setStatusMessage('');
    } catch (e: any) {
      console.error(e);
      setStatusMessage('Unable to load saved configuration');
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
    if (!saving) {
      if (isDirty) setStatusMessage('Unsaved changes');
      else setStatusMessage('');
    }
  }, [isDirty, saving]);

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      if (next.embedMode === 'inline') {
        next.target = normalizeTarget(next.target, '#feedback-widget');
      } else if (next.embedMode === 'trigger') {
        next.target = normalizeTarget(next.target, '#feedback-button');
      } else {
        next.target = undefined;
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
      return next;
    });
  };

  const applyPreset = (preset: WidgetPreset) => {
    const next = mergeConfig(DEFAULT_CONFIG, preset.config);
    if (next.embedMode === 'inline') next.target = normalizeTarget(next.target, '#feedback-widget');
    if (next.embedMode === 'trigger') next.target = normalizeTarget(next.target, '#feedback-button');
    setConfig(next);
    setStatusMessage(`Applied preset - ${preset.name}`);
  };

  const scrollTabsIntoView = useCallback(() => {
    if (!tabsRef.current) return;
    tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goToStep = useCallback((direction: 'prev' | 'next') => {
    const nextIndex = direction === 'next'
      ? Math.min(stepOrder.length - 1, currentStepIndex + 1)
      : Math.max(0, currentStepIndex - 1);
    setActiveTab(stepOrder[nextIndex]);
    requestAnimationFrame(scrollTabsIntoView);
  }, [currentStepIndex, stepOrder, scrollTabsIntoView]);
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
  const snippetForPlatform = snippets.get(selectedPlatform) || '';
  const snippetLanguage = SNIPPET_LANGUAGES[selectedPlatform];
  const platformInstructions = PLATFORM_INSTRUCTIONS[selectedPlatform];

  const activePresetSlug = useMemo(() => {
    if (!presets.length || !defaultConfigRow) return null;
    return presets.find((preset) => hash(mergeConfig(DEFAULT_CONFIG, preset.config)) === savedHash)?.slug || null;
  }, [presets, defaultConfigRow, savedHash]);

  const filteredPresets = useMemo(() => {
    if (!presets.length) return [] as WidgetPreset[];
    return presets.filter((preset) => {
      const presetMode = (preset.config?.embedMode as (EmbedMode | 'any') | undefined) ?? 'modal';
      if (presetMode === 'any') return true;
      return presetMode === config.embedMode;
    });
  }, [presets, config.embedMode]);

  const inlinePresetActive = useMemo(() => {
    const borderValue = config.inlineBorder || 'none';
    const shadowValue = config.inlineShadow || 'none';
    return INLINE_STYLE_PRESETS.find((preset) => preset.border === borderValue && preset.shadow === shadowValue)?.label || null;
  }, [config.inlineBorder, config.inlineShadow]);

  const inlinePreviewStyle = useMemo<CSSProperties>(() => ({
    border: config.inlineBorder || '1px solid rgba(15,23,42,0.08)',
    boxShadow: config.inlineShadow || 'none',
    background: config.backgroundColor || '#ffffff',
  }), [config.inlineBorder, config.inlineShadow, config.backgroundColor]);

  const sections = (
    <div ref={tabsRef} className="space-y-6 sm:space-y-8">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          requestAnimationFrame(scrollTabsIntoView);
        }}
        className="w-full"
      >
        <TabsList className="mb-4 hidden w-full gap-2 sm:grid sm:grid-cols-2 sm:gap-2 lg:flex lg:flex-wrap">
          {steps.map((step, index) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              className="flex h-11 items-center justify-center rounded-lg border border-border bg-background px-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary sm:flex-1 sm:px-4 sm:text-xs sm:tracking-[0.2em]"
            >
              {index + 1}. {step.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {null}

      <TabsContent value="setup" className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader className={CARD_HEADER}>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Choose an experience</CardTitle>
            <CardDescription>Select how the widget should appear on your site.</CardDescription>
          </CardHeader>
          <CardContent className={CARD_CONTENT}>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {MODE_PRESETS.map((item) => {
                const active = config.embedMode === item.mode;
                return (
                  <button
                    type="button"
                    key={item.mode}
                    onClick={() => handleModeChange(item.mode)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-w-0 flex-1 flex-col items-start gap-1 rounded-md border px-2 py-2 text-left text-[11px] leading-snug transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-[200px] sm:px-3 sm:text-sm',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-[11px] leading-tight sm:text-sm">{item.title}</div>
                      <p className="text-[10px] text-muted-foreground leading-snug sm:text-xs">{item.description}</p>
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
            {filteredPresets.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin sm:grid sm:grid-cols-2 sm:gap-3">
                {filteredPresets.map((preset) => (
                  <PresetCard key={preset.slug} preset={preset} onApply={applyPreset} active={activePresetSlug === preset.slug} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-[11px] text-muted-foreground sm:text-sm">
                {presets.length === 0 ? 'Presets will appear here once configured in Supabase.' : 'Switch experiences to see presets tailored for that embed mode.'}
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
              <Label>Modal shape</Label>
              <Select value={config.modalShape} onValueChange={(value) => updateConfig({ modalShape: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Rounded" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_SHAPES.map((shape) => (
                    <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {!showAdvancedFields && (
              <div className="md:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvancedFields(true)}>Show advanced inputs</Button>
              </div>
            )}
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
              </div>
            )}
            <div className="md:col-span-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvancedFields(false)}>Hide advanced inputs</Button>
            </div>
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
              <Switch checked={!!config.requireCaptcha} onCheckedChange={(value) => updateConfig({ requireCaptcha: value })} />
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
              </div>
            </div>
            {config.captchaProvider === 'turnstile' && (
              <div className="space-y-2">
                <Label>Turnstile site key</Label>
                <Input value={config.turnstileSiteKey || ''} onChange={(event) => updateConfig({ turnstileSiteKey: event.target.value })} placeholder="0xAAAA..." />
              </div>
            )}
            {config.captchaProvider === 'hcaptcha' && (
              <div className="space-y-2">
                <Label>hCaptcha site key</Label>
                <Input value={config.hcaptchaSiteKey || ''} onChange={(event) => updateConfig({ hcaptchaSiteKey: event.target.value })} placeholder="10000000-ffff-ffff-ffff-000000000001" />
              </div>
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
                  <CopyButton className="h-7 px-2 text-[11px]" text={`<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#','')}"/>`} />
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
                  <CopyButton className="h-7 px-2 text-[11px]" text={`<button id="${normalizeTarget(config.target, '#feedback-button').replace('#','')}">Give feedback</button>`} />
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
              <Button size="sm" variant="outline" onClick={() => setShowAdvancedExperience((v)=>!v)}>{showAdvancedExperience ? 'Hide' : 'Show'} advanced</Button>
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
                {showAdvancedExperience && (
                  <p className="text-xs text-muted-foreground">Floating button updates instantly in the preview. Position defaults to bottom right for the polished concierge look.</p>
                )}
              </div>
            )}

            {config.embedMode === 'inline' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Container ID</Label>
                  <Input value={normalizeTarget(config.target, '#feedback-widget').replace('#', '')} onChange={(event) => updateConfig({ target: `#${event.target.value}` })} placeholder="feedback-widget" />
                </div>
                <CodeSnippet code={`<div id="${normalizeTarget(config.target, '#feedback-widget').replace('#', '')}"></div>`} language="html" />
                <p className="text-xs text-muted-foreground">Drop the div anywhere in your layout. The widget renders directly inside itâ€”no wrapper shell needed.</p>
              </div>
            )}

            {config.embedMode === 'trigger' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Button ID</Label>
                  <Input value={normalizeTarget(config.target, '#feedback-button').replace('#', '')} onChange={(event) => updateConfig({ target: `#${event.target.value}` })} placeholder="feedback-button" />
                </div>
                {showAdvancedExperience && (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <CodeSnippet code={`<button id="${normalizeTarget(config.target, '#feedback-button').replace('#', '')}">Give feedback</button>`} language="html" />
                      <CodeSnippet code={`<button data-feedbacks-trigger>Open feedback</button>`} language="html" />
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
                      <p className="font-medium text-foreground">How it works</p>
                      <p>Give any element the chosen id or <code>data-feedbacks-trigger</code> attribute. The widget script discovers it automatically after load.</p>
                      <p>If the button renders after hydration, instantiate <code>new FeedbacksWidget</code> once the element exists.</p>
                    </div>
                  </>
                )}
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
          <Button onClick={handleSave} disabled={loading || saving || !isDirty}>
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
                <Button variant="outline" size="sm" disabled={loading} className="h-9 px-3 text-xs">Reset</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => resetToSaved()}>Reset to Last Published</DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetToDefaults()}>Reset to Defaults</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleSave}
              disabled={loading || saving || !isDirty}
              size="sm"
              className="h-9 px-3 text-xs"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {saving ? 'Saving...' : isDirty ? 'Save & publish' : 'Saved'}
            </Button>
          </div>
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
        nextDisabled={activeTab === 'publish' ? saving || loading || !isDirty : !hasNext}
        showNext={activeTab === 'publish' ? true : hasNext}
      />

    </div>
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


















