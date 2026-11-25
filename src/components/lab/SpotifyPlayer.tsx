"use client";

import * as React from "react";

/**
 * A compact Spotify embed driven through Spotify's iFrame API. Visitors
 * logged into Spotify in their browser hear whole tracks; everyone else
 * hears 30-second previews.
 */

interface PlaybackUpdate {
  data: { playingURI: string; isPaused: boolean; isBuffering: boolean; duration: number; position: number };
}

interface EmbedController {
  loadUri(uri: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  addListener(event: "ready", listener: () => void): void;
  addListener(event: "playback_update", listener: (event: PlaybackUpdate) => void): void;
}

interface IFrameAPI {
  createController(element: HTMLElement, options: { uri: string; width?: string | number; height?: number }, ready: (controller: EmbedController) => void): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
    __spotifyIframeApi?: Promise<IFrameAPI>;
  }
}

const SCRIPT = "https://open.spotify.com/embed/iframe-api/v1";
const HEIGHT = 80;

/** Loads the iFrame API once per page, however many times this mounts. */
function iframeApi() {
  if (!window.__spotifyIframeApi) {
    window.__spotifyIframeApi = new Promise<IFrameAPI>((resolve) => {
      window.onSpotifyIframeApiReady = resolve;
      const script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    });
  }
  return window.__spotifyIframeApi;
}

export interface SpotifyPlayerHandle {
  /** Get an album ready, without playing it. */
  load(uri: string): void;
  /** Play an album, loading it first if needed. */
  play(uri: string): void;
  pause(): void;
}

type Status = "loading" | "ready" | "playing" | "paused";

export const SpotifyPlayer = React.forwardRef<SpotifyPlayerHandle, { initialUri: string; className?: string }>(function SpotifyPlayer(
  { initialUri, className },
  ref,
) {
  const host = React.useRef<HTMLDivElement>(null);
  const controller = React.useRef<EmbedController | null>(null);
  /** What's loaded, whether the embed has finished loading it, and what's wanted next. */
  const track = React.useRef({ uri: initialUri, ready: false, wantPlay: false });
  const [status, setStatus] = React.useState<Status>("loading");

  React.useEffect(() => {
    const node = host.current;
    if (!node) return;
    let cancelled = false;
    // The API replaces the element it's given, so hand it one React doesn't own.
    const mount = document.createElement("div");
    node.appendChild(mount);
    iframeApi().then((api) => {
      if (cancelled) return;
      api.createController(mount, { uri: track.current.uri, width: "100%", height: HEIGHT }, (made) => {
        if (cancelled) {
          made.destroy();
          return;
        }
        controller.current = made;
        made.addListener("ready", () => {
          track.current.ready = true;
          setStatus((now) => (now === "loading" ? "ready" : now));
          if (track.current.wantPlay) {
            track.current.wantPlay = false;
            made.play();
          }
        });
        made.addListener("playback_update", ({ data }) => {
          if (data.isBuffering) return;
          setStatus(data.isPaused ? "paused" : "playing");
        });
      });
    });
    return () => {
      cancelled = true;
      controller.current?.destroy();
      controller.current = null;
      node.replaceChildren();
    };
  }, []);

  React.useImperativeHandle(
    ref,
    () => {
      const load = (uri: string) => {
        if (track.current.uri === uri) return;
        track.current = { uri, ready: false, wantPlay: false };
        controller.current?.loadUri(uri);
      };
      return {
        load,
        play(uri) {
          load(uri);
          const made = controller.current;
          if (made && track.current.ready) made.play();
          else track.current.wantPlay = true;
        },
        pause() {
          track.current.wantPlay = false;
          controller.current?.pause();
        },
      };
    },
    [],
  );

  return <div ref={host} className={className} data-status={status} style={{ minHeight: HEIGHT }} />;
});
