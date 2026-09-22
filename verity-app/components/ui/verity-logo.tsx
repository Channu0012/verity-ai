import Image from "next/image";
import Link from "next/link";

interface VerityLogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
}

export function VerityBrandLogo({
  size = 32,
  showText = true,
  subtitle,
  href = "/",
  className = "",
}: VerityLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/logo.png"
          alt="VERITY Logo"
          width={size}
          height={size}
          className="rounded-xl object-contain shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-sky-400 transition-colors leading-tight font-sans">
            VERITY
          </span>
          {subtitle && (
            <span className="text-[9px] tracking-[0.25em] text-white/40 uppercase font-mono -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
