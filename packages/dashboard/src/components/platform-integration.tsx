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
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-muted/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_300px,hsl(var(--accent)/0.05),transparent)]" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-6 px-4 py-2 bg-background/80 backdrop-blur-sm border-accent/20">
            <Code className="w-4 h-4 mr-2 text-accent" />
            Developer Experience
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Integrate anywhere in</span>
            <span className="gradient-text block mt-2">seconds</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
            Choose your platform and get started immediately. Our SDKs work with every major framework and platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Platform Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isActive = activeTab === platform.id;
              
              return (
                <button
                  key={platform.id}
                  onClick={() => setActiveTab(platform.id)}
                  className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' 
                      : 'bg-background/60 hover:bg-background border-border hover:border-primary/30 backdrop-blur-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors duration-300 ${
                    isActive ? 'text-primary-foreground' : 'text-primary group-hover:text-primary'
                  }`} />
                  <span className={`font-medium transition-colors duration-300 ${
                    isActive ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {platform.name}
                  </span>
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
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Code Display */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <activePlatform.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {activePlatform.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {activePlatform.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary">
                  {activePlatform.badge}
                </Badge>
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-xl blur-lg opacity-30" />
                <div className="relative">
                  <CodeSnippet 
                    code={activePlatform.code} 
                    language={activePlatform.language}
                    className="shadow-none border-primary/10"
                  />
                </div>
              </div>
              
              {/* Additional info */}
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Quick tip:</span> Replace{' '}
                    <code className="px-2 py-1 rounded bg-muted text-muted-foreground font-mono text-xs">
                      pk_live_abc123
                    </code>{' '}
                    with your actual project key from the dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}