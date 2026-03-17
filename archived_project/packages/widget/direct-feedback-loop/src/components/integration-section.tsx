import * as React from "react"
import { useState } from "react"
import { Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const IntegrationSection = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const integrations = [
    {
      id: "html",
      name: "HTML",
      label: "Vanilla JS",
      code: `<script 
  src="https://cdn.feedbacks.dev/widget.js"
  data-project="feedbacks_dev_api_key_your_key"
  defer>
</script>`
    },
    {
      id: "react",
      name: "React",
      label: "React/Next.js",
      code: `import { FeedbackWidget } from '@feedbacks/react'

function App() {
  return (
    <div>
      {/* Your app */}
      <FeedbackWidget projectKey="feedbacks_dev_api_key_your_key" />
    </div>
  )
}`
    },
    {
      id: "vue",
      name: "Vue",
      label: "Vue/Nuxt",
      code: `<template>
  <div>
    <!-- Your app -->
    <FeedbackWidget project-key="feedbacks_dev_api_key_your_key" />
  </div>
</template>

<script setup>
import { FeedbackWidget } from '@feedbacks/vue'
</script>`
    },
    {
      id: "react-native",
      name: "React Native",
      label: "Mobile",
      code: `import { FeedbackModal } from '@feedbacks/react-native'

function App() {
  return (
    <View>
      {/* Your app */}
      <FeedbackModal projectKey="feedbacks_dev_api_key_your_key" />
    </View>
  )
}`
    }
  ]

  return (
    <section className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Integrate anywhere in seconds
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your platform and get started immediately. 
            Our SDKs work with every major framework and platform.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              {integrations.map((integration) => (
                <TabsTrigger key={integration.id} value={integration.id} className="relative">
                  {integration.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {integration.label}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {integrations.map((integration) => (
              <TabsContent key={integration.id} value={integration.id}>
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">
                      {integration.name} Integration
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(integration.code, integration.id)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCode === integration.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted/50 rounded-lg p-6 overflow-x-auto">
                        <code className="text-sm font-mono">{integration.code}</code>
                      </pre>
                      
                      {/* Gradient overlay for style */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 pointer-events-none rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-center">
            {[
              { value: "<20KB", label: "Bundle size" },
              { value: "<100ms", label: "Load time" },
              { value: "99.9%", label: "Uptime" },
              { value: "10+", label: "Platforms" }
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default IntegrationSection
