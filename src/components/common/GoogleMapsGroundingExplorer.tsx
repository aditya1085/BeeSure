import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  Sparkles,
  Navigation,
  Building2,
  FlaskConical,
  Trees,
  CheckCircle,
  AlertCircle,
  Compass,
} from 'lucide-react';

interface MapsGroundedLink {
  title: string;
  uri: string;
  snippets: string[];
}

interface GoogleMapsGroundingExplorerProps {
  initialQuery?: string;
  className?: string;
}

export const GoogleMapsGroundingExplorer: React.FC<GoogleMapsGroundingExplorerProps> = ({
  initialQuery = 'Accredited honey testing laboratories and apiculture research centers in India',
  className = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const [mapsLinks, setMapsLinks] = useState<MapsGroundedLink[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  // Suggested quick grounding queries
  const quickGroundingQueries = [
    'Honey testing laboratories accredited by NABL near me',
    'Major apiculture centers and bee farms in Uttar Pradesh',
    'Wild forest honey collection points in Western Ghats & Nilgiris',
    'Mustard & Acacia honey beekeeping clusters in Punjab & Haryana',
    'National Bee Board training institutes in India',
  ];

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setErrorMsg('Could not detect location. Proceeding with global search.');
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: any = { query: q };
      if (userCoords) {
        payload.latitude = userCoords.lat;
        payload.longitude = userCoords.lng;
      }

      const res = await fetch('/api/maps-grounding/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to get Maps Grounding response`);
      }

      const data = await res.json();
      if (data && data.success) {
        setAnswer(data.answer || '');
        setMapsLinks(data.mapsLinks || []);
      } else {
        throw new Error(data?.error || 'Empty response received');
      }
    } catch (err: any) {
      console.error('Maps grounding query error:', err);
      setErrorMsg(err.message || 'Error querying Google Maps data.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial search on mount if initialQuery provided
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 shadow-md p-6 space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 p-2 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Google Maps Grounding Explorer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                gemini-3.5-flash + googleMaps
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live location grounding for apiaries, testing laboratories, and regional nectar flora
            </p>
          </div>
        </div>

        {/* Location GPS chip */}
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detectingGps}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shrink-0"
        >
          <Navigation className={`w-3.5 h-3.5 text-amber-500 ${detectingGps ? 'animate-spin' : ''}`} />
          <span>
            {detectingGps
              ? 'Detecting GPS...'
              : userCoords
              ? `GPS: ${userCoords.lat.toFixed(3)}, ${userCoords.lng.toFixed(3)}`
              : 'Use Current Location'}
          </span>
        </button>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apiaries, testing labs, or floral bloom areas with Google Maps..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Grounding...</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              <span>Explore</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Popular:</span>
        {quickGroundingQueries.map((qText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(qText);
              handleSearch(qText);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap transition cursor-pointer"
          >
            {qText}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Answer & Grounding Results */}
      {answer && (
        <div className="space-y-4 pt-2">
          {/* Grounded Text Summary */}
          <div className="p-4 bg-amber-50/40 dark:bg-slate-800/50 rounded-2xl border border-amber-500/20 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {answer}
          </div>

          {/* Extracted Google Maps Links (MANDATORY PER GEMINI MAPS GROUNDING GUIDELINE) */}
          {mapsLinks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google Maps Grounded Locations ({mapsLinks.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Click link to open in Google Maps
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mapsLinks.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 hover:shadow-md transition group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition line-clamp-1">
                          {item.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 shrink-0" />
                      </div>

                      {item.snippets.length > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                          "{item.snippets[0]}"
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Verified Map Grounding
                      </span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
                        View Map →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
