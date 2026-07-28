import { WorkCards, type Project } from "@/components/WorkCards";

const projects: Project[] = [
  {
    title: "Apple Trips",
    status: "Concept",
    description: "iOS-native trip planning",
    background: "/appleTripsCover.png",
    mockup: "/appleTripUI.png",
    mockupWidth: 529,
    mockupHeight: 705,
    mockupOffset: 0,
  },
  {
    title: "Trimble",
    status: "Shipped",
    description: "Global construction tooling",
    background: "/trimbleCover.png",
    mockup: "/trimbleUI.png",
    mockupWidth: 946,
    mockupHeight: 688,
    mockupOffset: 0,
  },
  {
    title: "Voxel",
    status: "Shipped",
    description: "Voice AI for healthcare",
    background: "/voxelCover.png",
    mockup: "/voxelUI.png",
    mockupWidth: 635,
    mockupHeight: 688,
    mockupOffset: 0,
  },
  {
    title: "Nova",
    status: "Shipped",
    description: "Offline international learning",
    background: "/novaCover.png",
    mockup: "/novaUI.png",
    mockupWidth: 910,
    mockupHeight: 777,
    mockupOffset: 0,
  },
  {
    title: "NRG Experiential",
    status: "Shipped",
    description: "Tech brand activations",
    background: "/nrgCover.png",
    mockup: "/nrgUI.png",
    mockupWidth: 938,
    mockupHeight: 656,
    mockupOffset: 0,
  },
];

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`rounded-lg px-2 py-1 text-[14px] leading-[1.4] text-black/70 ${
        active ? "bg-[#ebebeb] font-medium" : "font-normal"
      }`}
    >
      {label}
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-16 overflow-hidden bg-[#f7f7f7] px-6 font-sans text-black">
      <nav className="flex items-center gap-4 rounded-lg border border-black/10 p-2">
        <NavItem label="About" />
        <NavItem label="Work" active />
        <NavItem label="Contact" />
      </nav>

      <div className="flex flex-col items-center gap-[22px] text-center">
        <h1 className="font-serif text-[24px] leading-[1.2] font-medium whitespace-nowrap">
          Devin Hayden is a designer shaping experiences meant to be outgrown.
        </h1>
        <p className="text-[16px] leading-[1.4] text-black/70 whitespace-nowrap">
          You can reach him on LinkedIn, X, via email, or most likely on Beli.
        </p>
      </div>

      <WorkCards projects={projects} />
    </div>
  );
}
