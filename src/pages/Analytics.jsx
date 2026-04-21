import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { collection, query, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../firebase';
import LoadingScreen from '../components/LoadingScreen';

export default function Analytics() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalEggs: 0,
    averageDaily: 0,
    gradeAPercentage: 0,
    efficiency: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currentMonthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    setLoading(true);
    // 1. Fetch total birds for efficiency calculation
    const targetYear = selectedMonth.getFullYear();
    const targetMonth = selectedMonth.getMonth(); // 0-indexed

    let birdCount = 0;
    const fetchBirdsAndData = async () => {
      // Target the stats document directly as used in Profile.jsx
      const statsRef = doc(db, 'farm_data', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        birdCount = statsSnap.data().totalBirds || 0;
      }

      // Move RTDB listener inside or ensure birdCount is available
      const eggRef = ref(rtdb, 'egg_collections');
      return onValue(eggRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Transform and filter by selected month/year
        const allEntries = Object.values(data);
        const filteredEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === targetYear && entryDate.getMonth() === targetMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort Ascending for week grouping
        
        // Calculate Monthly Totals
        const total = filteredEntries.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        const totalA = filteredEntries.reduce((acc, curr) => acc + (Number(curr.gradeA) || 0), 0);
        const avg = filteredEntries.length > 0 ? Math.round(total / filteredEntries.length) : 0;
        
        // Group by Actual Calendar Weeks
        const weekMap = {};
        filteredEntries.forEach(entry => {
          const date = new Date(entry.date);
          // Calculate Week of Month
          const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const dayOfMonth = date.getDate();
          const offset = firstDayOfMonth.getDay(); 
          const weekIndex = Math.ceil((dayOfMonth + offset) / 7);
          
          if (!weekMap[weekIndex]) {
            weekMap[weekIndex] = { 
              week: `Week ${weekIndex}`, 
              eggs: 0, grade_a: 0, grade_b: 0, grade_c: 0,
              startDate: null, endDate: null 
            };
          }
          
          weekMap[weekIndex].eggs += Number(entry.total || 0);
          weekMap[weekIndex].grade_a += Number(entry.gradeA || 0);
          weekMap[weekIndex].grade_b += Number(entry.gradeB || 0);
          weekMap[weekIndex].grade_c += Number(entry.gradeC || 0);
        });

        const weeks = Object.values(weekMap);

        setWeeklyData(weeks);
        setMonthlyStats({
          totalEggs: total,
          averageDaily: avg,
          gradeAPercentage: total > 0 ? Math.round((totalA / total) * 100) : 0,
          efficiency: birdCount > 0 ? Math.round((avg / birdCount) * 100) : 0
        });
      }
      setLoading(false);
      });
    };

    const unsubscribePromise = fetchBirdsAndData();
    return () => {
       unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-');
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  return (
    <>
      {loading && <LoadingScreen message="Analyzing farm performance..." />}
      <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2D5016]">Farm Performance Analytics</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600">{currentMonthName}</p>
            <div className="relative flex items-center gap-1 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm group cursor-pointer">
               <input 
                 type="month" 
                 className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                 value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                 onClick={(e) => e.target.showPicker && e.target.showPicker()}
                 onChange={handleMonthChange}
               />
               <CalendarIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2D5016] pointer-events-none" />
               <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-[#2D5016] pointer-events-none">Change Period</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
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
    </>
  );
}