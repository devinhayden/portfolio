import { ContactLine } from "@/components/ContactLine";
import { WorkCards, type Project } from "@/components/WorkCards";

const projects: Project[] = [
  // {
  //   title: "Apple Trips",
  //   status: "Concept",
  //   description: "iOS-native trip planning",
  //   background: "/appleTripsCover.png",
  //   mockup: "/appleTripUI.png",
  //   mockupWidth: 529,
  //   mockupHeight: 705,
  //   mockupOffset: 56,
  // },
  {
    title: "Trimble",
    status: "Shipped",
    description: "Global construction tooling",
    background: "/trimbleCover.png",
    mockup: "/trimbleUI.png",
    mockupWidth: 946,
    mockupHeight: 688,
    mockupOffset: 56,
  },
  {
    title: "Voxel",
    status: "Shipped",
    description: "Voice AI for healthcare",
    background: "/voxelCover.png",
    mockup: "/voxelUI.png",
    mockupWidth: 635,
    mockupHeight: 688,
    mockupOffset: 56,
  },
  {
    title: "Nova",
    status: "Shipped",
    description: "Offline international learning",
    background: "/novaCover.png",
    mockup: "/novaUI.png",
    mockupWidth: 910,
    mockupHeight: 777,
    mockupOffset: 56,
  },
  {
    title: "NRG Experiential",
    status: "Shipped",
    description: "Tech brand activations",
    background: "/nrgCover.png",
    mockup: "/nrgUI.png",
    mockupWidth: 938,
    mockupHeight: 656,
    mockupOffset: 56,
  },
];

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-16 overflow-hidden bg-background px-6 pt-20 font-sans text-foreground">
      <div className="flex flex-col items-center gap-[22px] text-center">
        <h1 className="font-serif text-[24px] leading-[1.2] font-medium whitespace-nowrap">
          Devin is a designer shaping experiences meant to be outgrown.
        </h1>
        <ContactLine />
      </div>

      <WorkCards projects={projects} defaultExpandedTitle="Voxel" />
    </div>
  );
}
