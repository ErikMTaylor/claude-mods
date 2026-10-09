import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Member, Mood } from '../types'

const PANE = 'agent-crew'
const crew = atom({ plugin: 'agent-crew', key: 'crew' } as const, {} as Record<string, Member>)

// Color per activity: [color, label]
const LOOK: Record<Mood, [string, string]> = {
  thinking: ['gray', 'thinking'],
  search: ['cyan', 'searching'],
  build: ['yellow', 'editing'],
  shell: ['magenta', 'running'],
  web: ['blue', 'browsing'],
  boss: ['white', 'delegating'],
  done: ['green', 'done'],
  failed: ['red', 'stopped'],
}

const moodOf = (tool: string): Mood => {
  if (/^(Read|Grep|Glob|LS|NotebookRead)$/.test(tool)) return 'search'
  if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool)) return 'build'
  if (/^(Bash|PowerShell|Monitor)$/.test(tool)) return 'shell'
  if (/^(WebFetch|WebSearch)$/.test(tool)) return 'web'
  if (/^(Agent|Task)$/.test(tool)) return 'boss'
  return 'thinking'
}

// The engine reports no completion percentage, so this is an estimate: each tool
// call moves the bar a fraction of what is left, never past 95 until the agent ends.
const percent = (m: Member): number =>
  m.isDone ? 100 : Math.min(95, Math.round(100 * (1 - Math.exp(-m.calls / 10))))

const bar = (pct: number, width = 8): string => {
  const full = Math.round((pct / 100) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

const twoWords = (s: string): string => s.trim().split(/\s+/).slice(0, 2).join(' ').slice(0, 16)

export const register: Register = on => {
  on('agent.spawn', async ($, e, next) => {
    const res = await next(e)
    const id = res.agentId
    if (id) {
      const member: Member = {
        id,
        label: e.description || e.subagentType,
        type: e.subagentType,
        mood: 'thinking',
        calls: 0,
        lastTool: '',
        startedAt: Date.now(),
        endedAt: 0,
        isDone: false,
      }
      await update($, crew, all => ({ ...all, [id]: member }))
    }

    return res
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id) {
      await update($, crew, all =>
        all[id]
          ? { ...all, [id]: { ...all[id], calls: all[id].calls + 1, lastTool: e.tool, mood: moodOf(e.tool) } }
          : all,
      )
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id) {
      await update($, crew, all =>
        all[id]
          ? {
              ...all,
              [id]: { ...all[id], isDone: true, endedAt: Date.now(), mood: e.isAborted ? 'failed' : 'done' },
            }
          : all,
      )
    }

    return next(e)
  })

  // A new prompt clears the finished bubbles; running agents stay.
  on('prompt.submit', async ($, e, next) => {
    await update($, crew, all =>
      Object.fromEntries(Object.entries(all).filter(([, m]) => !m.isDone)),
    )

    return next(e)
  })

  // The band sizes itself to the room it has: full bubbles (5 rows), compact bubbles
  // (3 rows), or a single line of colored dots. Running agents come first, and
  // whatever does not fit collapses into "+N".
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const members = Object.values(await read($, crew)).sort((a, b) => a.startedAt - b.startedAt)
    if (e.props.hasSurvey || members.length === 0) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const cols = e.props.bodyColumns ?? e.viewport?.columns ?? 80
    const rows = e.props.maxRows ?? 24
    const all = [...members.filter(m => !m.isDone), ...members.filter(m => m.isDone)]
    const fit = (width: number) => Math.max(1, Math.floor(cols / width))
    const more = (n: number) => (n > 0 ? <Text dimColor>+{n}</Text> : null)

    if (rows >= 5) {
      const shown = all.slice(0, Math.min(4, fit(31)))

      return (
        <Box>
          {shown.map(m => {
            const [color] = LOOK[m.mood]
            const pct = percent(m)

            return (
              <Box borderStyle="round" borderColor={color} paddingX={1} marginRight={1}>
                <Box flexDirection="column" marginRight={1}>
                  <Text color={color}>{' ▐▛███▜▌'}</Text>
                  <Text color={color}>{'▝▜█████▛▘'}</Text>
                  <Text color={color}>{'  ▘▘ ▝▝'}</Text>
                </Box>
                <Box flexDirection="column" justifyContent="center">
                  <Text bold dimColor={m.isDone}>
                    {twoWords(m.label)}
                  </Text>
                  <Text color={color}>
                    {bar(pct)} {String(pct).padStart(3)}%
                  </Text>
                </Box>
              </Box>
            )
          })}
          {more(all.length - shown.length)}
        </Box>
      )
    }

    if (rows >= 3) {
      const shown = all.slice(0, Math.min(4, fit(38)))

      return (
        <Box>
          {shown.map(m => {
            const [color] = LOOK[m.mood]
            const pct = percent(m)

            return (
              <Box borderStyle="round" borderColor={color} paddingX={1} marginRight={1}>
                <Text color={color}>{'▟'}</Text>
                <Text color="black" backgroundColor={color}>
                  {'▪ ▪'}
                </Text>
                <Text color={color}>{'▙ '}</Text>
                <Text bold dimColor={m.isDone}>
                  {twoWords(m.label)}{' '}
                </Text>
                <Text color={color}>
                  {bar(pct, 6)} {String(pct).padStart(3)}%
                </Text>
              </Box>
            )
          })}
          {more(all.length - shown.length)}
        </Box>
      )
    }

    const shown = all.slice(0, Math.min(6, fit(26)))

    return (
      <Box>
        {shown.map(m => {
          const [color] = LOOK[m.mood]

          return (
            <Box marginRight={2}>
              <Text color={color}>{'● '}</Text>
              <Text dimColor={m.isDone}>
                {twoWords(m.label)} {String(percent(m)).padStart(3)}%
              </Text>
            </Box>
          )
        })}
        {more(all.length - shown.length)}
      </Box>
    )
  })
}
