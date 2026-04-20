import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';

export default function Schedule() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formatting for Header Date
  const todayLong = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    const tasksRef = collection(db, 'farm_data', 'shared', 'tasks');
    const q = query(tasksRef, orderBy('time', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data
        });
      });
      setTasks(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schedule:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Logic to separate today's tasks and upcoming events
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const todayTasks = tasks.filter(task => {
    // Assuming 'date' field exists in Firestore as YYYY-MM-DD or Timestamp
    const taskDate = task.date?.seconds 
      ? new Date(task.date.seconds * 1000).toISOString().split('T')[0] 
      : task.date;
    return taskDate === todayStr || !task.date; // Fallback to showing it today if no date
  });

  const upcomingEvents = tasks.filter(task => {
    const taskDate = task.date?.seconds 
      ? new Date(task.date.seconds * 1000).toISOString().split('T')[0] 
      : task.date;
    return taskDate > todayStr;
  });

  const completedCount = todayTasks.filter(t => t.status === 'completed').length;

  return (
    <>
      {loading && <LoadingScreen message="Organizing your daily tasks..." />}
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2D5016]">Daily Schedule</h2>
          <p className="text-gray-600 mt-1">{todayLong}</p>
        </div>
      </div>

      {/* Calendar Widget */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        {/* Mini Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 pb-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                day === selectedDay
                  ? 'bg-[#2D5016] text-white font-bold shadow-lg'
                  : day === new Date().getDate()
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Tasks</h3>
          
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  task.status === 'completed'
                    ? 'bg-green-50 border-green-200 opacity-75'
                    : 'bg-white border-gray-200 hover:border-[#2D5016]'
                }`}
              >
                <div className="flex-shrink-0">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  ) : (
                    <div className="w-8 h-8 border-2 border-gray-300 rounded-full" />
                  )}
                </div>

                <div className="flex-shrink-0 w-24">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{task.time}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className={`font-semibold ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {task.priority || 'medium'}
                </span>
              </div>
            ))}
            {todayTasks.length === 0 && !loading && (
              <p className="text-center py-8 text-gray-500 italic">No tasks scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Upcoming/Stats Side */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Task Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{todayTasks.length}</div>
                <div className="text-xs text-gray-600">Tasks Today</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-[#2D5016] text-white rounded-2xl p-6 shadow-lg">
            <CalendarDays className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="text-lg font-bold mb-2">Upcoming Events</h3>
            <p className="text-white/70 text-sm italic">Connect your Android app to add special events like deliveries or health checks.</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}