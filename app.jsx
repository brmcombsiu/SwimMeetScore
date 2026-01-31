    // Hide loading screen once React renders
    const hideLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => loadingScreen.remove(), 300);
      }
    };

    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    // Utility functions for production robustness
    const utils = {
      // Safe localStorage operations with error handling
      saveToStorage: (key, value) => {
        try {
          const storageKey = 'swimMeetScore_' + key;
          const serialized = JSON.stringify(value);
          localStorage.setItem(storageKey, serialized);
          return true;
        } catch (e) {
          if (e.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded. Some data may not be saved.');
            return false;
          }
          // Private browsing mode or other errors
          return false;
        }
      },

      loadFromStorage: (key, defaultValue) => {
        try {
          const saved = localStorage.getItem('swimMeetScore_' + key);
          if (!saved) return defaultValue;
          const parsed = JSON.parse(saved);
          // Validate parsed data structure
          return parsed !== null && typeof parsed !== 'undefined' ? parsed : defaultValue;
        } catch (e) {
          console.error('Error loading from storage:', e);
          return defaultValue;
        }
      },

      // Generate unique IDs (better than Date.now() for collisions)
      generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      },

      // Input validation
      validateTeamName: (name) => {
        const trimmed = (name || '').trim();
        if (trimmed.length === 0) return { valid: false, error: 'Team name cannot be empty' };
        if (trimmed.length > 50) return { valid: false, error: 'Team name must be 50 characters or less' };
        // Prevent XSS - basic sanitization
        if (/<[^>]*>/g.test(trimmed)) return { valid: false, error: 'Team name contains invalid characters' };
        return { valid: true, value: trimmed };
      },

      validateEventName: (name, type) => {
        if (type === 'diving') return { valid: true, value: 'Diving' };
        const trimmed = (name || '').trim();
        if (trimmed.length === 0) return { valid: false, error: 'Event name cannot be empty' };
        if (trimmed.length > 100) return { valid: false, error: 'Event name must be 100 characters or less' };
        if (/<[^>]*>/g.test(trimmed)) return { valid: false, error: 'Event name contains invalid characters' };
        return { valid: true, value: trimmed };
      },

      validateTemplateName: (name) => {
        const trimmed = (name || '').trim();
        if (trimmed.length === 0) return { valid: false, error: 'Template name cannot be empty' };
        if (trimmed.length > 50) return { valid: false, error: 'Template name must be 50 characters or less' };
        return { valid: true, value: trimmed };
      },

      validateNumber: (value, min, max, defaultValue) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return defaultValue;
        return Math.max(min, Math.min(max, num));
      },

      // Debounce function for localStorage writes
      debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
    };

    // Icon components
    const Plus = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );

    const X = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );

    const Settings = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );

    const HelpCircle = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    );

    const Share = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    );

    const Mail = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );

    const Swimmer = ({ className }) => (
       <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="19" cy="6" r="2.5" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 18c1.2 0 2-.8 3-1.5s1.8-1.5 3-1.5 2 .8 3 1.5 1.8 1.5 3 1.5 2-.8 3-1.5 1.8-1.5 3-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 22c1.2 0 2-.8 3-1.5s1.8-1.5 3-1.5 2 .8 3 1.5 1.8 1.5 3 1.5 2-.8 3-1.5 1.8-1.5 3-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 7.5L12 10l-4.5 2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14.5l2-1.5" />
      </svg>
    );

    const Zap = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );

    const Check = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );

    const Printer = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    );

    const ChevronUp = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );

    const ChevronDown = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );

    const Minus = ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );

    // Collapsible settings section component for mobile-friendly UI
    const CollapsibleSection = ({ id, title, description, icon: Icon, isCollapsed, onToggle, darkMode, children, accentColor = 'cyan' }) => {
      const contentRef = useRef(null);
      const [maxHeight, setMaxHeight] = useState('2000px');

      useEffect(() => {
        if (contentRef.current && !isCollapsed) {
          setMaxHeight(`${contentRef.current.scrollHeight + 32}px`);
        }
      }, [isCollapsed, children]);

      const colorClasses = {
        cyan: {
          header: darkMode ? 'bg-cyan-900/40 hover:bg-cyan-900/60' : 'bg-cyan-50 hover:bg-cyan-100',
          icon: darkMode ? 'text-cyan-400' : 'text-cyan-600',
          border: darkMode ? 'border-cyan-700/50' : 'border-cyan-200'
        },
        amber: {
          header: darkMode ? 'bg-amber-900/40 hover:bg-amber-900/60' : 'bg-amber-50 hover:bg-amber-100',
          icon: darkMode ? 'text-amber-400' : 'text-amber-600',
          border: darkMode ? 'border-amber-700/50' : 'border-amber-200'
        },
        red: {
          header: darkMode ? 'bg-red-900/40 hover:bg-red-900/60' : 'bg-red-50 hover:bg-red-100',
          icon: darkMode ? 'text-red-400' : 'text-red-600',
          border: darkMode ? 'border-red-700/50' : 'border-red-200'
        },
        purple: {
          header: darkMode ? 'bg-purple-900/40 hover:bg-purple-900/60' : 'bg-purple-50 hover:bg-purple-100',
          icon: darkMode ? 'text-purple-400' : 'text-purple-600',
          border: darkMode ? 'border-purple-700/50' : 'border-purple-200'
        },
        green: {
          header: darkMode ? 'bg-green-900/40 hover:bg-green-900/60' : 'bg-green-50 hover:bg-green-100',
          icon: darkMode ? 'text-green-400' : 'text-green-600',
          border: darkMode ? 'border-green-700/50' : 'border-green-200'
        },
        blue: {
          header: darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60' : 'bg-blue-50 hover:bg-blue-100',
          icon: darkMode ? 'text-blue-400' : 'text-blue-600',
          border: darkMode ? 'border-blue-700/50' : 'border-blue-200'
        },
        slate: {
          header: darkMode ? 'bg-slate-700/60 hover:bg-slate-700/80' : 'bg-slate-100 hover:bg-slate-200',
          icon: darkMode ? 'text-slate-300' : 'text-slate-600',
          border: darkMode ? 'border-slate-600/50' : 'border-slate-300'
        }
      };

      const colors = colorClasses[accentColor] || colorClasses.cyan;

      return (
        <div className={`settings-section mb-2 border ${colors.border} ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
          <button
            type="button"
            onClick={() => onToggle(id)}
            className={`settings-section-header w-full ${colors.header} rounded-t-lg ${isCollapsed ? 'rounded-b-lg' : ''}`}
            aria-expanded={!isCollapsed}
            aria-controls={`section-content-${id}`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
              <div className="text-left">
                <h4 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
                {description && isCollapsed && (
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
                )}
              </div>
            </div>
            <ChevronDown className={`chevron-icon w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${!isCollapsed ? 'rotated' : ''}`} />
          </button>
          <div
            id={`section-content-${id}`}
            ref={contentRef}
            className={`settings-section-content px-4 py-3 ${isCollapsed ? 'collapsed' : 'expanded'}`}
            style={{ maxHeight: isCollapsed ? '0px' : maxHeight }}
          >
            {children}
          </div>
        </div>
      );
    };

    // Mobile-friendly number input with +/- buttons
    const NumberInput = ({ value, onChange, min = 1, max = 20, darkMode, className = "", label = "", id = "" }) => {
      const handleDecrement = () => {
        const newValue = Math.max(min, (parseInt(value, 10) || min) - 1);
        onChange(newValue);
      };

      const handleIncrement = () => {
        const newValue = Math.min(max, (parseInt(value, 10) || min) + 1);
        onChange(newValue);
      };

      const handleInputChange = (e) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
          onChange(min);
          return;
        }
        const num = parseInt(inputValue, 10);
        if (!isNaN(num)) {
          onChange(Math.max(min, Math.min(max, num)));
        }
      };

      return (
        <div className={`flex items-center ${className}`}>
          <button
            type="button"
            onClick={handleDecrement}
            className={`touch-btn rounded-l-lg border border-r-0 font-bold text-xl transition-colors ${
              darkMode 
                ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 active:bg-gray-400' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
            aria-label={`Decrease ${label}`}
          >
            <Minus className="w-5 h-5" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={min}
            max={max}
            value={value}
            onChange={handleInputChange}
            className={`w-16 px-2 py-2 border-t border-b text-center font-medium ${
              darkMode
                ? 'bg-gray-700 border-gray-500 text-white'
                : 'bg-white border-gray-300 text-gray-800'
            }`}
            style={{ minHeight: '44px' }}
            id={id || undefined}
            aria-label={label}
          />
          <button
            type="button"
            onClick={handleIncrement}
            className={`touch-btn rounded-r-lg border border-l-0 font-bold text-xl transition-colors ${
              darkMode 
                ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500 active:bg-gray-400' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
            aria-label={`Increase ${label}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      );
    };

    // Mobile-friendly point input for scoring systems
    const PointInput = ({ value, onChange, onBlur, place, darkMode }) => {
      const handleDecrement = () => {
        const newValue = Math.max(0, (parseInt(value, 10) || 0) - 1);
        onChange(newValue);
      };

      const handleIncrement = () => {
        const newValue = Math.min(999, (parseInt(value, 10) || 0) + 1);
        onChange(newValue);
      };

      const handleInputChange = (e) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
          onChange(0);
          return;
        }
        const num = parseInt(inputValue, 10);
        if (!isNaN(num)) {
          onChange(Math.max(0, Math.min(999, num)));
        }
      };

      const placeLabel = place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;

      return (
        <div className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
          <label className={`text-xs font-medium block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {placeLabel}
          </label>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => { handleDecrement(); onBlur && onBlur(); }}
              className={`touch-btn flex-shrink-0 rounded-l border border-r-0 text-base font-bold transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-500 text-white hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minWidth: '28px', width: '28px', minHeight: '32px' }}
              aria-label={`Decrease ${placeLabel} points`}
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              value={value}
              onChange={handleInputChange}
              onBlur={onBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              className={`w-9 sm:w-11 px-0.5 py-1 border-t border-b text-center text-sm font-medium ${
                darkMode
                  ? 'bg-gray-800 border-gray-500 text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              style={{ minHeight: '32px' }}
              aria-label={`${placeLabel} place points`}
            />
            <button
              type="button"
              onClick={() => { handleIncrement(); onBlur && onBlur(); }}
              className={`touch-btn flex-shrink-0 rounded-r border border-l-0 text-base font-bold transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-500 text-white hover:bg-gray-600 active:bg-gray-500'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minWidth: '28px', width: '28px', minHeight: '32px' }}
              aria-label={`Increase ${placeLabel} points`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    };

    // Place selector with dropdown multiselect for ties
    const PlaceSelector = ({ event, place, teams, darkMode, pointSystem, numPlaces, onUpdate, consumedByTie, heatLockEnabled }) => {
      const [isOpen, setIsOpen] = useState(false);
      const dropdownRef = useRef(null);

      const result = event.results.find(r => r.place === place);
      const selectedTeamIds = result?.teamIds || [];
      const isRelay = event.name.includes('Relay');
      const isBFinals = heatLockEnabled && !isRelay && numPlaces > 10 && place >= 9 && place <= 16;
      const heatPosition = isBFinals ? place - 8 : null;
      const placeLabel = place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;

      // Calculate points display - if there's a tie, show split points
      const numTied = selectedTeamIds.length;
      let pointsDisplay = pointSystem[place] ?? 0;
      let splitPointsDisplay = null;

      if (numTied > 1) {
        // Sum points for tied places
        let totalPoints = 0;
        for (let i = 0; i < numTied && (place + i) <= numPlaces; i++) {
          totalPoints += (pointSystem[place + i]) || 0;
        }
        splitPointsDisplay = (totalPoints / numTied).toFixed(1).replace(/\.0$/, '');
      }

      const handleTeamToggle = (teamId, isChecked) => {
        onUpdate(event.id, place, teamId, isChecked);
      };

      // Close dropdown when clicking outside
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      // Get display text for selected teams
      const getDisplayText = () => {
        if (selectedTeamIds.length === 0) return '-';
        if (selectedTeamIds.length === 1) {
          const team = teams.find(t => String(t.id) === selectedTeamIds[0]);
          return team ? team.name : '-';
        }
        return `Tie (${selectedTeamIds.length})`;
      };

      // If this place is consumed by a previous tie, show it as disabled
      if (consumedByTie) {
        return (
          <div className={`p-1 rounded opacity-50 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <label className={`text-xs font-medium block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {placeLabel}
              {isBFinals && (
                <span className={`ml-0.5 ${darkMode ? 'text-amber-400/50' : 'text-amber-600/50'}`}>H1:{heatPosition}</span>
              )}
            </label>
            <div className={`w-full px-1 py-1 border rounded text-xs italic ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
              (tied above)
            </div>
          </div>
        );
      }

      return (
        <div className={`p-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'} ${numTied > 1 ? (darkMode ? 'ring-2 ring-yellow-500' : 'ring-2 ring-yellow-400') : ''}`} ref={dropdownRef}>
          <label className={`text-xs font-medium block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {placeLabel}
            {isBFinals && (
              <span className={`ml-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>H1:{heatPosition}</span>
            )}
            <span className={`ml-0.5 ${numTied > 1 ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') : ''}`}>
              ({numTied > 1 ? `${splitPointsDisplay} ea` : `${pointsDisplay} pts`})
            </span>
          </label>

          {/* Dropdown button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full px-1 py-1 border rounded text-xs text-left flex items-center justify-between gap-0.5 ${
                darkMode
                  ? 'bg-gray-700 border-gray-500 text-white hover:bg-gray-650'
                  : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
              } ${numTied > 1 ? (darkMode ? 'border-yellow-500' : 'border-yellow-400') : ''}`}
              style={{ minHeight: '28px' }}
            >
              <span className={`truncate text-xs ${selectedTeamIds.length === 0 ? (darkMode ? 'text-gray-400' : 'text-gray-500') : ''}`}>
                {getDisplayText()}
              </span>
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
              <div className={`absolute z-50 mt-1 w-full min-w-[140px] rounded-lg shadow-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {teams.map(team => {
                  const isChecked = selectedTeamIds.includes(String(team.id));
                  return (
                    <label
                      key={team.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                        isChecked
                          ? (darkMode ? 'bg-cyan-700' : 'bg-blue-100')
                          : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100')
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleTeamToggle(team.id, e.target.checked)}
                        className="w-4 h-4 rounded flex-shrink-0"
                      />
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {team.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tie indicator */}
          {numTied > 1 && (
            <div className={`text-xs font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              🤝 TIE: {numTied} teams
            </div>
          )}
        </div>
      );
    };

    // Haptic feedback for mobile devices (defined at module level for use in BulkEntryModal)
    const triggerHaptic = (style = 'light') => {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        navigator.vibrate(patterns[style] || patterns.light);
      }
    };

    // Team Mode Entry Event Card (inline, not modal)
    const QuickEntryEventCard = ({ event, teams, darkMode, numPlaces, pointSystem, onUpdate, onBulkUpdate, onMoveUp, onMoveDown, onRemove, canMoveUp, canMoveDown, heatLockEnabled, aRelayOnly, teamPlaceLimitEnabled, isCollapsed, onToggle }) => {
      const isDiving = event.name === 'Diving';
      const isRelay = event.name.includes('Relay');

      // Get current selections from event results
      const getTeamPlaces = (teamId) => {
        const places = [];
        event.results.forEach(result => {
          if (result.teamIds && result.teamIds.includes(String(teamId))) {
            places.push(result.place);
          }
        });
        return places.sort((a, b) => a - b);
      };

      const getPlaceLabel = (place) => {
        return place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;
      };

      // Toggle a place for a team
      const togglePlace = (teamId, place) => {
        triggerHaptic('light');
        const currentPlaces = getTeamPlaces(teamId);
        const hasPlace = currentPlaces.includes(place);
        onUpdate(event.id, place, teamId, !hasPlace);
      };

      // Check if a place is taken by another team (for visual indication)
      const getTeamsAtPlace = (place) => {
        const result = event.results.find(r => r.place === place);
        return result?.teamIds || [];
      };

      // Check if place is consumed by a tie above it
      const isPlaceConsumed = (place) => {
        for (let p = 1; p < place; p++) {
          const teamsAtP = getTeamsAtPlace(p);
          if (teamsAtP.length > 1) {
            // This place created a tie, check if current place falls within the skipped range
            if (place <= p + teamsAtP.length - 1) {
              return true;
            }
          }
        }
        return false;
      };

      return (
        <div className={`rounded-xl ${darkMode ? 'bg-pool-mid/80 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
          {/* Collapsible Event Header */}
          <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer transition rounded-xl ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            aria-expanded={!isCollapsed}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <span className={event.gender === 'girls' ? (darkMode ? 'text-pink-400' : 'text-pink-600') : (darkMode ? 'text-blue-400' : 'text-blue-600')}>
                  {event.gender === 'girls' ? 'G' : 'B'}
                </span>
                {' '}
                <span className={isDiving ? (darkMode ? 'text-orange-400' : 'text-orange-600') : ''}>
                  {event.name}
                </span>
              </h5>
              {/* Visual indicators for Conference/Sectionals settings */}
              {heatLockEnabled && !isRelay && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${darkMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                  🔒 A/B Finals
                </span>
              )}
              {aRelayOnly && isRelay && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${darkMode ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-teal-100 text-teal-700 border border-teal-200'}`}>
                  🅰️ A-Relay Only
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-5 h-5 transition-transform ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${!isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {!isCollapsed && (
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                {teams.length === 2 && (() => {
                  // Check if exactly one team has places assigned
                  const team0Places = getTeamPlaces(teams[0].id);
                  const team1Places = getTeamPlaces(teams[1].id);
                  const oneHasPlaces = (team0Places.length > 0 && team1Places.length === 0) || (team0Places.length === 0 && team1Places.length > 0);
                  const assignedTeam = team0Places.length > 0 ? teams[0] : teams[1];
                  const unassignedTeam = team0Places.length > 0 ? teams[1] : teams[0];
                  const assignedPlaces = team0Places.length > 0 ? team0Places : team1Places;
                  if (oneHasPlaces) {
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          // Build complete results array with existing + new assignments
                          const newResults = [...(event.results || [])];
                          for (let p = 1; p <= numPlaces; p++) {
                            if (!assignedPlaces.includes(p) && !isPlaceConsumed(p)) {
                              const existingIndex = newResults.findIndex(r => r && r.place === p);
                              if (existingIndex >= 0) {
                                const ids = [...(newResults[existingIndex].teamIds || [])];
                                if (!ids.includes(String(unassignedTeam.id))) {
                                  ids.push(String(unassignedTeam.id));
                                }
                                newResults[existingIndex] = { place: p, teamIds: ids };
                              } else {
                                newResults.push({ place: p, teamIds: [String(unassignedTeam.id)] });
                              }
                            }
                          }
                          onBulkUpdate(event.id, newResults);
                        }}
                        className={`text-xs px-2 py-1 rounded-full font-medium transition ${darkMode ? 'bg-chlorine/20 text-chlorine border border-chlorine/30 hover:bg-chlorine/30' : 'bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200'}`}
                      >
                        Auto-fill {unassignedTeam.name}
                      </button>
                    );
                  }
                  return <div />;
                })()}
                {teams.length !== 2 && <div />}
                <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                  disabled={!canMoveUp}
                  className={`p-1 rounded ${!canMoveUp ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                  disabled={!canMoveDown}
                  className={`p-1 rounded ${!canMoveDown ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className={`p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}
                >
                  <X className="w-4 h-4" />
                </button>
                </div>
              </div>
              {/* Team rows with place buttons */}
              <div className="space-y-2">
                {teams.map(team => {
                  const teamPlaces = getTeamPlaces(team.id);
                  const showHeatLabels = heatLockEnabled && !isRelay && numPlaces > 10;

                  // Calculate points for this team
                  const teamPoints = (() => {
                    if (teamPlaces.length === 0) return 0;
                    let totalPts = 0;
                    const applyTeamLimit = teamPlaceLimitEnabled && isRelay;
                    const maxTeamPlaces = applyTeamLimit ? Math.max(1, numPlaces - 1) : numPlaces;
                    const teamPlaceCount = {};
                    const resultsByPlace = {};
                    for (let p = 1; p <= numPlaces; p++) {
                      const teamsAtP = getTeamsAtPlace(p);
                      if (teamsAtP.length > 0) resultsByPlace[p] = teamsAtP;
                    }
                    let currentPlace = 1;
                    while (currentPlace <= numPlaces) {
                      const teamsAtCurrentPlace = resultsByPlace[currentPlace];
                      if (teamsAtCurrentPlace && teamsAtCurrentPlace.length > 0) {
                        const numTied = teamsAtCurrentPlace.length;
                        const eligibleTeams = teamsAtCurrentPlace.filter(teamId => {
                          if (!applyTeamLimit) return true;
                          return (teamPlaceCount[teamId] || 0) < maxTeamPlaces;
                        });
                        eligibleTeams.forEach(teamId => {
                          teamPlaceCount[teamId] = (teamPlaceCount[teamId] || 0) + 1;
                        });
                        if (eligibleTeams.includes(String(team.id))) {
                          let tiedPoints = 0;
                          for (let i = 0; i < eligibleTeams.length && (currentPlace + i) <= numPlaces; i++) {
                            tiedPoints += (pointSystem[currentPlace + i]) || 0;
                          }
                          totalPts += tiedPoints / eligibleTeams.length;
                        }
                        currentPlace += numTied;
                      } else {
                        currentPlace++;
                      }
                    }
                    return Math.round(totalPts * 10) / 10;
                  })();

                  return (
                    <div key={team.id}>
                      {/* Team name with points underneath */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`text-xs font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {team.name}
                        </div>
                        {teamPoints > 0 && (
                          <div className={`text-xs font-medium ${darkMode ? 'text-chlorine' : 'text-cyan-600'}`}>
                            {teamPoints}pt
                          </div>
                        )}
                      </div>

                      {/* Place buttons */}
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({ length: numPlaces }, (_, i) => i + 1).map(place => {
                          const isSelected = teamPlaces.includes(place);
                          const teamsAtPlace = getTeamsAtPlace(place);
                          const isTie = teamsAtPlace.length > 1;
                          const hasOtherTeam = teamsAtPlace.some(id => id !== String(team.id));
                          const consumed = isPlaceConsumed(place) && !isSelected;
                          const points = pointSystem[place] || 0;

                          // For B Finals places (9-16), show heat position label
                          const isBFinals = showHeatLabels && place >= 9 && place <= 16;
                          const heatPosition = isBFinals ? place - 8 : null;

                          if (consumed) {
                            return (
                              <div
                                key={place}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded flex items-center justify-center text-xs opacity-30 ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`}
                                title="Consumed by tie above"
                              >
                                -
                              </div>
                            );
                          }

                          return (
                            <button
                              key={place}
                              onClick={() => togglePlace(team.id, place)}
                              className={`${isBFinals ? 'w-10 h-8 sm:w-11 sm:h-9' : 'w-8 h-8 sm:w-9 sm:h-9'} rounded font-medium text-xs transition-all ${
                                isSelected
                                  ? (place === 1
                                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-900'
                                      : place === 2
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                        : place === 3
                                          ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900'
                                          : (darkMode ? 'bg-chlorine text-pool-deep' : 'bg-cyan-600 text-white'))
                                  : hasOtherTeam
                                    ? (darkMode ? 'bg-gray-600/50 text-gray-400 border border-dashed border-gray-500' : 'bg-gray-100 text-gray-400 border border-dashed border-gray-300')
                                    : (darkMode ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600 border border-gray-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200')
                              } ${isTie && isSelected ? 'ring-2 ring-yellow-400' : ''}`}
                              title={`${getPlaceLabel(place)} (${points}pts)${isBFinals ? ` - B Finals ${heatPosition}${heatPosition === 1 ? 'st' : heatPosition === 2 ? 'nd' : heatPosition === 3 ? 'rd' : 'th'}` : ''}${hasOtherTeam && !isSelected ? ' - taken' : ''}`}
                            >
                              {isBFinals ? (
                                <span className="flex flex-col items-center leading-none">
                                  <span>{place}</span>
                                  <span className={`text-[9px] leading-none ${isSelected ? '' : (darkMode ? 'text-amber-400' : 'text-amber-600')}`}>H1:{heatPosition}</span>
                                </span>
                              ) : place}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    };

    // Bulk Entry Modal - Quick entry for all places for a team
    const BulkEntryModal = ({ event, teams, darkMode, numPlaces, pointSystem, onSave, onClose, existingResults }) => {
      // Track selections for ALL teams, not just the current one
      const [allSelections, setAllSelections] = useState(() => {
        // Initialize from existing results
        const initial = {};
        teams.forEach(t => { initial[t.id] = []; });
        if (existingResults) {
          existingResults.forEach(result => {
            if (result.teamIds && result.place) {
              result.teamIds.forEach(teamId => {
                if (initial[teamId]) {
                  initial[teamId].push(result.place);
                }
              });
            }
          });
        }
        // Sort each team's places
        Object.keys(initial).forEach(k => { initial[k].sort((a, b) => a - b); });
        return initial;
      });
      
      const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || null);
      const [autoFillEnabled, setAutoFillEnabled] = useState(teams.length === 2);
      
      const selectedPlaces = allSelections[selectedTeam] || [];
      
      const togglePlace = (place) => {
        triggerHaptic('light');
        setAllSelections(prev => {
          const teamPlaces = [...(prev[selectedTeam] || [])];
          const idx = teamPlaces.indexOf(place);
          if (idx >= 0) {
            teamPlaces.splice(idx, 1);
          } else {
            teamPlaces.push(place);
            teamPlaces.sort((a, b) => a - b);
          }
          return { ...prev, [selectedTeam]: teamPlaces };
        });
      };
      
      const getPlaceLabel = (place) => {
        return place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;
      };
      
      // Get which team(s) have a place selected (for showing ties/other team selections)
      const getTeamsAtPlace = (place) => {
        const teamsAtPlace = [];
        Object.entries(allSelections).forEach(([teamId, places]) => {
          if (places.includes(place)) {
            teamsAtPlace.push(teamId);
          }
        });
        return teamsAtPlace;
      };
      
      // Calculate total places selected across all teams
      const getTotalPlacesSelected = () => {
        let total = 0;
        Object.values(allSelections).forEach(places => { total += places.length; });
        return total;
      };
      
      // Get place count for a specific team
      const getTeamPlaceCount = (teamId) => {
        return (allSelections[teamId] || []).length;
      };
      
      const handleSave = () => {
        // Build results from all selections
        const newResults = [];
        const placeToTeams = {};
        
        // Group teams by place
        Object.entries(allSelections).forEach(([teamId, places]) => {
          places.forEach(place => {
            if (!placeToTeams[place]) placeToTeams[place] = [];
            placeToTeams[place].push(String(teamId));
          });
        });
        
        // If dual meet and auto-fill is enabled, fill remaining places with other team
        if (autoFillEnabled && teams.length === 2) {
          const [team1, team2] = teams;
          for (let p = 1; p <= numPlaces; p++) {
            if (!placeToTeams[p] || placeToTeams[p].length === 0) {
              // Assign to the team that doesn't have this place
              const team1Has = (allSelections[team1.id] || []).includes(p);
              const team2Has = (allSelections[team2.id] || []).includes(p);
              if (!team1Has && !team2Has) {
                // Neither team has it - give to the one with fewer places
                const team1Count = (allSelections[team1.id] || []).length;
                const team2Count = (allSelections[team2.id] || []).length;
                placeToTeams[p] = [String(team1Count <= team2Count ? team1.id : team2.id)];
              }
            }
          }
        }
        
        // Convert to results format
        Object.entries(placeToTeams).forEach(([place, teamIds]) => {
          if (teamIds.length > 0) {
            newResults.push({ place: parseInt(place), teamIds });
          }
        });
        
        onSave(event.id, newResults);
        onClose();
        trackEvent('bulk_entry_save', { team_count: teams.length, places_selected: getTotalPlacesSelected(), auto_fill: autoFillEnabled });
        triggerHaptic('medium');
      };
      
      const clearAll = () => {
        triggerHaptic('light');
        setAllSelections(prev => ({ ...prev, [selectedTeam]: [] }));
      };

      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className={`rounded-2xl w-full max-w-lg flex flex-col ${darkMode ? 'bg-pool-mid border border-chlorine/30' : 'bg-white'}`} style={{ maxHeight: 'calc(100vh - 16px)' }}>
            {/* Header - Compact */}
            <div className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${darkMode ? 'bg-gradient-to-r from-chlorine/20 to-transparent border-chlorine/20' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}>
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${darkMode ? 'text-chlorine' : 'text-white'}`} />
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-chlorine' : 'text-white'}`}>Team Mode Entry</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-white/80'}`}>
                    {event.gender === 'girls' ? 'Girls' : 'Boys'} {event.name}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-white/10' : 'hover:bg-white/20'}`}>
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-white'}`} />
              </button>
            </div>

            {/* Content - Scrollable only if needed */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Team Selector - Compact grid */}
              <div className="mb-3">
                <div className={`grid gap-2 ${teams.length <= 2 ? 'grid-cols-2' : teams.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {teams.map(team => {
                    const placeCount = getTeamPlaceCount(team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => { setSelectedTeam(team.id); triggerHaptic('light'); }}
                        className={`px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                          selectedTeam === team.id
                            ? (darkMode ? 'bg-chlorine text-pool-deep ring-2 ring-chlorine/50' : 'bg-cyan-600 text-white ring-2 ring-cyan-300')
                            : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                        }`}
                      >
                        <span className="truncate">{team.name}</span>
                        {placeCount > 0 && (
                          <span className={`ml-1 text-xs ${selectedTeam === team.id ? 'opacity-80' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                            ({placeCount})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Places Grid - Compact */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tap places for {teams.find(t => t.id === selectedTeam)?.name}
                  </span>
                  <button
                    onClick={clearAll}
                    className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: numPlaces }, (_, i) => i + 1).map(place => {
                    const isSelected = selectedPlaces.includes(place);
                    const teamsAtPlace = getTeamsAtPlace(place);
                    const hasOtherTeam = teamsAtPlace.some(id => id !== String(selectedTeam));
                    const isTie = teamsAtPlace.length > 1;
                    const points = pointSystem[place] || 0;
                    
                    return (
                      <button
                        key={place}
                        onClick={() => togglePlace(place)}
                        className={`relative p-2 rounded-lg font-medium text-center transition-all ${
                          isSelected
                            ? (place === 1 
                                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-900 ring-2 ring-amber-300' 
                                : place === 2 
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 ring-2 ring-gray-300'
                                  : place === 3 
                                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900 ring-2 ring-orange-300'
                                    : (darkMode ? 'bg-chlorine text-pool-deep ring-2 ring-chlorine/50' : 'bg-cyan-600 text-white ring-2 ring-cyan-300'))
                            : hasOtherTeam
                              ? (darkMode ? 'bg-gray-600 text-gray-300 border-2 border-dashed border-gray-500' : 'bg-gray-200 text-gray-600 border-2 border-dashed border-gray-400')
                              : (darkMode ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600 border border-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200')
                        } ${isTie ? 'ring-2 ring-yellow-400' : ''}`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {isTie && (
                          <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-yellow-500 rounded-full flex items-center justify-center text-[9px] font-bold text-yellow-900">
                            {teamsAtPlace.length}
                          </div>
                        )}
                        <div className="text-sm font-bold">{getPlaceLabel(place)}</div>
                        <div className={`text-xs ${isSelected ? 'text-white/80' : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                          {points}pt
                        </div>
                        {hasOtherTeam && !isSelected && (
                          <div className={`text-[9px] leading-tight truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {teams.find(t => teamsAtPlace.includes(String(t.id)) && t.id !== selectedTeam)?.name?.slice(0, 6)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto-fill toggle for dual meets - Compact */}
              {teams.length === 2 && (
                <div className={`p-3 rounded-xl mb-3 ${darkMode ? 'bg-lane-gold/10 border border-lane-gold/30' : 'bg-amber-50 border border-amber-200'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFillEnabled}
                      onChange={(e) => { setAutoFillEnabled(e.target.checked); triggerHaptic('light'); }}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className={`text-sm font-medium ${darkMode ? 'text-lane-gold' : 'text-amber-700'}`}>
                      Auto-fill remaining to {teams.find(t => t.id !== selectedTeam)?.name}
                    </span>
                  </label>
                </div>
              )}

              {/* Summary - Compact, no "Preview" heading */}
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="space-y-1.5 text-sm">
                  {teams.map(team => {
                    const places = allSelections[team.id] || [];
                    if (places.length === 0) return null;
                    return (
                      <div key={team.id} className="flex items-center justify-between">
                        <span className={`${team.id === selectedTeam ? (darkMode ? 'text-chlorine font-medium' : 'text-cyan-600 font-medium') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                          {team.name}:
                        </span>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {places.map(p => getPlaceLabel(p)).join(', ')}
                        </span>
                      </div>
                    );
                  })}
                  {getTotalPlacesSelected() === 0 && (
                    <div className={`text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No places selected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className={`px-4 py-3 border-t flex gap-2 shrink-0 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={getTotalPlacesSelected() === 0}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 text-sm ${
                  getTotalPlacesSelected() === 0
                    ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                    : (darkMode ? 'bg-chlorine hover:bg-chlorine-glow text-pool-deep' : 'bg-cyan-600 hover:bg-cyan-700 text-white')
                }`}
              >
                <Check className="w-4 h-4" />
                Apply ({getTotalPlacesSelected()})</button>
            </div>
          </div>
        </div>
      );
    };

    function SwimMeetScore() {
      // Error state for user feedback
      const [error, setError] = useState(null);
      const [heatReminder, setHeatReminder] = useState(null);
      const [showConfirmDialog, setShowConfirmDialog] = useState(null);
      const [bulkEntryEvent, setBulkEntryEvent] = useState(null); // For bulk entry modal
      const [teamFirstMode, setTeamFirstMode] = useState(false); // Toggle between place-mode and team-mode entry modes
      
      // Clear error after 5 seconds
      useEffect(() => {
        if (error) {
          const timer = setTimeout(() => setError(null), 5000);
          return () => clearTimeout(timer);
        }
      }, [error]);

      // Clear heat reminder after 6 seconds
      useEffect(() => {
        if (heatReminder) {
          const timer = setTimeout(() => setHeatReminder(null), 6000);
          return () => clearTimeout(timer);
        }
      }, [heatReminder]);

      // Capture the PWA install prompt
      useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
          // Save the event so it can be triggered later (for the install button in About section)
          // We don't call e.preventDefault() so the browser can show its default install banner
          // The saved event allows users to also install via our custom button if they missed the banner
          // Note: We cannot auto-call prompt() because browsers require it to be triggered by a user gesture
          setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }, []);

      // Track online/offline status with periodic check for mobile reliability
      useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Periodic connectivity check for mobile (events aren't always reliable)
        const checkConnectivity = () => {
          // navigator.onLine can be unreliable, but it's a good first check
          if (!navigator.onLine) {
            setIsOffline(true);
            return;
          }
          
          // Try to fetch a tiny resource to confirm actual connectivity
          fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
            .then(() => setIsOffline(false))
            .catch(() => setIsOffline(true));
        };
        
        // Check connectivity every 30 seconds on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        let intervalId;
        if (isMobile) {
          intervalId = setInterval(checkConnectivity, 30000);
        }
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          if (intervalId) clearInterval(intervalId);
        };
      }, []);

      // Function to trigger the install prompt
      const handleInstallClick = async () => {
        if (!deferredPrompt) {
          return;
        }
        // Track install attempt
        trackEvent('pwa_install_prompt');
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        // Track the outcome
        trackEvent('pwa_install_outcome', { outcome: outcome });
        // Clear the deferred prompt variable
        setDeferredPrompt(null);
      };

      // Default values
      // Default teams match High School Dual Meet template
      const defaultTeams = [
        { id: '1', name: 'Home Team', score: 0, girlsScore: 0, boysScore: 0 },
        { id: '2', name: 'Away Team', score: 0, girlsScore: 0, boysScore: 0 }
      ];

      // Default events match High School Dual Meet template (diving between 50 Free and 100 Fly)
      const defaultEvents = [
        { id: 1, name: '200 Medley Relay', results: [], gender: 'girls' },
        { id: 2, name: '200 Medley Relay', results: [], gender: 'boys' },
        { id: 3, name: '200 Freestyle', results: [], gender: 'girls' },
        { id: 4, name: '200 Freestyle', results: [], gender: 'boys' },
        { id: 5, name: '200 IM', results: [], gender: 'girls' },
        { id: 6, name: '200 IM', results: [], gender: 'boys' },
        { id: 7, name: '50 Freestyle', results: [], gender: 'girls' },
        { id: 8, name: '50 Freestyle', results: [], gender: 'boys' },
        { id: 9, name: 'Diving', results: [], gender: 'girls' },
        { id: 10, name: 'Diving', results: [], gender: 'boys' },
        { id: 11, name: '100 Butterfly', results: [], gender: 'girls' },
        { id: 12, name: '100 Butterfly', results: [], gender: 'boys' },
        { id: 13, name: '100 Freestyle', results: [], gender: 'girls' },
        { id: 14, name: '100 Freestyle', results: [], gender: 'boys' },
        { id: 15, name: '500 Freestyle', results: [], gender: 'girls' },
        { id: 16, name: '500 Freestyle', results: [], gender: 'boys' },
        { id: 17, name: '200 Freestyle Relay', results: [], gender: 'girls' },
        { id: 18, name: '200 Freestyle Relay', results: [], gender: 'boys' },
        { id: 19, name: '100 Backstroke', results: [], gender: 'girls' },
        { id: 20, name: '100 Backstroke', results: [], gender: 'boys' },
        { id: 21, name: '100 Breaststroke', results: [], gender: 'girls' },
        { id: 22, name: '100 Breaststroke', results: [], gender: 'boys' },
        { id: 23, name: '400 Freestyle Relay', results: [], gender: 'girls' },
        { id: 24, name: '400 Freestyle Relay', results: [], gender: 'boys' }
      ];

      const defaultIndividualPoints = {
        1: 6, 2: 4, 3: 3, 4: 2, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
      };

      const defaultRelayPoints = {
        1: 8, 2: 4, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
      };

      const defaultDivingPoints = {
        1: 5, 2: 3, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
      };

      // State with localStorage initialization
      const CURRENT_VERSION = 4; // Version 4 adds tie support with teamIds array
      
      // Check and migrate events if needed
      const initializeEvents = () => {
        try {
          const savedVersion = utils.loadFromStorage('version', 1);
          const savedEvents = utils.loadFromStorage('events', null);
          
          if (savedVersion < 3 || !savedEvents || !Array.isArray(savedEvents)) {
            // Migrate to new version with correct diving position
            utils.saveToStorage('version', CURRENT_VERSION);
            return defaultEvents;
          }
          
          // Validate events structure
          let validEvents = savedEvents.filter(e => e && e.id && e.name && Array.isArray(e.results));
          
          // Migrate from version 3 (teamId) to version 4 (teamIds array)
          if (savedVersion < 4) {
            validEvents = validEvents.map(event => ({
              ...event,
              results: (event.results || []).map(result => {
                // If already has teamIds array, keep it
                if (result.teamIds && Array.isArray(result.teamIds)) {
                  return result;
                }
                // Migrate from teamId to teamIds array
                if (result.teamId) {
                  return { place: result.place, teamIds: [String(result.teamId)] };
                }
                return result;
              }).filter(r => r && r.place && r.teamIds && r.teamIds.length > 0)
            }));
            utils.saveToStorage('version', CURRENT_VERSION);
            utils.saveToStorage('events', validEvents);
          }
          
          return validEvents.length > 0 ? validEvents : defaultEvents;
        } catch (e) {
          console.error('Error initializing events:', e);
          return defaultEvents;
        }
      };
      
      const [teams, setTeams] = useState(() => {
        const loaded = utils.loadFromStorage('teams', defaultTeams);
        return Array.isArray(loaded) && loaded.length > 0 ? loaded : defaultTeams;
      });
      const [events, setEvents] = useState(() => initializeEvents());
      const [showSettings, setShowSettings] = useState(false);
      const [showAbout, setShowAbout] = useState(false);
      const [deferredPrompt, setDeferredPrompt] = useState(null);
      const [isOffline, setIsOffline] = useState(!navigator.onLine);
      const [newTeamName, setNewTeamName] = useState('');
      const [darkMode, setDarkMode] = useState(() => utils.loadFromStorage('darkMode', true));
      const [scoringMode, setScoringMode] = useState(() => utils.loadFromStorage('scoringMode', 'combined'));
      const [numIndividualPlaces, setNumIndividualPlaces] = useState(() => {
        const val = utils.loadFromStorage('numIndividualPlaces', 5);
        return utils.validateNumber(val, 1, 20, 5);
      });
      const [numRelayPlaces, setNumRelayPlaces] = useState(() => {
        const val = utils.loadFromStorage('numRelayPlaces', 3);
        return utils.validateNumber(val, 1, 20, 3);
      });
      const [numDivingPlaces, setNumDivingPlaces] = useState(() => {
        const val = utils.loadFromStorage('numDivingPlaces', 3);
        return utils.validateNumber(val, 1, 20, 3);
      });
      const [editingTeamId, setEditingTeamId] = useState(null);
      const [editingTeamName, setEditingTeamName] = useState('');
      // Separate editing state for settings panel to avoid conflicts with scoreboard
      const [settingsEditingTeamId, setSettingsEditingTeamId] = useState(null);
      const [settingsEditingTeamName, setSettingsEditingTeamName] = useState('');
      const [newEventName, setNewEventName] = useState('');
      const [newEventGender, setNewEventGender] = useState('girls');
      const [newEventType, setNewEventType] = useState('individual');
      const [savedTemplates, setSavedTemplates] = useState(() => {
        const loaded = utils.loadFromStorage('savedTemplates', []);
        return Array.isArray(loaded) ? loaded : [];
      });
      const [newTemplateName, setNewTemplateName] = useState('');
      const [showSaveTemplate, setShowSaveTemplate] = useState(false);
      const [shareSuccess, setShareSuccess] = useState(false);
      
      // Conference/Sectionals specific settings
      const [heatLockEnabled, setHeatLockEnabled] = useState(() => utils.loadFromStorage('heatLockEnabled', false));
      const [aRelayOnly, setARelayOnly] = useState(() => utils.loadFromStorage('aRelayOnly', false));

      // Team place limit - prevents one team from occupying all scoring places
      // When enabled, a team can score at most (numPlaces - 1) positions in any event
      const [teamPlaceLimitEnabled, setTeamPlaceLimitEnabled] = useState(() => utils.loadFromStorage('teamPlaceLimitEnabled', true));

      // Track which template is currently active (for visual indicator)
      const [activeTemplate, setActiveTemplate] = useState(() => utils.loadFromStorage('activeTemplate', 'high_school'));

      // Collapsible settings sections state - all collapsed by default
      const [collapsedSections, setCollapsedSections] = useState(() => {
        const saved = utils.loadFromStorage('collapsedSections', null);
        if (saved && typeof saved === 'object') return saved;
        // Default: all sections collapsed
        return {
          'manage-teams': true,
          'scoring-templates': true,
          'special-scoring': true,
          'scoring-places': true,
          'data-management': true,
          'point-systems': true,
          'appearance': true
        };
      });

      const toggleSection = (sectionId) => {
        setCollapsedSections(prev => {
          const updated = { ...prev, [sectionId]: !prev[sectionId] };
          utils.saveToStorage('collapsedSections', updated);
          return updated;
        });
      };

      // Collapsible events state for both place-mode and team-mode
      // Helper: collapse all events except the first one
      const collapseAllButFirst = (eventsList) => {
        const collapsed = {};
        if (Array.isArray(eventsList)) {
          eventsList.forEach((e, i) => { collapsed[e.id] = i !== 0; });
        }
        return collapsed;
      };

      const [collapsedEvents, setCollapsedEvents] = useState(() => {
        const savedEvents = utils.loadFromStorage('events', defaultEvents);
        return collapseAllButFirst(savedEvents);
      });

      const toggleEvent = (eventId) => {
        setCollapsedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
      };

      const toggleAllEvents = () => {
        const anyExpanded = events.some(e => !collapsedEvents[e.id]);
        const updated = {};
        events.forEach(e => { updated[e.id] = anyExpanded; });
        setCollapsedEvents(updated);
      };

      const [individualPointSystem, setIndividualPointSystem] = useState(() => {
        const loaded = utils.loadFromStorage('individualPointSystem', defaultIndividualPoints);
        return loaded && typeof loaded === 'object' ? loaded : defaultIndividualPoints;
      });
      const [relayPointSystem, setRelayPointSystem] = useState(() => {
        const loaded = utils.loadFromStorage('relayPointSystem', defaultRelayPoints);
        return loaded && typeof loaded === 'object' ? loaded : defaultRelayPoints;
      });
      const [divingPointSystem, setDivingPointSystem] = useState(() => {
        const loaded = utils.loadFromStorage('divingPointSystem', defaultDivingPoints);
        return loaded && typeof loaded === 'object' ? loaded : defaultDivingPoints;
      });

      // Debounced save functions to reduce localStorage writes
      const debouncedSaveTeamsRef = useRef(null);
      const debouncedSaveEventsRef = useRef(null);
      
      useEffect(() => {
        debouncedSaveTeamsRef.current = utils.debounce((data) => {
          if (!utils.saveToStorage('teams', data)) {
            setError('Failed to save teams. Storage may be full or unavailable.');
          }
        }, 500);
        
        debouncedSaveEventsRef.current = utils.debounce((data) => {
          if (!utils.saveToStorage('events', data)) {
            setError('Failed to save events. Storage may be full or unavailable.');
          }
        }, 500);
      }, []);

      // Auto-save to localStorage whenever state changes (with error handling)
      useEffect(() => {
        if (teams && Array.isArray(teams) && debouncedSaveTeamsRef.current) {
          debouncedSaveTeamsRef.current(teams);
        }
      }, [teams]);

      useEffect(() => {
        if (events && Array.isArray(events) && debouncedSaveEventsRef.current) {
          debouncedSaveEventsRef.current(events);
        }
      }, [events]);

      useEffect(() => {
        utils.saveToStorage('darkMode', darkMode);
      }, [darkMode]);

      useEffect(() => {
        utils.saveToStorage('scoringMode', scoringMode);
      }, [scoringMode]);

      useEffect(() => {
        utils.saveToStorage('numIndividualPlaces', numIndividualPlaces);
      }, [numIndividualPlaces]);

      useEffect(() => {
        utils.saveToStorage('numRelayPlaces', numRelayPlaces);
      }, [numRelayPlaces]);

      useEffect(() => {
        utils.saveToStorage('numDivingPlaces', numDivingPlaces);
      }, [numDivingPlaces]);

      useEffect(() => {
        if (savedTemplates && Array.isArray(savedTemplates)) {
          utils.saveToStorage('savedTemplates', savedTemplates);
        }
      }, [savedTemplates]);

      useEffect(() => {
        if (individualPointSystem && typeof individualPointSystem === 'object') {
          utils.saveToStorage('individualPointSystem', individualPointSystem);
        }
      }, [individualPointSystem]);

      useEffect(() => {
        if (relayPointSystem && typeof relayPointSystem === 'object') {
          utils.saveToStorage('relayPointSystem', relayPointSystem);
        }
      }, [relayPointSystem]);

      useEffect(() => {
        if (divingPointSystem && typeof divingPointSystem === 'object') {
          utils.saveToStorage('divingPointSystem', divingPointSystem);
        }
      }, [divingPointSystem]);

      useEffect(() => {
        utils.saveToStorage('heatLockEnabled', heatLockEnabled);
      }, [heatLockEnabled]);

      useEffect(() => {
        utils.saveToStorage('aRelayOnly', aRelayOnly);
      }, [aRelayOnly]);

      useEffect(() => {
        utils.saveToStorage('teamPlaceLimitEnabled', teamPlaceLimitEnabled);
      }, [teamPlaceLimitEnabled]);

      useEffect(() => {
        utils.saveToStorage('activeTemplate', activeTemplate);
      }, [activeTemplate]);

      // Sync state from other tabs via storage events
      useEffect(() => {
        const handleStorage = (e) => {
          if (!e.key || !e.key.startsWith('swimMeetScore_') || e.newValue === null) return;
          const field = e.key.replace('swimMeetScore_', '');
          try {
            const value = JSON.parse(e.newValue);
            if (field === 'teams' && Array.isArray(value)) setTeams(value);
            else if (field === 'events' && Array.isArray(value)) setEvents(value);
            else if (field === 'darkMode') setDarkMode(value);
            else if (field === 'scoringMode') setScoringMode(value);
            else if (field === 'heatLockEnabled') setHeatLockEnabled(value);
            else if (field === 'aRelayOnly') setARelayOnly(value);
          } catch (_) { /* ignore malformed data */ }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
      }, []);

      // When A-Relay Only is enabled, automatically set relay places equal to number of teams
      // (since each team can only enter one relay, max places = number of teams)
      useEffect(() => {
        if (aRelayOnly && teams.length > 0) {
          const newRelayPlaces = Math.min(teams.length, 20); // Cap at 20 (max places supported)
          if (numRelayPlaces !== newRelayPlaces) {
            setNumRelayPlaces(newRelayPlaces);
          }
        }
      }, [aRelayOnly, teams.length]);

      const recalculateAllScores = useCallback((teamsList, eventsList) => {
        if (!Array.isArray(teamsList) || !Array.isArray(eventsList)) return;
        
        try {
          const scores = {};
          const girlsScores = {};
          const boysScores = {};
          
          teamsList.forEach(team => {
            if (team && team.id) {
              scores[team.id] = 0;
              girlsScores[team.id] = 0;
              boysScores[team.id] = 0;
            }
          });

          eventsList.forEach(event => {
            if (!event || !event.results || !Array.isArray(event.results)) return;

            const isDiving = event.name === 'Diving';
            const isRelay = event.name && event.name.includes('Relay');
            const pointSystem = isDiving ? divingPointSystem : isRelay ? relayPointSystem : individualPointSystem;
            const numPlaces = isDiving ? numDivingPlaces : isRelay ? numRelayPlaces : numIndividualPlaces;

            // Calculate max scoring places per team when limit is enabled (relays only)
            // A team can score at most (numPlaces - 1) places to prevent sweeping all places
            const applyTeamLimit = teamPlaceLimitEnabled && isRelay;
            const maxTeamPlaces = applyTeamLimit ? Math.max(1, numPlaces - 1) : numPlaces;

            // Track how many scoring places each team has occupied in this event
            const teamScoringPlaceCount = {};

            // Group results by place to find ties
            const resultsByPlace = {};
            event.results.forEach(result => {
              if (!result || !result.place || !result.teamIds || !Array.isArray(result.teamIds)) return;
              resultsByPlace[result.place] = result.teamIds;
            });

            // Calculate points with tie handling
            // Places are consumed as we go - ties consume multiple places
            let currentPlace = 1;

            while (currentPlace <= numPlaces) {
              const teamsAtPlace = resultsByPlace[currentPlace];

              if (teamsAtPlace && teamsAtPlace.length > 0) {
                const numTied = teamsAtPlace.length;

                // Filter teams that haven't exceeded their place limit (relays only)
                const eligibleTeams = teamsAtPlace.filter(teamId => {
                  if (!applyTeamLimit) return true;
                  const currentCount = teamScoringPlaceCount[teamId] || 0;
                  return currentCount < maxTeamPlaces;
                });

                if (eligibleTeams.length > 0) {
                  // Sum up points for places consumed by eligible teams
                  let totalPoints = 0;
                  for (let i = 0; i < eligibleTeams.length && (currentPlace + i) <= numPlaces; i++) {
                    totalPoints += (pointSystem && pointSystem[currentPlace + i]) || 0;
                  }

                  // Split points evenly among eligible tied teams
                  const pointsPerTeam = totalPoints / eligibleTeams.length;

                  eligibleTeams.forEach(teamId => {
                    if (teamId) {
                      scores[teamId] = (scores[teamId] || 0) + pointsPerTeam;

                      if (event.gender === 'girls') {
                        girlsScores[teamId] = (girlsScores[teamId] || 0) + pointsPerTeam;
                      } else if (event.gender === 'boys') {
                        boysScores[teamId] = (boysScores[teamId] || 0) + pointsPerTeam;
                      }

                      // Track that this team has earned a scoring place
                      teamScoringPlaceCount[teamId] = (teamScoringPlaceCount[teamId] || 0) + 1;
                    }
                  });
                }

                // Skip places consumed by this tie (use original numTied, not eligible count)
                currentPlace += numTied;
              } else {
                currentPlace++;
              }
            }
          });

          setTeams(teamsList.map(team => ({
            ...team,
            score: Math.round((scores[team.id] || 0) * 100) / 100,
            girlsScore: Math.round((girlsScores[team.id] || 0) * 100) / 100,
            boysScore: Math.round((boysScores[team.id] || 0) * 100) / 100
          })));
        } catch (e) {
          console.error('Error recalculating scores:', e);
          setError('Error calculating scores. Please refresh the page.');
        }
      }, [individualPointSystem, relayPointSystem, divingPointSystem, numIndividualPlaces, numRelayPlaces, numDivingPlaces, teamPlaceLimitEnabled]);

      const addTeam = () => {
        const validation = utils.validateTeamName(newTeamName);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        
        // Check for duplicate team names
        const trimmedName = validation.value;
        if (teams.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
          setError('A team with this name already exists.');
          return;
        }
        
        // Check maximum teams limit (prevent performance issues)
        if (teams.length >= 50) {
          setError('Maximum of 50 teams allowed.');
          return;
        }
        
        try {
          setTeams([...teams, { 
            id: utils.generateId(), 
            name: trimmedName, 
            score: 0,
            girlsScore: 0,
            boysScore: 0
          }]);
          setNewTeamName('');
          setError(null);
          // Track event
          trackEvent('add_team', { team_count: teams.length + 1 });
        } catch (e) {
          console.error('Error adding team:', e);
          setError('Failed to add team. Please try again.');
        }
      };

      const removeTeam = (id) => {
        // Prevent removing all teams
        if (teams.length <= 1) {
          setError('At least one team is required.');
          return;
        }
        
        try {
          const newTeams = teams.filter(t => t && t.id !== id);
          setTeams(newTeams);
          recalculateAllScores(newTeams, events);
          setError(null);
        } catch (e) {
          console.error('Error removing team:', e);
          setError('Failed to remove team. Please try again.');
        }
      };

      const startEditingTeam = (team) => {
        setEditingTeamId(team.id);
        setEditingTeamName(team.name);
      };

      const saveTeamName = (teamId) => {
        const validation = utils.validateTeamName(editingTeamName);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        
        // Check for duplicate names (excluding current team)
        const trimmedName = validation.value;
        if (teams.some(t => t.id !== teamId && t.name.toLowerCase() === trimmedName.toLowerCase())) {
          setError('A team with this name already exists.');
          return;
        }
        
        try {
          const newTeams = teams.map(team => 
            team.id === teamId ? { ...team, name: trimmedName } : team
          );
          setTeams(newTeams);
          setEditingTeamId(null);
          setEditingTeamName('');
          setError(null);
        } catch (e) {
          console.error('Error saving team name:', e);
          setError('Failed to save team name. Please try again.');
        }
      };

      const cancelEditingTeam = () => {
        setEditingTeamId(null);
        setEditingTeamName('');
      };

      // Settings panel team editing functions (separate from scoreboard)
      const startEditingTeamInSettings = (team) => {
        setSettingsEditingTeamId(team.id);
        setSettingsEditingTeamName(team.name);
      };

      const saveTeamNameInSettings = (teamId) => {
        const validation = utils.validateTeamName(settingsEditingTeamName);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        // Check for duplicate names
        const duplicate = teams.find(t => t.id !== teamId && t.name.toLowerCase() === settingsEditingTeamName.trim().toLowerCase());
        if (duplicate) {
          setError('A team with this name already exists.');
          return;
        }

        try {
          setTeams(teams.map(t => t.id === teamId ? { ...t, name: settingsEditingTeamName.trim() } : t));
          setSettingsEditingTeamId(null);
          setSettingsEditingTeamName('');
          setError(null);
        } catch (e) {
          console.error('Error saving team name:', e);
          setError('Failed to save team name. Please try again.');
        }
      };

      const cancelEditingTeamInSettings = () => {
        setSettingsEditingTeamId(null);
        setSettingsEditingTeamName('');
      };

      const addEvent = () => {
        const validation = utils.validateEventName(newEventName, newEventType);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        
        // Check maximum events limit
        if (events.length >= 100) {
          setError('Maximum of 100 events allowed.');
          return;
        }
        
        try {
          let eventName;
          if (newEventType === 'diving') {
            eventName = 'Diving';
          } else if (newEventType === 'relay') {
            eventName = `${validation.value} Relay`;
          } else {
            eventName = validation.value;
          }
          
          setEvents([...events, {
            id: utils.generateId(),
            name: eventName,
            results: [],
            gender: newEventGender
          }]);
          setNewEventName('');
          setError(null);
          // Track event
          trackEvent('add_event', { event_type: newEventType, event_count: events.length + 1 });
        } catch (e) {
          console.error('Error adding event:', e);
          setError('Failed to add event. Please try again.');
        }
      };

      const removeEvent = (id) => {
        setShowConfirmDialog({
          message: 'Are you sure you want to delete this event? All results for this event will be lost.',
          onConfirm: () => {
            try {
              const newEvents = events.filter(e => e && e.id !== id);
              setEvents(newEvents);
              recalculateAllScores(teams, newEvents);
              setShowConfirmDialog(null);
            } catch (e) {
              console.error('Error removing event:', e);
              setError('Failed to remove event. Please try again.');
              setShowConfirmDialog(null);
            }
          },
          onCancel: () => setShowConfirmDialog(null)
        });
      };

      const moveEventUp = (index) => {
        if (index === 0) return;
        const newEvents = [...events];
        [newEvents[index - 1], newEvents[index]] = [newEvents[index], newEvents[index - 1]];
        setEvents(newEvents);
      };

      const moveEventDown = (index) => {
        if (index === events.length - 1) return;
        const newEvents = [...events];
        [newEvents[index], newEvents[index + 1]] = [newEvents[index + 1], newEvents[index]];
        setEvents(newEvents);
      };

      const saveTemplate = () => {
        const validation = utils.validateTemplateName(newTemplateName);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        
        // Check for duplicate template names
        const trimmedName = validation.value;
        if (savedTemplates.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
          setError('A template with this name already exists.');
          return;
        }
        
        // Check maximum templates limit
        if (savedTemplates.length >= 20) {
          setError('Maximum of 20 templates allowed.');
          return;
        }
        
        try {
          const template = {
            id: utils.generateId(),
            name: trimmedName,
            numIndividualPlaces,
            numRelayPlaces,
            numDivingPlaces,
            individualPointSystem: { ...individualPointSystem },
            relayPointSystem: { ...relayPointSystem },
            divingPointSystem: { ...divingPointSystem },
            heatLockEnabled,
            aRelayOnly,
            teamPlaceLimitEnabled,
            events: events.map(e => e ? { name: e.name, gender: e.gender } : null).filter(Boolean),
            teams: teams.map(t => t ? { name: t.name } : null).filter(Boolean)
          };
          setSavedTemplates([...savedTemplates, template]);
          setNewTemplateName('');
          setShowSaveTemplate(false);
          setError(null);
        } catch (e) {
          console.error('Error saving template:', e);
          setError('Failed to save template. Please try again.');
        }
      };

      const loadTemplate = (template) => {
        if (!template) {
          setError('Invalid template.');
          return;
        }
        
        try {
          setNumIndividualPlaces(utils.validateNumber(template.numIndividualPlaces, 1, 20, 5));
          setNumRelayPlaces(utils.validateNumber(template.numRelayPlaces, 1, 20, 3));
          setNumDivingPlaces(utils.validateNumber(template.numDivingPlaces, 1, 20, 3));
          
          if (template.individualPointSystem && typeof template.individualPointSystem === 'object') {
            setIndividualPointSystem({ ...template.individualPointSystem });
          }
          if (template.relayPointSystem && typeof template.relayPointSystem === 'object') {
            setRelayPointSystem({ ...template.relayPointSystem });
          }
          if (template.divingPointSystem && typeof template.divingPointSystem === 'object') {
            setDivingPointSystem({ ...template.divingPointSystem });
          }

          // Load special scoring rules if present in template
          if (typeof template.heatLockEnabled === 'boolean') {
            setHeatLockEnabled(template.heatLockEnabled);
          }
          if (typeof template.aRelayOnly === 'boolean') {
            setARelayOnly(template.aRelayOnly);
          }
          if (typeof template.teamPlaceLimitEnabled === 'boolean') {
            setTeamPlaceLimitEnabled(template.teamPlaceLimitEnabled);
          }

          let newTeams = teams;
          if (template.teams && Array.isArray(template.teams)) {
            newTeams = template.teams
              .filter(t => t && t.name)
              .map((t) => ({
                id: utils.generateId(),
                name: t.name,
                score: 0,
                girlsScore: 0,
                boysScore: 0
              }));
            setTeams(newTeams);
          }

          if (template.events && Array.isArray(template.events)) {
            const newEvents = template.events
              .filter(e => e && e.name && e.gender)
              .map((e, _index) => ({
                id: utils.generateId(),
                name: e.name,
                gender: e.gender,
                results: []
              }));
            setEvents(newEvents);
            setCollapsedEvents(collapseAllButFirst(newEvents));
            recalculateAllScores(newTeams, newEvents);
          } else {
            recalculateAllScores(newTeams, events);
          }
          // Set active template to custom template id
          setActiveTemplate('custom_' + template.id);
          setError(null);
        } catch (e) {
          console.error('Error loading template:', e);
          setError('Failed to load template. Template may be corrupted.');
        }
      };

      const deleteTemplate = (id) => {
        setSavedTemplates(savedTemplates.filter(t => t.id !== id));
      };

      // Helper to clear active template when user manually changes settings
      const handleManualSettingChange = (setter) => (value) => {
        setActiveTemplate(null);
        setter(value);
      };

      const updateEventResult = (eventId, place, teamId, isChecked) => {
        try {
          // Validate inputs
          if (!eventId || !place || place < 1) return;
          if (teamId && !teams.some(t => t && t.id == teamId)) return; // Validate team exists

          // Find the event to check if it's a relay
          const targetEvent = events.find(e => e && e.id === eventId);
          if (!targetEvent) return;

          const isRelay = targetEvent.name && targetEvent.name.includes('Relay');

          // Check team place limit for relays before adding
          if (isChecked && teamId && teamPlaceLimitEnabled && isRelay) {
            const maxTeamPlaces = Math.max(1, numRelayPlaces - 1);
            // Count how many places this team already has in this event
            let teamPlaceCount = 0;
            (targetEvent.results || []).forEach(result => {
              if (result && result.teamIds && result.teamIds.includes(String(teamId)) && result.place !== place) {
                teamPlaceCount++;
              }
            });
            if (teamPlaceCount >= maxTeamPlaces) {
              // Show error and prevent addition
              setError(<span>Team limit reached: A team can only occupy {maxTeamPlaces} of {numRelayPlaces} relay places. <button onClick={() => { setError(null); setShowSettings(true); setCollapsedSections(prev => { const updated = { ...prev, 'special-scoring': false }; utils.saveToStorage('collapsedSections', updated); return updated; }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="underline font-semibold hover:opacity-80">Change in Settings</button></span>);
              triggerHaptic('heavy');
              return;
            }
          }

          const newEvents = events.map(event => {
            if (event && event.id === eventId) {
              const newResults = [...(event.results || [])];
              const existingIndex = newResults.findIndex(r => r && r.place === place);

              if (existingIndex >= 0) {
                // Place already has entries
                const currentTeamIds = [...(newResults[existingIndex].teamIds || [])];

                if (isChecked && teamId) {
                  // Add team to this place if not already there
                  if (!currentTeamIds.includes(String(teamId))) {
                    currentTeamIds.push(String(teamId));
                  }
                } else if (!isChecked && teamId) {
                  // Remove team from this place
                  const teamIndex = currentTeamIds.indexOf(String(teamId));
                  if (teamIndex >= 0) {
                    currentTeamIds.splice(teamIndex, 1);
                  }
                }

                if (currentTeamIds.length === 0) {
                  // Remove the place entry if no teams left
                  newResults.splice(existingIndex, 1);
                } else {
                  newResults[existingIndex] = { place, teamIds: currentTeamIds };
                }
              } else if (isChecked && teamId) {
                // Create new place entry
                newResults.push({ place, teamIds: [String(teamId)] });
              }

              return { ...event, results: newResults };
            }
            return event;
          });

          setEvents(newEvents);
          recalculateAllScores(teams, newEvents);
          // Track result recording and provide haptic feedback (only when adding, not removing)
          if (isChecked && teamId) {
            trackEvent('record_result', { place: place });
            triggerHaptic('light');
          }

          // B Finals reminder: if heat lock is on, event is individual with >10 places,
          // user just scored a place in 1-8, and no places 9-16 have results yet
          if (isChecked && teamId && heatLockEnabled && !isRelay && numIndividualPlaces > 10 && place >= 1 && place <= 8) {
            const updatedEvent = newEvents.find(e => e.id === eventId);
            if (updatedEvent) {
              const hasBFinalsResults = (updatedEvent.results || []).some(r => r.place >= 9 && r.place <= 16 && r.teamIds && r.teamIds.length > 0);
              if (!hasBFinalsResults) {
                setHeatReminder(`Don't forget to score Heat 1 (B Finals) in places 9th–16th for ${updatedEvent.name}.`);
              }
            }
          }
        } catch (e) {
          console.error('Error updating event result:', e);
          setError('Failed to update result. Please try again.');
        }
      };

      // Bulk update event results - replaces all results for an event
      const bulkUpdateEventResults = (eventId, newResults) => {
        try {
          if (!eventId) return;
          
          const newEvents = events.map(event => {
            if (event && event.id === eventId) {
              return { ...event, results: newResults };
            }
            return event;
          });
          
          setEvents(newEvents);
          recalculateAllScores(teams, newEvents);
        } catch (e) {
          console.error('Error bulk updating event results:', e);
          setError('Failed to update results. Please try again.');
        }
      };

      const clearAllDataKeepTemplates = () => {
        setShowConfirmDialog({
          message: 'Clear all scores but keep your teams, events, and saved templates?',
          onConfirm: () => {
            try {
              // Clear only the scores from events, keep teams and event structure
              const clearedEvents = events.map(event => event ? { ...event, results: [] } : null);
              setEvents(clearedEvents);
              setCollapsedEvents(collapseAllButFirst(clearedEvents));

              // Reset team scores to 0
              const clearedTeams = teams.map(team => team ? {
                ...team,
                score: 0,
                girlsScore: 0,
                boysScore: 0
              } : null);
              setTeams(clearedTeams);

              utils.saveToStorage('teams', clearedTeams);
              utils.saveToStorage('events', clearedEvents);
              utils.saveToStorage('version', CURRENT_VERSION);

              recalculateAllScores(clearedTeams, clearedEvents);
              setShowConfirmDialog(null);
            } catch (e) {
              console.error('Error clearing data:', e);
              setError('Failed to clear data. Please try again.');
              setShowConfirmDialog(null);
            }
          },
          onCancel: () => setShowConfirmDialog(null)
        });
      };

      const clearAllDataAndTemplates = () => {
        setShowConfirmDialog({
          message: 'Clear ALL data including saved templates? This cannot be undone.',
          onConfirm: () => {
            try {
              // Clear only swimMeetScore-prefixed keys (preserve analytics queue and other data)
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('swimMeetScore_')) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => localStorage.removeItem(key));

              setTeams(defaultTeams);
              setEvents(defaultEvents);
              setCollapsedEvents(collapseAllButFirst(defaultEvents));
              setIndividualPointSystem(defaultIndividualPoints);
              setRelayPointSystem(defaultRelayPoints);
              setDivingPointSystem(defaultDivingPoints);
              setNumIndividualPlaces(5);
              setNumRelayPlaces(3);
              setNumDivingPlaces(3);
              setSavedTemplates([]);
              setDarkMode(true);
              setScoringMode('combined');
              // Reset Heat Lock and A-Relay settings to defaults (off)
              setHeatLockEnabled(false);
              setARelayOnly(false);
              // Reset team place limit to default (on for high school meets)
              setTeamPlaceLimitEnabled(true);
              // Reset active template to default (High School)
              setActiveTemplate('high_school');

              utils.saveToStorage('version', CURRENT_VERSION);
              recalculateAllScores(defaultTeams, defaultEvents);
              setShowConfirmDialog(null);
            } catch (e) {
              console.error('Error clearing all data:', e);
              setError('Failed to clear all data. Please try again.');
              setShowConfirmDialog(null);
            }
          },
          onCancel: () => setShowConfirmDialog(null)
        });
      };

      useEffect(() => {
        recalculateAllScores(teams, events);

      }, [scoringMode]);

      const sortedTeams = useMemo(() => {
        if (!Array.isArray(teams) || teams.length === 0) return [];
        return [...teams].sort((a, b) => {
          if (!a || !b) return 0;
          if (scoringMode === 'girls') {
            return (b.girlsScore || 0) - (a.girlsScore || 0);
          } else if (scoringMode === 'boys') {
            return (b.boysScore || 0) - (a.boysScore || 0);
          }
          return (b.score || 0) - (a.score || 0);
        });
      }, [teams, scoringMode]);

      const getPlacesArray = (event) => {
        if (!event || !event.name) return [];
        const isDiving = event.name === 'Diving';
        const isRelay = event.name.includes('Relay');
        const numPlaces = isDiving ? numDivingPlaces : isRelay ? numRelayPlaces : numIndividualPlaces;
        return Array.from({ length: numPlaces }, (_, i) => i + 1);
      };

      // Calculate which places are consumed by ties (skipped places)
      const getConsumedPlaces = (event) => {
        const consumed = new Set();
        if (!event || !event.results) return consumed;
        
        const isDiving = event.name === 'Diving';
        const isRelay = event.name.includes('Relay');
        const numPlaces = isDiving ? numDivingPlaces : isRelay ? numRelayPlaces : numIndividualPlaces;
        
        // Sort results by place
        const sortedResults = [...event.results]
          .filter(r => r && r.place && r.teamIds && r.teamIds.length > 0)
          .sort((a, b) => a.place - b.place);
        
        sortedResults.forEach(result => {
          const numTied = result.teamIds.length;
          if (numTied > 1) {
            // Mark subsequent places as consumed
            for (let i = 1; i < numTied && (result.place + i) <= numPlaces; i++) {
              consumed.add(result.place + i);
            }
          }
        });

        return consumed;
      };

      const highSchoolEvents = [
        { name: '200 Medley Relay', gender: 'girls' },
        { name: '200 Medley Relay', gender: 'boys' },
        { name: '200 Freestyle', gender: 'girls' },
        { name: '200 Freestyle', gender: 'boys' },
        { name: '200 IM', gender: 'girls' },
        { name: '200 IM', gender: 'boys' },
        { name: '50 Freestyle', gender: 'girls' },
        { name: '50 Freestyle', gender: 'boys' },
        { name: 'Diving', gender: 'girls' },
        { name: 'Diving', gender: 'boys' },
        { name: '100 Butterfly', gender: 'girls' },
        { name: '100 Butterfly', gender: 'boys' },
        { name: '100 Freestyle', gender: 'girls' },
        { name: '100 Freestyle', gender: 'boys' },
        { name: '500 Freestyle', gender: 'girls' },
        { name: '500 Freestyle', gender: 'boys' },
        { name: '200 Freestyle Relay', gender: 'girls' },
        { name: '200 Freestyle Relay', gender: 'boys' },
        { name: '100 Backstroke', gender: 'girls' },
        { name: '100 Backstroke', gender: 'boys' },
        { name: '100 Breaststroke', gender: 'girls' },
        { name: '100 Breaststroke', gender: 'boys' },
        { name: '400 Freestyle Relay', gender: 'girls' },
        { name: '400 Freestyle Relay', gender: 'boys' }
      ];

      const competitionEvents = [
        { name: '200 Medley Relay', gender: 'girls' },
        { name: '200 Medley Relay', gender: 'boys' },
        { name: '200 Freestyle', gender: 'girls' },
        { name: '200 Freestyle', gender: 'boys' },
        { name: '200 IM', gender: 'girls' },
        { name: '200 IM', gender: 'boys' },
        { name: '50 Freestyle', gender: 'girls' },
        { name: '50 Freestyle', gender: 'boys' },
        { name: 'Diving', gender: 'girls' },
        { name: 'Diving', gender: 'boys' },
        { name: '100 Butterfly', gender: 'girls' },
        { name: '100 Butterfly', gender: 'boys' },
        { name: '100 Freestyle', gender: 'girls' },
        { name: '100 Freestyle', gender: 'boys' },
        { name: '500 Freestyle', gender: 'girls' },
        { name: '500 Freestyle', gender: 'boys' },
        { name: '200 Freestyle Relay', gender: 'girls' },
        { name: '200 Freestyle Relay', gender: 'boys' },
        { name: '100 Backstroke', gender: 'girls' },
        { name: '100 Backstroke', gender: 'boys' },
        { name: '100 Breaststroke', gender: 'girls' },
        { name: '100 Breaststroke', gender: 'boys' },
        { name: '400 Freestyle Relay', gender: 'girls' },
        { name: '400 Freestyle Relay', gender: 'boys' }
      ];

      const loadHighSchoolMeet = () => {
        setNumIndividualPlaces(5);
        setNumRelayPlaces(3);
        setNumDivingPlaces(3);
        setIndividualPointSystem({
          1: 6, 2: 4, 3: 3, 4: 2, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
        });
        setRelayPointSystem({
          1: 8, 2: 4, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
        });
        setDivingPointSystem({
          1: 5, 2: 3, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
        });
        // Disable Conference/Sectionals-specific features
        setHeatLockEnabled(false);
        setARelayOnly(false);
        // Enable team place limit for dual meets (prevents one team from taking all scoring places)
        setTeamPlaceLimitEnabled(true);
        // Set 2 default teams for dual meet
        const dualMeetTeams = [
          { id: utils.generateId(), name: 'Home Team', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Away Team', score: 0, girlsScore: 0, boysScore: 0 }
        ];
        setTeams(dualMeetTeams);
        const newEvents = highSchoolEvents.map((e) => ({
          id: utils.generateId(),
          name: e.name,
          gender: e.gender,
          results: []
        }));
        setEvents(newEvents);
        setCollapsedEvents(collapseAllButFirst(newEvents));
        recalculateAllScores(dualMeetTeams, newEvents);
        setActiveTemplate('high_school');
        // Track event
        trackEvent('load_template', { template_name: 'high_school_meet' });
      };


      // Conference Meet - 16 places individual, 8 places relay (A-relay only), heat lock enabled
      const loadConferenceMeet = () => {
        setNumIndividualPlaces(16);
        setNumRelayPlaces(8);
        setNumDivingPlaces(16);
        setIndividualPointSystem({
          1: 20, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11, 9: 9, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0
        });
        setRelayPointSystem({
          1: 40, 2: 34, 3: 32, 4: 30, 5: 28, 6: 26, 7: 24, 8: 22, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
        });
        setDivingPointSystem({
          1: 20, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11, 9: 9, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0
        });
        // Enable Conference-specific features
        setHeatLockEnabled(true);
        setARelayOnly(true);
        // Disable team place limit for conference meets (many teams competing)
        setTeamPlaceLimitEnabled(false);
        // Set 8 default teams for Conference meet
        const conferenceTeams = [
          { id: utils.generateId(), name: 'Team 1', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 2', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 3', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 4', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 5', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 6', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 7', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 8', score: 0, girlsScore: 0, boysScore: 0 }
        ];
        setTeams(conferenceTeams);
        const newEvents = competitionEvents.map((e) => ({
          id: utils.generateId(),
          name: e.name,
          gender: e.gender,
          results: []
        }));
        setEvents(newEvents);
        setCollapsedEvents(collapseAllButFirst(newEvents));
        recalculateAllScores(conferenceTeams, newEvents);
        setActiveTemplate('conference');
        trackEvent('load_template', { template_name: 'conference_meet' });
      };

      // Sectionals - 16 places individual, 16 places relay (A-relay only, double points), heat lock enabled
      const loadSectionalsMeet = () => {
        setNumIndividualPlaces(16);
        setNumDivingPlaces(16);
        setIndividualPointSystem({
          1: 20, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11, 9: 9, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0
        });
        // Relay points are double the individual points for all 20 places (to support up to 20 teams)
        setRelayPointSystem({
          1: 40, 2: 34, 3: 32, 4: 30, 5: 28, 6: 26, 7: 24, 8: 22, 9: 18, 10: 14, 11: 12, 12: 10, 13: 8, 14: 6, 15: 4, 16: 2, 17: 1, 18: 1, 19: 1, 20: 1
        });
        setDivingPointSystem({
          1: 20, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11, 9: 9, 10: 7, 11: 6, 12: 5, 13: 4, 14: 3, 15: 2, 16: 1, 17: 0, 18: 0, 19: 0, 20: 0
        });
        // Enable Sectionals-specific features
        setHeatLockEnabled(true);
        setARelayOnly(true);
        // Disable team place limit for sectionals (many teams competing)
        setTeamPlaceLimitEnabled(false);
        // Set 10 default teams for Sectionals (typical entry size)
        const sectionalsTeams = [
          { id: utils.generateId(), name: 'Team 1', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 2', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 3', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 4', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 5', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 6', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 7', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 8', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 9', score: 0, girlsScore: 0, boysScore: 0 },
          { id: utils.generateId(), name: 'Team 10', score: 0, girlsScore: 0, boysScore: 0 }
        ];
        setTeams(sectionalsTeams);
        // For Sectionals with A-relay only, relay places = number of teams (one relay per team)
        setNumRelayPlaces(sectionalsTeams.length);
        const newEvents = competitionEvents.map((e) => ({
          id: utils.generateId(),
          name: e.name,
          gender: e.gender,
          results: []
        }));
        setEvents(newEvents);
        setCollapsedEvents(collapseAllButFirst(newEvents));
        recalculateAllScores(sectionalsTeams, newEvents);
        setActiveTemplate('sectionals');
        trackEvent('load_template', { template_name: 'sectionals_meet' });
      };

      // USA Swimming Official Scoring by Number of Lanes (Multi-team Meet)
      // Individual points follow USA Swimming standards, relay points are doubled
      const usaSwimmingScoring = {
        4: { individual: [5, 3, 2, 1], relay: [10, 6, 4, 2] },
        5: { individual: [6, 4, 3, 2, 1], relay: [12, 8, 6, 4, 2] },
        6: { individual: [7, 5, 4, 3, 2, 1], relay: [14, 10, 8, 6, 4, 2] },
        7: { individual: [8, 6, 5, 4, 3, 2, 1], relay: [16, 12, 10, 8, 6, 4, 2] },
        8: { individual: [9, 7, 6, 5, 4, 3, 2, 1], relay: [18, 14, 12, 10, 8, 6, 4, 2] },
        9: { individual: [10, 8, 7, 6, 5, 4, 3, 2, 1], relay: [20, 16, 14, 12, 10, 8, 6, 4, 2] },
        10: { individual: [11, 9, 8, 7, 6, 5, 4, 3, 2, 1], relay: [22, 18, 16, 14, 12, 10, 8, 6, 4, 2] }
      };

      const loadUSASwimmingMeet = (lanes) => {
        const scoring = usaSwimmingScoring[lanes];
        if (!scoring) return;

        const numPlaces = lanes;
        setNumIndividualPlaces(numPlaces);
        setNumRelayPlaces(numPlaces);
        setNumDivingPlaces(numPlaces);

        // Build point systems from arrays, filling remaining places with 0
        const buildPointSystem = (pointsArray) => {
          const system = {};
          for (let i = 1; i <= 20; i++) {
            system[i] = pointsArray[i - 1] || 0;
          }
          return system;
        };

        setIndividualPointSystem(buildPointSystem(scoring.individual));
        setRelayPointSystem(buildPointSystem(scoring.relay));
        setDivingPointSystem(buildPointSystem(scoring.individual)); // Diving uses individual points

        // Disable Conference/Sectionals-specific features
        setHeatLockEnabled(false);
        setARelayOnly(false);
        // Disable team place limit for USA Swimming meets (multi-team format)
        setTeamPlaceLimitEnabled(false);

        // Set default teams equal to number of lanes
        const usaTeams = [];
        for (let i = 1; i <= lanes; i++) {
          usaTeams.push({ id: utils.generateId(), name: `Team ${i}`, score: 0, girlsScore: 0, boysScore: 0 });
        }
        setTeams(usaTeams);

        // USA Swimming templates exclude diving events
        const newEvents = competitionEvents
          .filter((e) => e.name !== 'Diving')
          .map((e) => ({
            id: utils.generateId(),
            name: e.name,
            gender: e.gender,
            results: []
          }));
        setEvents(newEvents);
        setCollapsedEvents(collapseAllButFirst(newEvents));
        recalculateAllScores(usaTeams, newEvents);
        setActiveTemplate(`usa_swimming_${lanes}`);
        trackEvent('load_template', { template_name: `usa_swimming_${lanes}_lane` });
      };

      // Generate shareable score text
      const generateShareText = () => {
        const modeLabel = scoringMode === 'combined' ? '' : scoringMode === 'girls' ? ' (Girls)' : ' (Boys)';
        const sortedTeams = [...teams].sort((a, b) => {
          const scoreA = scoringMode === 'girls' ? a.girlsScore : scoringMode === 'boys' ? a.boysScore : a.score;
          const scoreB = scoringMode === 'girls' ? b.girlsScore : scoringMode === 'boys' ? b.boysScore : b.score;
          return scoreB - scoreA;
        });
        
        let text = `🏊 Swim Meet Scores${modeLabel}\n\n`;
        
        sortedTeams.forEach((team, index) => {
          const score = scoringMode === 'girls' ? team.girlsScore : scoringMode === 'boys' ? team.boysScore : team.score;
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
          
          if (scoringMode === 'combined') {
            // Show breakdown for combined mode
            text += `${medal} #${index + 1} ${team.name}: ${score} pts (G: ${team.girlsScore}, B: ${team.boysScore})\n`;
          } else {
            text += `${medal} #${index + 1} ${team.name}: ${score} pts\n`;
          }
        });
        
        text += `\n📊 Scored with SwimMeetScore\n`;
        text += `https://swimmeetscore.com`;
        
        // Add extra newlines at end for email clients that append signatures
        text += `\n\n\n`;
        
        return text;
      };

      // Share scores via native share or clipboard
      const shareScores = async () => {
        const text = generateShareText();
        
        // Track the share attempt
        trackEvent('share_scores', { method: navigator.share ? 'native' : 'clipboard', scoring_mode: scoringMode });
        
        // Try native share first (mobile)
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Swim Meet Scores',
              text: text
            });
            return;
          } catch (err) {
            // User cancelled or share failed, fall back to clipboard
            if (err.name === 'AbortError') return;
          }
        }
        
        // Fall back to clipboard
        try {
          await navigator.clipboard.writeText(text);
          setError(null);
          // Show success message briefly using error state (we'll style it differently)
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        } catch (err) {
          setError('Failed to copy to clipboard');
        }
      };

      // Base64-encoded QR code for swimmeetscore.com (fallback when external API is unavailable)
      const QR_CODE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASIAAAEiAQAAAAB1xeIbAAAB5UlEQVR4nO2aTYrjMBCFv2oJeulDDpCjyDeYM+Vm8YEGrGVA5s1CkjvdmWFmMcY/LS2M7HyQR1F+cqlk4u9jfPsHCBrVqANR0coYmI0xz6A+9VvpOj3lAZcAMOJFFjR7ES+JcAeIl010fR+qpDcA8V02dIn8Qgyb6jo35b/cizjby/q7V/UnorqHlVn0f6b+5z82CkkJwMkGoHhOJ+m+qa7zU3P+oKnZ7pRno5mZ9dvpOjvloVvsPc6msXf55tn096r+2BTS5CRJIkzuOeBBi/HsVf2xKaQJCJOT7iyXLlGsvsV+NYqc8nxaXEvY88y12K9E5bzPl4+8z8+UiiO12K9C5byXFqtf3IdQf2ixX42KHuge9uw+gG49MF7TVrpOT9X6NV5kABrNpVLdRkNEn/ar/thUif34I9UP+m5CMBt0P72Fqe1jrkXl2FuY5mUHx9A4QN7RzBa0V/XHpupauyy4YVrqrVp0tbV2Neqjb9U9TLersvnYAJSVeMfqD07VPQUAwgSMfS2wxn47XWenit+XxqFT3cCfDXBY0Da6vifVLW+AErq1Xvlq1GvPkNorh9nTvjHXpmrfCsx6JyunRd5b32pNylO8HSD2uZAV0SULWrrme1V/bOr1TMJvRjsT2KiTUb8AfOYOwMRUyGwAAAAASUVORK5CYII=';

      // Print QR Code for spectators
      const printQRCode = () => {
        trackEvent('print_qr_code');

        const qrImgTag = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=https://swimmeetscore.com" ' +
          'onerror="this.onerror=null;this.src=\'' + QR_CODE_BASE64 + '\';" ' +
          'class="qr-code" alt="QR Code for SwimMeetScore.com" />';

        const htmlContent = '<!DOCTYPE html>' +
          '<html>' +
          '<head>' +
            '<title>SwimMeetScore QR Code</title>' +
            '<style>' +
              '@page { size: letter; margin: 0; }' +
              '* { margin: 0; padding: 0; box-sizing: border-box; }' +
              'html, body { width: 8.5in; height: 11in; }' +
              'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5in; text-align: center; }' +
              '.header { margin-bottom: 0.4in; }' +
              '.header h1 { font-size: 36pt; font-weight: bold; color: #0891b2; margin-bottom: 0.15in; line-height: 1.2; }' +
              '.header p { font-size: 16pt; color: #374151; }' +
              '.qr-container { padding: 0.25in; border: 4px solid #0891b2; border-radius: 0.2in; background: white; margin-bottom: 0.4in; }' +
              '.qr-code { width: 3.5in; height: 3.5in; display: block; }' +
              '.url { font-size: 24pt; font-weight: bold; color: #0891b2; margin-bottom: 0.25in; }' +
              '.tagline { font-size: 14pt; color: #6b7280; max-width: 6in; line-height: 1.4; }' +
              '.swimmer-icon { margin-top: 0.25in; font-size: 36pt; }' +
              '@media print { html, body { width: 100%; height: 100%; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }' +
            '</style>' +
          '</head>' +
          '<body>' +
            '<div class="header">' +
              '<h1>🏊 Scan to Track<br/>Live Swim Meet Scores!</h1>' +
              '<p>Point your phone camera at the QR code below</p>' +
            '</div>' +
            '<div class="qr-container">' +
              qrImgTag +
            '</div>' +
            '<div class="url">SwimMeetScore.com</div>' +
            '<div class="tagline">Free swim meet scoring tool — Track scores in real-time!<br/>Works on any phone • No app download required</div>' +
            '<div class="swimmer-icon">🏆</div>' +
          '</body>' +
          '</html>';

        // Create print window with US Letter sizing
        const printWindow = window.open('', '_blank', 'width=850,height=1100');

        if (!printWindow) {
          alert('Pop-up blocked! Please allow pop-ups for this site to print the QR code poster.');
          return;
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = function() {
          setTimeout(function() {
            printWindow.print();
          }, 250);
        };
      };

      // Email formatted results
      const emailResults = () => {
        trackEvent('email_results', { scoring_mode: scoringMode });
        
        const modeLabel = scoringMode === 'combined' ? '' : scoringMode === 'girls' ? ' (Girls Only)' : ' (Boys Only)';
        const sortedTeams = [...teams].sort((a, b) => {
          const scoreA = scoringMode === 'girls' ? a.girlsScore : scoringMode === 'boys' ? a.boysScore : a.score;
          const scoreB = scoringMode === 'girls' ? b.girlsScore : scoringMode === 'boys' ? b.boysScore : b.score;
          return scoreB - scoreA;
        });
        
        // Filter events based on scoring mode
        const filteredEvents = scoringMode === 'combined' 
          ? events 
          : events.filter(e => e.gender === scoringMode);
        
        const subject = encodeURIComponent('Swim Meet Results' + modeLabel);
        
        let body = 'SWIM MEET RESULTS' + modeLabel.toUpperCase() + '\n';
        body += '================================\n\n';
        body += 'FINAL STANDINGS:\n\n';
        
        sortedTeams.forEach((team, index) => {
          const score = scoringMode === 'girls' ? team.girlsScore : scoringMode === 'boys' ? team.boysScore : team.score;
          const place = index + 1;
          const placeStr = place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : place + 'th';
          body += placeStr + ' Place: ' + team.name + ' - ' + score + ' points\n';
        });
        
        if (scoringMode === 'combined' && sortedTeams.length > 0) {
          body += '\n--------------------------------\n';
          body += 'BREAKDOWN BY GENDER:\n\n';
          body += 'Girls Scores:\n';
          [...teams].sort((a, b) => b.girlsScore - a.girlsScore).forEach((team, index) => {
            body += '  ' + (index + 1) + '. ' + team.name + ': ' + team.girlsScore + ' pts\n';
          });
          body += '\nBoys Scores:\n';
          [...teams].sort((a, b) => b.boysScore - a.boysScore).forEach((team, index) => {
            body += '  ' + (index + 1) + '. ' + team.name + ': ' + team.boysScore + ' pts\n';
          });
        }
        
        // Add event-by-event results
        if (filteredEvents.length > 0) {
          body += '\n================================\n';
          body += 'EVENT-BY-EVENT RESULTS:\n';
          body += '================================\n\n';
          
          filteredEvents.forEach((event) => {
            const genderPrefix = scoringMode === 'combined' ? (event.gender === 'girls' ? 'Girls ' : 'Boys ') : '';
            const isDiving = event.name === 'Diving';
            const isRelay = event.name.includes('Relay');
            const evtPointSystem = isDiving ? divingPointSystem : isRelay ? relayPointSystem : individualPointSystem;
            body += genderPrefix + event.name + ':\n';

            if (event.results && event.results.length > 0) {
              // Sort results by place
              const sortedResults = [...event.results].sort((a, b) => a.place - b.place);

              sortedResults.forEach((result) => {
                const placeNum = result.place;
                const placeStr = placeNum === 1 ? '1st' : placeNum === 2 ? '2nd' : placeNum === 3 ? '3rd' : placeNum + 'th';
                const numTied = result.teamIds.length;
                let points;
                if (numTied > 1) {
                  let totalPoints = 0;
                  for (let i = 0; i < numTied; i++) {
                    totalPoints += (evtPointSystem[placeNum + i]) || 0;
                  }
                  points = (totalPoints / numTied).toFixed(1).replace(/\.0$/, '');
                } else {
                  points = evtPointSystem[placeNum] ?? 0;
                }
                const teamNames = result.teamIds.map(id => {
                  const team = teams.find(t => String(t.id) === String(id));
                  return team ? team.name : 'Unknown';
                }).join(', ');

                if (numTied > 1) {
                  body += '  ' + placeStr + ' (TIE): ' + teamNames + ' (' + points + ' pts each)\n';
                } else {
                  body += '  ' + placeStr + ': ' + teamNames + ' (' + points + ' pts)\n';
                }
              });
            } else {
              body += '  (No results recorded)\n';
            }
            body += '\n';
          });
        }
        
        body += '================================\n';
        body += 'Scored with SwimMeetScore.com\n';
        body += 'https://swimmeetscore.com\n';
        body += 'Free swim meet scoring tool\n';
        
        const mailtoLink = 'mailto:?subject=' + subject + '&body=' + encodeURIComponent(body);
        window.location.href = mailtoLink;
      };

      return (
        <div className={`min-h-screen p-4 font-outfit ${darkMode ? 'bg-pool-deep' : 'bg-gradient-to-b from-sky-100 via-cyan-50 to-blue-100'}`} style={darkMode ? {background: 'linear-gradient(180deg, #0c1929 0%, #0f2942 50%, #164e6e 100%)'} : {}}>
          {/* Pool lane pattern overlay for dark mode */}
          {darkMode && (
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 80px, #fbbf24 80px, #fbbf24 84px)',
            }} />
          )}
          {/* Fixed Position Notifications - Always visible regardless of scroll */}
          {error && (
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-fade-slide-up">
              <div className={`max-w-lg w-full p-4 rounded-lg flex items-center justify-between shadow-lg ${darkMode ? 'bg-red-900 text-red-100 border border-red-700' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className={`ml-4 flex-shrink-0 ${darkMode ? 'text-red-300 hover:text-red-100' : 'text-red-500 hover:text-red-700'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          {heatReminder && (
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-fade-slide-up">
              <div className={`max-w-lg w-full p-4 rounded-lg flex items-center justify-between shadow-lg ${darkMode ? 'bg-amber-900 text-amber-100 border border-amber-700' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                <span>🔒 {heatReminder}</span>
                <button
                  onClick={() => setHeatReminder(null)}
                  className={`ml-4 flex-shrink-0 ${darkMode ? 'text-amber-300 hover:text-amber-100' : 'text-amber-500 hover:text-amber-700'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Fixed Success Message */}
          {shareSuccess && (
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-fade-slide-up">
              <div className={`max-w-lg w-full p-4 rounded-lg flex items-center gap-3 shadow-lg ${darkMode ? 'bg-green-900 text-green-100 border border-green-700' : 'bg-green-100 text-green-800 border border-green-300'}`}>
                <span>✓ Scores copied to clipboard!</span>
              </div>
            </div>
          )}

          {/* Fixed Offline Indicator */}
          {isOffline && (
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
              <div className={`max-w-lg w-full p-3 rounded-lg flex items-center gap-3 shadow-lg ${darkMode ? 'bg-cyan-900/70 text-cyan-100 border border-cyan-700' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'}`}>
                <span className="text-lg">📶</span>
                <span><strong>Offline Mode</strong> — No worries! The app works offline. Your data is saved locally.</span>
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto">
            {/* Confirmation Dialog */}
            {showConfirmDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`rounded-lg p-6 max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Confirm Action
                  </h3>
                  <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {showConfirmDialog.message}
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={showConfirmDialog.onCancel}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={showConfirmDialog.onConfirm}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Entry Modal */}
            {bulkEntryEvent && (
              <BulkEntryModal
                event={bulkEntryEvent}
                teams={teams}
                darkMode={darkMode}
                numPlaces={
                  bulkEntryEvent.name === 'Diving' 
                    ? numDivingPlaces 
                    : bulkEntryEvent.name.includes('Relay') 
                      ? numRelayPlaces 
                      : numIndividualPlaces
                }
                pointSystem={
                  bulkEntryEvent.name === 'Diving' 
                    ? divingPointSystem 
                    : bulkEntryEvent.name.includes('Relay') 
                      ? relayPointSystem 
                      : individualPointSystem
                }
                existingResults={bulkEntryEvent.results}
                onSave={bulkUpdateEventResults}
                onClose={() => setBulkEntryEvent(null)}
              />
            )}

            {/* About/Help Modal */}
            {showAbout && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {/* Header */}
                  <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <HelpCircle className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Help & Instructions</h3>
                    </div>
                    <button
                      onClick={() => setShowAbout(false)}
                      className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    >
                      <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className={`flex-1 overflow-y-auto p-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {/* About Section */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🏊 About Swim Meet Score</h4>
                      <p className="mb-3">
                        Swim Meet Score is a free, ad-free tool for tracking scores during swim meets. Perfect for coaches, parents, and officials at high school and competitive swimming events.
                      </p>
                      
                      {/* QR Code for Spectators - Meet Organizers */}
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-cyan-900/50 border border-cyan-700' : 'bg-cyan-50 border border-cyan-200'}`}>
                        <h5 className={`font-semibold mb-1 ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>📱 For Meet Organizers: QR Code Poster</h5>
                        <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(Spectators can skip this section)</p>
                        <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Print a QR code poster so spectators can scan and track scores on their own phones — no printed score sheets needed!
                        </p>
                        <button
                          onClick={printQRCode}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${darkMode ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
                        >
                          <Printer className="w-5 h-5" />
                          Print QR Code Poster
                        </button>
                      </div>
                      
                      <p className={`mt-6 text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        📶 <strong>Works at pools with poor cell service!</strong> Once loaded, the app works completely offline.
                      </p>
                    </section>

                    {/* Install on Phone */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>→📱 Install on Your Phone</h4>
                      
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>iPhone / iPad (Safari)</h5>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>Open swimmeetscore.com in Safari</li>
                          <li>Tap the Share button (square with arrow)</li>
                          <li>Scroll down and tap "Add to Home Screen"</li>
                          <li>Tap "Add" to confirm</li>
                        </ol>
                      </div>

                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Android (Chrome)</h5>
                        
                        {deferredPrompt ? (
                          <div className="mb-3">
                            <button
                              onClick={handleInstallClick}
                              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Install App Now
                            </button>
                            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Click above to add Swim Meet Score to your home screen
                            </p>
                          </div>
                        ) : (
                          <div className={`mb-3 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-green-100 text-green-800'}`}>
                            <p className="font-medium mb-1">📱 Already installed or not available?</p>
                            <p className="text-xs">The install button appears automatically on Android Chrome. If you don't see it, you may have already installed the app, or try the manual steps below.</p>
                          </div>
                        )}
                        
                        <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Or install manually:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>Open swimmeetscore.com in Chrome</li>
                          <li>Tap the three-dot menu (⋮) in the top right</li>
                          <li>Tap "Add to Home screen" or "Install app"</li>
                          <li>Tap "Add" or "Install" to confirm</li>
                        </ol>
                      </div>
                    </section>

                    {/* How to Use */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🏊 How to Use</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Add Teams:</strong> Go to Settings and add your competing teams</li>
                        <li><strong>Choose a Template:</strong> Select a preset template like "High School Dual Meet," "Conference Meet," or "Sectionals" for preset events and point systems, or customize your own</li>
                        <li><strong>Record Results:</strong> For each event, select the team(s) that placed 1st, 2nd, 3rd, etc.</li>
                        <li><strong>View Scores:</strong> The scoreboard updates automatically as you enter results</li>
                      </ol>
                    </section>

                    {/* Two Entry Modes */}
                    <section className="mb-8">
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>📋 Two Entry Modes</h5>
                        <div className="text-sm space-y-2">
                          <p><strong>Place Mode (Default):</strong> Pick teams for each place using dropdowns. Best for recording ties.</p>
                          <p><strong>Team Mode:</strong> Tap place numbers for each team. Faster dual meets as you can simply select the places for one team and the scores for the other team fill in automatically.</p>
                          <p className="mt-2"><strong>Auto-fill in Team Mode:</strong> When there are exactly 2 teams and one team has places assigned, an "Auto-fill [team name]" button appears in each event card. Pressing it assigns all remaining unoccupied places to the other team.</p>
                        </div>
                      </div>
                    </section>

                    {/* Tie Handling */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🤝 How Ties Are Handled</h4>
                      <p className="mb-3">
                        Swim Meet Score follows official tie-breaking rules used in competitive swimming:
                      </p>
                      
                      {/* How to Record a Tie */}
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-cyan-900/50 border border-cyan-700' : 'bg-cyan-50 border border-cyan-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>📝 How to Record a Tie</h5>
                        <ol className="text-sm space-y-1 list-decimal list-inside">
                          <li>Click on the place dropdown (1st, 2nd, etc.)</li>
                          <li>Check the boxes for ALL teams that tied for that place</li>
                          <li>The app will automatically calculate split points and skip places</li>
                        </ol>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
                          💡 You'll see a yellow highlight and "TIE" indicator when multiple teams are selected
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>➗ Point Splitting</h5>
                        <p className="text-sm mb-2">When swimmers tie, the points for the tied places are added together and split evenly.</p>
                        <div className={`text-sm p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <p className="font-medium mb-1">Example - Dual Meet (6-4-3-2-1 scoring):</p>
                          <p>• Two swimmers tie for 1st: (6 + 4) ÷ 2 = <strong>5 pts each</strong></p>
                          <p className="mt-2 font-medium mb-1">Example - Championship (20-17-16-15... scoring):</p>
                          <p>• Two swimmers tie for 1st: (20 + 17) ÷ 2 = <strong>18.5 pts each</strong></p>
                          <p>• Three swimmers tie for 2nd: (17 + 16 + 15) ÷ 3 = <strong>16 pts each</strong></p>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>⏭ Place Skipping</h5>
                        <p className="text-sm mb-2">After a tie, subsequent places are skipped based on how many swimmers tied.</p>
                        <div className={`text-sm p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <p className="font-medium mb-1">Examples:</p>
                          <p>• 2 swimmers tie for 1st → Next finisher gets <strong>3rd place</strong> (2nd skipped)</p>
                          <p>• 3 swimmers tie for 2nd → Next finisher gets <strong>5th place</strong> (3rd & 4th skipped)</p>
                          <p>• 2 swimmers tie for 5th → Next finisher gets <strong>7th place</strong> (6th skipped)</p>
                        </div>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                          Skipped places will appear grayed out with "(tied above)" in the app
                        </p>
                      </div>

                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>🏆 Complete Tie Example</h5>
                        <p className="text-sm mb-2">Dual meet scoring (6-4-3-2-1) with Team A and Team B:</p>
                        <div className={`text-sm p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <p>• 1st Place: Team A & Team B tie → Each gets 5 pts (6+4÷2)</p>
                          <p>• 2nd Place: <span className="italic text-gray-500">(skipped - consumed by tie)</span></p>
                          <p>• 3rd Place: Team A → Gets 3 pts</p>
                          <p>• 4th Place: Team B → Gets 2 pts</p>
                          <p>• 5th Place: Team A → Gets 1 pt</p>
                          <p className="mt-2 font-medium">Final: Team A = 9 pts, Team B = 7 pts</p>
                        </div>
                      </div>
                    </section>

                    {/* Tips */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>💡 Tips</h4>
                      <ul className="space-y-2">
                        <li>• <strong>Team Mode:</strong> Toggle "Team Mode" next to Events header for faster mobile entry - tap place numbers directly for each team</li>
                        <li>• <strong>Works Offline:</strong> Once loaded, works without internet - perfect for pools with bad service!</li>
                        <li>• <strong>Save Templates:</strong> Create custom templates for your league's specific scoring rules</li>
                        <li>• <strong>Dark Mode:</strong> Use dark mode for better visibility at indoor pools</li>
                        <li>• <strong>Data Persists:</strong> Your data stays saved even if you close the browser</li>
                        <li>• <strong>Share Scores:</strong> Tap the Share button on the Scoreboard to quickly send team standings via text or social media</li>
                        <li>• <strong>Email Results:</strong> Tap the Email Results button next to Events to send a complete meet report including final standings and all event-by-event results with places</li>
                        <li>• <strong>Clear Data:</strong> Start fresh anytime from Settings → Clear Data</li>
                      </ul>
                    </section>

                    {/* Conference/Sectionals Templates */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🏅 Conference & Sectionals Templates</h4>
                      <p className="mb-3">
                        These templates are designed for championship-style meets with prelims/finals heat structures.
                      </p>
                      
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Conference Meet Template</h5>
                        <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <li>• <strong>Individual Events:</strong> 16 places scored (20-17-16-15-14-13-12-11-9-7-6-5-4-3-2-1)</li>
                          <li>• <strong>Relays:</strong> 8 places, A-relay only, double points (40-34-32-30-28-26-24-22)</li>
                          <li>• <strong>B-relays</strong> are exhibition (non-scoring)</li>
                          <li>• <strong>Heat Lock enabled:</strong> B Finals swimmers locked to places 9-16</li>
                        </ul>
                      </div>
                      
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-teal-900/30 border border-teal-700/50' : 'bg-teal-50 border border-teal-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>Sectionals Template</h5>
                        <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <li>• <strong>Individual Events:</strong> 16 places scored (20-17-16-15-14-13-12-11-9-7-6-5-4-3-2-1)</li>
                          <li>• <strong>Relays:</strong> A-relay only, places = number of teams, double points</li>
                          <li>• <strong>Dynamic relay places:</strong> Since each team enters one A-relay, relay places automatically match team count (e.g., 11 teams = 11 relay places)</li>
                          <li>• <strong>Heat Lock enabled:</strong> B Finals swimmers locked to places 9-16</li>
                        </ul>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Key Difference: Conference vs Sectionals</h5>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Conference scores relays to a fixed 8 places. Sectionals relay places dynamically match the number of teams (since only A-relays are allowed). Both use double points for relays compared to individual events.
                        </p>
                      </div>
                    </section>

                    {/* Heat Lock & A-Relay Settings */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🔒 Heat Lock & A-Relay Settings</h4>
                      <p className="mb-3">
                        Found in Settings under "Special Scoring Rules". These are visual reminders for championship meet scoring rules.
                      </p>
                      
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>🔒 Heat Lock (B Finals/A Finals)</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          When enabled, displays a reminder on individual events that B Finals swimmers are locked to places 9-16, while A Finals swimmers compete for places 1-8.
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                          <strong>Note:</strong> This is a visual reminder - you still manually enter which places each team earned.
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-teal-900/30 border border-teal-700/50' : 'bg-teal-50 border border-teal-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>🅰️ A-Relay Only Scoring</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          When enabled, displays a reminder on relay events that only A-relays score points. B-relays are exhibition and don't count toward team scores.
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}>
                          <strong>Note:</strong> This is a visual reminder - simply don't enter results for B-relays, or enter them for record-keeping knowing they won't affect your manual score calculations.
                        </p>
                      </div>
                    </section>

                    {/* Team Place Limit */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🚫 Team Place Limit (relays)</h4>
                      <p className="mb-3">
                        Found in Settings under "Special Scoring Rules". This rule prevents a single team from occupying all scoring places in relay events.
                      </p>

                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>📋 How It Works</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          When enabled (default for high school dual meets), a team can score at most <strong>(number of places - 1)</strong> positions in any relay event.
                        </p>
                        <div className={`text-sm p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <p className="font-medium mb-1">Example - 3-place relay (8-4-2 scoring):</p>
                          <p>• Team A takes 1st (8 pts) and 2nd (4 pts)</p>
                          <p>• Since max = 2 places, Team A cannot be added to 3rd place</p>
                          <p>• An error message will appear if you try to add Team A to a 3rd place</p>
                        </div>
                      </div>
                    </section>

                    {/* Disqualification Handling */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>❌ Disqualification Handling</h4>
                      <p className="mb-3">
                        How to handle disqualifications (DQs) and their interaction with scoring rules.
                      </p>

                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-orange-900/30 border border-orange-700/50' : 'bg-orange-50 border border-orange-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>📝 Basic DQ Handling</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          If a swimmer finishing in a scoring position is disqualified, remaining finishers should advance normally:
                        </p>
                        <div className={`text-sm p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <p className="font-medium mb-1">Example:</p>
                          <p>• Original finish: Team A (1st), Team B (2nd), Team C (3rd)</p>
                          <p>• Team A is disqualified</p>
                          <p>• New results: Team B becomes 1st (6 pts), Team C becomes 2nd (4 pts)</p>
                        </div>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                          <strong>How to record:</strong> Simply don't enter the DQ'd team's placement, or remove them from the place they were in. Enter the advancing swimmers in their new places.
                        </p>
                      </div>

                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-50 border border-purple-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>🔄 DQ + Team Place Limit (relays)</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          When Team Place Limit is enabled, after advancing places due to a DQ in a relay, the team limit rule still applies.
                        </p>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                          <strong>Key point:</strong> The app automatically recalculates scoring whenever you change place assignments. Just update the placements after the DQ and the limit rules will be applied automatically.
                        </p>
                      </div>
                    </section>

                    {/* Scoring Modes */}
                    <section className="mb-8">
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 Scoring Modes</h4>
                      <ul className="space-y-2">
                        <li>• <strong>Combined:</strong> Shows total team scores (boys + girls)</li>
                        <li>• <strong>Girls Only:</strong> Shows only girls' events and scores</li>
                        <li>• <strong>Boys Only:</strong> Shows only boys' events and scores</li>
                      </ul>
                    </section>

                    {/* Sharing & Emailing */}
                    <section>
                      <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📤 Sharing & Emailing Results</h4>
                      
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-cyan-900/30 border border-cyan-700/50' : 'bg-cyan-50 border border-cyan-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Share Button (Quick Share)</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Located on the Scoreboard. Quickly shares team standings with medal emojis via text, social media, or copies to clipboard.
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Best for: Quick updates during the meet, social media posts
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'}`}>
                        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Email Results Button (Full Report)</h5>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Located next to the Events heading. Opens your email app with a complete meet report including:
                        </p>
                        <ul className={`text-sm space-y-1 ml-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <li>• Final team standings with points</li>
                          <li>• Gender breakdown (Combined mode)</li>
                          <li>• Event-by-event results with all places</li>
                          <li>• Tie indicators where applicable</li>
                        </ul>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Best for: Post-meet reports to coaches, parents, athletic directors
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Footer */}
                  <div className={`px-6 py-4 border-t ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <button
                      onClick={() => setShowAbout(false)}
                      className={`w-full py-3 rounded-lg font-semibold transition ${darkMode ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      Got It!
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-2xl shadow-xl p-4 sm:p-6 mb-6 backdrop-blur-sm ${darkMode ? 'bg-pool-mid/80 border border-chlorine/20' : 'bg-white/90 border border-cyan-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-chlorine/20' : 'bg-cyan-100'}`}>
                    <Swimmer className={`w-8 h-8 ${darkMode ? 'text-chlorine' : 'text-cyan-600'}`} />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Swim Meet <span className={darkMode ? 'text-chlorine' : 'text-cyan-600'}>Score</span>
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowAbout(true); trackEvent('open_help'); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition text-sm font-medium ${darkMode ? 'bg-pool-light/50 hover:bg-pool-light text-white border border-white/10' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'}`}
                  >
                    <HelpCircle className="w-5 h-5" />
                    Help & Info
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(!showSettings);
                      if (!showSettings) {
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        trackEvent('open_settings');
                      } else {
                        // Clear any ongoing settings edit when closing
                        cancelEditingTeamInSettings();
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition text-sm font-medium ${darkMode ? 'bg-chlorine/20 hover:bg-chlorine/30 text-chlorine border border-chlorine/30' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </button>
                </div>
              </div>
              
              {/* SEO-friendly description */}
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Free swimming scoresheet and swim meet scoring tool. Track team scores, individual events, relays, and diving. High school dual meet scoresheet, championship meets, and more — use instantly, no download required!
              </p>

              {showSettings && (
                <div className={`rounded-2xl mb-6 mt-6 relative overflow-hidden ${darkMode ? 'bg-pool-mid border border-chlorine/30' : 'bg-white border border-cyan-200 shadow-xl'}`}>
                  {/* Settings Header Bar */}
                  <div className={`px-4 sm:px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-chlorine/20' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}>
                    <div className="flex items-center gap-3">
                      <Settings className={`w-6 h-6 ${darkMode ? 'text-chlorine' : 'text-white'}`} />
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-chlorine' : 'text-white'}`}>Settings</h3>
                    </div>
                    <button
                      onClick={() => { setShowSettings(false); cancelEditingTeamInSettings(); }}
                      className={`p-2 rounded-lg transition ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                      <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-white'}`} />
                    </button>
                  </div>

                  {/* Settings Content */}
                  <div className="p-3 sm:p-4">
                  {/* Quick Actions Bar */}
                  <div className={`flex items-center justify-between mb-3 pb-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Tap sections to expand/collapse
                    </span>
                    <button
                      onClick={() => {
                        const allSections = ['manage-teams', 'scoring-templates', 'special-scoring', 'scoring-places', 'data-management', 'point-systems', 'appearance'];
                        const anyCollapsed = allSections.some(s => collapsedSections[s]);
                        const newState = {};
                        allSections.forEach(s => { newState[s] = !anyCollapsed; });
                        setCollapsedSections(newState);
                        utils.saveToStorage('collapsedSections', newState);
                      }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {Object.values(collapsedSections).some(Boolean) ? 'Expand All' : 'Collapse All'}
                    </button>
                  </div>

                  {/* Scoring Templates Section */}
                  <CollapsibleSection
                    id="scoring-templates"
                    title="Scoring Templates"
                    description={activeTemplate ? `Using: ${{high_school:'HS Dual Meet',conference:'Conference',sectionals:'Sectionals'}[activeTemplate] || (activeTemplate.startsWith('usa_swimming_') ? 'USA Swimming ' + activeTemplate.split('_')[2] + '-Lane' : activeTemplate.startsWith('custom_') ? (savedTemplates.find(t => 'custom_' + t.id === activeTemplate) || {}).name || 'Custom' : activeTemplate.replace(/_/g, ' '))}` : "Quick presets for common meets"}
                    isCollapsed={collapsedSections['scoring-templates']}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="purple"
                  >
                    {/* Standard Meet Templates */}
                    <div className="mb-5">
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Standard Meets
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {[
                          { label: 'HS Dual Meet', key: 'high_school', onClick: loadHighSchoolMeet, desc: '2 teams · 5 places', color: 'pink' },
                          { label: 'Conference', key: 'conference', onClick: loadConferenceMeet, desc: '8 teams · 16 places', color: 'amber' },
                          { label: 'Sectionals', key: 'sectionals', onClick: loadSectionalsMeet, desc: '10 teams · 16 places', color: 'teal' },
                        ].map(tmpl => {
                          const isActive = activeTemplate === tmpl.key;
                          const colorMap = {
                            pink: darkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600',
                            amber: darkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600',
                            teal: darkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-500 hover:bg-teal-600',
                          };
                          return (
                            <button
                              key={tmpl.key}
                              onClick={tmpl.onClick}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl ${colorMap[tmpl.color]} text-white font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${isActive ? 'ring-[3px] ring-white shadow-lg scale-[1.02]' : ''}`}
                            >
                              <span className="text-sm">{tmpl.label}</span>
                              <span className="text-xs text-white/80">{tmpl.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* USA Swimming Templates */}
                    <div className={`mb-5 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-indigo-600'}`}>
                        USA Swimming Multi-team
                      </p>
                      <p className={`text-xs mb-2.5 ${darkMode ? 'text-gray-500' : 'text-indigo-400'}`}>
                        Select by lane count · Relay points doubled
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[4, 5, 6, 7, 8, 9, 10].map(lanes => {
                          const isActive = activeTemplate === 'usa_swimming_' + lanes;
                          return (
                            <button
                              key={lanes}
                              onClick={() => loadUSASwimmingMeet(lanes)}
                              className={`flex flex-col items-center py-2 rounded-lg ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${isActive ? 'ring-[3px] ring-white shadow-lg scale-[1.02]' : ''}`}
                            >
                              <span className="font-bold">{lanes}</span>
                              <span className="text-xs text-white/80">lanes</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Templates */}
                    {savedTemplates.length > 0 && (
                      <div className="mb-4">
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Your Custom Templates
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {savedTemplates.map(template => {
                            const isActive = activeTemplate === 'custom_' + template.id;
                            return (
                              <button
                                key={template.id}
                                onClick={() => loadTemplate(template)}
                                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl ${darkMode ? 'bg-gray-600 hover:bg-gray-550' : 'bg-white border border-gray-200 hover:border-gray-300'} transition-all cursor-pointer ${isActive ? 'ring-[3px] ring-purple-400 shadow-md' : 'shadow-sm'}`}
                              >
                                <span className={`font-medium text-sm truncate ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                                  {template.name}
                                </span>
                                <span
                                  role="button"
                                  onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                                  className="text-red-400 hover:text-red-500 p-0.5 ml-1 flex-shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Save Template */}
                    {showSaveTemplate ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTemplate()}
                          placeholder="Template name"
                          aria-label="Template name"
                          autoFocus
                          className={`w-full px-3 py-2.5 border rounded-xl ${darkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveTemplate}
                            className={`flex-1 px-4 py-2.5 rounded-xl ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white font-medium transition-all`}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowSaveTemplate(false);
                              setNewTemplateName('');
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-xl ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'} font-medium transition-all`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSaveTemplate(true)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white' : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700'} font-medium transition-all`}
                      >
                        + Save Current Settings as Template
                      </button>
                    )}

                    <p className={`text-xs mt-3 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Templates save team names, point systems, places, and event lineup
                    </p>
                  </CollapsibleSection>
                  {/* Manage Teams Section */}
                  <CollapsibleSection
                    id="manage-teams"
                    title="Manage Teams"
                    description={`${teams.length} team${teams.length !== 1 ? 's' : ''} configured`}
                    isCollapsed={collapsedSections['manage-teams']}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="green"
                  >
                    <div className="flex flex-col gap-2 mb-3">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                        placeholder="Team name"
                        aria-label="Team name"
                        className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                      />
                      <button
                        onClick={addTeam}
                        className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 ${darkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium`}
                      >
                        <Plus className="w-4 h-4" /> Add Team
                      </button>
                    </div>
                    {teams.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {teams.map(team => (
                          <div key={team.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-600 text-white' : 'bg-white border border-gray-200'}`}>
                            {settingsEditingTeamId === team.id ? (
                              <input
                                type="text"
                                value={settingsEditingTeamName}
                                onChange={(e) => setSettingsEditingTeamName(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onBlur={() => saveTeamNameInSettings(team.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTeamNameInSettings(team.id);
                                  if (e.key === 'Escape') cancelEditingTeamInSettings();
                                }}
                                autoFocus
                                aria-label="Edit team name"
                                className={`text-sm px-2 py-1 border rounded min-w-[80px] ${darkMode ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                              />
                            ) : (
                              <span
                                onClick={() => startEditingTeamInSettings(team)}
                                className="text-sm cursor-pointer hover:underline"
                              >
                                {team.name}
                              </span>
                            )}
                            <button
                              onClick={() => removeTeam(team.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* Special Scoring Rules Section */}
                  <CollapsibleSection
                    id="special-scoring"
                    title="Special Scoring Rules"
                    description={(() => {
                      const activeRules = [];
                      if (teamPlaceLimitEnabled) activeRules.push('Team Place Limit');
                      if (heatLockEnabled) activeRules.push('Heat Lock');
                      if (aRelayOnly) activeRules.push('A-Relay Only');
                      return activeRules.length > 0 ? `Active: ${activeRules.join(', ')}` : "Heat lock, relay, and place limit options";
                    })()}
                    isCollapsed={collapsedSections['special-scoring']}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="amber"
                  >
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-amber-50'}`}>
                        <input
                          type="checkbox"
                          checked={teamPlaceLimitEnabled}
                          onChange={(e) => { setActiveTemplate(null); setTeamPlaceLimitEnabled(e.target.checked); }}
                          className="w-5 h-5 rounded accent-amber-500 flex-shrink-0"
                        />
                        <div>
                          <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Team Place Limit (relays)</span>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            A team cannot occupy all scoring places in any relay event (e.g., max 2 of 3 relay places)
                          </p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-amber-50'}`}>
                        <input
                          type="checkbox"
                          checked={heatLockEnabled}
                          onChange={(e) => { setActiveTemplate(null); setHeatLockEnabled(e.target.checked); }}
                          className="w-5 h-5 rounded accent-amber-500 flex-shrink-0"
                        />
                        <div>
                          <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Heat Lock (B Finals/A Finals)</span>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            B Finals swimmers locked to places 9-16; A Finals compete for 1-8
                          </p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-amber-50'}`}>
                        <input
                          type="checkbox"
                          checked={aRelayOnly}
                          onChange={(e) => { setActiveTemplate(null); setARelayOnly(e.target.checked); }}
                          className="w-5 h-5 rounded accent-amber-500 flex-shrink-0"
                        />
                        <div>
                          <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>A-Relay Only Scoring</span>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Only A-relays score; B-relays are exhibition (non-scoring)
                          </p>
                        </div>
                      </label>
                    </div>
                    {(teamPlaceLimitEnabled || heatLockEnabled || aRelayOnly) && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${darkMode ? 'bg-amber-900/30 border border-amber-700/50 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                        <strong>Active:</strong> {[
                          teamPlaceLimitEnabled && 'Team Place Limit',
                          heatLockEnabled && 'Heat Lock',
                          aRelayOnly && 'A-Relay Only'
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* Number of Scoring Places Section */}
                  <CollapsibleSection
                    id="scoring-places"
                    title="Number of Scoring Places"
                    description={`Diving: ${numDivingPlaces}, Individual: ${numIndividualPlaces}, Relay: ${numRelayPlaces}`}
                    isCollapsed={collapsedSections['scoring-places']}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="blue"
                  >
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label htmlFor="diving-places-input" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Diving Events</label>
                        <NumberInput
                          value={numDivingPlaces}
                          onChange={handleManualSettingChange(setNumDivingPlaces)}
                          min={1}
                          max={20}
                          darkMode={darkMode}
                          label="diving places"
                          id="diving-places-input"
                        />
                      </div>

                      <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label htmlFor="individual-places-input" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Individual Events</label>
                        <NumberInput
                          value={numIndividualPlaces}
                          onChange={handleManualSettingChange(setNumIndividualPlaces)}
                          min={1}
                          max={20}
                          darkMode={darkMode}
                          label="individual places"
                          id="individual-places-input"
                        />
                      </div>

                      <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label htmlFor="relay-places-input" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Relay Events</label>
                        <NumberInput
                          value={numRelayPlaces}
                          onChange={handleManualSettingChange(setNumRelayPlaces)}
                          min={1}
                          max={20}
                          darkMode={darkMode}
                          label="relay places"
                          id="relay-places-input"
                        />
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Data Management Section */}
                  <CollapsibleSection
                    id="data-management"
                    title="Data Management"
                    description="Clear scores and reset data"
                    isCollapsed={collapsedSections['data-management']}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="red"
                  >
                    <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Your data will persist when you refresh the page until you clear it.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={clearAllDataKeepTemplates}
                        className={`w-full px-4 py-3 rounded-xl font-medium transition text-left ${darkMode ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                      >
                        Clear Scores Only
                      </button>
                      <button
                        onClick={clearAllDataAndTemplates}
                        className={`w-full px-4 py-3 rounded-xl font-medium transition text-left ${darkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                      >
                        Clear All Data & Templates
                      </button>
                    </div>
                  </CollapsibleSection>

                  {/* Point Systems Section */}
                  <CollapsibleSection
                    id="point-systems"
                    title="Point Systems"
                    description="Configure points for each place"
                    isCollapsed={collapsedSections['point-systems']}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="cyan"
                  >
                    <div className="space-y-6">
                      <div>
                        <h5 className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Diving Points</h5>
                        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {getPlacesArray({ name: 'Diving' }).map(place => (
                            <PointInput
                              key={place}
                              place={place}
                              value={divingPointSystem[place] ?? 0}
                              onChange={(value) => {
                                setActiveTemplate(null);
                                const newPoints = { ...divingPointSystem, [place]: value };
                                setDivingPointSystem(newPoints);
                              }}
                              onBlur={() => recalculateAllScores(teams, events)}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Individual Events Points</h5>
                        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {getPlacesArray({ name: 'Swimming' }).map(place => (
                            <PointInput
                              key={place}
                              place={place}
                              value={individualPointSystem[place] ?? 0}
                              onChange={(value) => {
                                setActiveTemplate(null);
                                const newPoints = { ...individualPointSystem, [place]: value };
                                setIndividualPointSystem(newPoints);
                              }}
                              onBlur={() => recalculateAllScores(teams, events)}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Relay Events Points</h5>
                        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {getPlacesArray({ name: 'Relay' }).map(place => (
                            <PointInput
                              key={place}
                              place={place}
                              value={relayPointSystem[place] ?? 0}
                              onChange={(value) => {
                                setActiveTemplate(null);
                                const newPoints = { ...relayPointSystem, [place]: value };
                                setRelayPointSystem(newPoints);
                              }}
                              onBlur={() => recalculateAllScores(teams, events)}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Appearance Section */}
                  <CollapsibleSection
                    id="appearance"
                    title="Appearance"
                    description={darkMode ? "Dark mode enabled" : "Light mode enabled"}
                    isCollapsed={collapsedSections.appearance}
                    onToggle={toggleSection}
                    darkMode={darkMode}
                    accentColor="slate"
                  >
                    <label className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}>
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                        className="w-5 h-5 rounded accent-cyan-500"
                      />
                      <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>Dark Mode</span>
                    </label>
                  </CollapsibleSection>
                  </div>

                  {/* Settings Footer */}
                  <div className={`px-4 sm:px-6 py-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <button
                      onClick={() => { setShowSettings(false); cancelEditingTeamInSettings(); }}
                      className={`w-full py-3 rounded-lg font-semibold text-white transition ${darkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      Close Settings
                    </button>
                  </div>
                </div>
              )}

              <div className={`rounded-2xl p-6 mb-6 relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-pool-mid to-pool-light border border-chlorine/20' : 'bg-gradient-to-br from-cyan-500 to-blue-600'}`}>
                {/* Lane lines decoration */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 42px)'
                }} />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-chlorine' : 'text-white'}`}>Scoreboard</h2>
                    <button
                      onClick={shareScores}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${darkMode ? 'bg-chlorine/20 text-chlorine hover:bg-chlorine/30 border border-chlorine/30' : 'bg-white/20 text-white hover:bg-white/30'}`}
                      title="Share scores"
                    >
                      <Share className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setScoringMode('combined'); trackEvent('change_scoring_mode', { mode: 'combined' }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        scoringMode === 'combined'
                          ? (darkMode ? 'bg-chlorine text-pool-deep' : 'bg-white text-cyan-600')
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Combined
                    </button>
                    <button
                      onClick={() => { setScoringMode('girls'); trackEvent('change_scoring_mode', { mode: 'girls' }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        scoringMode === 'girls'
                          ? 'bg-pink-500 text-white'
                          : 'bg-pink-400/30 text-white hover:bg-pink-400/50'
                      }`}
                    >
                      Girls Only
                    </button>
                    <button
                      onClick={() => { setScoringMode('boys'); trackEvent('change_scoring_mode', { mode: 'boys' }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        scoringMode === 'boys'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-400/30 text-white hover:bg-blue-400/50'
                      }`}
                    >
                      Boys Only
                    </button>
                  </div>
                </div>
                <div className="relative grid gap-2">
                  {sortedTeams.length === 0 ? (
                    <div className={`rounded-xl p-4 text-center ${darkMode ? 'bg-pool-deep/50 text-slate-400 border border-white/10' : 'bg-white/90 text-slate-500'}`}>
                      No teams added yet. Add teams in Settings.
                    </div>
                  ) : (
                    sortedTeams.map((team, index) => (
                    <div key={team.id} className={`rounded-xl p-2 sm:p-3 transition-all ${
                      index === 0 
                        ? (darkMode ? 'bg-gradient-to-r from-lane-gold/20 to-transparent border-l-4 border-lane-gold' : 'bg-gradient-to-r from-amber-50 to-white border-l-4 border-amber-400')
                        : (darkMode ? 'bg-pool-deep/50 border border-white/5' : 'bg-white/90')
                    }`}>
                      <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-shrink">
                          <span className={`text-base sm:text-2xl font-bold flex-shrink-0 ${
                            index === 0
                              ? (darkMode ? 'text-lane-gold' : 'text-amber-500')
                              : (darkMode ? 'text-slate-500' : 'text-slate-400')
                          }`}>#{index + 1}</span>
                          {editingTeamId === team.id ? (
                            <input
                              type="text"
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              onFocus={(e) => e.target.select()}
                              onBlur={() => saveTeamName(team.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTeamName(team.id);
                                if (e.key === 'Escape') cancelEditingTeam();
                              }}
                              autoFocus
                              aria-label="Edit team name"
                              className={`text-sm sm:text-xl font-semibold px-2 py-1 border rounded min-w-0 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                          ) : (
                            <span
                              onClick={() => startEditingTeam(team)}
                              className={`text-sm sm:text-xl font-semibold cursor-pointer hover:underline truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}
                            >
                              {team.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
                          {scoringMode === 'combined' && (
                            <>
                              <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div className="text-center">
                                  <div className={`font-medium hidden sm:block ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>Girls</div>
                                  <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>{team.girlsScore}</div>
                                </div>
                                <div className="text-center">
                                  <div className={`font-medium hidden sm:block ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Boys</div>
                                  <div className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{team.boysScore}</div>
                                </div>
                              </div>
                              <div className={`w-px h-6 sm:h-8 ${darkMode ? 'bg-white/20' : 'bg-gray-300'}`}></div>
                            </>
                          )}
                          <span className={`text-lg sm:text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                            {scoringMode === 'girls' ? team.girlsScore : scoringMode === 'boys' ? team.boysScore : team.score}
                          </span>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-chlorine' : 'text-slate-800'}`}>Events</h3>
                      <button
                        onClick={emailResults}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${darkMode ? 'bg-chlorine/20 text-chlorine hover:bg-chlorine/30 border border-chlorine/30' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                        title="Email full results"
                      >
                        <Mail className="w-4 h-4" />
                        Email Results
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {/* Entry Mode Toggle Switch */}
                      <button
                        onClick={() => { setTeamFirstMode(!teamFirstMode); triggerHaptic('light'); trackEvent('toggle_entry_mode', { mode: !teamFirstMode ? 'team-mode' : 'place-mode' }); }}
                        className={`flex items-center gap-2 px-1 py-1 rounded-full text-xs font-medium transition cursor-pointer ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-200 border border-gray-300'}`}
                        title={teamFirstMode ? "Switch to Place Mode" : "Switch to Team Mode"}
                      >
                        <span className={`px-2.5 py-1 rounded-full transition-all ${!teamFirstMode ? (darkMode ? 'bg-chlorine text-pool-deep font-semibold' : 'bg-cyan-600 text-white font-semibold') : ''}`}>Place Mode</span>
                        <span className={`px-2.5 py-1 rounded-full transition-all ${teamFirstMode ? (darkMode ? 'bg-lane-gold text-pool-deep font-semibold' : 'bg-amber-500 text-white font-semibold') : ''}`}>Team Mode</span>
                      </button>
                      {events.length > 0 && (
                        <button
                          onClick={toggleAllEvents}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'}`}
                          title={events.some(e => !collapsedEvents[e.id]) ? "Collapse all events" : "Expand all events"}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${events.some(e => !collapsedEvents[e.id]) ? '' : 'rotate-180'}`} />
                          {events.some(e => !collapsedEvents[e.id]) ? 'Collapse All' : 'Expand All'}
                        </button>
                      )}
                    </div>
                  </div>
                  {teamFirstMode && (
                    <div className={`text-xs px-3 py-1.5 rounded-full ${darkMode ? 'bg-lane-gold/20 text-lane-gold border border-lane-gold/30' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                      ⚡ Tap place numbers to assign to each team
                    </div>
                  )}
                </div>
                {scoringMode === 'combined' ? (
                  <div className={`space-y-2`}>
                    {events.map((event, index) => {
                      const isDiving = event.name === 'Diving';
                      const isRelay = event.name.includes('Relay');
                      const pointSystem = isDiving ? divingPointSystem : isRelay ? relayPointSystem : individualPointSystem;
                      const numPlaces = isDiving ? numDivingPlaces : isRelay ? numRelayPlaces : numIndividualPlaces;
                      
                      // Team Mode - compact cards
                      if (teamFirstMode) {
                        return (
                          <QuickEntryEventCard
                            key={event.id}
                            event={event}
                            teams={teams}
                            darkMode={darkMode}
                            numPlaces={numPlaces}
                            pointSystem={pointSystem}
                            onUpdate={updateEventResult}
                            onBulkUpdate={bulkUpdateEventResults}
                            onMoveUp={() => moveEventUp(index)}
                            onMoveDown={() => moveEventDown(index)}
                            onRemove={() => removeEvent(event.id)}
                            canMoveUp={index > 0}
                            canMoveDown={index < events.length - 1}
                            heatLockEnabled={heatLockEnabled}
                            aRelayOnly={aRelayOnly}
                            teamPlaceLimitEnabled={teamPlaceLimitEnabled}
                            isCollapsed={collapsedEvents[event.id]}
                            onToggle={() => toggleEvent(event.id)}
                          />
                        );
                      }

                      // Place Mode - dropdowns (collapsible)
                      const isEventCollapsed = collapsedEvents[event.id];
                      return (
                        <div key={event.id} className={`rounded-xl ${darkMode ? 'bg-pool-mid/80 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'} relative`} style={{ zIndex: events.length - index }}>
                          <button
                            type="button"
                            onClick={() => toggleEvent(event.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer transition rounded-xl ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                            aria-expanded={!isEventCollapsed}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                <span className={event.gender === 'girls' ? (darkMode ? 'text-pink-400' : 'text-pink-600') : (darkMode ? 'text-blue-400' : 'text-blue-600')}>
                                  {event.gender === 'girls' ? 'G' : 'B'}
                                </span>
                                {' '}
                                <span className={isDiving ? (darkMode ? 'text-orange-400' : 'text-orange-600') : ''}>
                                  {event.name}
                                </span>
                              </h5>
                              {heatLockEnabled && !isRelay && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${darkMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                  🔒 A/B Finals
                                </span>
                              )}
                              {aRelayOnly && isRelay && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${darkMode ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-teal-100 text-teal-700 border border-teal-200'}`}>
                                  🅰️ A-Relay Only
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-5 h-5 transition-transform ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${!isEventCollapsed ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {!isEventCollapsed && (
                            <div className="px-3 pb-3">
                              <div className="flex items-center justify-end gap-1 mb-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveEventUp(index); }}
                                  disabled={index === 0}
                                  className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveEventDown(index); }}
                                  disabled={index === events.length - 1}
                                  className={`p-1 rounded ${index === events.length - 1 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                                  className={`p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                                {(() => {
                                  const consumedPlaces = getConsumedPlaces(event);
                                  return getPlacesArray(event).map(place => (
                                    <PlaceSelector
                                      key={place}
                                      event={event}
                                      place={place}
                                      teams={teams}
                                      darkMode={darkMode}
                                      pointSystem={pointSystem}
                                      numPlaces={numPlaces}
                                      onUpdate={updateEventResult}
                                      consumedByTie={consumedPlaces.has(place)}
                                      heatLockEnabled={heatLockEnabled}
                                    />
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${scoringMode === 'girls' ? (darkMode ? 'text-pink-400' : 'text-pink-600') : (darkMode ? 'text-blue-400' : 'text-blue-600')}`}>
                      {scoringMode === 'girls' ? 'Girls Events' : 'Boys Events'}
                    </h4>
                    <div className={`space-y-2`}>
                      {events.filter(e => e.gender === scoringMode).map((event, _index) => {
                        const isDiving = event.name === 'Diving';
                        const isRelay = event.name.includes('Relay');
                        const actualIndex = events.findIndex(e => e.id === event.id);
                        const pointSystem = isDiving ? divingPointSystem : isRelay ? relayPointSystem : individualPointSystem;
                        const numPlaces = isDiving ? numDivingPlaces : isRelay ? numRelayPlaces : numIndividualPlaces;
                        
                        // Team Mode - compact cards
                        if (teamFirstMode) {
                          return (
                            <QuickEntryEventCard
                              key={event.id}
                              event={event}
                              teams={teams}
                              darkMode={darkMode}
                              numPlaces={numPlaces}
                              pointSystem={pointSystem}
                              onUpdate={updateEventResult}
                              onMoveUp={() => moveEventUp(actualIndex)}
                              onMoveDown={() => moveEventDown(actualIndex)}
                              onRemove={() => removeEvent(event.id)}
                              canMoveUp={actualIndex > 0}
                              canMoveDown={actualIndex < events.length - 1}
                              heatLockEnabled={heatLockEnabled}
                              aRelayOnly={aRelayOnly}
                              teamPlaceLimitEnabled={teamPlaceLimitEnabled}
                              isCollapsed={collapsedEvents[event.id]}
                              onToggle={() => toggleEvent(event.id)}
                            />
                          );
                        }
                        
                        // Place Mode - dropdowns (collapsible)
                        const isEventCollapsed = collapsedEvents[event.id];
                        return (
                          <div key={event.id} className={`rounded-xl ${darkMode ? 'bg-pool-mid/80 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'} relative`} style={{ zIndex: events.length - _index }}>
                            <button
                              type="button"
                              onClick={() => toggleEvent(event.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer transition rounded-xl ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                              aria-expanded={!isEventCollapsed}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className={`font-semibold text-base ${isDiving ? (darkMode ? 'text-orange-400' : 'text-orange-600') : (darkMode ? 'text-white' : 'text-slate-800')}`}>{event.name}</h5>
                                {heatLockEnabled && !isRelay && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${darkMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                    🔒 A/B Finals
                                  </span>
                                )}
                                {aRelayOnly && isRelay && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${darkMode ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-teal-100 text-teal-700 border border-teal-200'}`}>
                                    🅰️ A-Relay Only
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-5 h-5 transition-transform ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${!isEventCollapsed ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {!isEventCollapsed && (
                              <div className="px-3 pb-3">
                                <div className="flex items-center justify-end gap-1 mb-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveEventUp(actualIndex); }}
                                    disabled={actualIndex === 0}
                                    className={`p-1 rounded ${actualIndex === 0 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveEventDown(actualIndex); }}
                                    disabled={actualIndex === events.length - 1}
                                    className={`p-1 rounded ${actualIndex === events.length - 1 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                                    className={`p-1 rounded ${darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                                  {(() => {
                                    const consumedPlaces = getConsumedPlaces(event);
                                    return getPlacesArray(event).map(place => (
                                      <PlaceSelector
                                        key={place}
                                        event={event}
                                        place={place}
                                        teams={teams}
                                        darkMode={darkMode}
                                        pointSystem={pointSystem}
                                        numPlaces={numPlaces}
                                        onUpdate={updateEventResult}
                                        consumedByTie={consumedPlaces.has(place)}
                                        heatLockEnabled={heatLockEnabled}
                                      />
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={`rounded-lg p-4 mt-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add New Event</h4>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                      placeholder={newEventType === 'diving' ? 'Diving (name auto-filled)' : newEventType === 'relay' ? 'e.g., 200 Medley' : 'e.g., 100 Backstroke'}
                      disabled={newEventType === 'diving'}
                      aria-label="Event name"
                      className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300'} ${newEventType === 'diving' ? 'opacity-50' : ''}`}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={newEventType}
                        onChange={(e) => {
                          setNewEventType(e.target.value);
                          if (e.target.value === 'diving') setNewEventName('Diving');
                          else if (newEventName === 'Diving') setNewEventName('');
                        }}
                        aria-label="Event type"
                        className={`flex-1 sm:flex-none px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="individual">Individual</option>
                        <option value="relay">Relay</option>
                        <option value="diving">Diving</option>
                      </select>
                      <select
                        value={newEventGender}
                        onChange={(e) => setNewEventGender(e.target.value)}
                        aria-label="Event gender"
                        className={`flex-1 sm:flex-none px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="girls">Girls</option>
                        <option value="boys">Boys</option>
                      </select>
                      <button
                        onClick={addEvent}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white ${darkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {newEventType === 'diving' && 'Diving events use their own point system'}
                    {newEventType === 'relay' && '"Relay" will be automatically added to the event name'}
                    {newEventType === 'individual' && 'Individual swimming events'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="max-w-4xl mx-auto px-4">
              {/* Contact Section */}
              <div className="mb-6">
                <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Contact Us</h4>
                <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>General Inquiries: </span>
                    <a href="mailto:info@swimmeetscore.com" className="text-cyan-600 hover:text-cyan-700 hover:underline">
                      info@swimmeetscore.com
                    </a>
                  </div>
                  <div>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Support: </span>
                    <a href="mailto:support@swimmeetscore.com" className="text-cyan-600 hover:text-cyan-700 hover:underline">
                      support@swimmeetscore.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Donate Button */}
              <div className={`mt-6 p-6 rounded-xl text-center ${darkMode ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'}`}>
                <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  ☕ Enjoying Swim Meet Score?
                </p>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  SwimMeetScore is free and ad-free. If it saved you time today, consider a coffee!
                </p>
                <a 
                  href="https://buymeacoffee.com/kadenco" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('click_donate')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg rounded-xl transition shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 19h16v2H4v-2zm16-12h-2V5H6v2H4V5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2zm-2 2H6c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-1h1c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-1zm1 4h-1v-2h1v2zm-3 3H6v-5h12v5z"/>
                  </svg>
                  Buy Me a Coffee
                </a>
              </div>

              {/* Copyright */}
              <div className={`mt-6 pt-4 border-t text-center text-sm ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                Copyright © 2026 Kaden Co - All rights reserved.
              </div>

              {/* Legal Disclaimer */}
              <div className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-center max-w-2xl mx-auto`}>
                <p className="mb-2">
                  <strong>Terms of Use:</strong> This application is provided "as is" without warranties. Users are responsible for the accuracy of data entered. 
                  Swim Meet Score is not liable for any scoring errors or data loss.
                </p>
                <p>
                  <strong>Privacy & Data:</strong> Your meet data is stored locally in your browser using localStorage and is never transmitted to our servers. 
                  We use Google Analytics to collect anonymous usage statistics (pages visited, features used) to improve the app. 
                  No personal information is required to use this application. By using SwimMeetScore, you consent to this data collection.
                </p>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<SwimMeetScore />);
    
    // Hide loading screen after render
    hideLoadingScreen();
