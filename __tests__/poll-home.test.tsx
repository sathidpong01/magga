import { expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PollSummary from "@/app/components/features/polls/PollSummary";
it("renders no container, heading, margins or placeholder when no homepage poll is available", () => {
  expect(
    renderToStaticMarkup(
      createElement(PollSummary, { poll: null, compact: true }),
    ),
  ).toBe("");
});
