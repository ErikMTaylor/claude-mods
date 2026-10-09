export type Mood = 'thinking' | 'search' | 'build' | 'shell' | 'web' | 'boss' | 'done' | 'failed'
export type Member = {
  id: string
  label: string
  type: string
  mood: Mood
  calls: number
  lastTool: string
  startedAt: number
  endedAt: number
  isDone: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'agent-crew': { crew: Record<string, Member> }
  }
}
