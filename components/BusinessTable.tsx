
import React from 'react';
import { Business } from '../types';

interface BusinessTableProps {
  businesses: Business[];
}

const BusinessTable: React.FC<BusinessTableProps> = ({ businesses }) => {
  const exportToCSV = () => {
    const headers = ["Nazwa", "Strona WWW", "Telefon", "Email", "Adres", "Potencjał", "Ocena", "Ilość opinii", "Link Google Maps"];
    const rows = businesses.map(b => [
      b.name,
      b.website || '',
      b.phone || '',
      b.email || '',
      b.address || '',
      b.status || 'Nieznany',
      b.rating?.toString() || '0',
      b.reviewsCount?.toString() || '0',
      b.mapsUri || ''
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `baza_firm_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (businesses.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Wyniki Wyszukiwania</h3>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Znaleziono {businesses.length} rekordów spełniających kryteria</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-lg shadow-emerald-200 font-black text-sm uppercase tracking-widest"
        >
          <i className="fas fa-file-export text-lg"></i>
          Eksportuj do CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-100/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-200">
              <th className="px-6 py-5 font-black">Firma</th>
              <th className="px-6 py-5 font-black">Witryna WWW</th>
              <th className="px-6 py-5 font-black">Potencjał</th>
              <th className="px-6 py-5 font-black">Kontakt</th>
              <th className="px-6 py-5 font-black">Opinie Google</th>
              <th className="px-6 py-5 font-black">Adres</th>
              <th className="px-6 py-5 font-black text-center">Mapy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {businesses.map((business) => (
              <tr key={business.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-6 py-5">
                  <div className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {business.name}
                  </div>
                </td>
                <td className="px-6 py-5">
                  {business.website ? (
                    <a 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all group/btn"
                    >
                      <i className="fas fa-external-link-alt text-[10px] group-hover/btn:scale-110 transition-transform"></i>
                      <span className="max-w-[150px] truncate">{business.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      <i className="fas fa-search"></i>
                      Sprawdź ręcznie
                    </span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    business.status?.toLowerCase().includes('low') 
                    ? 'bg-red-50 text-red-500' 
                    : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {business.status || 'High Potential'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-1">
                    {business.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                        <i className="fas fa-phone-alt text-emerald-400 text-[10px]"></i>
                        {business.phone}
                      </div>
                    )}
                    {business.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium italic">
                        <i className="fas fa-envelope text-slate-300"></i>
                        {business.email}
                      </div>
                    )}
                    {!business.phone && !business.email && (
                      <span className="text-slate-300 text-[10px] font-medium uppercase italic">Brak danych</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400 text-[10px]">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`${i < Math.floor(business.rating || 0) ? 'fas' : 'far'} fa-star`}></i>
                        ))}
                      </div>
                      <span className="text-sm font-black text-slate-700">{business.rating || '0.0'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {business.reviewsCount || 0} opinii
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-start gap-2 text-xs text-slate-500 max-w-[200px] leading-relaxed">
                    <i className="fas fa-map-marker-alt text-slate-300 mt-0.5"></i>
                    {business.address || "Nie podano"}
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  {business.mapsUri ? (
                    <a 
                      href={business.mapsUri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all transform hover:scale-110 shadow-md"
                      title="Zobacz w Mapach"
                    >
                      <i className="fas fa-map-location-dot"></i>
                    </a>
                  ) : (
                    <div className="w-10 h-10 border-2 border-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-200">
                      <i className="fas fa-minus"></i>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Optymalizacja LEAD-Quality: Aktywna
          </span>
        </div>
        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          AgroFinder AI v3.0 | Multi-Region
        </div>
      </div>
    </div>
  );
};

export default BusinessTable;
