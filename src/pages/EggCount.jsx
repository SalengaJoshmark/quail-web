import React, { useState, useEffect } from 'react';
import { Egg, TrendingUp, Calendar } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

export default function EggCount() {
  const [dailyLog, setDailyLog] = useState([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    gradeA: 0,
    gradeB: 0,
    gradeC: 0,
    percentChange: 0
  });

  useEffect(() => {
    // Connect to Realtime Database
    const eggRef = ref(rtdb, 'egg_collections');
    const unsubscribe = onValue(eggRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Transform the object into a sorted array of entries
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

        if (entries.length > 0) {
          const today = entries[0];
          const yesterday = entries[1];

          let change = 0;
          if (yesterday && yesterday.total > 0) {
            change = ((today.total - yesterday.total) / yesterday.total) * 100;
          }

          setStats({
            todayTotal: today.total,
            gradeA: today.gradeA,
            gradeB: today.gradeB,
            gradeC: today.gradeC,
            percentChange: change.toFixed(1)
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const { todayTotal, gradeA, gradeB, gradeC, percentChange } = stats;

  return (
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
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2D5016]" />
          <h3 className="font-bold text-gray-900">Daily Collection Log</h3>
        </div>
        <div className="space-y-2">
          {dailyLog.map((entry, index) => (
            <div key={entry.id} className={`rounded-xl p-4 border-2 transition-all ${index === 0 ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">{entry.date}</span>
                <span className="text-lg font-bold text-[#2D5016]">{entry.total.toLocaleString()}</span>
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <span className="text-green-700">A: {entry.gradeA}</span>
                <span className="text-yellow-700">B: {entry.gradeB}</span>
                <span className="text-red-700">C: {entry.gradeC}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
