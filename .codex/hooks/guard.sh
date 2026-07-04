#!/usr/bin/env bash
# trend-watcher PreToolUse guard (Bash).
# rules（.codex/rules/project.rules）で拾えないコマンド内容依存の判定を補完する。
# deny 時は permissionDecision: "deny" を含む JSON を出力し exit 0。許可時は何も出さず exit 0。

INPUT=$(cat)
cmd=$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception:
    pass' 2>/dev/null || true)
[ -z "$cmd" ] && exit 0

deny() {
  python3 -c "import json,sys; print(json.dumps({'hookSpecificOutput':{'hookEventName':'PreToolUse','permissionDecision':'deny','permissionDecisionReason':sys.argv[1]}}, ensure_ascii=False))" "$1"
  exit 0
}

# public/data/*.json へのシェル直書き（> リダイレクト / tee）をブロック（atomic rename をコードで使うこと）
if printf '%s' "$cmd" | grep -qE '(^|[^"'"'"'])(>[[:space:]]*|tee[[:space:]]+(-a[[:space:]]+)?)[^"'"'"'|;&]*public/data/[^"'"'"'|;&[:space:]]+\.json'; then
  deny "public/data/*.json はシェルから直書きしない — コード内で atomic rename を使う（AGENTS.md）"
fi

# out/ の force-add をブロック（.gitignore 対象の生成物）
if printf '%s' "$cmd" | grep -qE '(^|[;&|][[:space:]]*)git[[:space:]]+add[[:space:]]+[^"'"'"']*(\./)?out/'; then
  deny "out/ は gitignore 対象 — force-add しない（AGENTS.md）"
fi

# .env のステージング / コミットをブロック
if printf '%s' "$cmd" | grep -qE '(^|[;&|][[:space:]]*)(git[[:space:]]+add|git[[:space:]]+commit)[^"'"'"']*[[:space:]](\./)?\.env([[:space:]]|$|\.)'; then
  deny ".env をステージング / コミットしない"
fi

# rules のプレフィックス一致で拾えない rm 表記ゆれ（rm -fr / rm -r -f）で out/・public/data を消すのをブロック
if printf '%s' "$cmd" | grep -qE 'rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+|-[a-zA-Z]*[fF][a-zA-Z]*[[:space:]]+){1,2}(\./)?(out|public/data)([[:space:]/]|$)'; then
  deny "out/ ・ public/data/ は手で削除しない（ビルド / バッチが管理）"
fi

exit 0
