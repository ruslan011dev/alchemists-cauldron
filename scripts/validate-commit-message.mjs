import { readFileSync } from "node:fs";

const messagePath = process.argv[2];

if (!messagePath) {
  console.error("Commit message file path is missing.");
  process.exit(1);
}

const raw = readFileSync(messagePath, "utf8");
const lines = raw.split(/\r?\n/).filter((line) => !line.startsWith("#"));

while (lines.length > 0 && lines.at(-1)?.trim() === "") {
  lines.pop();
}

const header = lines[0]?.trim() ?? "";
const mergeMessage = /^Merge (branch|pull request|remote-tracking branch) \S/;
const conventionalHeader =
  /^(feat|fix|docs|style|refactor|test|perf|build|ci|chore|revert)(\([A-Za-z0-9][A-Za-z0-9._/-]*\))?!?: [a-z].+/;

if (mergeMessage.test(header)) {
  process.exit(0);
}

if (!conventionalHeader.test(header)) {
  console.error(
    "Commit message must follow the RS School convention: https://rs.school/docs/git-convention",
  );
  console.error("Example: feat: add the ingredient shelf");
  console.error(`Received: ${header || "(empty)"}`);
  process.exit(1);
}

if (lines.length > 1 && lines[1]?.trim() !== "") {
  console.error("Put a blank line between the commit subject and the body.");
  process.exit(1);
}
