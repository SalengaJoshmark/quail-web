import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Egg, FileText, ClipboardList, Lightbulb } from 'lucide-react';
import { db, rtdb } from '../firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';

export default function Home() {
  const navigate = useNavigate();
  const [eggCount, setEggCount] = useState(0);
  const [feedRemaining, setFeedRemaining] = useState('0kg');
  const [recommendation, setRecommendation] = useState('Loading daily tips...');
  
  // Get user data from local storage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // 1. Listen to Realtime Database for Egg Collection
    const eggRef = ref(rtdb, 'egg_collections');
    const unsubscribeRtdb = onValue(eggRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Handle if it's a direct number or an object from your app
        setEggCount(typeof data === 'number' ? data : data.today_count || 0);
      }
    });

    // 2. Listen to Firestore for Farm Data (Feed Inventory)
    const farmDataRef = collection(db, 'farm_data');
    const unsubscribeFarm = onSnapshot(query(farmDataRef, limit(1)), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setFeedRemaining(`${data.feed_remaining || 0}kg`);
      }
    });

    // 3. Listen to Firestore for AI Recommendations
    const settingsRef = collection(db, 'system_settings');
    const unsubscribeSettings = onSnapshot(query(settingsRef, limit(1)), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setRecommendation(data.daily_recommendation || 'Keep your quails hydrated and happy!');
      }
    });

    return () => {
      unsubscribeRtdb();
      unsubscribeFarm();
      unsubscribeSettings();
    };
  }, []);

  const shortcuts = [
    { icon: ShoppingBag, label: 'Feed Inventory', path: '/dashboard/feed-inventory' },
    { icon: Egg, label: 'Egg Count', path: '/dashboard/egg-count' },
    { icon: FileText, label: 'Report', path: '/dashboard/production-reports' },
    { icon: ClipboardList, label: 'Tasks', path: '/dashboard/schedule' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Card */}
      <div className="bg-[#2D5016] text-white rounded-3xl p-8 shadow-lg">
        <h2 className="font-bold text-3xl">Hi, {user.fullName?.split(' ')[0] || 'Farmer'}!</h2>
        <p className="text-white/80 text-lg mt-1">Welcome Back!</p>
      </div>

      {/* Recommendation Card */}
      <div className="border-4 border-purple-500 bg-gray-50 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#2D5016] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <Lightbulb className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">AI Recommendation</h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Icon Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-3xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="w-16 h-16 bg-[#2D5016] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-center text-gray-700">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-3xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-[#2D5016] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Eggs Today</span>
          </div>
          <div className="text-4xl font-black text-[#2D5016]">
            {eggCount.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-3xl p-6 border border-orange-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">Feed Remaining</span>
          </div>
          <div className="text-4xl font-black text-orange-600">
            {feedRemaining}
          </div>
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs pt-4">
        Live updates connected to Waje's Quail Farm Database
      </p>
    </div>
  );
}