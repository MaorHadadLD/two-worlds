"use client";

import { useEffect } from "react";

/** Marks each [data-enter] block once, when it first comes into view. One observer for the page. */
export default function Enter() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-enter]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
