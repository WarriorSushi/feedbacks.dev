'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CodeSnippet } from '@/components/code-snippet';
import { Globe, Smartphone, Code, Layers, Zap, Cpu } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  badge: string;
  code: string;
  description: string;
  language: string;
}

const platforms: Platform[] = [
  {
    id: 'html',
    name: 'HTML',
    icon: Globe,
    badge: 'Universal',
    description: 'Works with any website, framework, or CMS',
    language: 'html',
    code: `<script 
  src="https://cdn.feedbacks.dev/widget-1.0.0.js"
  data-project="pk_live_abc123"
  defer>
</script>`
  },
  {
    id: 'vanilla',
    name: 'Vanilla JS',
    icon: Code,
    badge: 'Pure JS',
    description: 'Zero dependencies, maximum compatibility',
    language: 'javascript',
    code: `import { initFeedback } from 'https://cdn.feedbacks.dev/widget-1.0.0.js';

initFeedback({
  projectKey: 'pk_live_abc123',
  position: 'bottom-right',
  theme: 'auto'
});`
  },
  {
    id: 'react',
    name: 'React',
    icon: Layers,
    badge: 'Component',
    description: 'Native React component with TypeScript support',
    language: 'jsx',
    code: `import { FeedbackWidget } from '@feedbacks/react';

function App() {
  return (
    <div>
      <FeedbackWidget 
        projectKey="pk_live_abc123"
        position="bottom-right"
        theme="auto"
      />
    </div>
  );
}`
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    icon: Zap,
    badge: 'SSR Ready',
    description: 'Server-side rendering compatible',
    language: 'jsx',
    code: `import dynamic from 'next/dynamic';

const FeedbackWidget = dynamic(
  () => import('@feedbacks/react').then(mod => mod.FeedbackWidget),
  { ssr: false }
);

export default function Layout({ children }) {
  return (
    <>
      {children}
      <FeedbackWidget projectKey="pk_live_abc123" />
    </>
  );
}`
  },
  {
    id: 'vue',
    name: 'Vue',
    icon: Layers,
    badge: 'Composition',
    description: 'Vue 3 composition API support',
    language: 'vue',
    code: `<script setup>
import { FeedbackWidget } from '@feedbacks/vue';

const config = {
  projectKey: 'pk_live_abc123',
  position: 'bottom-right',
  theme: 'auto'
};
</script>

<template>
  <div>
    <!-- Your app content -->
    <FeedbackWidget v-bind="config" />
  </div>
</template>`
  },
  {
    id: 'react-native',
    name: 'React Native',
    icon: Smartphone,
    badge: 'Mobile',
    description: 'Native mobile app integration',
    language: 'jsx',
    code: `import { FeedbackModal } from '@feedbacks/react-native';
import { useState } from 'react';

export default function App() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowFeedback(true)}>
        <Text>Give Feedback</Text>
      </TouchableOpacity>
      
      <FeedbackModal
        projectKey="pk_live_abc123"
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </View>
  );
}`
  },
  {
    id: 'flutter',
    name: 'Flutter',
    icon: Cpu,
    badge: 'Cross Platform',
    description: 'Dart package for iOS and Android',
    language: 'dart',
    code: `import 'package:feedbacks_dev/feedbacks_dev.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: YourContent(),
        floatingActionButton: FeedbackButton(
          projectKey: 'pk_live_abc123',
          theme: FeedbackTheme.auto,
        ),
      ),
    );
  }
}`
  }
];

export function PlatformIntegration() {
  const [activeTab, setActiveTab] = useState('html');
  const activePlatform = platforms.find(p => p.id === activeTab) || platforms[0];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-background to-muted/10" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm border-accent/20">
            <Code className="w-3 h-3 mr-2 text-accent" />
            Developer Experience
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">Integrate anywhere in</span>
            <span className="gradient-text block mt-1">seconds</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Choose your platform and get started immediately.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-8 max-w-6xl mx-auto">
          {/* Left Side - Platform Tabs */}
          <div className="space-y-3">
            <div className="lg:hidden mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isActive = activeTab === platform.id;
                  
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setActiveTab(platform.id)}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                        isActive 
                          ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                          : 'bg-background/60 hover:bg-background border-border hover:border-primary/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        isActive ? 'text-primary-foreground' : 'text-primary'
                      }`} />
                      <span className="font-medium">
                        {platform.name.length > 6 ? platform.name.slice(0,4) + '.' : platform.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop Tab List */}
            <div className="hidden lg:block space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Platforms</h3>
              {platforms.map((platform, index) => {
                const Icon = platform.icon;
                const isActive = activeTab === platform.id;
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => setActiveTab(platform.id)}
                    className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 text-left ${
                      isActive 
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02] translate-x-2' 
                        : 'bg-background/40 hover:bg-background/60 border-border/50 hover:border-primary/30 hover:translate-x-1'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary-foreground/20' 
                        : 'bg-primary/10 group-hover:bg-primary/15'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${
                        isActive ? 'text-primary-foreground' : 'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold transition-colors duration-300 ${
                        isActive ? 'text-primary-foreground' : 'text-foreground'
                      }`}>
                        {platform.name}
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {platform.description.split(',')[0]}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {platform.badge}
                    </Badge>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side - Code Display */}
          <div className="relative">
            <div className="sticky top-8">
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm shadow-xl transition-all duration-700 ease-out" key={activePlatform.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <activePlatform.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">
                          {activePlatform.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {activePlatform.description.split(',')[0]}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary text-xs">
                      {activePlatform.badge}
                    </Badge>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative transform transition-all duration-500 ease-out" style={{
                      transform: `translateY(0px)`,
                      opacity: 1
                    }}>
                      <CodeSnippet 
                        code={activePlatform.code} 
                        language={activePlatform.language}
                        className="shadow-sm border-primary/10 text-xs"
                      />
                    </div>
                  </div>
                  
                  {/* Quick tip */}
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Quick tip:</span> Replace{' '}
                      <code className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
                        pk_live_abc123
                      </code>{' '}
                      with your project key.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6 text-sm">
            Join developers building better products with user feedback
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {['Next.js', 'React', 'Vue', 'WordPress', 'Shopify'].map((tech, i) => (
              <Badge key={tech} variant="outline" className="bg-background/50 hover:bg-primary/10 transition-colors duration-300 cursor-default text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}