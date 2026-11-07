import { expect, it } from "bun:test";
import { pollSchema, scopePollSql } from "@/lib/polls/schema";
import { PGlite } from "@electric-sql/pglite";
import type { PollDatabase } from "@/lib/polls/database";
import { createPoll, listPolls } from "@/lib/polls/service";

it("keeps production defaults and rejects untrusted schema identifiers", () => {
  expect(pollSchema("")).toBe("private");
  for (const schema of [
    "public",
    "private; DROP TABLE profiles",
    'preview_polls_"',
    "preview_polls_" + "a".repeat(41),
  ])
    expect(() => pollSchema(schema)).toThrow();
});

it("scopes every poll table without changing authentication, other private tables or SQL parameters", () => {
  const query =
    "SELECT * FROM private.polls p JOIN private.poll_options o ON o.poll_id=p.id JOIN private.poll_limits l ON true JOIN private.comment_guests g ON true JOIN public.profiles u ON true WHERE p.title=$1";
  const scoped = scopePollSql(query, "preview_polls_community");
  expect(scoped).toContain("preview_polls_community.polls");
  expect(scoped).toContain("preview_polls_community.poll_options");
  expect(scoped).toContain("preview_polls_community.poll_limits");
  expect(scoped).toContain("private.comment_guests");
  expect(scoped).toContain("public.profiles");
  expect(scoped).toContain("$1");
  expect(scopePollSql(query, "private")).toBe(query);
});

it("keeps preview poll writes separate from production polls in the same PostgreSQL database", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(
      "CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE public.manga(id uuid PRIMARY KEY,cover_image text,is_hidden boolean DEFAULT false);",
    );
    const migration =
      (await Bun.file(
        new URL("../db/migrations/0019_community_polls.sql", import.meta.url),
      ).text()) +
      (await Bun.file(
        new URL(
          "../db/migrations/0020_poll_captcha_settings.sql",
          import.meta.url,
        ),
      ).text());
    await pg.exec(migration);
    await pg.exec(migration.replace(/\bprivate\b/g, "preview_polls_test"));
    const database = (schema: string): PollDatabase => ({
      async query<T>(sql: string, parameters?: unknown[]) {
        return (await pg.query<T>(scopePollSql(sql, schema), parameters)).rows;
      },
      transaction: (work) =>
        pg.transaction((tx) =>
          work({
            async query<T>(sql: string, parameters?: unknown[]) {
              return (await tx.query<T>(scopePollSql(sql, schema), parameters))
                .rows;
            },
          }),
        ),
    });
    const input = (title: string) => ({
      title,
      description: "",
      coverAssetId: null,
      visibility: "public" as const,
      resultsVisibility: "public" as const,
      security: "standard" as const,
      requireCaptcha: true,
      minChoices: 1,
      maxChoices: 1,
      allowChange: false,
      showCount: true,
      showOnHome: true,
      pinned: false,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      options: ["one", "two"].map((label) => ({
        id: crypto.randomUUID(),
        label,
        assetId: null,
        mangaId: null,
      })),
    });
    const production = database("private");
    const preview = database("preview_polls_test");
    await createPoll(production, "admin", input("Production poll"));
    await createPoll(preview, "admin", input("Preview poll"));
    expect(
      (await listPolls(production, true)).map((poll) => poll.title),
    ).toEqual(["Production poll"]);
    expect((await listPolls(preview, true)).map((poll) => poll.title)).toEqual([
      "Preview poll",
    ]);
  } finally {
    await pg.close();
  }
}, 30000);
