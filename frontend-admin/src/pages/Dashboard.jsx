import React from 'react';

const Dashboard = () => {
  return (
    <>
      {/* SVG Gradients Definitions */}
      <svg aria-hidden="true" focusable="false" style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2"></stop>
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0"></stop>
          </linearGradient>
          <linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"></stop>
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.01"></stop>
          </linearGradient>
        </defs>
      </svg>
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Metric 1 */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headline-sm text-headline-sm text-text-primary">Total Bookings</h3>
            <div className="w-10 h-10 rounded-lg bg-danger-bg flex items-center justify-center">
              <span className="material-symbols-outlined text-danger">confirmation_number</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-display-md text-display-md text-primary-container">2345</span>
              <span className="text-success text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +4.5%
              </span>
            </div>
            <div className="w-32 h-16 ml-auto -mb-2">
              <svg className="w-full h-full preserve-aspect-ratio-none" viewBox="0 0 100 30">
                <path className="sparkline-area" d="M0,30 L0,15 Q10,5 20,15 T40,25 T60,15 T80,25 L100,5 L100,30 Z"></path>
                <path className="sparkline-line" d="M0,15 Q10,5 20,15 T40,25 T60,15 T80,25 L100,5"></path>
              </svg>
            </div>
          </div>
        </div>
        {/* Metric 2 */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headline-sm text-headline-sm text-text-primary">Người dùng đăng ký</h3>
            <div className="w-10 h-10 rounded-lg bg-warning-bg flex items-center justify-center">
              <span className="material-symbols-outlined text-warning">group_add</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-display-md text-display-md text-primary-container">2345</span>
              <span className="text-success text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +4.5%
              </span>
            </div>
            <div className="w-32 h-16 ml-auto -mb-2">
              <svg className="w-full h-full preserve-aspect-ratio-none" viewBox="0 0 100 30">
                <path className="sparkline-area" d="M0,30 L0,20 Q15,10 30,20 T60,15 T80,5 L100,20 L100,30 Z"></path>
                <path className="sparkline-line" d="M0,20 Q15,10 30,20 T60,15 T80,5 L100,20"></path>
              </svg>
            </div>
          </div>
        </div>
        {/* Metric 3 */}
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headline-sm text-headline-sm text-text-primary">Today Bookings</h3>
            <div className="w-10 h-10 rounded-lg bg-pink-bg flex items-center justify-center">
              <span className="material-symbols-outlined text-pink">loyalty</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-display-md text-display-md text-primary-container">234</span>
              <span className="text-success text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +4.5%
              </span>
            </div>
            <div className="w-32 h-16 ml-auto flex items-end justify-between gap-1 pb-1">
              <div className="w-4 bg-danger opacity-40 rounded-t-sm h-6"></div>
              <div className="w-4 bg-danger opacity-60 rounded-t-sm h-10"></div>
              <div className="w-4 bg-danger opacity-80 rounded-t-sm h-12"></div>
              <div className="w-4 bg-danger rounded-t-sm h-16"></div>
              <div className="w-4 bg-danger rounded-t-sm h-8"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-sm text-headline-sm text-text-primary">Chi tiết bán vé</h2>
            <div className="flex gap-2">
              <select className="text-sm border border-border-default rounded-md px-2 py-1 text-text-secondary bg-surface focus:ring-0 focus:border-primary-container">
                <option>Tháng 4</option>
              </select>
              <select className="text-sm border border-border-default rounded-md px-2 py-1 text-text-secondary bg-surface focus:ring-0 focus:border-primary-container">
                <option>2021</option>
              </select>
            </div>
          </div>
          <div className="relative mb-4">
            <div className="inline-block border border-border-default rounded-lg p-3 bg-surface shadow-sm relative z-10">
              <p className="text-xs text-text-muted mb-1">Tháng 4 Bookings</p>
              <p className="font-display-md text-display-md text-text-primary leading-none">345,678</p>
            </div>
          </div>
          <div className="h-[200px] w-full relative mt-4">
            <div className="w-full h-full pt-4 relative">
              <svg className="w-full h-full preserve-aspect-ratio-none" viewBox="0 0 400 150">
                <path className="chart-area" d="M0,150 L0,100 Q40,110 80,80 T160,90 T240,60 T320,100 L400,70 L400,150 Z"></path>
                <path className="sparkline-line" d="M0,100 Q40,110 80,80 T160,90 T240,60 T320,100 L400,70"></path>
              </svg>
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-text-muted pt-2 border-t border-border-light border-dashed">
                <div className="text-center"><span>T2</span><br/>10</div>
                <div className="text-center"><span>T3</span><br/>11</div>
                <div className="text-center"><span>T4</span><br/>12</div>
                <div className="text-center"><span>T5</span><br/>13</div>
                <div className="text-center"><span>T6</span><br/>14</div>
                <div className="text-center"><span>T7</span><br/>15</div>
                <div className="text-center"><span>CN</span><br/>16</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-sm text-headline-sm text-text-primary">Tổng doanh thu</h2>
            <select className="text-sm border border-border-default rounded-md px-2 py-1 text-text-secondary bg-surface focus:ring-0 focus:border-primary-container">
              <option>2021</option>
            </select>
          </div>
          <div className="mb-4">
            <p className="font-display-md text-display-md text-primary-container mb-2">23,4567</p>
          </div>
          <div className="h-[180px] w-full flex items-end justify-between gap-2 md:gap-4 relative pb-6 border-b border-border-light">
            <div className="w-full bg-danger rounded-t-sm h-[30%] relative z-10"></div>
            <div className="w-full bg-danger rounded-t-sm h-[50%] relative z-10"></div>
            <div className="w-full bg-danger rounded-t-sm h-[70%] relative z-10"></div>
            <div className="w-full bg-danger rounded-t-sm h-[40%] relative z-10"></div>
            <div className="w-full bg-danger rounded-t-sm h-[80%] relative z-10"></div>
            <div className="w-full bg-danger rounded-t-sm h-[45%] relative z-10"></div>
            <div className="w-full bg-danger rounded-t-sm h-[35%] relative z-10"></div>
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-text-muted mt-2">
              <span className="w-full text-center">Th1</span>
              <span className="w-full text-center">Th2</span>
              <span className="w-full text-center">Th3</span>
              <span className="w-full text-center">Th4</span>
              <span className="w-full text-center">Th5</span>
              <span className="w-full text-center">Th6</span>
              <span className="w-full text-center">Th7</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-success font-semibold">+4.5%</span>
            <span className="text-xs text-text-muted">Hiệu suất bán vé tốt hơn 30% so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-sm text-headline-sm text-text-primary">Phim bán chạy</h2>
            <div className="flex gap-2">
              <select className="text-sm border border-border-default rounded-md px-2 py-1 text-text-secondary bg-surface focus:ring-0 focus:border-primary-container">
                <option>Tháng 4</option>
              </select>
              <select className="text-sm border border-border-default rounded-md px-2 py-1 text-text-secondary bg-surface focus:ring-0 focus:border-primary-container">
                <option>2021</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
            <div className="relative w-48 h-48 rounded-full border-8 border-surface flex items-center justify-center" style={{ background: "conic-gradient(#EF4444 0% 40%, #2346d5 40% 65%, #F59E0B 65% 85%, #EC4899 85% 100%)" }}>
              <div className="w-32 h-32 bg-surface rounded-full absolute"></div>
              <div className="absolute top-4 left-4 bg-surface px-2 py-1 rounded shadow-sm text-xs border border-border-light z-10 text-text-primary font-medium text-center">
                20%<br/><span className="text-text-muted font-normal">Th3vel</span>
              </div>
              <div className="absolute bottom-4 right-2 bg-surface px-2 py-1 rounded shadow-sm text-xs border border-border-light z-10 text-text-primary font-medium text-center">
                40%<br/><span className="text-text-muted font-normal">Iron Man</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-danger"></span>
                  <span className="text-sm text-text-secondary">Iron Man</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">36,638,465.14</span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                  <span className="text-sm text-text-secondary">Avatar</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">8,141,881.2</span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-warning"></span>
                  <span className="text-sm text-text-secondary">Th3vel</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">4,870,040.6</span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink"></span>
                  <span className="text-sm text-text-secondary">Batman</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">12,212,621.83</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-default p-card-padding shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-text-primary mb-6">Phim sắp chiếu</h2>
          <div className="flex flex-col gap-4 h-[250px] overflow-y-auto pr-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                <img alt="The Real Gosht" className="w-14 h-14 rounded-lg object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIQusthBdeNVttWSeaHH8bgEKW_fsSkuHjaVWMa3BGo3niSpEFgMX_yYqnIJlmtHorMgn6lWPBiWKv3q4kZRsUWUhGqwlOwuTZvytsDowwZ6S2iqYnKt96vEW6hbkZzDJ0B7Zf4ai7du0vMYFeqNlN0MI_gM_SM2tdx7Tn_H71JrYZ1qFoBkzJlxVfzQ26XYPbCRPuQNHPnHAA74OZ8IZlGz0D2oHHMz3BI0So2xtyDslPXJSVAVvcuEx7qjJEECZcYcoId6443kyT" />
                <div className="flex-1">
                  <h4 className="font-body-md text-body-md font-semibold text-text-primary">The Real Gosht {i}</h4>
                  <p className="text-xs text-text-muted mt-0.5">Tháng 4 12th, T2day</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
