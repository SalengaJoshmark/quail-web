import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db, rtdb } from '../firebase';

export default function Analytics() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalEggs: 0,
    averageDaily: 0,
    gradeAPercentage: 0,
    efficiency: 0,
  });
  const [currentMonthName] = useState(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    // 1. Fetch total birds for efficiency calculation
    let birdCount = 0;
    const fetchBirdsAndData = async () => {
      const q = query(collection(db, 'farm_data'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        birdCount = snap.docs[0].data().total_quails || 0;
      }

      // Move RTDB listener inside or ensure birdCount is available
      const eggRef = ref(rtdb, 'egg_collections');
      return onValue(eggRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.values(data).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate Monthly Totals
        const total = entries.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        const totalA = entries.reduce((acc, curr) => acc + (Number(curr.gradeA) || 0), 0);
        const avg = entries.length > 0 ? Math.round(total / entries.length) : 0;
        
        // Group by Week (Simple 7-day chunks for visualization)
        const weeks = [];
        for (let i = 0; i < entries.length; i += 7) {
          const chunk = entries.slice(i, i + 7);
          const weekTotal = chunk.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
          const weekA = chunk.reduce((acc, curr) => acc + (Number(curr.gradeA) || 0), 0);
          const weekB = chunk.reduce((acc, curr) => acc + (Number(curr.gradeB) || 0), 0);
          const weekC = chunk.reduce((acc, curr) => acc + (Number(curr.gradeC) || 0), 0);
          
          weeks.push({
            week: `Week ${Math.floor(i/7) + 1}`,
            eggs: weekTotal,
            grade_a: weekA,
            grade_b: weekB,
            grade_c: weekC
          });
        }

        setWeeklyData(weeks.reverse());
        setMonthlyStats({
          totalEggs: total,
          averageDaily: avg,
          gradeAPercentage: total > 0 ? Math.round((totalA / total) * 100) : 0,
          efficiency: birdCount > 0 ? Math.round((avg / birdCount) * 100) : 0
        });
      }
      });
    };

    const unsubscribePromise = fetchBirdsAndData();
    return () => {
       unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Analytics Report</h2>
          <h2 className="text-2xl font-bold text-[#2D5016]">Monthly Analytics Report</h2>
          <p className="text-gray-600 mt-1">{currentMonthName} Performance Summary</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#2D5016] text-white px-6 py-3 rounded-xl hover:bg-[#3d6b1f] transition-colors shadow-lg">
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Total</span>
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">{monthlyStats.totalEggs.toLocaleString()}</div>
          <div className="text-sm text-blue-700">Total Eggs Collected</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <TrendingUp className="w-10 h-10 text-green-600" />
            <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Avg</span>
          </div>
          <div className="text-3xl font-bold text-green-900 mb-1">{monthlyStats.averageDaily}</div>
          <div className="text-sm text-green-700">Daily Average</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <CalendarIcon className="w-10 h-10 text-yellow-600" />
            <span className="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full">Quality</span>
          </div>
          <div className="text-3xl font-bold text-yellow-900 mb-1">{monthlyStats.gradeAPercentage}%</div>
          <div className="text-sm text-yellow-700">Grade A Quality</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <BarChart3 className="w-10 h-10 text-purple-600" />
            <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">Rate</span>
          </div>
          <div className="text-3xl font-bold text-purple-900 mb-1">{monthlyStats.efficiency}%</div>
          <div className="text-sm text-purple-700">Production Efficiency</div>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 text-left">
                <th className="py-4 px-4 font-semibold text-gray-700">Period</th>
                <th className="py-4 px-4 font-semibold text-gray-700 text-right">Total Eggs</th>
                <th className="py-4 px-4 font-semibold text-gray-700 text-right">Grade A</th>
                <th className="py-4 px-4 font-semibold text-gray-700 text-right">Grade B</th>
                <th className="py-4 px-4 font-semibold text-gray-700 text-right">Grade C</th>
                <th className="py-4 px-4 font-semibold text-gray-700 text-right">A %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {weeklyData.map((week, index) => (
                <tr key={week.week} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-900 font-medium">{week.week}</td>
                  <td className="py-4 px-4 text-right text-gray-900 font-semibold">{week.eggs.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-green-700">{week.grade_a}</td>
                  <td className="py-4 px-4 text-right text-yellow-700">{week.grade_b}</td>
                  <td className="py-4 px-4 text-right text-red-700">{week.grade_c}</td>
                  <td className="py-4 px-4 text-right text-gray-900">
                    {week.eggs > 0 ? Math.round((week.grade_a / week.eggs) * 100) : 0}%
                  </td>
                </tr>
              ))}
              {weeklyData.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 italic">
                    No collection data found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Production Trend</h3>
        <div className="h-64 bg-gradient-to-t from-green-50 to-white rounded-xl border border-gray-200 flex items-center justify-center">
          <div className="text-center px-4">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Production trends over time</p>
            <p className="text-sm text-gray-400 mt-1">Visualization updates automatically as data is logged.</p>
          </div>
        </div>
      </div>
    </div>
  );
}