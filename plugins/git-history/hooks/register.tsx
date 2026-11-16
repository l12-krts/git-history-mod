import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Commit, History } from '../types'

const PANE = 'git-history'
const history = atom(
  { plugin: 'git-history', key: 'history' } as const,
  { repo: '', branch: '', commits: [] } as History,
  { shape: 'history-1' },
)

const SEP = '\x1f'

async function refresh($: any) {
  const cwd: string = await $.session.cwd()
  const log = await $.process.run(
    ['git', 'log', '-n', '200', `--pretty=format:%h${SEP}%D${SEP}%cr${SEP}%an${SEP}%s`],
    { cwd },
  )
  if (log.exitCode !== 0) {
    await update($, history, () => ({
      repo: cwd, branch: '', commits: [],
      error: 'Not a git repository (or no commits yet).',
    }))
    return
  }
  const br = await $.process.run(['git', 'branch', '--show-current'], { cwd })
  const commits: Commit[] = log.stdout
    .split('\n')
    .filter(Boolean)
    .map((line: string) => {
      const [hash, refs, when, author, ...rest] = line.split(SEP)
      return { hash, refs, when, author, subject: rest.join(SEP) }
    })
  await update($, history, () => ({
    repo: cwd.split('/').pop() || cwd,
    branch: br.stdout.trim() || 'detached',
    commits,
  }))
}

async function open($: any) {
  await refresh($)
  await $.ui.open({ id: PANE, title: 'Git history' })
}


export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'git-history', description: 'Show the git history of this repo in a pane' })
    void open($)
    return next(e)
  })

  on('command.run', { command: 'git-history' }, async $ => {
    await open($)
    return { text: 'Git history pane opened (refreshed).' }
  })

  // Commits, checkouts and pulls happen through Bash: refresh after each call.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    void refresh($)
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const h = await read($, history)
    const room = Math.max(1, (e.viewport?.rows ?? 24) - 4)

    if (h.error) return <Text dimColor>{h.error}</Text>

    return (
      <Box flexDirection="column">
        <Text bold>{h.repo} <Text dimColor>on</Text> {h.branch}</Text>
        {h.commits.slice(0, room).map(c => (
          <Box flexDirection="column">
            <Text>
              <Text color="yellow">{c.hash}</Text> {c.subject}
              {c.refs ? <Text color="cyan"> ({c.refs})</Text> : null}
            </Text>
            <Text dimColor>  {c.author} · {c.when}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
