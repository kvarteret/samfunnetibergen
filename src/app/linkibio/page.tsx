import Link from "next/link";
import { fetchLinkInBio } from "@/lib/sanity/fetch";

function LinkInBioProfile({
  heading,
  bio,
}: {
  heading: string | null | undefined;
  bio: string | null | undefined;
}) {
  return (
    <div className="mb-8 text-center space-y-2">
      <h1 className="font-heading text-2xl">{heading}</h1>
      {bio && <p className="text-sm text-foreground/60 max-w-xs">{bio}</p>}
    </div>
  );
}

type LinkInBioLink = {
  _key: string;
  link?: {
    label?: string | null;
    href?: string | null;
  } | null;
  emoji?: string | null;
  highlight?: boolean | null;
};

function LinkInBioLinkList({ links }: { links: LinkInBioLink[] }) {
  return (
    <ul className="w-full max-w-sm space-y-3">
      {links.map((link) => {
        const href = link.link?.href;
        const linkLabel = link.link?.label;
        if (!href || !linkLabel) return null;

        const isExternal = !href.startsWith("/");
        const label = (
          <span className="flex items-center gap-2 justify-center">
            {link.emoji && <span aria-hidden>{link.emoji}</span>}
            {linkLabel}
          </span>
        );
        const className = [
          "flex w-full items-center justify-center px-5 py-4 text-sm font-medium border-2 border-border transition-colors",
          link.highlight
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-card text-foreground hover:bg-muted",
        ].join(" ");

        return (
          <li key={link._key}>
            {isExternal ? (
              <a
                href={href}
                rel="noreferrer"
                target="_blank"
                className={className}
              >
                {label}
              </a>
            ) : (
              <Link href={href} className={className}>
                {label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function LinkInBioPage() {
  const data = await fetchLinkInBio();

  if (!data) return null;

  const links = (data.links ?? []) as LinkInBioLink[];

  return (
    <main className="flex min-h-svh flex-col items-center justify-start gap-0 px-4 pt-16 pb-12 bg-background">
      <LinkInBioProfile heading={data.heading} bio={data.bio} />
      <LinkInBioLinkList links={links} />
      <p className="mt-10 text-xs text-foreground/30">samfunnetibergen.no</p>
    </main>
  );
}
