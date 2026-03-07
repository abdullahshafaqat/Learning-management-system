"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export const MouseAura = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{
        left: springX,
        top: springY,
      }}
      className="pointer-events-none fixed z-0 hidden h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-[100px] dark:bg-brand/10 md:block lg:h-[600px] lg:w-[600px] lg:blur-[120px]"
    />
  );
};
