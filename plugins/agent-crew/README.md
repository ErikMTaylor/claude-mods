# agent-crew

Shows each running subagent as a bubble above the prompt: a mini Claude icon colored by its current activity, a two-word label, and a progress bar with a percent.

- cyan: searching, yellow: editing, magenta: running commands, blue: browsing, white: delegating, gray: thinking, green: done, red: stopped.
- The band sizes itself to the room above the prompt: full bubbles, compact bubbles, then a single line of dots. Overflow shows as `+N`.
- The percent is an estimate from the number of tool calls (capped at 95% until the agent finishes), because Claude Code does not report real progress.
- Finished bubbles stay dimmed until your next prompt.
