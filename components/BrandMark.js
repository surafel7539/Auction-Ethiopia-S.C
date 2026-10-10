import Image from "next/image";

export function BrandMark({
  className = "h-10 w-auto sm:h-11",
  variant = "auto",
}) {
  const shared = {
    alt: "Crown Bid",
    width: 280,
    height: 140,
    className: `shrink-0 object-contain ${className}`,
    priority: true,
    unoptimized: true,
  };

  if (variant === "light") {
    return <Image src="/crownbid-full.png" {...shared} />;
  }
  if (variant === "dark") {
    return <Image src="/crownbid-dark.png" {...shared} />;
  }

  return (
    <span className="relative inline-flex items-center">
      <Image
        src="/crownbid-full.png"
        {...shared}
        className={`${shared.className} dark:hidden`}
      />
      <Image
        src="/crownbid-dark.png"
        {...shared}
        className={`${shared.className} hidden dark:block`}
      />
    </span>
  );
}
