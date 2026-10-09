import { pgSchema } from 'drizzle-orm/pg-core';

// drizzle-kit must see the namespace itself as well as its exported tables,
// otherwise push proposes dropping the existing policy-helper namespace.
export const fixturePrivateSchema = pgSchema('private');
