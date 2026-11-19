import { expect, it } from "bun:test";
import { createServer, type Socket } from "node:net";
import { fileURLToPath } from "node:url";

const int16 = (value: number) => { const bytes = Buffer.alloc(2); bytes.writeInt16BE(value); return bytes; };
const int32 = (value: number) => { const bytes = Buffer.alloc(4); bytes.writeInt32BE(value); return bytes; };
const cstring = (value: string) => Buffer.from(`${value}\0`);
const frame = (type: string, ...parts: Buffer[]) => {
  const body = Buffer.concat(parts);
  return Buffer.concat([Buffer.from(type), int32(body.length + 4), body]);
};

it("completes concurrent database reads through a pooler that cannot pipeline queries", async () => {
  const sockets = new Set<Socket>();
  let pipelined = false;
  // Model the transaction pooler's protocol boundary: a connection must receive
  // ReadyForQuery before another query begins. No production database is used.
  const server = createServer(socket => {
    sockets.add(socket);
    socket.on("error", () => {});
    let input = Buffer.alloc(0);
    let startup = true;
    let busy = false;
    let parameterCount = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const ready = () => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        busy = false;
        if (!socket.destroyed) socket.write(frame("Z", Buffer.from("I")));
      }, 30);
      timers.add(timer);
    };
    socket.on("close", () => { sockets.delete(socket); for (const timer of timers) clearTimeout(timer); });
    socket.on("data", chunk => {
      input = Buffer.concat([input, typeof chunk === "string" ? Buffer.from(chunk) : chunk]);
      while (input.length >= (startup ? 8 : 5)) {
        const length = input.readInt32BE(startup ? 0 : 1);
        const total = startup ? length : length + 1;
        if (input.length < total) return;
        const message = input.subarray(0, total);
        input = input.subarray(total);
        if (startup) {
          if (message.readInt32BE(4) === 80877103) { socket.write("N"); continue; }
          startup = false;
          socket.write(Buffer.concat([
            frame("R", int32(0)),
            frame("S", cstring("server_version"), cstring("17.0")),
            frame("S", cstring("client_encoding"), cstring("UTF8")),
            frame("K", int32(1), int32(1)), frame("Z", Buffer.from("I")),
          ]));
          continue;
        }
        const type = String.fromCharCode(message[0]);
        if (type === "X") { socket.end(); return; }
        if (type === "P") {
          if (busy) { pipelined = true; socket.destroy(); return; }
          busy = true;
          const statementEnd = message.indexOf(0, 5);
          const queryEnd = message.indexOf(0, statementEnd + 1);
          parameterCount = message.readInt16BE(queryEnd + 1);
          socket.write(frame("1"));
        } else if (type === "D") {
          socket.write(Buffer.concat([
            frame("t", int16(parameterCount), ...Array.from({ length: parameterCount }, () => int32(23))),
            frame("T", int16(1), cstring("value"), int32(0), int16(0), int32(23), int16(4), int32(-1), int16(0)),
          ]));
        } else if (type === "B") socket.write(frame("2"));
        else if (type === "E") socket.write(Buffer.concat([
          frame("D", int16(1), int32(1), Buffer.from("1")), frame("C", cstring("SELECT 1")),
        ]));
        else if (type === "C") socket.write(frame("3"));
        else if (type === "S") ready();
      }
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test socket");
  try {
    const child = Bun.spawn([process.execPath, "--no-env-file", fileURLToPath(new URL("./helpers/database-pipeline.ts", import.meta.url))], {
      env: {
        ...process.env, DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${address.port}/postgres`,
        POSTGRES_URL: "", POSTGRES_PRISMA_URL: "", POSTGRES_URL_NON_POOLING: "",
        VERCEL: "1", NEXT_PHASE: "", MCP_LOCAL_DATABASE: "", MAGGA_DISPOSABLE_DATABASE: "",
      }, stdout: "pipe", stderr: "pipe",
    });
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    expect(pipelined).toBe(false);
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual({ completed: 12 });
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}, 15000);
