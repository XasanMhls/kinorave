"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Link } from "@/lib/navigation";
import { getImageUrl } from "@/lib/tmdb";

export default function MovieCard({ movie, type = "movie" }) {
  const href = type === "tv" ? `/series/${movie.id}` : `/movies/${movie.id}`;
  const title = movie.title || movie.name || "";
  const poster = getImageUrl(movie.poster_path, "w342");
  const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  const rating = movie.vote_average;

  return (
    <Link href={href} className="group block">
      <motion.div
        className="relative aspect-[2/3] rounded-[20px] overflow-hidden bg-bg-card border border-white/[0.05]"
        whileHover={{ y: -10, scale: 1.03 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,18vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-card">
            <svg className="w-10 h-10 text-white/[0.08]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Rating stamp */}
        {rating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-2.5 py-1">
            <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[11px] font-[family-name:var(--font-mono)] text-accent font-bold mono-num">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-[0_0_50px_rgba(185,255,102,0.5)]"
            initial={{ opacity: 0, scale: 0.4 }}
            whileHover={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg className="w-6 h-6 text-text-inverse ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        </div>

        {/* Bottom title on hover */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4"
          initial={{ y: 10, opacity: 0 }}
          whileHover={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-white text-[13px] font-[family-name:var(--font-display)] italic leading-tight line-clamp-2">
            {title}
          </p>
        </motion.div>
      </motion.div>

      {/* Title under card */}
      <div className="mt-4 px-1">
        <h3
          className="text-[15px] font-[family-name:var(--font-display)] text-text-primary/85 group-hover:text-accent transition-colors duration-300 truncate leading-snug"
          style={{ fontVariationSettings: '"opsz" 100, "SOFT" 40' }}
        >
          {title}
        </h3>
        {year && (
          <p className="text-[11px] text-text-muted mt-1 font-[family-name:var(--font-mono)] tracking-[0.15em] mono-num">
            {year}
          </p>
        )}
      </div>
    </Link>
  );
}
