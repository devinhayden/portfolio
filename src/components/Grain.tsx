"use client";

import { useDialKit } from "dialkit";
import { useEffect } from "react";

/**
 * The paper texture under every content page (see `page-ground` in
 * globals.css): `public/textures/paper.webp`, a photographed sheet of paper
 * (Texturelabs Paper 234M) flattened, made seamless and reduced to the
 * shadows of its tooth, dark on transparent so it only darkens the white.
 * A 1024px tile, shown at 512px × scale so it's sharp on retina screens.
 *
 * It belongs to the pages, so it stays with them as they shrink into the
 * menu's window. The panel's placement switch moves it onto the menu's wall
 * instead (`menu-ground`), to compare. Renders nothing; it keeps the
 * texture's CSS variables on <html> in step with the DialKit "Grain" panel.
 */

/** The tile's size in CSS pixels at scale 1: half its 1024px. */
const TILE = 512;

export function Grain() {
  const dial = useDialKit(
    "Grain",
    {
      on: true,
      /** Where it goes: the pages (inside the window) or the menu's wall. */
      placement: {
        type: "select",
        options: ["pages", "menu"],
        default: "menu",
      },
      /** How dark the tooth is overall: felt rather than seen. */
      strength: [0.08, 0, 0.5, 0.01],
      /** Larger is a coarser tooth; 1 is the texture's own scale. */
      scale: [0.7, 0.5, 2, 0.05],
    },
    { id: "grain", persist: true },
  );

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--grain", 'url("/textures/paper.webp")');
    root.setProperty("--grain-tile", `${TILE * dial.scale}px`);
    const strength = dial.on ? dial.strength : 0;
    const onMenu = dial.placement === "menu";
    root.setProperty("--grain-strength", String(onMenu ? 0 : strength));
    root.setProperty("--menu-grain-strength", String(onMenu ? strength : 0));
  }, [dial.on, dial.strength, dial.scale, dial.placement]);

  return null;
}
