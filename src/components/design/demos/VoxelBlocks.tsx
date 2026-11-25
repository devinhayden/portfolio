"use client";

import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";

import { VOXEL_ICONS as ICONS, voxelFont } from "./voxel";

type Block = { id: string; icon: string; name: string; description: string };

const BLOCKS: Block[] = [
  {
    id: "script",
    icon: "message",
    name: "Script",
    description: "The agent speaks your words.",
  },
  {
    id: "topic",
    icon: "sparkles",
    name: "Handle a topic",
    description: "Give the agent a goal, not a script.",
  },
  {
    id: "transfer",
    icon: "phone-forwarded",
    name: "Transfer to staff",
    description: "Hand the call to a person.",
  },
  {
    id: "end",
    icon: "phone-missed",
    name: "End call",
    description: "Hang up politely.",
  },
];

/**
 * The block library from Voxel's agent builder (Figma "Voxel Design Files",
 * node 603:173), live: search filters it, and blocks drag by their grip.
 * The palette is Voxel's, kept local to this demo.
 */
export function VoxelBlocks() {
  const [order, setOrder] = useState(BLOCKS);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = q
    ? order.filter((b) =>
        `${b.name} ${b.description}`.toLowerCase().includes(q),
      )
    : order;

  // Reordering a filtered list: the shown blocks swap among the slots they
  // already hold in the full list, and the hidden ones stay put.
  const reorder = (next: Block[]) => {
    const ids = new Set(next.map((b) => b.id));
    let i = 0;
    setOrder(order.map((b) => (ids.has(b.id) ? next[i++] : b)));
  };

  return (
    <div
      className={`${voxelFont.className} mx-auto flex w-full max-w-[468px] flex-col gap-4 rounded-[12px] border border-[#dde3e7] bg-white p-6 text-left text-[#18262c] shadow-[0_1px_1px_rgba(15,23,41,0.05)] max-sm:p-4`}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-[16px] font-medium">Blocks</p>
        <p className="text-[14px] text-[#5c6f7c]">
          Drag a block into your call script.
        </p>
      </div>

      <div className="flex items-center gap-4 max-sm:gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[#c5ced5] bg-white p-2 focus-within:border-[#18262c]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ICONS}/search.svg`} alt="" width={16} height={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for elements…"
            aria-label="Search blocks"
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#5c6f7c] [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        <button
          type="button"
          tabIndex={-1}
          className="shrink-0 cursor-default rounded-[8px] border border-[#c5ced5] bg-white px-4 py-2 text-[16px] font-medium"
        >
          Templates
        </button>
      </div>

      <Reorder.Group
        axis="y"
        values={shown}
        onReorder={reorder}
        className="flex min-h-[248px] flex-col gap-2"
      >
        {shown.map((block) => (
          <BlockRow key={block.id} block={block} />
        ))}
        {shown.length === 0 && (
          <li className="py-6 text-center text-[14px] text-[#5c6f7c]">
            No blocks match “{query.trim()}”.
          </li>
        )}
      </Reorder.Group>
    </div>
  );
}

/**
 * One block. A mouse drags it from anywhere; touch only from the grip, so a
 * swipe across the demo still scrolls the page.
 */
function BlockRow({ block }: { block: Block }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") controls.start(e);
      }}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 20px rgba(15,23,41,0.12)",
      }}
      className="flex min-w-[150px] items-center gap-3 rounded-[8px] border border-[#dde3e7] bg-white py-2 pr-4 pl-3 shadow-[0_1px_1.5px_rgba(15,23,41,0.06)] transition-colors select-none hover:border-[#c5ced5] pointer-fine:cursor-grab pointer-fine:active:cursor-grabbing"
    >
      <span
        className="-m-2 shrink-0 touch-none p-2"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") controls.start(e);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${ICONS}/grip.svg`}
          alt=""
          width={16}
          height={16}
          draggable={false}
          className="block"
        />
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#f8f8f9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${ICONS}/${block.icon}.svg`}
          alt=""
          width={24}
          height={24}
          draggable={false}
        />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[16px]">{block.name}</span>
        <span className="text-[14px] text-[#5c6f7c]">{block.description}</span>
      </span>
    </Reorder.Item>
  );
}
