import Image from "next/image";

export function BrandMark({ className = "h-10 w-10 sm:h-11 sm:w-11" }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Auction Ethiopia S.C"
      width={88}
      height={88}
      className={`shrink-0 rounded-full object-cover ring-1 ring-gold/40 ${className}`}
      priority
    />
  );
}
