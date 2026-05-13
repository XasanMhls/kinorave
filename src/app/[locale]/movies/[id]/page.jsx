import { getTranslations } from "next-intl/server";
import { getMovieDetails, getImageUrl, getBackdropUrl } from "@/lib/tmdb";
import Image from "next/image";
import MovieGrid from "@/components/MovieGrid";
import MovieDetailClient from "./MovieDetailClient";

export async function generateMetadata({ params }) {
  const { id, locale } = await params;
  const lang = locale === "uz" ? "en" : locale;
  try {
    const movie = await getMovieDetails(id, lang);
    return { title: movie.title, description: movie.overview?.slice(0, 160) };
  } catch {
    return { title: "Movie" };
  }
}

export default async function MovieDetailPage({ params }) {
  const { id, locale } = await params;
  const lang = locale === "uz" ? "en" : locale;
  const t = await getTranslations({ locale, namespace: "movie" });

  let movie;
  try {
    movie = await getMovieDetails(id, lang);
  } catch {
    return (
      <div className="site-container pt-10 text-center py-24">
        <p className="text-text-muted text-lg">Movie not found</p>
      </div>
    );
  }

  const backdrop = getBackdropUrl(movie.backdrop_path);
  const poster = getImageUrl(movie.poster_path, "w500");
  const year = (movie.release_date || "").slice(0, 4);
  const hours = Math.floor((movie.runtime || 0) / 60);
  const mins = (movie.runtime || 0) % 60;
  const director = movie.credits?.crew?.find((c) => c.job === "Director");
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const similar = movie.similar?.results?.slice(0, 6) || [];

  return (
    <>
      {/* Backdrop — full bleed behind navbar */}
      <div className="relative h-[60vh] min-h-[420px] -mt-[88px]">
        {backdrop && (
          <Image src={backdrop} alt="" fill className="object-cover object-[50%_20%]" priority quality={85} sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-bg-primary/30" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-primary to-transparent" />
      </div>

      <div className="site-container -mt-60 relative z-10 pb-20 animate-fade-up">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Poster */}
          <div className="shrink-0 mx-auto lg:mx-0">
            <div className="w-[240px] aspect-[2/3] rounded-[24px] overflow-hidden shadow-elevated ring-1 ring-white/[0.06]">
              {poster ? (
                <Image src={poster} alt={movie.title} width={240} height={360} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-card flex items-center justify-center">
                  <svg className="w-12 h-12 text-white-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-text-primary tracking-[-0.04em] leading-[1.05] mb-4 font-[family-name:var(--font-display)]">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-text-muted text-[15px] italic mb-5">{movie.tagline}</p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              {movie.vote_average > 0 && (
                <span className="chip chip-accent font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
              {year && <span className="chip chip-muted">{year}</span>}
              {movie.runtime > 0 && (
                <span className="chip chip-muted">
                  {hours > 0 ? `${hours}h ` : ""}{mins}m
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-7">
              {movie.genres?.map((g) => (
                <span key={g.id} className="px-3.5 py-1.5 rounded-full bg-white-4 text-text-secondary text-[12px] font-medium border border-border">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Description */}
            {movie.overview && (
              <div className="mb-7">
                <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em] mb-3">{t("description")}</h2>
                <p className="text-text-secondary text-[15px] leading-[1.8] max-w-2xl">{movie.overview}</p>
              </div>
            )}

            {/* Crew */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              {director && (
                <div>
                  <span className="text-text-muted text-[12px] font-medium block mb-1">{t("director")}</span>
                  <span className="text-text-primary font-semibold">{director.name}</span>
                </div>
              )}
              {cast.length > 0 && (
                <div>
                  <span className="text-text-muted text-[12px] font-medium block mb-1">{t("cast")}</span>
                  <span className="text-text-primary line-clamp-2">{cast.map((c) => c.name).join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player + comments */}
        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-text-primary tracking-[-0.03em] mb-6 font-[family-name:var(--font-display)]">{t("watch")}</h2>
          <MovieDetailClient tmdbId={movie.id} type="movie" title={movie.title} poster={poster} />
        </div>

        {similar.length > 0 && <MovieGrid title={t("similar")} movies={similar} />}
      </div>
    </>
  );
}
