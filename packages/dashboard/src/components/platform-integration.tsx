'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeSnippet } from '@/components/code-snippet';
import { Globe, Smartphone, Code, Layers, Zap, Cpu, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  badge: string;
  code: string;
  description: string;
  language: string;
  isPrimary: boolean;
  popularity: number;
}

const platforms: Platform[] = [
  {
    id: 'html',
    name: 'Website',
    icon: Globe,
    badge: 'Ready',
    description: 'Works with any website, framework, or CMS',
    language: 'html',
    isPrimary: true,
    popularity: 95,
    code: `<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/1.1.0.css">
<script src="https://app.feedbacks.dev/cdn/widget/1.1.0.js"></script>

<script>
  new FeedbacksWidget({
    apiKey: 'feedbacks_dev_api_key_abc123',
    mode: 'floating'
  });
</script>`
  },
  {
    id: 'react',
    name: 'React',
    icon: Layers,
    badge: 'Ready',
    description: 'Framework-agnostic React integration with proper cleanup',
    language: 'jsx',
    isPrimary: true,
    popularity: 90,
    code: `import { useEffect, useRef } from 'react';

export default function FeedbackWidget() {
  const widgetRef = useRef(null);
  const configRef = useRef({
    apiKey: 'feedbacks_dev_api_key_abc123',
    mode: 'floating'
  });

  useEffect(() => {
    // Load CSS if not already loaded
    if (!document.querySelector('link[href="https://app.feedbacks.dev/cdn/widget/1.1.0.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://app.feedbacks.dev/cdn/widget/1.1.0.css';
      document.head.appendChild(link);
    }

    // Load and initialize widget
    const initWidget = () => {
      if (window.FeedbacksWidget) {
        widgetRef.current = new window.FeedbacksWidget(configRef.current);
      }
    };

    if (!window.FeedbacksWidget) {
      const script = document.createElement('script');
      script.src = 'https://app.feedbacks.dev/cdn/widget/1.1.0.js';
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    // Cleanup on unmount
    return () => {
      if (widgetRef.current && typeof widgetRef.current.destroy === 'function') {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, []);

  return null; // Widget renders itself
}`
  },
  {
    id: 'vue',
    name: 'Vue',
    icon: Layers,
    badge: 'Ready',
    description: 'Vue 3 Composition API with proper script loading',
    language: 'vue',
    isPrimary: true,
    popularity: 70,
    code: `<!-- FeedbackWidget.vue -->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const widget = ref(null)

onMounted(async () => {
  // Load CSS if not already loaded
  if (!document.querySelector('link[href="https://app.feedbacks.dev/cdn/widget/1.1.0.css"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://app.feedbacks.dev/cdn/widget/1.1.0.css'
    document.head.appendChild(link)
  }

  // Load and initialize widget
  const initWidget = () => {
    if (window.FeedbacksWidget) {
      widget.value = new window.FeedbacksWidget({
        apiKey: 'feedbacks_dev_api_key_abc123',
        mode: 'floating'
      })
    }
  }

  if (!window.FeedbacksWidget) {
    const script = document.createElement('script')
    script.src = 'https://app.feedbacks.dev/cdn/widget/1.1.0.js'
    script.onload = initWidget
    document.head.appendChild(script)
  } else {
    initWidget()
  }
})

onUnmounted(() => {
  if (widget.value && typeof widget.value.destroy === 'function') {
    widget.value.destroy()
    widget.value = null
  }
})
</script>

<template>
  <!-- Widget renders itself -->
</template>`
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: Zap,
    badge: 'Beta',
    description: 'WordPress integration (basic functions.php approach)',
    language: 'php',
    isPrimary: false,
    popularity: 60,
    code: `<!-- functions.php -->
function feedbacks_assets() {
  wp_enqueue_style('feedbacks-css', 'https://app.feedbacks.dev/cdn/widget/1.1.0.css');
  wp_enqueue_script('feedbacks-js', 'https://app.feedbacks.dev/cdn/widget/1.1.0.js', array(), null, true);
  wp_add_inline_script('feedbacks-js', 'new FeedbacksWidget({ apiKey: "feedbacks_dev_api_key_abc123", mode: "floating" });');
}
add_action('wp_enqueue_scripts', 'feedbacks_assets');`
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: Code,
    badge: 'Beta',
    description: 'Shopify theme integration (basic theme.liquid approach)',
    language: 'liquid',
    isPrimary: false,
    popularity: 50,
    code: `{% comment %} theme.liquid {% endcomment %}
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/1.1.0.css">
<script src="https://app.feedbacks.dev/cdn/widget/1.1.0.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function(){
  new FeedbacksWidget({
    apiKey: 'feedbacks_dev_api_key_abc123',
    mode: 'floating'
  });
});
</script>`
  }
];

export function PlatformIntegration() {
  const [activeTab, setActiveTab] = useState('html');
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  
  // Sort platforms by popularity and separate primary from secondary
  const sortedPlatforms = platforms.sort((a, b) => b.popularity - a.popularity);
  const primaryPlatforms = sortedPlatforms.filter(p => p.isPrimary);
  const secondaryPlatforms = sortedPlatforms.filter(p => !p.isPrimary);
  
  const visiblePlatforms = showAllPlatforms 
    ? sortedPlatforms 
    : primaryPlatforms;
    
  const activePlatform = platforms.find(p => p.id === activeTab) || platforms[0];

  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-8 md:mb-12">
          <Badge variant="outline" className="mb-4 px-3 py-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <Code className="w-3 h-3 mr-1.5" />
            Integration
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
            <span className="gradient-text">Web-first integration</span>
          </h2>
          <p className="text-sm md:text-base lg:text-lg max-w-xl mx-auto text-gray-600 dark:text-gray-400 px-4">
            Perfect for websites and web applications. Choose your platform and get the code instantly.
          </p>
        </div>

        {/* Sidebar Layout */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-premium-xl overflow-hidden">
            <div className="grid lg:grid-cols-[280px_1fr] min-h-[400px] md:min-h-[500px]">
              {/* Left Sidebar - Platform Tabs */}
              <div className="border-b lg:border-b-0 lg:border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="p-3 md:p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="font-semibold text-sm md:text-base text-foreground">Choose Platform</h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Select your framework</p>
                </div>

                <div className="p-1 overflow-x-auto lg:overflow-x-visible">
                  <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    const isActive = activeTab === platform.id;
                    
                    return (
                      <button
                        key={platform.id}
                        onClick={() => setActiveTab(platform.id)}
                        className={`w-auto lg:w-full flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 text-left whitespace-nowrap lg:whitespace-normal ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 border-gray-200/30 dark:border-gray-700/30 hover:border-primary/30'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          isActive 
                            ? 'bg-primary-foreground/20' 
                            : 'bg-primary/10'
                        }`}>
                          <Icon className={`w-3 h-3 ${
                            isActive ? 'text-primary-foreground' : 'text-primary'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-xs ${
                            isActive ? 'text-primary-foreground' : 'text-foreground'
                          }`}>
                            {platform.name}
                          </div>
                          <div className={`text-[10px] leading-tight ${
                            isActive ? 'text-primary-foreground/80' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {platform.badge}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              </div>

              {/* Right Side - Code Display */}
              <div className="p-4 md:p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <activePlatform.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-base md:text-lg">
                      {activePlatform.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {activePlatform.description}
                    </p>
                  </div>
                </div>

                <div className="relative group flex-1">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <CodeSnippet 
                      code={activePlatform.code} 
                      language={activePlatform.language}
                      className="border border-gray-200/50 dark:border-gray-700/50"
                    />
                  </div>
                </div>
                
                {/* Quick tip - Sticky to bottom */}
                <div className="mt-3 md:mt-4 p-2 md:p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    💡 Key will be automatically replaced with your personalized key in the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Production-ready for websites and modern web frameworks
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {['Website', 'React', 'Vue'].map((tech, i) => (
              <Badge key={tech} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-300 cursor-default text-xs border-green-200 dark:border-green-800">
                ✅ {tech}
              </Badge>
            ))}
            {['WordPress', 'Shopify'].map((tech, i) => (
              <Badge key={tech} variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors duration-300 cursor-default text-xs border-amber-200 dark:border-amber-700">
                ⚠️ {tech}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
