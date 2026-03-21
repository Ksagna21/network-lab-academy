import { useEffect, useRef, useState } from "react";

const useScrollReveal = (options?: { delay?: number; threshold?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: options?.threshold ?? 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options?.threshold]);

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(16px)",
    filter: isVisible ? "blur(0)" : "blur(4px)",
    transition: `all 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${options?.delay ?? 0}ms`,
  };

  return { ref, style, isVisible };
};

export default useScrollReveal;
