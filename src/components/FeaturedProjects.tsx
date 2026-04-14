import Link from 'next/link';

const projects = [
  {
    id: 'trimble',
    description: 'Secure and intuitive voice AI for healthcare clinics',
    href: '#',
  },
  {
    id: 'voxel',
    description: 'Enterprise construction tooling for global workflows',
    href: '#',
  },
];

export default function FeaturedProjects() {
  return (
    <section className="flex flex-col gap-6 sm:flex-row">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={project.href}
          className="group flex flex-1 flex-col gap-4"
        >
          {/* Placeholder — replace with media */}
          <div className="aspect-[1518/1080] w-full bg-white transition-opacity duration-200 group-hover:opacity-80" />
          <p className="text-base font-normal leading-normal text-foreground transition-opacity duration-200 group-hover:opacity-60">
            {project.description}
          </p>
        </Link>
      ))}
    </section>
  );
}
