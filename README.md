# claude-mods

A collection of Claude Code mods. Each mod lives in its own folder under `plugins/`.

| Mod | What it does |
|---|---|
| [agent-crew](plugins/agent-crew) | Bubbles above the prompt: one per subagent, with a mini Claude icon colored by what it is doing, a short label and a progress bar. |

## Install

```
/plugin marketplace add <owner>/<repo>
/plugin install agent-crew@claude-mods
```

Or from a local clone: `claude plugin marketplace add ./claude-mods`.

## Adding another mod

1. Create `plugins/<mod-name>/` with `.claude-plugin/plugin.json`, `hooks/hooks.json` and `hooks/register.tsx`.
2. Add an entry for it to `.claude-plugin/marketplace.json`.
3. Check it with `claude plugin validate plugins/<mod-name>` and `claude plugin test plugins/<mod-name>`.
