import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, Mountain, Globe, Loader2, Building, Layers } from 'lucide-react';
import { VOLCANO_DATABASE } from '../data/volcanoes';
import { regionService } from '../services/regionService';

export default function CitySearchBar({ onSelectLocation = () => {} }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [onlineResults, setOnlineResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // 1. Instant Multi-Level Local Matching: 514 Kab/Kota, 7.093 Kecamatan, & 120+ Gunung Api
  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Cari di dataset wilayah 2012
    const { regencies, kecamatan } = regionService.search(q, {
      maxRegencies: 6,
      maxKecamatan: 4
    });

    const matchedRegencies = regencies.map(r => ({
      ...r,
      type: 'city',
      subType: r.type, // 'kota' | 'kabupaten'
      title: r.name,
      subtitle: `Ibukota: ${r.capital} • ${r.province} • ${r.kecamatanCount} Kec`,
      badgeText: r.type === 'kota' ? 'Kota' : 'Kabupaten'
    }));

    const matchedKecamatan = kecamatan.map(k => {
      const fullKab = regionService.getRegencyByCode(k.kabCode);
      return {
        ...(fullKab || {}),
        id: `kec_${k.kecCode}`,
        name: `Kec. ${k.kecName}, ${k.kabName}`,
        districtName: k.kecName,
        parentKabName: k.kabName,
        type: 'district',
        title: `Kecamatan ${k.kecName}`,
        subtitle: `${k.kabName}, ${k.province} • ${k.desaCount} Desa`,
        badgeText: 'Kecamatan',
        lat: k.lat,
        lon: k.lon
      };
    });

    const matchedVolcanoes = VOLCANO_DATABASE.filter(
      v => v.name.toLowerCase().includes(q) || v.province.toLowerCase().includes(q)
    ).slice(0, 3).map(v => ({
      ...v,
      type: 'volcano',
      title: v.name,
      subtitle: `${v.statusText} • ${v.province}`,
      badgeText: 'Gunung'
    }));

    return [...matchedRegencies, ...matchedKecamatan, ...matchedVolcanoes];
  }, [query]);

  // 2. Dynamic Online Geocoding Fallback jika hasil lokal sedikit dan query >= 3 karakter
  useEffect(() => {
    const q = query.trim();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (q.length < 3 || localResults.length >= 5) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=4&language=id&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Geocoding error');
        const json = await res.json();

        if (json.results && json.results.length > 0) {
          const filtered = json.results
            .filter(r => r.country_code === 'ID' || (r.country && r.country.toLowerCase().includes('indonesia')))
            .map(r => ({
              id: `geo_${r.id}`,
              name: r.name,
              title: r.name,
              province: r.admin1 || r.admin2 || 'Indonesia',
              subtitle: `${r.admin1 || ''} • Geocoding Satelit`,
              island: 'Indonesia',
              lat: r.latitude,
              lon: r.longitude,
              type: 'city',
              badgeText: 'Satelit',
              isOnlineGeocode: true
            }))
            .filter(onlineItem => !localResults.some(loc => loc.title.toLowerCase() === onlineItem.title.toLowerCase()));

          setOnlineResults(filtered);
        } else {
          setOnlineResults([]);
        }
      } catch (err) {
        setOnlineResults([]);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, localResults]);

  // Gabungkan hasil pencarian lokal dan geocoding satelit
  const combinedResults = useMemo(() => {
    return [...localResults, ...onlineResults];
  }, [localResults, onlineResults]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.title);
    setIsOpen(false);
    onSelectLocation(item);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || combinedResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < combinedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : combinedResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < combinedResults.length) {
        handleSelect(combinedResults[activeIndex]);
      } else if (combinedResults.length > 0) {
        handleSelect(combinedResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="aero-search-wrapper" ref={wrapperRef}>
      <div className="aero-search-box">
        {isSearchingOnline ? (
          <Loader2 size={13} className="search-icon spinning" color="#38bdf8" />
        ) : (
          <Search size={14} className="search-icon" />
        )}
        <input
          type="text"
          className="search-input"
          placeholder="Cari 514 kota/kab, 7rb+ kecamatan, gunung api..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setOnlineResults([]);
            }}
            title="Bersihkan pencarian"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && combinedResults.length > 0 && (
        <div className="aero-search-dropdown">
          <div className="search-dropdown-meta">
            <span>Ditemukan {combinedResults.length} hasil di Indonesia</span>
          </div>
          {combinedResults.map((item, idx) => (
            <div
              key={`${item.type}_${item.id}_${idx}`}
              className={`search-dropdown-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <div className="item-icon-box">
                {item.type === 'volcano' ? (
                  <Mountain size={14} color="#f97316" />
                ) : item.type === 'district' ? (
                  <Layers size={14} color="#a855f7" />
                ) : item.subType === 'kota' ? (
                  <Building size={14} color="#38bdf8" />
                ) : item.isOnlineGeocode ? (
                  <Globe size={14} color="#10b981" />
                ) : (
                  <MapPin size={14} color="#38bdf8" />
                )}
              </div>
              <div className="item-text-box">
                <span className="item-title">{item.title}</span>
                <span className="item-subtitle">{item.subtitle}</span>
              </div>
              <span className={`item-badge ${item.isOnlineGeocode ? 'geocode' : item.type}`}>
                {item.badgeText || (item.type === 'volcano' ? 'Gunung' : 'Daerah')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
