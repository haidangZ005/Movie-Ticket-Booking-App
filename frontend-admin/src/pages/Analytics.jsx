import React from 'react';

const Analytics = () => {
  return (
    <>
      <div className="mb-6">
        <h2 className="font-headline-sm text-headline-sm text-text-primary">Analytics</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today Ticket Sold */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between h-48">
          <div>
            <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-1">Today Ticket Sold</h3>
            <div className="flex items-baseline space-x-2">
              <span className="font-display-md text-display-md text-text-primary">12,345</span>
              <span className="font-label-sm text-label-sm text-success bg-success-bg px-2 py-0.5 rounded-full flex items-center">
                <span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span> 5.4%
              </span>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted mt-1">than last day</p>
          </div>
          <div className="w-full h-16 mt-4 relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0 30 L0 20 Q10 15 20 25 T40 10 T60 20 T80 5 T100 15 L100 30 Z" fill="url(#blueGradient)" opacity="0.2"></path>
              <path d="M0 20 Q10 15 20 25 T40 10 T60 20 T80 5 T100 15" fill="none" stroke="#2346d5" strokeLinecap="round" strokeWidth="2"></path>
              <defs>
                <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2346d5"></stop>
                  <stop offset="100%" stopColor="#111827" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Total Ticket (Donut) */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center h-48">
          <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-4 self-start w-full">Total Ticket</h3>
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="w-full h-full rounded-full" style={{background: 'conic-gradient(#F87171 0% 30%, #253044 30% 100%)'}}></div>
            <div className="absolute inset-0 m-auto w-16 h-16 bg-surface rounded-full flex items-center justify-center flex-col">
              <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
              <span className="font-label-sm text-label-sm font-bold">565</span>
            </div>
          </div>
          <div className="flex space-x-4 mt-4 w-full justify-center">
            <div className="flex items-center text-label-sm font-label-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-danger mr-1.5"></span> Sold <span className="ml-1 text-text-primary font-semibold">4.5k</span>
            </div>
            <div className="flex items-center text-label-sm font-label-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-border-default mr-1.5"></span> Unsold <span className="ml-1 text-text-primary font-semibold">4.5k</span>
            </div>
          </div>
        </div>

        {/* Sales by Movie (Bar) */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-[0_1px_3px_rgba(0,0,0,0.06)] h-48 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider">Sales by Movie</h3>
            <div className="text-right">
              <span className="font-label-md text-label-md text-text-primary font-semibold block">220,542.76</span>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between px-2 space-x-2">
            <div className="flex flex-col items-center w-full group">
              <div className="w-full bg-danger rounded-t-[4px] transition-all h-[60%] group-hover:opacity-80"></div>
              <span className="text-[10px] text-text-muted mt-2">Movie 1</span>
            </div>
            <div className="flex flex-col items-center w-full group">
              <div className="w-full bg-primary rounded-t-[4px] transition-all h-[80%] group-hover:opacity-80"></div>
              <span className="text-[10px] text-text-muted mt-2">Movie 2</span>
            </div>
            <div className="flex flex-col items-center w-full group">
              <div className="w-full bg-purple rounded-t-[4px] transition-all h-[40%] group-hover:opacity-80"></div>
              <span className="text-[10px] text-text-muted mt-2">Movie 3</span>
            </div>
            <div className="flex flex-col items-center w-full group">
              <div className="w-full bg-warning rounded-t-[4px] transition-all h-[90%] group-hover:opacity-80"></div>
              <span className="text-[10px] text-text-muted mt-2">Movie 4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Revenue Chart */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-2">Total Revenue</h3>
              <div className="flex items-baseline space-x-2">
                <span className="font-display-md text-display-md text-primary">$236,535</span>
                <span className="material-symbols-outlined text-text-muted text-sm cursor-help" title="Revenue before taxes">info</span>
                <span className="font-label-sm text-label-sm text-success bg-success-bg px-2 py-0.5 rounded-full flex items-center ml-2">
                  <span className="material-symbols-outlined text-[10px] mr-0.5">arrow_upward</span> 0.8%
                </span>
                <span className="font-label-sm text-label-sm text-text-muted ml-1">Than last Day</span>
              </div>
            </div>
            <select className="border border-border-default rounded-lg text-label-md font-label-md px-3 py-1.5 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Year</option>
              <option>Month</option>
              <option>Week</option>
            </select>
          </div>
          <div className="h-48 flex items-end justify-between px-2 space-x-1 border-b border-border-light pb-2 relative">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-text-muted py-2 -ml-6">
              <span>100K</span>
              <span>50K</span>
              <span>0</span>
            </div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[30%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Jan</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[45%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Feb</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[25%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Mar</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[60%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Apr</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[35%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">May</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[80%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Jun</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[50%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Jul</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[75%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Aug</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[40%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Sep</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[90%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Oct</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[65%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Nov</div></div>
            <div className="w-full bg-danger/20 rounded-t-[4px] h-[85%] relative hover:bg-danger/40 transition-colors"><div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] text-text-muted">Dec</div></div>
          </div>
        </div>

        {/* Top Selling Movies */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-4">Top Selling Movies</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary text-sm">movie</span>
                  <span className="font-label-md text-label-md font-semibold text-text-primary">Avatar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-success text-sm">arrow_drop_up</span>
                  <span className="font-label-sm text-label-sm font-semibold text-text-primary">16500</span>
                </div>
              </div>
              <div className="w-full bg-border-light rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-danger text-sm">movie</span>
                  <span className="font-label-md text-label-md font-semibold text-text-primary">Avatar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-success text-sm">arrow_drop_up</span>
                  <span className="font-label-sm text-label-sm font-semibold text-text-primary">16500</span>
                </div>
              </div>
              <div className="w-full bg-border-light rounded-full h-1.5">
                <div className="bg-danger h-1.5 rounded-full" style={{width: '70%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-warning text-sm">movie</span>
                  <span className="font-label-md text-label-md font-semibold text-text-primary">Avatar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-success text-sm">arrow_drop_up</span>
                  <span className="font-label-sm text-label-sm font-semibold text-text-primary">16500</span>
                </div>
              </div>
              <div className="w-full bg-border-light rounded-full h-1.5">
                <div className="bg-warning h-1.5 rounded-full" style={{width: '55%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-danger text-sm">movie</span>
                  <span className="font-label-md text-label-md font-semibold text-text-primary">Avatar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-success text-sm">arrow_drop_up</span>
                  <span className="font-label-sm text-label-sm font-semibold text-text-primary">16500</span>
                </div>
              </div>
              <div className="w-full bg-border-light rounded-full h-1.5">
                <div className="bg-danger h-1.5 rounded-full" style={{width: '40%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Booking Times Area Chart */}
      <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-4">Peak Booking Times</h3>
        <div className="h-48 w-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4361ee" stopOpacity="0.5"></stop>
                <stop offset="100%" stopColor="#4361ee" stopOpacity="0.0"></stop>
              </linearGradient>
            </defs>
            <line stroke="#253044" strokeWidth="0.5" x1="0" x2="100" y1="10" y2="10"></line>
            <line stroke="#253044" strokeWidth="0.5" x1="0" x2="100" y1="20" y2="20"></line>
            <line stroke="#253044" strokeWidth="0.5" x1="0" x2="100" y1="30" y2="30"></line>
            <line stroke="#253044" strokeWidth="0.5" x1="0" x2="100" y1="40" y2="40"></line>
            <text className="font-body-md text-[2px]" fill="#9CA3AF" fontSize="2" x="-5" y="10">1000</text>
            <text className="font-body-md text-[2px]" fill="#9CA3AF" fontSize="2" x="-5" y="20">800</text>
            <text className="font-body-md text-[2px]" fill="#9CA3AF" fontSize="2" x="-5" y="30">600</text>
            <text className="font-body-md text-[2px]" fill="#9CA3AF" fontSize="2" x="-5" y="40">400</text>
            <path d="M0 40 L0 35 Q5 30 10 32 T20 25 T30 28 T40 15 T50 20 T60 10 T70 25 T80 20 T90 28 T100 20 L100 40 Z" fill="url(#areaGradient)"></path>
            <path d="M0 35 Q5 30 10 32 T20 25 T30 28 T40 15 T50 20 T60 10 T70 25 T80 20 T90 28 T100 20" fill="none" stroke="#4361ee" strokeLinejoin="round" strokeWidth="1"></path>
          </svg>
        </div>
      </div>
    </>
  );
};

export default Analytics;
