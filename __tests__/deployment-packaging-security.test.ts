import { afterAll, expect, it } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";

const root = mkdtempSync(join(tmpdir(), "magga-deploy-privacy-"));
const project = join(root, "project");
const python = process.platform === "win32" ? "python" : "python3";
const helper = resolve(".agents/skills/deploy-to-vercel/resources/package-project.py");
const bash = process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
function write(name: string, content: string) { const file = join(project, name); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); }
write("package.json", '{"dependencies":{"next":"16.4.3"}}');
write("index.html", "<h1>Safe page</h1>"); write("src/main.ts", "export const safe = true;");
write(".local/mcp/client-credentials.json", "SYNTHETIC_PRIVATE_FIXTURE");
write(".env.local", "SYNTHETIC_SECRET=test"); write("keys.txt", "SYNTHETIC_KEY");
write("nested/cache/generated.txt", "Ignored"); write("nested/cache/keep.txt", "Allowed by negation");
write("private-design.txt", "Not deployment source");
write("private/credentials.json", "SYNTHETIC_PRIVATE_FIXTURE");
write(".gitignore", "nested/cache/*\n!nested/cache/keep.txt\nprivate/\n!private/credentials.json\n");
write(".vercelignore", "private-design.txt\n!.local/mcp/client-credentials.json\n!.env.local\n");
afterAll(() => { if (!resolve(root).startsWith(resolve(tmpdir()) + sep)) throw Error("Unexpected fixture root"); rmSync(root, { recursive: true }); });
function py(code: string, ...args: string[]) {
  const result = Bun.spawnSync([python, "-c", code, ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode) throw Error(result.stderr.toString());
  return result.stdout.toString();
}
function members(file: string) { return JSON.parse(py("import tarfile,json,sys; a=tarfile.open(sys.argv[1]); print(json.dumps(a.getnames()))", file)) as string[]; }
function assertSafe(file: string) {
  const names = members(file);
  expect(names).toContain("src/main.ts"); expect(names).toContain("index.html");
  expect(names).toContain("nested/cache/keep.txt");
  for (const name of [".local/mcp/client-credentials.json", ".env.local", "keys.txt", "nested/cache/generated.txt", "private-design.txt", "private/credentials.json"]) expect(names).not.toContain(name);
}

it("directory and supplied archives apply identical ignore/secret rules, including negations", () => {
  const raw = join(root, "input.tgz");
  py("import tarfile,sys; a=tarfile.open(sys.argv[2],'w:gz'); a.add(sys.argv[1],arcname='.'); a.close()", project, raw);
  for (const [index, input] of [project, raw].entries()) {
    const output = join(root, `sanitized-${index}.tgz`);
    const result = Bun.spawnSync([python, helper, input, output]);
    expect(result.exitCode).toBe(0); assertSafe(output);
  }
  expect(readFileSync(join(project, ".local/mcp/client-credentials.json"), "utf8")).toBe("SYNTHETIC_PRIVATE_FIXTURE");
});

it("unsafe archive paths and links fail before producing an uploadable package", () => {
  for (const name of ["../escape.txt", "/absolute.txt", "C:/drive.txt", "folder\\escape.txt", ".local./file", ".env.local /file", "symlink"] ) {
    const input = join(root, "unsafe.tgz"), output = join(root, "rejected.tgz");
    py("import tarfile,sys,io; a=tarfile.open(sys.argv[1],'w:gz'); i=tarfile.TarInfo(sys.argv[2]); i.type=tarfile.SYMTYPE if sys.argv[2]=='symlink' else tarfile.REGTYPE; i.linkname='../outside'; i.size=1 if i.isfile() else 0; a.addfile(i,io.BytesIO(b'x') if i.isfile() else None); a.close()", input, name);
    expect(Bun.spawnSync([python, helper, input, output], { stdout: "pipe", stderr: "pipe" }).exitCode).not.toBe(0);
    expect(existsSync(output)).toBe(false);
  }
});

it("case aliases stay private and Windows reparse directories are rejected before traversal", () => {
  const input = join(root, "case-aliases.tgz"), output = join(root, "case-filtered.tgz");
  py("import tarfile,sys,io; a=tarfile.open(sys.argv[1],'w:gz'); names=['index.html','.LOCAL/mcp/credentials.json','.ENV.LOCAL','KEYS.TXT']; [(lambda i: (setattr(i,'size',1),a.addfile(i,io.BytesIO(b'x'))))(tarfile.TarInfo(n)) for n in names]; a.close()", input);
  expect(Bun.spawnSync([python, helper, input, output]).exitCode).toBe(0);
  expect(members(output)).toEqual(["index.html"]);
  // Exercise the actual reparse predicate without creating a privileged junction.
  expect(py("import runpy,sys,types,stat; m=runpy.run_path(sys.argv[1]); f=types.SimpleNamespace(lstat=lambda:types.SimpleNamespace(st_mode=stat.S_IFDIR,st_file_attributes=1024)); print(m['linked'](f))", helper).trim()).toBe("True");
});

it("a plain static HTML directory keeps single-page renaming", () => {
  const plain = join(root, "plain"); mkdirSync(plain); writeFileSync(join(plain, "landing.html"), "Safe page");
  const output = join(root, "plain.tgz");
  expect(Bun.spawnSync([python, helper, plain, output]).exitCode).toBe(0);
  expect(members(output)).toEqual(["index.html"]);
});

it("all four fallback scripts upload only the sanitized archive via a stubbed uploader", () => {
  // curl is a shell function, so no request can reach the real deployment service.
  const stub = `function curl() {
    local previous="" value
    for value in "$@"; do
      if [[ "$previous" == "-F" && "$value" == file=@* ]]; then
        cp "\${value#file=@}" "$CAPTURE_ARCHIVE" || return 1
        printf '{"previewUrl":"http://fixture.invalid","claimUrl":"http://fixture.invalid/claim"}'
        return 0
      fi
      previous="$value"
    done
    printf '200'
  }
  export -f curl
  bash "$1" "$2"`;
  for (const base of [".agents", ".claude"]) for (const script of ["deploy.sh", "deploy-codex.sh"]) {
    const capture = join(root, `${base}-${script}.tgz`);
    const result = Bun.spawnSync([bash, "-c", stub, "fixture", resolve(base, "skills/deploy-to-vercel/resources", script), project], {
      env: { ...process.env, CAPTURE_ARCHIVE: capture }, stdout: "pipe", stderr: "pipe",
    });
    if (result.exitCode) throw Error(result.stderr.toString());
    assertSafe(capture);
  }
}, 30000);
