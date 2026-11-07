import { expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PollRail from "@/app/components/features/polls/PollRail";
import PollSummary from "@/app/components/features/polls/PollSummary";
it("renders no container, heading, margins or placeholder when no homepage poll is available", () => {
  expect(renderToStaticMarkup(createElement(PollSummary, { poll: null }))).toBe(
    "",
  );
  expect(renderToStaticMarkup(createElement(PollRail, { polls: [] }))).toBe("");
});
