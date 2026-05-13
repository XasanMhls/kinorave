"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import { getBackdropUrl, getImageUrl } from "@/lib/tmdb";

export default function TrendingCarousel({ movies, type = "movie" }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!movies || movies.length === 0) return null;

  const items = movies.slice(0, 10);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.offsetWidth || 400;
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.firstElementChild) return;
    const cardWidth = el.firstElementChild.offsetWidth + 16;
    setActiveIndex(Math.round(el.scrollLeft / cardWidth));
  }, []);

  return (
    <div className="relative group/carousel">
      {/* Arrow buttons */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-black/80 hover:scale-110"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={() => scroll(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-black/80 hover:scale-110"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((movie, i) => {
          const backdrop = getBackdropUrl(movie.backdrop_path);
          const poster = getImageUrl(movie.poster_path, "w342");
          const title = movie.title || movie.name || "";
          const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
          const href = type === "tv" ? `/series/${movie.id}` : `/movies/${movie.id}`;
          const rating = movie.vote_average;

          return (
            <Link
              key={movie.id}
              href={href}
              className="flex-none w-[85vw] sm:w-[70vw] md:w-[550px] lg:w-[600px] snap-start group block"
            >
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-bg-card border border-white/[0.04] transition-all duration-500 group-hover:border-white/[0.08] group-hover:shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                {backdrop ? (
                  <Image
                    src={backdrop}
                    alt={title}
                    fill
                    sizes="(max-width:768px) 85vw, 600px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : poster ? (
                  <Image src={poster} alt={title} fill className="object-cover" sizes="600px" />
                ) : null}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                {/* Rank number */}
                <div className="absolute top-4 left-5 text-[72px] font-black text-white/[0.08] leading-none font-[family-name:var(--font-display)] select-none">
                  {i + 1}
                </div>

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 shadow-[0_0_40px_rgba(185,255,102,0.3)]">
                    <svg className="w-7 h-7 text-text-inverse ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    {rating > 0 && (
                      <span className="flex items-center gap-1 bg-accent/15 backdrop-blur-md text-accent text-[12px] font-bold px-2.5 py-1 rounded-lg">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {rating.toFixed(1)}
                      </span>
                    )}
                    {year && <span className="text-white/50 text-[12px] font-medium">{year}</span>}
                  </div>
                  <h3 className="text-white text-[20px] sm:text-[24px] font-bold tracking-[-0.03em] font-[family-name:var(--font-display)] line-clamp-1 group-hover:text-accent transition-colors duration-300">
                    {title}
                  </h3>
                  {movie.overview && (
                    <p className="text-white/50 text-[13px] leading-[1.6] mt-2 line-clamp-2 max-w-md">
                      {movie.overview}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {items.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
