import React, { useState } from 'react';
import { Languages, X, Check, Search, Globe, Sparkles } from 'lucide-react';
import { INDIAN_LANGUAGES, SupportedLanguage, LanguageInfo } from '../../services/indianLanguages';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = INDIAN_LANGUAGES.filter((lang) => {
    const q = searchTerm.toLowerCase();
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-amber-500/10 via-amber-400/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Select Your Language</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
                  13 Indian Languages
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                भारत की सभी प्रमुख भाषाओं में उपलब्ध • Available across all pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search language (e.g., Hindi, বাংলা, தமிழ், Telugu, Marathi)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
          {filteredLanguages.map((lang: LanguageInfo) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`text-left p-3.5 rounded-2xl border transition flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:scale-105 transition">
                    {lang.flagOrIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        ({lang.name})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                      {lang.region}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-xs font-mono text-slate-400 uppercase group-hover:text-amber-600">
                    {lang.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Real-time bidirectional translation for all pages and words</span>
          </div>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            BeeSure National Apiculture Network
          </span>
        </div>
      </div>
    </div>
  );
};
