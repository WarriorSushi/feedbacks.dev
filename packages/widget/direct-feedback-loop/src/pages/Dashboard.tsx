import * as React from "react"
import { Plus, BarChart3, Settings, Copy, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Dashboard = () => {
  const [projects] = React.useState([
    {
      id: 1,
      name: "My Portfolio",
      apiKey: "feedbacks_dev_api_key_abc123",
      feedbackCount: 24,
      status: "active",
      url: "https://myportfolio.com"
    },
    {
      id: 2,
      name: "SaaS Project", 
      apiKey: "feedbacks_dev_api_key_xyz789",
      feedbackCount: 156,
      status: "active",
      url: "https://mysaas.app"
    }
  ])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your feedback projects</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-400">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover-lift">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {project.url}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Feedback Count</span>
                      <span className="font-semibold">{project.feedbackCount}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">API Key</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1 text-xs bg-muted rounded font-mono">
                          {project.apiKey}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(project.apiKey)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Add new project card */}
              <Card className="hover-lift border-dashed cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Create New Project</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start collecting feedback for a new website or app
                  </p>
                  <Button>Get Started</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Latest feedback submissions across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">My Portfolio</span>
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          "Great website design! Would love to see more case studies."
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>user@example.com</span>
                          <span>•</span>
                          <span>2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">180</div>
                  <div className="text-xs text-muted-foreground">+12% from last month</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-xs text-muted-foreground">All projects active</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-xs text-muted-foreground">+5% from last month</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
