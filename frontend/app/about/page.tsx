import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Target, Lightbulb, Code, Sparkles, Zap, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-red-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-16 w-16 text-blue-400 animate-pulse drop-shadow-lg" />
          </div>
          <h1 className="text-5xl font-bold mb-4 gradient-text drop-shadow-lg">About Automata Visualizer</h1>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-xl text-white font-medium drop-shadow-md">
              Empowering students and researchers to understand finite state automata through interactive visualization
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <Card className="bg-black/40 backdrop-blur-md border-white/20 card-hover animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-md">
                <Target className="h-5 w-5 text-blue-400" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/95 drop-shadow-sm">
                We believe that complex theoretical concepts in computer science should be accessible and engaging. Our
                mission is to bridge the gap between abstract automata theory and practical understanding through
                cutting-edge visualization tools and AI-powered assistance.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/20 card-hover animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-md">
                <Lightbulb className="h-5 w-5 text-red-400" />
                Why We Built This
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/95 drop-shadow-sm">
                Traditional textbooks and static diagrams often fail to convey the dynamic nature of automata. We
                created this platform to provide an interactive, intuitive way to create, modify, and analyze finite
                state machines, making learning more effective and enjoyable.
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8 bg-white/30" />

        <Card className="mb-8 bg-black/40 backdrop-blur-md border-white/20 card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white drop-shadow-md">
              <Code className="h-5 w-5 text-blue-400" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white drop-shadow-sm">Interactive Canvas</h3>
                </div>
                <p className="text-sm text-white/95 mb-3 drop-shadow-sm">
                  Draw and modify automata with an intuitive drag-and-drop interface. Add states, transitions, and
                  labels with simple clicks and gestures.
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/50 drop-shadow-sm">Drag & Drop</Badge>
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 drop-shadow-sm">Real-time</Badge>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold text-white drop-shadow-sm">AI-Powered Analysis</h3>
                </div>
                <p className="text-sm text-white/95 mb-3 drop-shadow-sm">
                  Upload images of hand-drawn automata or describe your machine in natural language. Our AI will help
                  you create and analyze your automaton.
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 drop-shadow-sm">
                    Image Recognition
                  </Badge>
                  <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/50 drop-shadow-sm">NLP</Badge>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white drop-shadow-sm">Educational Tools</h3>
                </div>
                <p className="text-sm text-white/95 mb-3 drop-shadow-sm">
                  Step-through execution, string acceptance testing, and detailed explanations help students understand
                  how automata process input.
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/50 drop-shadow-sm">Step-by-step</Badge>
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 drop-shadow-sm">Testing</Badge>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold text-white drop-shadow-sm">Export & Share</h3>
                </div>
                <p className="text-sm text-white/95 mb-3 drop-shadow-sm">
                  Save your work in multiple formats, share with classmates, or export for use in presentations and
                  assignments.
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 drop-shadow-sm">
                    Multiple Formats
                  </Badge>
                  <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/50 drop-shadow-sm">
                    Collaboration
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-white/20 card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white drop-shadow-md">
              <Users className="h-5 w-5 text-blue-400" />
              Who We Serve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 drop-shadow-lg">
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="font-semibold mb-2 text-white drop-shadow-sm">Students</h3>
                <p className="text-sm text-white/95 drop-shadow-sm">
                  Computer science students learning automata theory, formal languages, and computational models.
                </p>
              </div>

              <div className="text-center bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 drop-shadow-lg">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
                <h3 className="font-semibold mb-2 text-white drop-shadow-sm">Educators</h3>
                <p className="text-sm text-white/95 drop-shadow-sm">
                  Professors and teachers looking for engaging tools to demonstrate complex theoretical concepts.
                </p>
              </div>

              <div className="text-center bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 drop-shadow-lg">
                  <span className="text-2xl">🔬</span>
                </div>
                <h3 className="font-semibold mb-2 text-white drop-shadow-sm">Researchers</h3>
                <p className="text-sm text-white/95 drop-shadow-sm">
                  Academic researchers and industry professionals working with formal verification and system design.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12 p-8 bg-black/40 backdrop-blur-md rounded-lg border border-white/20 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8 text-red-400 animate-pulse drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-bold mb-4 gradient-text drop-shadow-lg">Ready to Get Started?</h2>
          <p className="text-white/95 mb-6 text-lg drop-shadow-sm">
            Join thousands of students and educators who are already using Automata Visualizer to make learning more
            interactive and effective.
          </p>
          <div className="flex gap-6 justify-center text-sm text-white/95">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="drop-shadow-sm">Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-400" />
              <span className="drop-shadow-sm">No installation required</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-400" />
              <span className="drop-shadow-sm">Works on all devices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
