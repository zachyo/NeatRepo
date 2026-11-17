import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  size?: "sm" | "md";
  className?: string;
}

/** NeatRepo wordmark: a blue tile with stacked "folder" bars and the name. */
export function Logo({ href = "/", size = "md", className }: LogoProps) {
  const tile = size === "sm" ? "size-6 rounded-md" : "size-8 rounded-lg";
  const bars = size === "sm" ? "w-3 gap-[2px]" : "w-4 gap-[3px]";
  const text = size === "sm" ? "text-sm" : "text-lg";

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("flex items-center justify-center bg-blue-600", tile)}
      >
        <span className={cn("flex flex-col", bars)}>
          <span className="h-[3px] w-3/5 rounded-full bg-white/70" />
          <span className="h-[3px] w-full rounded-full bg-white" />
          <span className="h-[3px] w-4/5 rounded-full bg-white/70" />
        </span>
      </span>
      <span className={cn("font-semibold text-gray-900", text)}>NeatRepo</span>
    </Link>
  );
}
