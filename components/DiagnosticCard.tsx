import Link from "next/link";

export type DiagnosticCardProps = {
  title: string;
  description: string;
  href: string;
  image: string;
  /** Bottom link label */
  ctaLine?: string;
  /** Optional emoji badge on the image (e.g. ❄️ 🚿 ⚡) */
  icon?: string;
};

/**
 * Primary homepage conversion tile: full card is one link (keyboard + middle-click friendly),
 * hover lift + image zoom, title on overlay.
 */
export default function DiagnosticCard({
  title,
  description,
  href,
  image,
  ctaLine = "Start Diagnosis →",
  icon,
}: DiagnosticCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-hvac-blue/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hvac-gold"
    >
      <div className="relative h-56 shrink-0 overflow-hidden bg-slate-200">
        {icon ? (
          <span
            className="absolute left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xl shadow-md backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <img
          src={image}
          alt=""
          width={1200}
          height={700}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/75" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="m-0 text-lg font-bold leading-snug tracking-tight text-white drop-shadow-md sm:text-xl">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="m-0 text-sm leading-relaxed text-slate-600">{description}</p>
        <span className="mt-3 text-sm font-semibold text-hvac-blue group-hover:underline">{ctaLine}</span>
      </div>
    </Link>
  );
}
