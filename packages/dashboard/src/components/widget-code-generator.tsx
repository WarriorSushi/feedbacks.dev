"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CodeSnippet } from "@/components/code-snippet";

type Mode = "modal" | "inline" | "trigger";
type Platform =
  | "website"
  | "react"
  | "vue"
  | "react-native"
  | "flutter"
  | "wordpress"
  | "shopify";

interface WidgetCodeGeneratorProps {
  projectKey: string;
  widgetVersion?: string; // e.g., "latest" or "1.0"
  projectId?: string;
}

export function WidgetCodeGenerator({ projectKey, widgetVersion = "latest", projectId }: WidgetCodeGeneratorProps) {
  const [mode, setMode] = useState<Mode>("inline");
  const [platform, setPlatform] = useState<Platform>("website");
  const [position, setPosition] = useState("bottom-right");
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [buttonText, setButtonText] = useState<string>("");
  const [containerId, setContainerId] = useState<string>("feedback-widget");
  const [triggerId, setTriggerId] = useState<string>("feedback-btn");
  const [requireEmail, setRequireEmail] = useState<boolean>(false);
  const [enableType, setEnableType] = useState<boolean>(true);
  const [enableRating, setEnableRating] = useState<boolean>(true);
  const [enableScreenshot, setEnableScreenshot] = useState<boolean>(false);
  const [screenshotRequired, setScreenshotRequired] = useState<boolean>(false);
  const [enablePriority, setEnablePriority] = useState<boolean>(false);
  const [enableTags, setEnableTags] = useState<boolean>(false);
  const [successTitle, setSuccessTitle] = useState<string>("");
  const [successDescription, setSuccessDescription] = useState<string>("");
  const [enableAttachment, setEnableAttachment] = useState<boolean>(false);
  const [attachmentMaxMB, setAttachmentMaxMB] = useState<string>('5');
  const [viewport, setViewport] = useState<'desktop'|'mobile'>("desktop");
  const [scale, setScale] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [ultra, setUltra] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(600);
  const [showUltraTip, setShowUltraTip] = useState<boolean>(false);
  const [modalShape, setModalShape] = useState<'rounded'|'pill'|'square'>('rounded');
  const [headerIcon, setHeaderIcon] = useState<'none'|'chat'|'star'|'lightbulb'|'thumbs-up'>('none');
  const [headerLayout, setHeaderLayout] = useState<'text-only'|'icon-left'|'icon-top'>('text-only');
  const [spacing, setSpacing] = useState<number>(24);
  const [modalWidth, setModalWidth] = useState<number>(480);
  const [selectedPresetOption, setSelectedPresetOption] = useState<string>("");
  // Anti-spam (client-side rendering options)
  const [requireCaptcha, setRequireCaptcha] = useState<boolean>(false);
  const [captchaProvider, setCaptchaProvider] = useState<'turnstile'|'hcaptcha'|'none'>("none");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>("");
  const [hcaptchaSiteKey, setHcaptchaSiteKey] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  useEffect(() => { if (typeof window !== 'undefined') setShowAdvanced(window.innerWidth >= 768); }, []);
  // Simple contrast checks for accessibility
  function contrastRatio(hex: string): number | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null; const h = m[1];
    const r = parseInt(h.slice(0,2),16)/255, g=parseInt(h.slice(2,4),16)/255, b=parseInt(h.slice(4,6),16)/255;
    const rl = r<=0.03928?r/12.92:Math.pow((r+0.055)/1.055,2.4);
    const gl = g<=0.03928?g/12.92:Math.pow((g+0.055)/1.055,2.4);
    const bl = b<=0.03928?b/12.92:Math.pow((b+0.055)/1.055,2.4);
    const L = 0.2126*rl + 0.7152*gl + 0.0722*bl;
    const ratio = (1 + 0.05) / (L + 0.05);
    return Math.round(ratio*100)/100;
  }
  // Contrast between two colors (bg vs text)
  const contrastBetween = (bg: string, text: string): number | null => {
    const norm = (v: string) => {
      const m = /^#?([0-9a-f]{6})$/i.exec(v || '');
      return m ? `#${m[1].toLowerCase()}` : '';
    };
    const hexToLin = (hex: string) => {
      const h = hex.replace('#','');
      const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
      const lin = (c:number)=> c<=0.03928? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
      const L = 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
      return L;
    };
    const b = norm(bg), t = norm(text);
    if (!b || !t) return null;
    const Lb = hexToLin(b), Lt = hexToLin(t);
    const lighter = Math.max(Lb, Lt), darker = Math.min(Lb, Lt);
    return Math.round(((lighter+0.05)/(darker+0.05))*100)/100;
  };
  const wcagSummary = (ratio: number) => {
    return {
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    };
  };
  const normalizeHex = (v: string): string => {
    if (!v) return "";
    const m = /^#?([0-9a-f]{6})$/i.exec(v);
    if (m) return `#${m[1].toLowerCase()}`;
    return v;
  };
  const a11yRatio = useMemo(()=> primaryColor ? contrastRatio(normalizeHex(primaryColor)) : null, [primaryColor]);
  const buttonTextOnPrimary = useMemo(()=> {
    const pc = normalizeHex(primaryColor) || '#3b82f6';
    const white = contrastBetween(pc, '#ffffff');
    const black = contrastBetween(pc, '#111827');
    return { white, black };
  }, [primaryColor]);
  const colorPickerValue = useMemo(()=> {
    const n = normalizeHex(primaryColor);
    return n && /^#([0-9a-f]{6})$/i.test(n) ? n : '#3b82f6';
  }, [primaryColor]);
  const [formBg, setFormBg] = useState<string>('');
  const formBgPicker = useMemo(()=> {
    const n = normalizeHex(formBg);
    return n && /^#([0-9a-f]{6})$/i.test(n) ? n : '#ffffff';
  }, [formBg]);
  const [inlineBorder, setInlineBorder] = useState<string>('');
  const [inlineShadow, setInlineShadow] = useState<string>('');
  const bgContrast = useMemo(()=>{
    const n = normalizeHex(formBg);
    const m = /^#([0-9a-f]{6})$/i.exec(n||'');
    if (!m) return null;
    const white = contrastBetween(`#${m[1]}`, '#ffffff');
    const black = contrastBetween(`#${m[1]}`, '#111827');
    const best = (white ?? 0) >= (black ?? 0) ? { ratio: white!, text: '#ffffff' } : { ratio: black!, text: '#111827' };
    return { ...best, white, black } as { ratio: number; text: '#ffffff'|'#111827'; white: number|null; black: number|null };
  }, [formBg]);

  function adjustColor(hex: string, amount: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex;
    let r = parseInt(m[1].slice(0,2),16);
    let g = parseInt(m[1].slice(2,4),16);
    let b = parseInt(m[1].slice(4,6),16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    const toHex = (v:number)=> v.toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  const previewJsHref = `/cdn/widget/${widgetVersion}.js`;
  const previewCssHref = `/cdn/widget/${widgetVersion}.css`;
  const publicJsHref = `https://app.feedbacks.dev/cdn/widget/${widgetVersion}.js`;
  const publicCssHref = `https://app.feedbacks.dev/cdn/widget/${widgetVersion}.css`;

  // Build current config first, then derive entries for snippets so Simple mode doesn't leak advanced fields
  const currentConfig = useMemo(() => ({
    projectKey,
    embedMode: mode,
    ...(mode === 'modal' ? { position } : {}),
    ...(mode === 'inline' ? { target: `#${containerId}` } : {}),
    ...(mode === 'trigger' ? { target: `#${triggerId}` } : {}),
    ...(primaryColor ? { primaryColor: normalizeHex(primaryColor) } : {}),
    ...(formBg ? { backgroundColor: normalizeHex(formBg) } : {}),
    ...(scale && scale !== 1 ? { scale } : {}),
    ...(buttonText && mode === 'modal' ? { buttonText } : {}),
    ...(requireEmail ? { requireEmail: true } : {}),
    ...(enableType === false ? { enableType: false } : {}),
    ...(enableRating === false ? { enableRating: false } : {}),
    ...(enableScreenshot ? { enableScreenshot: true } : {}),
    ...(screenshotRequired ? { screenshotRequired: true } : {}),
    // Advanced fields added only in Ultra
    ...(ultra && requireCaptcha ? { requireCaptcha: true } : {}),
    ...(ultra && captchaProvider && captchaProvider !== 'none' ? { captchaProvider } : {}),
    ...(ultra && captchaProvider === 'turnstile' && turnstileSiteKey ? { turnstileSiteKey } : {}),
    ...(ultra && captchaProvider === 'hcaptcha' && hcaptchaSiteKey ? { hcaptchaSiteKey } : {}),
    ...(ultra && enablePriority ? { enablePriority: true } : {}),
    ...(ultra && enableTags ? { enableTags: true } : {}),
    ...(ultra && successTitle ? { successTitle } : {}),
    ...(ultra && successDescription ? { successDescription } : {}),
    ...(ultra && enableAttachment ? { enableAttachment: true } : {}),
    ...(ultra && enableAttachment && attachmentMaxMB ? { attachmentMaxMB: Number(attachmentMaxMB) } : {}),
    ...(ultra && modalShape ? { modalShape } : {}),
    ...(ultra && headerIcon ? { headerIcon } : {}),
    ...(ultra && headerLayout ? { headerLayout } : {}),
    ...(ultra && spacing ? { spacing } : {}),
    ...(ultra && modalWidth ? { modalWidth } : {}),
  }), [
    projectKey,
    mode,
    position,
    containerId,
    triggerId,
    primaryColor,
    formBg,
    scale,
    buttonText,
    requireEmail,
    enableType,
    enableRating,
    enableScreenshot,
    screenshotRequired,
    // Ultra deps
    ultra,
    requireCaptcha,
    captchaProvider,
    turnstileSiteKey,
    hcaptchaSiteKey,
    enablePriority,
    enableTags,
    successTitle,
    successDescription,
    enableAttachment,
    attachmentMaxMB,
    modalShape,
    headerIcon,
    headerLayout,
    spacing,
    modalWidth,
  ]);

  const configEntries = useMemo(() => {
    const entries: Array<[string, string | number | boolean]> = [];
    for (const [k, v] of Object.entries(currentConfig)) {
      if (typeof v === 'undefined' || v === null) continue;
      entries.push([k, v as any]);
    }
    return entries;
  }, [currentConfig]);

  const configJs = useMemo(() => {
    const toLine = ([k, v]: [string, string | number | boolean]) =>
      typeof v === "string" && v.startsWith("#")
        ? `  ${k}: "${v}",`
        : typeof v === "string" && v.startsWith("#")
        ? `  ${k}: "${v}",`
        : typeof v === "string"
        ? `  ${k}: "${v}",`
        : `  ${k}: ${String(v)},`;
    return `{
${configEntries.map(toLine).join("\n")}
}`;
  }, [configEntries]);

  const websiteSnippet = useMemo(() => {
    const pre = [
      `<!-- Include widget assets -->`,
      `<script src="${publicJsHref}"></script>`,
      `<link rel="stylesheet" href="${publicCssHref}">`,
      "",
    ];
    const anchors: string[] = [];
    if (mode === "inline") anchors.push(`<div id="${containerId}"></div>`);
    if (mode === "trigger") anchors.push(`<button id="${triggerId}">Give Feedback</button>`);
    const init = [
      "<script>",
      `  new FeedbacksWidget(${configJs});`,
      "</script>",
    ];
    return [...pre, ...anchors, ...init].join("\n");
  }, [publicJsHref, publicCssHref, mode, containerId, triggerId, configJs]);

  const reactSnippet = useMemo(() => {
    const anchors = mode === "inline" ? `<div id="${containerId}" />` : mode === "trigger" ? `<button id="${triggerId}">Give Feedback</button>` : "";
    return `import Script from "next/script";
import { useEffect } from "react";

export default function FeedbackWidget() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).FeedbacksWidget) {
      new (window as any).FeedbacksWidget(${configJs});
    }
  }, []);
  
  return (
    <>
      <link rel="stylesheet" href="${publicCssHref}" />
      <Script src="${publicJsHref}" strategy="afterInteractive" />
      ${anchors}
    </>
  );
}`;
  }, [configJs, publicCssHref, publicJsHref, mode, containerId, triggerId]);

  const vueSnippet = useMemo(() => {
    const anchors = mode === "inline" ? `<div id="${containerId}"></div>` : mode === "trigger" ? `<button id="${triggerId}">Give Feedback</button>` : "";
    return `<!-- main.vue -->
<template>
  <link rel="stylesheet" href="${publicCssHref}" />
  ${anchors}
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  new window.FeedbacksWidget(${configJs})
})
</script>

<!-- Include once in index.html -->
<script src="${publicJsHref}"></script>`;
  }, [configJs, publicCssHref, publicJsHref, mode, containerId, triggerId]);

  const rnSnippet = `// React Native (WebView) pseudo-code
import { WebView } from 'react-native-webview';

export default function FeedbackWidget() {
  const html = ` + "`" + `<link rel=\"stylesheet\" href=\"${publicCssHref}\" />
<script src=\"${publicJsHref}\"></script>
<div id=\"root\"></div>
<script>new FeedbacksWidget(${configJs});</script>` + "`" + `;
  return <WebView originWhitelist={["*"]} source={{ html }} />;
}`;

  const flutterSnippet = `// Flutter (WebView) pseudo-code using webview_flutter
// Load an HTML string similar to React Native example and instantiate the widget.`;

  const wpSnippet = `// WordPress (shortcode) pseudo-code
// Provide a [feedbacks_widget] shortcode that prints the script + link tags and an inline init with your project key.`;

  const shopifySnippet = `// Shopify (Liquid) pseudo-code
// Add the script + link tags in theme.liquid and include an inline init in the relevant template.`;

  const snippet = useMemo(() => {
    switch (platform) {
      case "react":
        return reactSnippet;
      case "vue":
        return vueSnippet;
      case "react-native":
        return rnSnippet;
      case "flutter":
        return flutterSnippet;
      case "wordpress":
        return wpSnippet;
      case "shopify":
        return shopifySnippet;
      default:
        return websiteSnippet;
    }
  }, [platform, websiteSnippet, reactSnippet, vueSnippet, rnSnippet, flutterSnippet, wpSnippet, shopifySnippet]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewSrcDoc = useMemo(() => {
    const initial = {
      projectKey,
      embedMode: mode,
      ...(mode === 'modal' ? { position } : {}),
      ...(mode === 'inline' ? { target: '#inline-anchor' } : {}),
      ...(mode === 'trigger' ? { target: '#trigger-anchor' } : {}),
      ...(primaryColor ? { primaryColor: normalizeHex(primaryColor) } : {}),
      ...(formBg ? { backgroundColor: normalizeHex(formBg) } : {}),
      ...(buttonText && mode === 'modal' ? { buttonText } : {}),
      ...(requireEmail ? { requireEmail: true } : {}),
      ...(requireCaptcha ? { requireCaptcha: true } : {}),
      ...(captchaProvider && captchaProvider !== 'none' ? { captchaProvider } : {}),
      ...(captchaProvider === 'turnstile' && turnstileSiteKey ? { turnstileSiteKey } : {}),
      ...(captchaProvider === 'hcaptcha' && hcaptchaSiteKey ? { hcaptchaSiteKey } : {}),
      ...(enableType === false ? { enableType: false } : {}),
      ...(enableRating === false ? { enableRating: false } : {}),
      ...(enableScreenshot ? { enableScreenshot: true } : {}),
      ...(screenshotRequired ? { screenshotRequired: true } : {}),
      ...(enablePriority ? { enablePriority: true } : {}),
      ...(enableTags ? { enableTags: true } : {}),
      ...(enableAttachment ? { enableAttachment: true } : {}),
      ...(enableAttachment && attachmentMaxMB ? { attachmentMaxMB: Number(attachmentMaxMB) } : {}),
      ...(successTitle ? { successTitle } : {}),
      ...(successDescription ? { successDescription } : {}),
      ...(scale && scale !== 1 ? { scale } : {}),
      ...(modalShape ? { modalShape } : {}),
      ...(headerIcon ? { headerIcon } : {}),
      ...(headerLayout ? { headerLayout } : {}),
      ...(spacing ? { spacing } : {}),
      ...(modalWidth ? { modalWidth } : {}),
      ...(inlineBorder ? { inlineBorder } : {}),
      ...(inlineShadow ? { inlineShadow } : {}),
    };
    const initialJson = JSON.stringify(initial).replace(/</g, '\\u003c');
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="${previewCssHref}" />
    <style>body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; padding:16px;} button{all:unset}</style>
  </head>
  <body>
    <div id="inline-anchor"></div>
    <button id="trigger-anchor" data-feedbacks-trigger style="display:none;border:1px solid #e5e7eb;border-radius:6px;padding:6px 10px;cursor:pointer">Give Feedback</button>
    <script src="${previewJsHref}"></script>
    <script>
      (function(){
        var pending = ${initialJson};
        function postHeight(){ try{ parent.postMessage({ type: 'widget-preview:height', height: document.body.scrollHeight }, '*'); }catch(e){} }
        function cleanup(){
          try{document.querySelectorAll('.feedbacks-overlay').forEach(function(e){e.remove()});}catch(e){}
          try{var btn = document.querySelector('.feedbacks-button'); if (btn) btn.remove();}catch(e){}
          try{document.querySelectorAll('.feedbacks-inline-container').forEach(function(e){e.remove()});}catch(e){}
        }
        function apply(cfg){
          cleanup();
          var inlineEl = document.getElementById('inline-anchor');
          var triggerEl = document.getElementById('trigger-anchor');
          if (inlineEl) inlineEl.style.display = cfg.embedMode === 'inline' ? 'block' : 'none';
          if (triggerEl) triggerEl.style.display = cfg.embedMode === 'trigger' ? 'inline-block' : 'none';
          if (cfg.embedMode === 'inline') cfg.target = '#inline-anchor';
          if (cfg.embedMode === 'trigger') cfg.target = '#trigger-anchor';
          if (cfg.primaryColor) document.documentElement.style.setProperty('--feedbacks-primary', cfg.primaryColor);
          if (cfg.backgroundColor) document.documentElement.style.setProperty('--feedbacks-bg', cfg.backgroundColor);
          if (typeof cfg.spacing === 'number') document.documentElement.style.setProperty('--feedbacks-spacing', String(cfg.spacing)+'px');
          if (cfg.modalShape){
            var r = cfg.modalShape==='pill'?'9999px':(cfg.modalShape==='square'?'8px':'16px');
            document.documentElement.style.setProperty('--feedbacks-radius', r);
          }
          if (cfg.inlineBorder) document.documentElement.style.setProperty('--feedbacks-border', cfg.inlineBorder);
          if (cfg.inlineShadow) document.documentElement.style.setProperty('--feedbacks-shadow', cfg.inlineShadow);
          new FeedbacksWidget(cfg);
          // Post height immediately and repeatedly to ensure it's captured
          postHeight();
          setTimeout(postHeight, 10);
          setTimeout(postHeight, 50);
          setTimeout(postHeight, 100);
        }
        function ready(){ if (typeof FeedbacksWidget === 'function') { apply(pending); pending = null; } else setTimeout(ready, 30); }
        ready();
        window.addEventListener('message', function(ev){
          if (!ev || !ev.data || ev.data.type !== 'widget-preview:update') return;
          var cfg = ev.data.config || {};
          clearTimeout(window.__previewTimer);
          window.__previewTimer = setTimeout(function(){ apply(cfg); }, 50);
        });
        new MutationObserver(function(){ postHeight(); }).observe(document.body, { childList: true, subtree: true });
        window.addEventListener('load', postHeight);
      })();
    </script>
  </body>
  </html>`;
  }, [previewCssHref, previewJsHref]);

  // currentConfig moved above to allow gating and reuse

  // Push live updates without reloading the iframe
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try { win.postMessage({ type: 'widget-preview:update', config: currentConfig }, '*'); } catch {}
  }, [currentConfig]);

  // Prefill captcha provider/keys from settings when enabling captcha
  useEffect(() => {
    (async () => {
      if (!requireCaptcha || captchaProvider !== 'none') return;
      try {
        const res = await fetch('/api/settings/anti-spam');
        if (!res.ok) return;
        const s = await res.json();
        const def = s.defaultProvider || 'none';
        if (def === 'turnstile') {
          if (s.turnstileSiteKey) setTurnstileSiteKey(s.turnstileSiteKey);
          setCaptchaProvider('turnstile');
        } else if (def === 'hcaptcha') {
          if (s.hcaptchaSiteKey) setHcaptchaSiteKey(s.hcaptchaSiteKey);
          setCaptchaProvider('hcaptcha');
        }
      } catch {}
    })();
  }, [requireCaptcha]);

  // Auto-resize iframe to fit widget content
  useEffect(() => {
    function onMsg(ev: MessageEvent){
      if (!ev || !ev.data) return;
      if (ev.data.type === 'widget-preview:height' && typeof ev.data.height === 'number') {
        // Use actual content height but with reasonable minimums
        const minHeight = viewport === 'mobile' ? 500 : 850;
        setIframeHeight(Math.max(ev.data.height + 20, minHeight));
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [viewport]);

  const saveDefaults = async () => {
    if (!projectId) return;
    try {
      setIsSaving(true); setMessage("");
      const res = await fetch(`/api/projects/${projectId}/widget-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentConfig),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage('Saved defaults');
    } catch (e: any) {
      setMessage('Save failed');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const applyConfig = (cfg: any) => {
    if (!cfg || typeof cfg !== 'object') return;
    if (cfg.embedMode) setMode(cfg.embedMode);
    if (cfg.position) setPosition(cfg.position);
    if (cfg.primaryColor) setPrimaryColor(cfg.primaryColor);
    if (cfg.backgroundColor) setFormBg(cfg.backgroundColor);
    if (typeof cfg.scale === 'number') setScale(cfg.scale);
    if (cfg.buttonText) setButtonText(cfg.buttonText);
    if (cfg.requireCaptcha) setRequireCaptcha(!!cfg.requireCaptcha);
    if (cfg.captchaProvider) setCaptchaProvider(cfg.captchaProvider);
    if (cfg.turnstileSiteKey) setTurnstileSiteKey(cfg.turnstileSiteKey);
    if (cfg.hcaptchaSiteKey) setHcaptchaSiteKey(cfg.hcaptchaSiteKey);
    if (cfg.target) {
      if (cfg.embedMode === 'inline') setContainerId(String(cfg.target).replace('#',''));
      if (cfg.embedMode === 'trigger') setTriggerId(String(cfg.target).replace('#',''));
    }
    setRequireEmail(!!cfg.requireEmail);
    setEnableType(cfg.enableType !== false);
    setEnableRating(cfg.enableRating !== false);
    setEnableScreenshot(!!cfg.enableScreenshot);
    setScreenshotRequired(!!cfg.screenshotRequired);
    setEnablePriority(!!cfg.enablePriority);
    setEnableTags(!!cfg.enableTags);
    if (cfg.successTitle) setSuccessTitle(cfg.successTitle);
    if (cfg.successDescription) setSuccessDescription(cfg.successDescription);
    setEnableAttachment(!!cfg.enableAttachment);
    if (cfg.attachmentMaxMB) setAttachmentMaxMB(String(cfg.attachmentMaxMB));
    if (cfg.modalShape) setModalShape(cfg.modalShape);
    if (cfg.headerIcon) setHeaderIcon(cfg.headerIcon);
    if (cfg.headerLayout) setHeaderLayout(cfg.headerLayout);
    if (typeof cfg.spacing === 'number') setSpacing(cfg.spacing);
    if (typeof cfg.modalWidth === 'number') setModalWidth(cfg.modalWidth);
  };

  const loadDefaults = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/widget-config`);
      if (!res.ok) return;
      const cfg = await res.json();
      if (!cfg || typeof cfg !== 'object') return;
      applyConfig(cfg);
    } catch (e) { /* ignore */ }
  };

  // Auto-load when projectId provided
  useEffect(() => {
    if (projectId) {
      loadDefaults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <TooltipProvider>
    <div className="space-y-6 relative">
      {(!ultra && showUltraTip) && (
        <div className="absolute right-2 -top-2 z-10 animate-in fade-in-0 zoom-in-95">
          <div className="rounded-md bg-popover border px-3 py-2 text-xs text-popover-foreground shadow-md">
            Try Ultra mode for more customisations
          </div>
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border p-1 bg-muted/40">
          <Button variant={ultra ? "ghost" : "default"} size="sm" onClick={()=> setUltra(false)} className={!ultra ? "bg-primary text-primary-foreground" : ""}>Simple</Button>
          <Button variant={ultra ? "default" : "ghost"} size="sm" onClick={()=> setUltra(true)} className={ultra ? "bg-primary text-primary-foreground" : ""}>Ultra</Button>
        </div>
        <Button variant="outline" size="sm" onClick={()=>{
          setMode('inline'); setPlatform('website'); setPosition('bottom-right'); setPrimaryColor(''); setFormBg(''); setScale(1);
          setButtonText(''); setContainerId('feedback-widget'); setTriggerId('feedback-btn');
          setRequireEmail(false); setEnableType(true); setEnableRating(true); setEnableScreenshot(false); setScreenshotRequired(false);
          setEnablePriority(false); setEnableTags(false); setEnableAttachment(false); setAttachmentMaxMB('5'); setSuccessTitle(''); setSuccessDescription('');
          setRequireCaptcha(false); setCaptchaProvider('none'); setTurnstileSiteKey(''); setHcaptchaSiteKey('');
          setInlineBorder(''); setInlineShadow('');
        }}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>
      {/* Main layout: left controls + right preview/snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Tiny Mode selector (always visible) + Platform (Ultra only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Mode</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">How the widget appears. Modal shows a floating button; Inline embeds the form; Trigger attaches to your button.</PopoverContent>
                </Popover>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 p-1">
                <Button size="sm" variant={mode==='modal'?'default':'ghost'} onClick={()=> setMode('modal')} className={mode==='modal'?"bg-primary text-primary-foreground":""}>Modal</Button>
                <Button size="sm" variant={mode==='inline'?'default':'ghost'} onClick={()=> setMode('inline')} className={mode==='inline'?"bg-primary text-primary-foreground":""}>Inline</Button>
                <Button size="sm" variant={mode==='trigger'?'default':'ghost'} onClick={()=> setMode('trigger')} className={mode==='trigger'?"bg-primary text-primary-foreground":""}>Trigger</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {mode === 'modal' && 'Floating button opens a popup.'}
                {mode === 'inline' && 'Embed the form into your page.'}
                {mode === 'trigger' && 'Attach to your existing button.'}
              </p>
            </div>
            {ultra && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Platform</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="text-xs">Generates code tailored to your stack</PopoverContent>
                  </Popover>
                </div>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website (script tag)</SelectItem>
                    <SelectItem value="react">React / Next.js</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="react-native">React Native</SelectItem>
                    <SelectItem value="flutter">Flutter</SelectItem>
                    <SelectItem value="wordpress">WordPress</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Presets (Ultra only) */}
          {ultra && (
          <div className="flex items-center gap-3">
            <Label>Apply Preset:</Label>
            <Select value={selectedPresetOption} onValueChange={(value) => {
              setSelectedPresetOption(value);
              // Apply preset configurations
              if (mode !== 'inline') {
                switch (value) {
                  case 'default':
                    setPosition('bottom-right'); setPrimaryColor('#3b82f6'); setFormBg('#ffffff'); setButtonText('Feedback'); setRequireEmail(false); setEnableType(true); setEnableRating(true); setEnableScreenshot(false); setModalWidth(480); setSpacing(24);
                    break;
                  case 'minimal':
                    setPosition('bottom-right'); setPrimaryColor(''); setFormBg('#ffffff'); setButtonText('Send'); setRequireEmail(false); setEnableType(false); setEnableRating(false); setEnableScreenshot(false); setModalWidth(480); setSpacing(20);
                    break;
                  case 'high-contrast':
                    setPosition('bottom-right'); setPrimaryColor('#111827'); setFormBg('#ffffff'); setButtonText('Feedback'); setRequireEmail(true); setEnableType(true); setEnableRating(true); setEnableScreenshot(true); setModalWidth(480); setSpacing(24);
                    break;
                  case 'compact':
                    setModalWidth(400); setSpacing(16);
                    break;
                  case 'wide':
                    setModalWidth(640); setSpacing(28);
                    break;
                }
              } else {
                switch (value) {
                  case 'inline-card':
                    setFormBg('#ffffff'); setInlineBorder('1px solid #e5e7eb'); setInlineShadow('0 2px 8px rgba(0,0,0,0.05)'); setSpacing(24); setHeaderLayout('text-only'); setHeaderIcon('none'); setEnableType(true); setEnableRating(true); setPrimaryColor('#3b82f6');
                    break;
                  case 'inline-compact':
                    setFormBg('#ffffff'); setInlineBorder('1px solid #e5e7eb'); setInlineShadow('0 2px 8px rgba(0,0,0,0.05)'); setSpacing(16); setHeaderLayout('icon-left'); setHeaderIcon('chat'); setEnableType(false); setEnableRating(true); setPrimaryColor('#3b82f6');
                    break;
                  case 'inline-minimal':
                    setFormBg('#ffffff'); setInlineBorder('1px solid #e5e7eb'); setInlineShadow('none'); setSpacing(12); setHeaderLayout('text-only'); setHeaderIcon('none'); setEnableType(false); setEnableRating(false); setPrimaryColor('');
                    break;
                  case 'inline-borderless':
                    setFormBg('transparent'); setInlineBorder('0 solid transparent'); setInlineShadow('none'); setSpacing(24); setHeaderLayout('text-only'); setHeaderIcon('none'); setEnableType(true); setEnableRating(true); setPrimaryColor('#3b82f6');
                    break;
                  case 'inline-elevated':
                    setFormBg('#ffffff'); setInlineBorder('1px solid #e5e7eb'); setInlineShadow('0 10px 30px rgba(0,0,0,0.12)'); setSpacing(24); setHeaderLayout('icon-top'); setHeaderIcon('star'); setEnableType(true); setEnableRating(true); setPrimaryColor('#3b82f6');
                    break;
                  case 'inline-section':
                    setFormBg('#f8fafc'); setInlineBorder('1px solid #e5e7eb'); setInlineShadow('none'); setSpacing(20); setHeaderLayout('text-only'); setHeaderIcon('none'); setEnableType(true); setEnableRating(false); setPrimaryColor('#3b82f6');
                    break;
                }
              }
              // Clear selection after applying
              setTimeout(() => setSelectedPresetOption(""), 100);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choose a preset..." />
              </SelectTrigger>
              <SelectContent>
                {mode !== 'inline' ? (
                  <>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="high-contrast">High Contrast</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="inline-card">Card</SelectItem>
                    <SelectItem value="inline-compact">Compact</SelectItem>
                    <SelectItem value="inline-minimal">Minimal</SelectItem>
                    <SelectItem value="inline-borderless">Borderless</SelectItem>
                    <SelectItem value="inline-elevated">Elevated</SelectItem>
                    <SelectItem value="inline-section">Section</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          )}


          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === "modal" && (
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {ultra && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Submit Button Color</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">Sets the primary color used for the submit button and accents</PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="#3b82f6" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                <input type="color" value={colorPickerValue} onChange={(e)=> setPrimaryColor(e.target.value)} className="h-9 w-10 rounded-md border" />
              </div>
              {buttonTextOnPrimary.white !== null && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Button text on primary</span> —
                  <span className={`ml-1 ${buttonTextOnPrimary.white && buttonTextOnPrimary.white >= 3 ? 'text-green-600' : 'text-destructive'}`}>
                    white {buttonTextOnPrimary.white}:1 {buttonTextOnPrimary.white && buttonTextOnPrimary.white >= 3 ? '(AA Large ✓)' : '(AA Large ✗)'}
                  </span>
                  <span className="mx-1">/</span>
                  <span className={`${buttonTextOnPrimary.black && buttonTextOnPrimary.black >= 3 ? 'text-green-600' : 'text-destructive'}`}>
                    dark {buttonTextOnPrimary.black}:1 {buttonTextOnPrimary.black && buttonTextOnPrimary.black >= 3 ? '(AA Large ✓)' : '(AA Large ✗)'}
                  </span>
                </div>
              )}
              {/* Removed darker/lighter buttons for simplicity */}
            </div>
            )}
            {/* Form Background Color */}
            {ultra && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Form Background Color</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">Sets the background of the modal/inline form container</PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="#ffffff" value={formBg} onChange={(e) => setFormBg(e.target.value)} className="flex-1" />
                <input type="color" value={formBgPicker} onChange={(e)=> setFormBg(e.target.value)} className="h-9 w-10 rounded-md border" />
              </div>
              {bgContrast && (
                <div className="text-xs space-y-1">
                  <div>
                    <span className="font-medium">Light text</span> —
                    <span className={`ml-1 ${bgContrast.white && bgContrast.white >= 4.5 ? 'text-green-600' : 'text-destructive'}`}>
                      subtitle {bgContrast.white}:1 {bgContrast.white && bgContrast.white >= 4.5 ? '(AA ✓)' : '(below AA)'}
                    </span>
                    <span className="mx-1">/</span>
                    <span className={`${bgContrast.white && bgContrast.white >= 3 ? 'text-green-600' : 'text-destructive'}`}>
                      title {bgContrast.white}:1 {bgContrast.white && bgContrast.white >= 3 ? '(AA Large ✓)' : '(AA Large ✗)'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Dark text</span> —
                    <span className={`ml-1 ${bgContrast.black && bgContrast.black >= 4.5 ? 'text-green-600' : 'text-destructive'}`}>
                      subtitle {bgContrast.black}:1 {bgContrast.black && bgContrast.black >= 4.5 ? '(AA ✓)' : '(below AA)'}
                    </span>
                    <span className="mx-1">/</span>
                    <span className={`${bgContrast.black && bgContrast.black >= 3 ? 'text-green-600' : 'text-destructive'}`}>
                      title {bgContrast.black}:1 {bgContrast.black && bgContrast.black >= 3 ? '(AA Large ✓)' : '(AA Large ✗)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            )}
            {/* Size / Scale */}
            {ultra && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Size</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs">Adjust overall scale of the widget</PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <input type="range" min={0.6} max={1.0} step={0.05} value={scale} onChange={(e)=> setScale(parseFloat(e.target.value))} className="w-full" />
                <span className="text-xs tabular-nums w-10 text-right">{scale.toFixed(2)}x</span>
              </div>
            </div>
            )}
            {mode === "modal" && (
              <div className="space-y-2">
                <Label>Button Text (optional)</Label>
                <Input placeholder="Feedback" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
              </div>
            )}
            {/* Container ID moved to Ultra section */}
            {mode === "trigger" && (
              <div className="space-y-2">
                <Label>Trigger Button ID</Label>
                <Input value={triggerId} onChange={(e) => setTriggerId(e.target.value)} />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Screenshot Capture</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="text-xs">Allow users to include a page screenshot</PopoverContent>
                  </Popover>
                </div>
                <Switch checked={enableScreenshot} onCheckedChange={(v)=> setEnableScreenshot(!!v)} />
              </div>
              {enableScreenshot && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Require screenshot</span>
                  <Switch checked={screenshotRequired} onCheckedChange={(v)=> setScreenshotRequired(!!v)} />
                </div>
              )}
            </div>
            {ultra && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Priority Field</Label>
                  <Tooltip><TooltipTrigger asChild><span className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></span></TooltipTrigger><TooltipContent>Optional priority selector</TooltipContent></Tooltip>
                </div>
                <Switch checked={enablePriority} onCheckedChange={(v)=> setEnablePriority(!!v)} />
              </div>
            )}
            {ultra && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Tags Field</Label>
                </div>
                <Switch checked={enableTags} onCheckedChange={(v)=> setEnableTags(!!v)} />
              </div>
            )}
            {ultra && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Attachment</Label>
                  </div>
                  <Switch checked={enableAttachment} onCheckedChange={(v)=> setEnableAttachment(!!v)} />
                </div>
                {enableAttachment && (
                  <div className="space-y-2">
                    <Label>Attachment Size Limit (MB)</Label>
                    <Select value={attachmentMaxMB} onValueChange={setAttachmentMaxMB}>
                      <SelectTrigger>
                        <SelectValue placeholder="Max MB" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Require Email</Label>
              </div>
              <Switch checked={requireEmail} onCheckedChange={(v)=> setRequireEmail(!!v)} />
            </div>
            {/* Captcha options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Require Captcha</Label>
                <Popover><PopoverTrigger asChild><button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button></PopoverTrigger><PopoverContent className="text-xs">Enforce Turnstile or hCaptcha verification</PopoverContent></Popover>
              </div>
              <Switch checked={requireCaptcha} onCheckedChange={(v)=> setRequireCaptcha(!!v)} />
            </div>
            {ultra && requireCaptcha && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Use Turnstile</Label>
                  <Switch checked={captchaProvider==='turnstile'} onCheckedChange={(v)=> setCaptchaProvider(v? 'turnstile' : 'none' as any)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Use hCaptcha</Label>
                  <Switch checked={captchaProvider==='hcaptcha'} onCheckedChange={(v)=> setCaptchaProvider(v? 'hcaptcha' : 'none' as any)} />
                </div>
                {captchaProvider === 'turnstile' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Turnstile Site Key</Label>
                    <Input placeholder="0xAAAA..." value={turnstileSiteKey} onChange={(e)=>setTurnstileSiteKey(e.target.value)} />
                  </div>
                )}
                {captchaProvider === 'hcaptcha' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>hCaptcha Site Key</Label>
                    <Input placeholder="10000000-ffff-ffff-ffff-000000000001" value={hcaptchaSiteKey} onChange={(e)=>setHcaptchaSiteKey(e.target.value)} />
                  </div>
                )}
              </div>
            )}
            {/* provider keys rendered above under Ultra when required */}
            <div className="flex items-center justify-between">
              <Label>Category Field</Label>
              <Switch checked={enableType} onCheckedChange={(v)=> setEnableType(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Rating Field</Label>
              <Switch checked={enableRating} onCheckedChange={(v)=> setEnableRating(!!v)} />
            </div>
            {/* Success messages */}
            <div className="space-y-2 md:col-span-2">
              <Label>Success Title (optional)</Label>
              <Input placeholder="Thank you!" value={successTitle} onChange={(e)=>setSuccessTitle(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Success Description (optional)</Label>
              <textarea
                placeholder="Your feedback has been sent successfully. We'll review it and get back to you if needed."
                value={successDescription}
                onChange={(e)=>setSuccessDescription(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={3}
              />
            </div>
          </div>

          {/* Ultra Section */}
          {ultra && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Container / Target */}
                {mode === 'inline' && (
                  <div className="space-y-2">
                    <Label>Container ID</Label>
                    <Input value={containerId} onChange={(e) => setContainerId(e.target.value)} />
                  </div>
                )}
                {/* Modal Shape */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Modal Shape</Label>
                    <Popover><PopoverTrigger asChild><button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground"/></button></PopoverTrigger><PopoverContent className="text-xs">Controls border radius for modal and inline card</PopoverContent></Popover>
                  </div>
                  <Select value={modalShape} onValueChange={(v)=> setModalShape(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Shape" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="pill">Pill</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Header Icon */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Header Icon</Label>
                    <Popover><PopoverTrigger asChild><button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground"/></button></PopoverTrigger><PopoverContent className="text-xs">Choose an icon to display in the header</PopoverContent></Popover>
                  </div>
                  <Select value={headerIcon} onValueChange={(v)=> setHeaderIcon(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Icon" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="star">Star</SelectItem>
                      <SelectItem value="lightbulb">Lightbulb</SelectItem>
                      <SelectItem value="thumbs-up">Thumbs Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Header Layout */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Header Layout</Label>
                    <Popover><PopoverTrigger asChild><button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground"/></button></PopoverTrigger><PopoverContent className="text-xs">Position of icon relative to title</PopoverContent></Popover>
                  </div>
                  <Select value={headerLayout} onValueChange={(v)=> setHeaderLayout(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Layout" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-only">Text only</SelectItem>
                      <SelectItem value="icon-left">Icon left</SelectItem>
                      <SelectItem value="icon-top">Icon top</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Spacing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Spacing</Label>
                    <Popover><PopoverTrigger asChild><button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground"/></button></PopoverTrigger><PopoverContent className="text-xs">Adjust padding and gaps</PopoverContent></Popover>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="range" min={12} max={32} step={2} value={spacing} onChange={(e)=> setSpacing(parseInt(e.target.value))} className="w-full" />
                    <span className="text-xs tabular-nums w-10 text-right">{spacing}px</span>
                  </div>
                </div>
                {/* Modal Width */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Modal Width</Label>
                    <Popover><PopoverTrigger asChild><button type="button" className="inline-flex items-center cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground"/></button></PopoverTrigger><PopoverContent className="text-xs">Max width on desktop screens</PopoverContent></Popover>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="range" min={360} max={720} step={20} value={modalWidth} onChange={(e)=> setModalWidth(parseInt(e.target.value))} className="w-full" />
                    <span className="text-xs tabular-nums w-12 text-right">{modalWidth}px</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Code Snippet (always visible) */}
          <div className="space-y-2">
            <Label>Installation Code</Label>
            <CodeSnippet code={snippet} language="html" />
          </div>

          {/* Import/Export (Ultra only) */}
          {ultra && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={async ()=>{ try { await navigator.clipboard.writeText(JSON.stringify(currentConfig, null, 2)); setMessage('Exported to clipboard'); } catch {} }}>Export Config (JSON)</Button>
            <Button size="sm" variant="outline" onClick={async ()=>{ const val = window.prompt('Paste JSON config'); if (!val) return; try { const cfg = JSON.parse(val); applyConfig(cfg); setMessage('Imported'); } catch { setMessage('Invalid JSON'); } }}>Import Config (JSON)</Button>
          </div>
          )}

          {/* Save Defaults */}
          {projectId && (
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={saveDefaults} disabled={isSaving}>Save as Project Default</Button>
                </TooltipTrigger>
                <TooltipContent>Saves these choices as the default config for this project</TooltipContent>
              </Tooltip>
              {message && <span className="text-xs text-muted-foreground">{message}</span>}
            </div>
          )}
        </div>

        {/* Live Preview (always visible) */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div>
            <iframe
              ref={iframeRef}
              title="Widget Preview"
              style={{ width: viewport === 'mobile' ? 390 : '100%', height: iframeHeight, border: '0', background: 'transparent' }}
              srcDoc={previewSrcDoc}
            />
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/widget-demo?apiKey=${encodeURIComponent(projectKey)}&config=${encodeURIComponent(JSON.stringify(currentConfig))}`}
                 target="_blank" rel="noreferrer">
                Open Demo
              </a>
            </Button>
            <Select value={viewport} onValueChange={(v)=>setViewport(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Viewport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
