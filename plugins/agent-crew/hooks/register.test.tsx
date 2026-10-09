import { expect, test } from 'claude-code/testing'

test('band stays quiet before any subagent spawns', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>fallback</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'agent-crew',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false },
    viewport: { columns: 80, rows: 24 },
  })
  expect(await ui.findAll({ text: /%/ })).toHaveLength(0)
  expect(await ui.find({ text: /fallback/ })).toBeDefined()
  await ui.unmount()
})
