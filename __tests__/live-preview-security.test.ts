import { afterAll, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:net";

const scripts = resolve(".agents/skills/impeccable/scripts");
const securityUrl = pathToFileURL(join(scripts, "live-security.mjs")).href;
const injectUrl = pathToFileURL(join(scripts, "live-inject.mjs")).href;
const pathsUrl = pathToFileURL(join(scripts, "impeccable-paths.mjs")).href;
const { previewSourcePath, isPreviewOrigin } = await import(securityUrl);
const { insertTag } = await import(injectUrl);
const { readLiveServerInfo } = await import(pathsUrl);
const root = mkdtempSync(join(tmpdir(), "magga-live-security-"));
const project = join(root, "project"); mkdirSync(project);
writeFileSync(join(project, "index.html"), "<html><body>Preview</body></html>");
writeFileSync(join(project, ".env.local"), "SYNTHETIC_TEST_ONLY=private");
writeFileSync(join(root, "outside.html"), "Outside project");
afterAll(() => { if (!resolve(root).startsWith(resolve(tmpdir()) + sep)) throw Error("Unexpected fixture root"); rmSync(root, { recursive: true }); });

it("source fallback rejects secrets, alternate path representations and symlink escapes", () => {
  expect(previewSourcePath(project, "index.html")).toBe(join(project, "index.html"));
  for (const name of [".env.local", ".local/credentials.html", "../outside.html", "..\\outside.html", "/outside.html", "C:/outside.html", "//server/file.html"])
    expect(() => previewSourcePath(project, name)).toThrow();
  try { symlinkSync(join(root, "outside.html"), join(project, "alias.html")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EPERM") throw error; return; }
  expect(() => previewSourcePath(project, "alias.html")).toThrow();
});

it("live HTTP bootstrap, source and event routes enforce the browser origin boundary", async () => {
  const reservation = createServer(); await new Promise<void>(done => reservation.listen(0, "127.0.0.1", done));
  const address = reservation.address(); if (!address || typeof address === "string") throw Error("No port");
  const port = address.port; await new Promise<void>(done => reservation.close(() => done()));
  const child = Bun.spawn([process.execPath, join(scripts, "live-server.mjs"), `--port=${port}`], { cwd: project, stdout: "ignore", stderr: "pipe" });
  try {
    let info;
    for (let n = 0; n < 160; n++) { info = readLiveServerInfo(project)?.info; if (info) break; await Bun.sleep(25); }
    if (!info) throw Error("Preview fixture failed to start");
    const base = `http://127.0.0.1:${port}`;
    const token = info.token;
    expect((await fetch(`${base}/live.js`, { headers: { Referer: "http://localhost:3000/" } })).status).toBe(401);
    const hostile = await fetch(`${base}/live.js?token=${token}`, { headers: { Origin: "https://evil.example" } });
    expect(hostile.status).toBe(403); expect(hostile.headers.get("access-control-allow-origin")).toBeNull();
    expect((await fetch(`${base}/live.js?token=${token}`, { headers: { Origin: "null" } })).status).toBe(403);
    expect((await fetch(`${base}/health`, { headers: { Host: `evil.example:${port}` } })).status).toBe(403);
    expect((await fetch(`${base}/live.js?token=${token}`, { headers: { Referer: "https://evil.example/" } })).status).toBe(403);
    // Capability bootstrap also supports no-referrer pages without minting a public token.
    expect((await fetch(`${base}/live.js?token=${token}`)).status).toBe(200);
    for (const origin of ["http://localhost:3000", "http://127.0.0.1:3100", "http://[::1]:3000"]) {
      const response = await fetch(`${base}/live.js?token=${token}`, { headers: { Origin: origin } });
      expect(response.status).toBe(200); expect(response.headers.get("access-control-allow-origin")).toBe(origin);
      expect(response.headers.get("vary")).toBe("Origin");
    }
    const trusted = { Origin: "http://localhost:3000" };
    expect((await fetch(`${base}/source?path=index.html&token=${token}`, { headers: trusted })).status).toBe(200);
    expect((await fetch(`${base}/source?path=.env.local&token=${token}`, { headers: trusted })).status).toBe(403);
    expect((await fetch(`${base}/modern-screenshot.js`, { headers: trusted })).status).toBe(200);
    expect((await fetch(`${base}/events`, { method: "POST", headers: { ...trusted, "Content-Type": "application/json" }, body: JSON.stringify({ token, type: "exit" }) })).status).toBe(200);
    expect(insertTag("<body></body>", { commentSyntax: "html", insertBefore: "</body>" }, port, token)).toContain(`/live.js?token=${token}`);
    expect(isPreviewOrigin("https://tunnel.example", ["https://tunnel.example"])).toBe(true);
    expect(isPreviewOrigin("https://evil.example", ["https://tunnel.example"])).toBe(false);
  } finally { child.kill(); await child.exited; }
}, 15000);
