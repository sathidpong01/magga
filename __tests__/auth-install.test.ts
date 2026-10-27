import { afterAll, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { checkAuthInstall } from "@/scripts/auth-install-check";

const root = mkdtempSync(join(tmpdir(), "magga-auth-layout-"));
function json(path:string, value:unknown) { mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value)); }
json(join(root,"package.json"),{dependencies:{"better-auth":"1.7.13"}});
for (const name of ["better-auth","@better-auth/core","@better-auth/drizzle-adapter"]) json(join(root,"node_modules",name,"package.json"),{name,version:"1.7.13"});
afterAll(()=>{if(!resolve(root).startsWith(resolve(tmpdir())+sep))throw Error("Unexpected fixture path");rmSync(root,{recursive:true});});
it("accepts one consistent core and rejects a nested-core layout like the remote error",()=>{
  expect(checkAuthInstall(root)).toBe("1.7.13");
  const stale=join(root,"restored");
  json(join(stale,"package.json"),{dependencies:{"better-auth":"1.7.13"}});
  for(const name of ["better-auth","@better-auth/core","@better-auth/drizzle-adapter"])json(join(stale,"node_modules",name,"package.json"),{name,version:"1.7.13"});
  json(join(stale,"node_modules/better-auth/node_modules/@better-auth/core/package.json"),{name:"@better-auth/core",version:"1.4.18"});
  expect(()=>checkAuthInstall(stale)).toThrow("AUTH_INSTALL_MISMATCH");
});

