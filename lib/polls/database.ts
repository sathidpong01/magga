import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";

export interface PollExecutor {
  query<T = Record<string, unknown>>(
    text: string,
    parameters?: unknown[],
  ): Promise<T[]>;
}
export interface PollDatabase extends PollExecutor {
  transaction<T>(work: (transaction: PollExecutor) => Promise<T>): Promise<T>;
}

function bind(text: string, parameters: unknown[] = []): SQL {
  const parts: SQL[] = [];
  let start = 0;
  for (const match of text.matchAll(/\$(\d+)/g)) {
    parts.push(
      sql.raw(text.slice(start, match.index)),
      sql`${parameters[Number(match[1]) - 1]}`,
    );
    start = match.index! + match[0].length;
  }
  parts.push(sql.raw(text.slice(start)));
  return sql.join(parts, sql.raw(""));
}
function executor(execute: (query: SQL) => Promise<unknown>): PollExecutor {
  return {
    async query<T>(text: string, parameters?: unknown[]) {
      const result = await execute(bind(text, parameters));
      return result as T[];
    },
  };
}
export const pollDatabase: PollDatabase = {
  ...executor((query) => db.execute(query)),
  transaction: (work) =>
    db.transaction((tx) => work(executor((query) => tx.execute(query)))),
};
