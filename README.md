# git-history

A Claude Code mod that opens a pane beside the chat showing the git history of the repo you are working in: the repo name, the current branch, and the last 200 commits with short hash, subject, branch and tag labels, author and relative time.

The pane opens at session start and refreshes after every Bash tool call, so commits, checkouts and pulls Claude makes show up. Run `/git-history` to reopen or refresh it.

## Install

```
/plugin marketplace add l12-krts/git-history-mod
/plugin install git-history@git-history-mod
```
