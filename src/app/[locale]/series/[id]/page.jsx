import { getTranslations } from "next-intl/server";
import { getSeriesDetails, getSeasonDetails, getImageUrl, getBackdropUrl } from "@/lib/tmdb";
import Image from "next/image";
import MovieGrid from "@/components/MovieGrid";
import SeriesDetailClient from "./SeriesDetailClient";

export async function generateMetadata({ params }) {
  const { id, locale } = await params;
  const lang = locale === "uz" ? "en" : locale;
  try {
    const s = await getSeriesDetails(id, lang);
    return { title: s.name, description: s.overview?.slice(0, 160) };
  } catch {
    return { title: "Series" };
  }
}

export default async function SeriesDetailPage({ params }) {
  const { id, locale } = await params;
  const lang = locale === "uz" ? "en" : locale;
  const t = await getTranslations({ locale, namespace: "movie" });

  let series;
  try {
    series = await getSeriesDetails(id, lang);
  } catch {
    return (
      <div className="site-container pt-10 text-center py-24">
        <p className="text-text-muted text-lg">Series not found</p>
      </div>
    );
  }

  let seasonsData = series.seasons || [];
  try {
    const first = seasonsData.find((s) => s.season_number > 0);
    if (first) {
      const d = await getSeasonDetails(id, first.season_number, lang);
      seasonsData = seasonsData.map((s) =>
        s.season_number === first.season_number ? { ...s, episodes: d.episodes } : s
      );
    }
  } catch {}

  const backdrop = getBackdropUrl(series.backdrop_path);
  const poster = getImageUrl(series.poster_path, "w500");
  const year = (series.first_air_date || "").slice(0, 4);
  const cast = series.credits?.cast?.slice(0, 8) || [];
  const similar = series.similar?.results?.slice(0, 6) || [];

  return (
    <>
      <div className="relative h-[60vh] min-h-[420px] -mt-[88px]">
        {backdrop && <Image src={backdrop} alt="" fill className="object-cover object-[50%_20%]" priority quality={85} sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-bg-primary/30" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg-primary to-transparent" />
      </div>

      <div className="site-container -mt-60 relative z-10 pb-20 animate-fade-up">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          <div className="shrink-0 mx-auto lg:mx-0">
            <div className="w-[240px] aspect-[2/3] rounded-[24px] overflow-hidden shadow-elevated ring-1 ring-white/[0.06]">
              {poster ? (
                <Image src={poster} alt={series.name} width={240} height={360} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-card flex items-center justify-center">
                  <svg className="w-12 h-12 text-white-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-text-primary tracking-[-0.04em] leading-[1.05] mb-4 font-[family-name:var(--font-display)]">{series.name}</h1>
            {series.tagline && <p className="text-text-muted text-[15px] italic mb-5">{series.tagline}</p>}

            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              {series.vote_average > 0 && (
                <span className="chip chip-accent font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {series.vote_average.toFixed(1)}
                </span>
              )}
              {year && <span className="chip chip-muted">{year}</span>}
              {series.number_of_seasons > 0 && (
                <span className="chip chip-muted">{series.number_of_seasons} {t("season")}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-7">
              {series.genres?.map((g) => (
                <span key={g.id} className="px-3.5 py-1.5 rounded-full bg-white-4 text-text-secondary text-[12px] font-medium border border-border">{g.name}</span>
              ))}
            </div>

            {series.overview && (
              <div className="mb-7">
                <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em] mb-3">{t("description")}</h2>
                <p className="text-text-secondary text-[15px] leading-[1.8] max-w-2xl">{series.overview}</p>
              </div>
            )}

            {cast.length > 0 && (
              <div>
                <span className="text-text-muted text-[12px] font-medium block mb-1">{t("cast")}</span>
                <span className="text-text-primary text-[14px] line-clamp-2">{cast.map((c) => c.name).join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-text-primary tracking-[-0.03em] mb-6 font-[family-name:var(--font-display)]">{t("watch")}</h2>
          <SeriesDetailClient tmdbId={series.id} seasons={seasonsData} title={series.name} poster={poster} />
        </div>

        {similar.length > 0 && <MovieGrid title={t("similar")} movies={similar} type="tv" />}
      </div>
    </>
  );
}
