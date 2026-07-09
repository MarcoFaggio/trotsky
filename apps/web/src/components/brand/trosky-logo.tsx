import { cn } from "@/lib/utils";

interface TroskyMarkProps {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** White backing plate so the transparent PNG reads on light and dark surfaces */
  withPlate?: boolean;
  alt?: string;
}

export function TroskyMark({
  className,
  imageClassName,
  priority,
  withPlate = true,
  alt = "Trosky",
}: TroskyMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        withPlate && [
          "overflow-hidden rounded-xl p-1",
          "bg-white shadow-sm ring-1 ring-trosky-border/80",
          "dark:bg-white dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] dark:ring-white/15",
        ],
        className
      )}
    >
      <img
        src="/trosky-image.png"
        alt={alt}
        width={1254}
        height={1254}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn(
          "h-full w-full object-contain object-center",
          "drop-shadow-[0_2px_6px_rgba(166,1,1,0.22)]",
          imageClassName
        )}
      />
    </span>
  );
}
