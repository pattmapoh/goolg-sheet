'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Calendar, MapPin, ArrowUpDown, RefreshCw, 
  Users, Home, Calculator, AlertTriangle, Printer, Download,
  Layers, ChevronDown, Sheet, RotateCcw, TrendingUp, TrendingDown
} from 'lucide-react';
import { TreatmentRecord, SortOption } from '@/types/data';
import { DEFAULT_RECORDS, RAW_CSV_DEFAULT, parseCSV } from '@/data/defaultData';

export default function DashboardPage() {
  const [records, setRecords] = useState<TreatmentRecord[]>(DEFAULT_RECORDS);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('patients_desc');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('ข้อมูลตัวอย่าง จ.ศรีสะเกษ (2565-2568)');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Available unique years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map(r => r.year)));
    return years.sort().reverse();
  }, [records]);

  // Filtered & Sorted Dataset
  const filteredRecords = useMemo(() => {
    let result = records.filter(item => {
      const matchYear = selectedYear === 'ALL' || item.year === selectedYear;
      const matchDistrict = !searchQuery || item.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchYear && matchDistrict;
    });

    result.sort((a, b) => {
      if (sortOption === 'patients_desc') return b.patients - a.patients;
      if (sortOption === 'patients_asc') return a.patients - b.patients;
      if (sortOption === 'community_desc') return b.community - a.community;
      if (sortOption === 'district_asc') return a.district.localeCompare(b.district, 'th');
      return 0;
    });

    return result;
  }, [records, selectedYear, searchQuery, sortOption]);

  // Summary KPIs
  const stats = useMemo(() => {
    const totalPatients = filteredRecords.reduce((sum, r) => sum + r.patients, 0);
    const totalCommunities = filteredRecords.reduce((sum, r) => sum + r.community, 0);
    const avgRatio = totalCommunities > 0 ? (totalPatients / totalCommunities).toFixed(1) : '0.0';

    const districtTotals: Record<string, number> = {};
    filteredRecords.forEach(r => {
      districtTotals[r.district] = (districtTotals[r.district] || 0) + r.patients;
    });

    let topDistrict = '-';
    let topDistrictCount = 0;
    for (const [dist, count] of Object.entries(districtTotals)) {
      if (count > topDistrictCount) {
        topDistrictCount = count;
        topDistrict = dist;
      }
    }

    return { totalPatients, totalCommunities, avgRatio, topDistrict, topDistrictCount };
  }, [filteredRecords]);

  // Sync Google Sheet
  const handleSyncGoogleSheet = async (customUrl?: string) => {
    const targetUrl = customUrl || sheetUrl;
    if (!targetUrl) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setStatusMessage('กำลังดึงข้อมูลจาก Google Sheets...');
    try {
      const res = await fetch(`/api/sheet?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const csvData = await res.text();
      const parsed = parseCSV(csvData);
      if (parsed.length > 0) {
        setRecords(parsed);
        setStatusMessage('ซิงค์ข้อมูล Google Sheets สำเร็จ');
        setIsModalOpen(false);
      } else {
        alert('พบข้อมูลแต่ไม่สามารถอ่านรูปแบบคอลัมน์ได้ กรุณาตรวจสอบหัวตาราง: ปี, อำเภอ, หมู่บ้าน/ชุมชน, ผู้ป่วยเข้ารับบำบัด');
      }
    } catch (err: any) {
      alert(`ไม่สามารถดึงข้อมูลได้: ${err.message}`);
      setStatusMessage('เชื่อมต่อไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = 'ปี,อำเภอ,หมู่บ้าน/ชุมชน,ผู้ป่วยเข้ารับบำบัด,เฉลี่ยต่อชุมชน\n';
    const rows = filteredRecords.map(r => `${r.year},${r.district},${r.community},${r.patients},${r.ratio}`).join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานผู้ป่วยบำบัด_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  ระบบวิเคราะห์ข้อมูลผู้ป่วยเข้ารับการบำบัด
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    จ.ศรีสะเกษ
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Next.js App Router &bull; เชื่อมต่อ Google Sheets Live Sync
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 no-print">
              <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{statusMessage}</span>
              </div>

              <button
                onClick={() => handleSyncGoogleSheet()}
                disabled={isLoading}
                className="p-2 sm:px-3 sm:py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">ดึงข้อมูลใหม่</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 flex items-center space-x-1.5 transition-all"
              >
                <Sheet className="w-4 h-4" />
                <span>Google Sheets</span>
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters Bar */}
        <section className="glass-card rounded-2xl p-4 sm:p-5 shadow-sm no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                เลือกปี พ.ศ.
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 appearance-none"
                >
                  <option value="ALL">ทุกปี (2565 - 2568)</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>พ.ศ. {yr}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                ค้นหาอำเภอ
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่ออำเภอ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                เรียงลำดับ
              </label>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 appearance-none"
                >
                  <option value="patients_desc">ผู้ป่วย (มาก &rarr; น้อย)</option>
                  <option value="patients_asc">ผู้ป่วย (น้อย &rarr; มาก)</option>
                  <option value="community_desc">หมู่บ้าน/ชุมชน (มาก &rarr; น้อย)</option>
                  <option value="district_asc">ชื่ออำเภอ (ก - ฮ)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={() => { setSelectedYear('ALL'); setSearchQuery(''); setSortOption('patients_desc'); }}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 px-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>รีเซ็ต</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-xl text-sm flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>โหลด CSV</span>
              </button>
            </div>
          </div>
        </section>

        {/* KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้ป่วยเข้ารับบำบัดรวม</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats.totalPatients.toLocaleString('th-TH')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {selectedYear === 'ALL' ? 'ยอดรวมสะสม 4 ปี (2565-2568)' : `ประจำปี พ.ศ. ${selectedYear}`}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">หมู่บ้าน/ชุมชนเป้าหมาย</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats.totalCommunities.toLocaleString('th-TH')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">ในพื้นที่ที่มีรายงานข้อมูลการบำบัด</p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เฉลี่ยต่อหมู่บ้าน/ชุมชน</p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats.avgRatio}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">คน / ชุมชน (อัตราความหนาแน่น)</p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">อำเภอที่พบผู้ป่วยสูงสุด</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                  {stats.topDistrict}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              {stats.topDistrictCount.toLocaleString('th-TH')} คน
            </p>
          </div>
        </section>

        {/* Data Table */}
        <section className="glass-card rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                ตารางแจกแจงข้อมูลผู้ป่วยรายอำเภอ
              </h2>
              <p className="text-xs text-slate-500">
                พบข้อมูล {filteredRecords.length} รายการ
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100/75 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-6">ลำดับ</th>
                  <th className="py-3 px-6">ปี พ.ศ.</th>
                  <th className="py-3 px-6">อำเภอ</th>
                  <th className="py-3 px-6 text-right">หมู่บ้าน/ชุมชน</th>
                  <th className="py-3 px-6 text-right">ผู้ป่วยเข้ารับบำบัด</th>
                  <th className="py-3 px-6 text-right">เฉลี่ยต่อชุมชน</th>
                  <th className="py-3 px-6 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecords.map((row, idx) => (
                  <tr key={`${row.year}-${row.district}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-6 text-slate-400 text-xs font-mono">{idx + 1}</td>
                    <td className="py-3 px-6 font-medium">{row.year}</td>
                    <td className="py-3 px-6 font-semibold text-slate-900 dark:text-white">{row.district}</td>
                    <td className="py-3 px-6 text-right font-mono">{row.community}</td>
                    <td className="py-3 px-6 text-right font-bold font-mono text-slate-900 dark:text-white">{row.patients}</td>
                    <td className="py-3 px-6 text-right font-mono text-slate-500">{row.ratio}</td>
                    <td className="py-3 px-6 text-center">
                      {row.patients >= 100 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200">
                          วิกฤตสูง (&ge;100)
                        </span>
                      ) : row.patients >= 40 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200">
                          ปานกลาง (&ge;40)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                          เฝ้าระวังปกติ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Google Sheets Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ตั้งค่า Google Sheet Link
            </h3>
            <p className="text-xs text-slate-500">
              กรอก URL ที่แชร์แบบ Published to web (CSV) หรือแชร์แบบ Anyone with the link
            </p>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                ปิด
              </button>
              <button
                onClick={() => handleSyncGoogleSheet()}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              >
                บันทึกและซิงค์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
