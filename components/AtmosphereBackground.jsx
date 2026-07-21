import { useState, useEffect } from "react";
import Image from "next/image";

// Fundal atmosferic fix, in spatele cardurilor — aceleasi setari confirmate pe Ritual.
// zIndex:-1 (nu 0) — altfel, fiind element pozitionat, s-ar picta DUPA continutul static
// al paginii (cardurile), aparand DEASUPRA lor in loc de dedesubt.
export default function AtmosphereBackground() {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsNarrow(mq.matches);
    const handler = (e) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}>
      <Image
        src={isNarrow ? "/images/atmosphere/fog-1-portrait.jpg" : "/images/atmosphere/fog-1.jpg"}
        alt=""
        fill
        unoptimized
        sizes="100vw"
        style={{
          objectFit: "cover",
          objectPosition: isNarrow ? "50% 50%" : "50% 75%",
          filter: "blur(3px) saturate(0.95) brightness(1.3)",
          opacity: 0.42,
        }}
      />
    </div>
  );
}
