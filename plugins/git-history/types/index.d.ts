export type Commit = { hash: string; refs: string; when: string; author: string; subject: string }
export type History = { repo: string; branch: string; commits: Commit[]; error?: string }

declare module 'claude-code' {
  interface PluginState {
    'git-history': { history: Shaped<History> }
  }
}
