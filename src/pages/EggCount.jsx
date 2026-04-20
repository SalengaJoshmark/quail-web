import React, { useState, useEffect } from 'react';
import { Egg, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';
import LoadingScreen from '../components/LoadingScreen';

export default function EggCount() {
  const [dailyLog, setDailyLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseDate, setBaseDate] = useState(new Date());
  const [stats, setStats] = useState({
    todayTotal: 0,
    gradeA: 0,
    gradeB: 0,
    gradeC: 0,
    percentChange: 0
  });

  useEffect(() => {
    // Helper to get YYYY-MM-DD in local time
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

    // Connect to Realtime Database
    const eggRef = ref(rtdb, 'egg_collections');
    const unsubscribe = onValue(eggRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.entries(data)
          .map(([key, val]) => ({
            id: key,
            date: val.date || key,
            gradeA: Number(val.gradeA || 0),
            gradeB: Number(val.gradeB || 0),
            gradeC: Number(val.gradeC || 0),
            total: val.total || (Number(val.gradeA || 0) + Number(val.gradeB || 0) + Number(val.gradeC || 0))
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setDailyLog(entries);

        const todayEntry = entries.find(e => e.date === todayStr);
        const yesterdayEntry = entries.find(e => e.date === yesterdayStr);

        let change = 0;
        if (yesterdayEntry && yesterdayEntry.total > 0) {
          const todayT = todayEntry ? todayEntry.total : 0;
          change = ((todayT - yesterdayEntry.total) / yesterdayEntry.total) * 100;
        }

        setStats({
          todayTotal: todayEntry ? todayEntry.total : 0,
          gradeA: todayEntry ? todayEntry.gradeA : 0,
          gradeB: todayEntry ? todayEntry.gradeB : 0,
          gradeC: todayEntry ? todayEntry.gradeC : 0,
          percentChange: change.toFixed(1)
        });
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculate the 7 days of the currently selected week
  const startOfWeek = new Date(baseDate);
  const dayIndex = startOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const weekRangeLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const entry = dailyLog.find(e => e.date === dStr);
    weekDays.push({
      date: dStr,
      displayDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      total: entry?.total || 0,
      gradeA: entry?.gradeA || 0,
      gradeB: entry?.gradeB || 0,
      gradeC: entry?.gradeC || 0,
      isToday: dStr === new Date().toLocaleDateString('en-CA')
    });
  }

  const { todayTotal, gradeA, gradeB, gradeC, percentChange } = stats;

  return (
    <>
      {loading && <LoadingScreen message="Counting today's production..." />}
      <div className="space-y-4">
      {/* Today's Count */}
      <div className="bg-gradient-to-br from-[#2D5016] to-[#3d6b1f] text-white rounded-2xl p-6 text-center shadow-lg">
        <Egg className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
        <div className="text-5xl font-bold mb-2">{todayTotal.toLocaleString()}</div>
        <div className="text-white/80 text-sm">Total Eggs Today</div>
        <div className="flex items-center justify-center gap-1 mt-2 text-green-300">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">{percentChange >= 0 ? '+' : ''}{percentChange}% from yesterday</span>
        </div>
      </div>

      {/* Quality Grade Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900">Quality Distribution</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Grade A', val: gradeA, color: 'green' },
            { label: 'Grade B', val: gradeB, color: 'yellow' },
            { label: 'Grade C', val: gradeC, color: 'red' }
          ].map((grade) => (
            <div key={grade.label} className={`bg-${grade.color}-50 border-2 border-${grade.color}-500 rounded-xl p-4 text-center shadow-sm`}>
              <div className={`text-2xl font-bold text-${grade.color}-700`}>{grade.val}</div>
              <div className="text-xs text-gray-600 mt-1">{grade.label}</div>
              <div className={`text-xs text-${grade.color}-600 font-semibold mt-1`}>
                {todayTotal > 0 ? Math.round((grade.val / todayTotal) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Log */}
      <div className="space-y-3 pt-2 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2D5016]" />
            <h3 className="font-bold text-gray-900">Weekly Breakdown</h3>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
             <button 
               onClick={() => {
                 const d = new Date(baseDate);
                 d.setDate(d.getDate() - 7);
                 setBaseDate(d);
               }}
               className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <ChevronLeft className="w-4 h-4 text-gray-600" />
             </button>
             {/* Make the date range clickable to open the calendar */}
             <div className="relative flex items-center gap-1 px-2 py-1 group cursor-pointer">
               <input
                 type="date"
                 // The input is transparent but covers the label, making it clickable.
                 // Added hover/focus opacity for visual feedback.
                 // w-full h-full ensures it covers the parent div entirely.
                 className="absolute inset-0 opacity-0 hover:opacity-10 focus:opacity-10 cursor-pointer z-10 w-full h-full"
                 onChange={(e) => {
                   if (e.target.value) {
                     const [year, month, day] = e.target.value.split('-').map(Number);
                     setBaseDate(new Date(year, month - 1, day));
                   }
                 }}
               />
               {/* These elements are visible, but clicks pass through to the input */}
               <Calendar className="w-3 h-3 text-gray-400 group-hover:text-[#2D5016] transition-colors pointer-events-none" />
               <span className="text-[10px] uppercase font-black text-gray-400 group-hover:text-[#2D5016] transition-colors pointer-events-none">
                 {weekRangeLabel}
               </span>
             </div>
             <button 
               onClick={() => {
                 const d = new Date(baseDate);
                 d.setDate(d.getDate() + 7);
                 setBaseDate(d);
               }}
               className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <ChevronRight className="w-4 h-4 text-gray-600" />
             </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {weekDays.map((entry) => (
            <div key={entry.date} className={`rounded-xl p-4 border-2 transition-all ${entry.isToday ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                   <Calendar className="w-5 h-5 text-[#2D5016]" />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{entry.displayDate}</span>
                  <span className="text-lg font-bold text-[#2D5016]">{entry.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-wider ml-13">
                <span className="text-green-700">A: {entry.gradeA}</span>
                <span className="text-yellow-600">B: {entry.gradeB}</span>
                <span className="text-red-600">C: {entry.gradeC}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}
