import React from 'react';

const Bookings = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline-sm text-headline-sm text-text-primary">Bookings</h2>
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
          <input className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface border border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-body-md shadow-sm" placeholder="Search bookings..." type="text"/>
        </div>
      </div>
      
      <div className="bg-surface rounded-xl border border-border-default shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-border-default">
              <tr>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[15%]">Movie Name <span className="material-symbols-outlined text-[12px] align-middle ml-1 cursor-pointer">arrow_drop_down</span></th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[15%]">Customer</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[12%]">Theatre Name</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[10%]">Screen</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[8%]">Seat</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[15%]">Show Date/Time</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[8%] text-center">Type</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[8%] text-right">Amount</th>
                <th className="py-3 px-4 font-label-md text-[13px] font-bold text-text-secondary uppercase w-[9%] text-center">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default font-body-md text-[13px]">
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary truncate">The Real Goat</td>
                <td className="py-3 px-4 text-text-secondary truncate">John Doe</td>
                <td className="py-3 px-4 text-text-secondary truncate">Cineworld Imax</td>
                <td className="py-3 px-4 text-text-secondary">Screen 6</td>
                <td className="py-3 px-4 text-text-secondary">L6, L7</td>
                <td className="py-3 px-4 text-text-secondary">
                  <div>24/4/2024</div>
                  <div className="text-text-muted text-[11px]">9:00 AM</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="material-symbols-outlined text-primary text-[18px]" title="Online">language</span>
                </td>
                <td className="py-3 px-4 text-right font-medium">$234</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-[20px] bg-success-bg text-success font-label-sm text-[10px] uppercase tracking-wide font-semibold">Paid</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary truncate">The Real Goat</td>
                <td className="py-3 px-4 text-text-secondary truncate">Jane Smith</td>
                <td className="py-3 px-4 text-text-secondary truncate">Cineworld Imax</td>
                <td className="py-3 px-4 text-text-secondary">Screen 6</td>
                <td className="py-3 px-4 text-text-secondary">M12, M13</td>
                <td className="py-3 px-4 text-text-secondary">
                  <div>24/4/2024</div>
                  <div className="text-text-muted text-[11px]">9:00 AM</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="material-symbols-outlined text-text-muted text-[18px]" title="Offline">storefront</span>
                </td>
                <td className="py-3 px-4 text-right font-medium">$234</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-[20px] bg-warning-bg text-warning font-label-sm text-[10px] uppercase tracking-wide font-semibold">Pending</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary truncate">The Real Goat</td>
                <td className="py-3 px-4 text-text-secondary truncate">Alice Johnson</td>
                <td className="py-3 px-4 text-text-secondary truncate">Cineworld Imax</td>
                <td className="py-3 px-4 text-text-secondary">Screen 6</td>
                <td className="py-3 px-4 text-text-secondary">A1, A2, A3</td>
                <td className="py-3 px-4 text-text-secondary">
                  <div>24/4/2024</div>
                  <div className="text-text-muted text-[11px]">11:30 AM</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="material-symbols-outlined text-primary text-[18px]" title="Online">language</span>
                </td>
                <td className="py-3 px-4 text-right font-medium">$351</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-[20px] bg-danger-bg text-danger font-label-sm text-[10px] uppercase tracking-wide font-semibold">Failed</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary truncate">The Real Goat</td>
                <td className="py-3 px-4 text-text-secondary truncate">Bob Williams</td>
                <td className="py-3 px-4 text-text-secondary truncate">Cineworld Imax</td>
                <td className="py-3 px-4 text-text-secondary">Screen 6</td>
                <td className="py-3 px-4 text-text-secondary">K5</td>
                <td className="py-3 px-4 text-text-secondary">
                  <div>24/4/2024</div>
                  <div className="text-text-muted text-[11px]">11:30 AM</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="material-symbols-outlined text-primary text-[18px]" title="Online">language</span>
                </td>
                <td className="py-3 px-4 text-right font-medium">$117</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-[20px] bg-success-bg text-success font-label-sm text-[10px] uppercase tracking-wide font-semibold">Paid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border-default flex items-center justify-between bg-surface">
          <div className="font-body-md text-sm text-text-secondary">Showing 1 to 6 of 48 entries</div>
          <div className="flex items-center space-x-1">
            <button className="px-3 py-1.5 border border-border-default rounded-md text-text-secondary hover:bg-surface-container-low disabled:opacity-50 text-sm font-medium transition-colors" disabled>Previous</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-on-primary font-medium text-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-surface-container-low font-medium text-sm transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-surface-container-low font-medium text-sm transition-colors">3</button>
            <span className="px-2 text-text-muted">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-surface-container-low font-medium text-sm transition-colors">8</button>
            <button className="px-3 py-1.5 border border-border-default rounded-md text-text-secondary hover:bg-surface-container-low text-sm font-medium transition-colors">Next</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Bookings;
