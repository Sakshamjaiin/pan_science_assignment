import json
prd = open("assets/sample-prd.md").read()
open("assets/sample-prd.js", "w").write("// Generated from assets/sample-prd.md\nwindow.SAMPLE_PRD = " + json.dumps(prd) + ";\n")
p = open("prompts/backlog_prompt.md").read().split("\n---\n", 1)[1].strip()
open("assets/prompt.js", "w").write("// Generated from prompts/backlog_prompt.md (the text after the --- line)\nwindow.BACKLOG_PROMPT = " + json.dumps(p) + ";\n")
print(len(prd), len(p))
