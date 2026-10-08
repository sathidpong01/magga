import { mock } from "bun:test";

const connect = mock(() => { throw new Error("connection factory reached"); });
mock.module("postgres", () => ({ default: connect }));
try {
  await import("../../db");
  throw new Error("Expected the connection guard or mocked factory to reject");
} catch (error) {
  console.log(JSON.stringify({ error: (error as Error).message, calls: connect.mock.calls }));
}
