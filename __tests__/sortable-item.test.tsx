import { expect, it, mock } from "bun:test";
import { Children, isValidElement, type ReactNode } from "react";

mock.module("@dnd-kit/sortable", () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef() {}, transform: null, transition: undefined, isDragging: false }),
}));
const { SortableItem } = await import("@/app/components/ui/SortableItem");

type ControlProps = {
  children?: ReactNode;
  "aria-label"?: string;
  type?: string;
  disabled?: boolean;
  onClick?: (event?: { stopPropagation: () => void }) => void;
  onKeyDown?: (event: {
    key: string;
    preventDefault: () => void;
    currentTarget: { querySelector: () => { value: string } };
  }) => void;
};
function findControl(node: ReactNode, name: string): ControlProps {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<ControlProps>(child)) continue;
    if (child.props["aria-label"] === name || child.props.type === name) return child.props;
    const found = findControl(child.props.children, name);
    if (found.onClick || found.onKeyDown || found.disabled !== undefined) return found;
  }
  return {};
}

it("keeps move, preview and removal actions in the compact card", () => {
  const move = mock(), preview = mock(), remove = mock();
  const card = SortableItem({ id: "page", index: 1, total: 3, onMove: move, onPreview: preview, onRemove: remove });
  findControl(card, "ย้ายหน้า 2 ขึ้น").onClick?.();
  findControl(card, "ย้ายหน้า 2 ลง").onClick?.();
  expect(move.mock.calls).toEqual([[0], [2]]);
  findControl(card, "Preview page 2").onClick?.({ stopPropagation() {} });
  findControl(card, "Remove page 2").onClick?.({ stopPropagation() {} });
  expect(preview).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(findControl(card, "number").onKeyDown).toBeFunction();
  const first = SortableItem({ id: "first", index: 0, total: 3, onMove: move, onRemove: remove });
  const last = SortableItem({ id: "last", index: 2, total: 3, onMove: move, onRemove: remove });
  expect(findControl(first, "ย้ายหน้า 1 ขึ้น").disabled).toBe(true);
  expect(findControl(last, "ย้ายหน้า 3 ลง").disabled).toBe(true);
});

it("moves to a valid page on Enter without submitting, and rejects invalid page numbers", () => {
  const move = mock(), preventDefault = mock();
  const card = SortableItem({ id: "page", index: 0, total: 21, onMove: move, onRemove() {} });
  const keyDown = findControl(card, "number").onKeyDown;
  expect(keyDown).toBeFunction();
  for (const value of ["0", "22", "1.5", "", "NaN", "3"]) {
    keyDown?.({ key: "Enter", preventDefault, currentTarget: { querySelector: () => ({ value }) } });
  }
  expect(move.mock.calls).toEqual([[2]]);
  expect(preventDefault).toHaveBeenCalledTimes(6);
  keyDown?.({ key: "ArrowUp", preventDefault, currentTarget: { querySelector: () => ({ value: "4" }) } });
  expect(move).toHaveBeenCalledTimes(1);
});
