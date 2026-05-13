import { cn } from "@/lib/utils";

interface TroskyMarkProps {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function TroskyMark({
  className,
  imageClassName,
  priority,
}: TroskyMarkProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      aria-hidden
    >
      {/* Plain img avoids Next image optimizer 400s on large PNGs from external drives */}
      <img
        src="/trosky-image.png"
        alt=""
        width={1254}
        height={1254}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
