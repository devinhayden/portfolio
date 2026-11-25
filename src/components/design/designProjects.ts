import type { ComponentType } from "react";

import { HuddleActions } from "./demos/HuddleActions";
import { HuddleKeep } from "./demos/HuddleKeep";
import { HuddleSurface } from "./demos/HuddleSurface";
import { VoxelBlocks } from "./demos/VoxelBlocks";
import { VoxelCallScript } from "./demos/VoxelCallScript";
import { VoxelVariables } from "./demos/VoxelVariables";

/**
 * The design work, in carousel order.
 *
 * Each project has two layers:
 * - Upfront, on the carousel: one hero screen, the summary as its headline,
 *   and the facts (company, role, timeline, team). Enough to choose by.
 * - The deep dive, a scroll below. Short on purpose — an overview, not a
 *   case study — and built so a skim of its bold lines tells the story:
 *   1. The problem: who's stuck, on what, and why it's worth solving.
 *   2. Two or three key decisions. Each names the part of the problem it
 *      answers (`tension`), then what you chose, over what, and why.
 *   3. A closing line: what the work shows.
 *
 * Anything marked PLACEHOLDER is a stand-in to be replaced with the real
 * copy or a proper export.
 */

export type DesignImage = {
  src: string;
  width: number;
  height: number;
  /** Describes the screen for anyone who can't see it. */
  alt: string;
};

/** What sits under a decision: a still, or a live slice of the UI to try. */
export type DecisionMedia =
  | ({ kind: "image"; caption?: string } & DesignImage)
  | {
      kind: "demo";
      /** A small, self-contained interactive recreation of the UI. */
      component: ComponentType;
      caption?: string;
    };

export type Decision = {
  /** The part of the problem this answers, in a few words. */
  tension: string;
  /** The decision itself, as one sentence. */
  heading: string;
  /**
   * Each string is its own paragraph. One is usually enough: what you
   * chose over what, and why it won.
   */
  body: string[];
  media?: DecisionMedia;
};

export type DesignProject = {
  slug: string;
  // Upfront.
  title: string;
  hero: DesignImage;
  /** One sentence, shown as the headline under the screen. */
  summary: string;
  facts: { label: string; value: string }[];
  // The deep dive.
  /**
   * The problem and why it matters, in three beats, with the key fact set
   * apart as a callout so it's seen at a glance. Together they should name
   * the tensions the decisions go on to answer. Wrap a phrase in
   * ==double equals== to highlight it.
   */
  problem: {
    /** Who's stuck, and on what. */
    context: string;
    /** The key fact, often the figure that sizes it, as one sentence. */
    callout: string;
    /** Why it's worth solving, and what any answer has to get right. */
    stakes: string;
  };
  decisions: Decision[];
  /** The closing line: what the work shows. */
  closing: string;
};

export const DESIGN_PROJECTS: DesignProject[] = [
  {
    slug: "voxel",
    title: "Voice agent builder for healthcare clinics",
    hero: {
      src: "/design/voxel-cover.png",
      width: 2888,
      height: 2056,
      alt: "The Create Voice Agent screen: a call script built from draggable blocks, beside a library of blocks and patient variables",
    },
    summary:
      "Automating manual patient lookups on live clinic calls with voice agents.",
    facts: [
      { label: "Status", value: "Shipped" },
      { label: "Role", value: "Sole designer" },
      { label: "Timeline", value: "8 weeks" },
      { label: "Team", value: "1 PM, 2 developers" },
    ],
    problem: {
      context:
        "Healthcare clinics are stuck in the past, running on legacy technology and manual systems that can’t keep up with the demand for modern medical care.",
      callout:
        "Clinic staff lose ==1–2 hours a day== to manual calls and EMR lookups, instead of spending that time with patients.",
      stakes:
        "Voice agents could take those calls, but only if clinics could ==set them up easily== and ==trust how they’d behave==.",
    },
    decisions: [
      {
        tension: "Clinics know their legacy tools",
        heading:
          "Researched the comms software clinics already use, and mirrored its patterns.",
        body: [
          "The voice agent API came with its own agent designer, but it was too complicated for clinics, with far more options than they needed. I designed a block-based system that scoped it down into recognizable actions clinics were already using in other comms software, like automated texting.",
        ],
        media: {
          kind: "demo",
          component: VoxelBlocks,
          caption: "Search and drag the blocks",
        },
      },
      {
        tension: "Clinics need trust upfront",
        heading:
          "Built a form builder that shows each call flow from start to finish.",
        body: [
          "For clinics to hand off calls with their patients, they need to know exactly how a call will play out from the moment they set it up. I designed the call script builder around clear, linear flows, with no complex branching, so clinics define recognizable steps for the agent to follow.",
        ],
        media: {
          kind: "demo",
          component: VoxelCallScript,
          caption: "Open, reorder or remove a step",
        },
      },
      {
        tension: "Patient data is buried in EMRs",
        heading:
          "Designed EMR-integrated variables to reference in call scripts.",
        body: [
          "On manual calls, clinic staff juggle a real conversation while digging through pages of EMR records. Once connected to a clinic’s EMR, customizable variables pull patient data straight from it, so the agent can surface it live on the call.",
        ],
        media: {
          kind: "demo",
          component: VoxelVariables,
          caption: "Sync with the EMR, then copy a variable",
        },
      },
    ],
    closing:
      "Modern voice agents, built around the tools clinics already know.",
  },
  {
    slug: "meeting-agent",
    title: "Passive agent support in impromptu meetings",
    hero: {
      src: "/design/huddle-cover.png",
      width: 2880,
      height: 1800,
      alt: "A huddle between Jane and John, with the Agent panel open beside the call: a pinned note, a design file it surfaced after hearing “Daily report UI”, with Pin and Dismiss, and chips to ask for a screenshot, open questions or a message",
    },
    summary:
      "Passive agent support in impromptu meetings, bringing thread context into the call without breaking the conversation.",
    facts: [
      { label: "Status", value: "Concept" },
      { label: "Role", value: "Sole designer" },
      { label: "Timeline", value: "Ongoing" },
    ],
    problem: {
      context:
        "A huddle usually starts because a thread stopped working, but the thread still holds what the call needs: ideas floated, feedback buried in replies, images under discussion.",
      callout:
        "Once the conversation moves to voice, ==that material drops out of view==.",
      stakes:
        "Participants either ==pull attention away from the call== to dig it up, or forget it exists, so ideas go unnoticed, feedback gets missed, and the same ground gets covered again later. An agent could bring it back, but only if it ==stays out of the way== and ==behaves predictably==.",
    },
    decisions: [
      {
        tension: "Finding context takes effort",
        heading:
          "Designed the agent to surface relevant context passively, and show why.",
        body: [
          "On a call, time goes to remembering what was said in the thread and searching for the right message or file. I designed the agent to pull keywords from the live transcript, cross-reference them with the thread, and surface matches on its own, each with a short reason it appeared.",
        ],
        media: {
          kind: "demo",
          component: HuddleSurface,
          caption: "The agent hears a keyword and surfaces the file",
        },
      },
      {
        tension: "Not everything surfaced is useful",
        heading:
          "Designed clear states and quick actions to keep or dismiss what surfaces.",
        body: [
          "Not everything an agent surfaces will be relevant, and the rest is noise. I designed distinct states for surfaced items, with quick actions to pin what matters or dismiss what doesn’t; anything left alone clears on its own after a short time.",
        ],
        media: {
          kind: "demo",
          component: HuddleKeep,
          caption: "Pin it, dismiss it, or let it fade",
        },
      },
      {
        tension: "Agents can be unpredictable",
        heading: "Limited the agent to a defined set of in-call actions.",
        body: [
          "An agent roaming a thread and interrupting the call would hurt the meeting more than help it. I defined a small set of actions and a simple control panel, so everyone knows upfront what the agent can do, can ask it for one of those actions directly, or can turn it off completely.",
        ],
        media: {
          kind: "demo",
          component: HuddleActions,
          caption: "Ask for an action, or pause the agent",
        },
      },
    ],
    closing: "An agent that listens in, without taking over the call.",
  },
];
