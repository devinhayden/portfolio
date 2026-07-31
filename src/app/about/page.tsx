import Image from "next/image";

import { AboutContactRow } from "@/components/AboutContactRow";

type TimelineEntry = {
  org: string;
  role: string;
  date: string;
};

const experience: TimelineEntry[] = [
  { org: "NRG Experiential", role: "Experience Design", date: "Fall 2025" },
  { org: "Trimble", role: "Product Design", date: "Summer 2025" },
  { org: "Freelance", role: "Photography", date: "Ongoing" },
];

const education: TimelineEntry[] = [
  { org: "University of Southern California", role: "Cognitive Science", date: "May 2026" },
  { org: "Innovative Design @ USC", role: "VP of External Affairs", date: "'25 -'26" },
  { org: "USC LavaLab", role: "Founding Designer", date: "Spring 2025" },
];

function TimelineRow({ org, role, date }: TimelineEntry) {
  return (
    <div className="flex items-baseline gap-4 text-[16px] leading-[1.4] whitespace-nowrap">
      <span className="w-[260px] shrink-0 text-foreground/90">{org}</span>
      <span className="grow text-foreground/70">{role}</span>
      <span className="shrink-0 text-foreground/70">{date}</span>
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-background px-6 pt-28 pb-24 font-sans text-foreground">
      <div className="mx-auto flex w-full max-w-[670px] flex-col">
        <div className="flex items-start gap-6">
          <Image
            src="/aboutPhoto.jpg"
            alt="Devin Hayden"
            width={100}
            height={100}
            className="size-[100px] shrink-0 rounded-lg border-4 border-white object-cover"
          />
          <div className="flex flex-col gap-1 pt-1">
            <p className="font-serif text-[18px] leading-[1.2] font-medium tracking-[0.36px]">
              Devin Hayden
            </p>
            <p className="text-[16px] leading-[1.4] text-foreground/70">
              Product Design + Photo + Community
            </p>
            <div className="mt-2">
              <AboutContactRow />
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-4 text-[16px] leading-[1.4] text-foreground/70">
          <p>
            Great design, to me, is when someone takes what you made and finds
            their own way to Z, not just A to B. That&rsquo;s the moment a
            product turns into a boundless experience, meant to be outgrown
            from the start.
          </p>
          <p>
            While design is where I&rsquo;ve landed, it&rsquo;s not where I
            started. Photography and community-building were there first, and
            honestly, they&rsquo;re still where a lot of my best instincts
            come from.
          </p>
          <p>Open to full-time and contract opportunities.</p>
        </div>

        <p className="mt-24 font-serif text-[18px] leading-[1.2] font-medium">
          Education &amp; Experience
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {experience.map((entry) => (
            <TimelineRow key={entry.org} {...entry} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {education.map((entry) => (
            <TimelineRow key={entry.org} {...entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
