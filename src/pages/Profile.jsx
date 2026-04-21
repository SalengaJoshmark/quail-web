import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, LogOut, Shield, Database, Cake, Activity, Box, ClipboardCheck, Settings } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, query, where, getCountFromServer } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

// Database Monitor configuration categories
const MONITOR_CATEGORIES = [
  { name: 'User Accounts', path: 'user_access', icon: User, color: 'text-blue-600' },
  { name: 'Farm Tasks', path: 'farm_data/shared/tasks', icon: ClipboardCheck, color: 'text-green-600' },
  { name: 'Feed Inventory', path: 'farm_data/shared/feed', icon: Box, color: 'text-orange-600' },
  { name: 'System Settings', path: 'system_settings', icon: Settings, color: 'text-purple-600' },
];

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [farmStats, setFarmStats] = useState({
    total_quails: 0,
    active_cages: 0,
    days_running: 0,
    farm_location: ''
  });

  const [dbMonitor, setDbMonitor] = useState(
    MONITOR_CATEGORIES.map(cat => ({ ...cat, count: 0 }))
  );

  const [formData, setFormData] = useState({
    name: storedUser?.name || '',
    email: storedUser?.email || '',
    birthday: storedUser?.birthday || '',
    role: storedUser?.role || '',
    farmName: "Waje's Quail Farm",
    address: {
      street: storedUser?.address?.street || '',
      city: storedUser?.address?.city || '',
      state: storedUser?.address?.state || '',
      postalCode: storedUser?.address?.postalCode || '',
    },
  });

  useEffect(() => {
    if (!storedUser.email) {
      setLoading(false);
      return;
    }

    // Fetch collection counts for the Database Monitor
    const fetchMonitorCounts = async () => {
      try {
        const updatedMonitor = await Promise.all(
          MONITOR_CATEGORIES.map(async (category) => {
            const collRef = collection(db, category.path);
            const snapshot = await getCountFromServer(collRef);
            return { ...category, count: snapshot.data().count };
          })
        );
        setDbMonitor(updatedMonitor);
      } catch (error) {
        console.error("Error fetching monitor counts:", error);
      }
    };

    fetchMonitorCounts();

    const usersRef = collection(db, 'user_access');
    const userQuery = query(usersRef, where('email', '==', storedUser.email));
    const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const addr = data.address || {};

        setFormData((prev) => ({
          ...prev,
          name: data.name || '',
          email: data.email || storedUser?.email || '',
          birthday: data.birthday || '',
          role: data.role || '',
          address: {
            street: addr.street || '',
            city: addr.city || '',
            state: addr.state || '',
            postalCode: addr.postalCode || '',
          },
        }));

        const updatedUser = { ...storedUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setLoading(false);
    });

    const statsDocRef = doc(db, 'farm_data', 'stats');
    const unsubscribeStats = onSnapshot(statsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        const start = data.farmStartDate?.toDate ? data.farmStartDate.toDate() : new Date(data.farmStartDate);
        const daysRunning = start ? Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)) : 0;

        const fLoc = data.farmLocation;
        const formattedFarmLocation = fLoc ? `${fLoc.street}, ${fLoc.city}, ${fLoc.state} ${fLoc.postalCode}` : '';

        setFarmStats({
          total_quails: data.totalBirds || 0,
          active_cages: data.activeCages || 0,
          days_running: daysRunning,
          farm_location: formattedFarmLocation
        });
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeStats();
    };
  }, [storedUser.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (['street', 'city', 'state', 'postalCode'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <>
      {loading && <LoadingScreen message="Retrieving your farm profile..." />}
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1f] text-white rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-4 border-white/20 overflow-hidden shadow-xl">
                  {storedUser.profilePic ? (
                    <img src={storedUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-[#2D5016]" />
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-1">{formData.name || 'Farmer'}</h2>
                <p className="text-white/80 text-lg font-medium">
                  {formData.role === 'owner' ? 'Farm Owner' :
                   formData.role === 'backup_owner' ? 'Co Farm Owner' :
                   'Farm Staff'}
                </p>
                <p className="text-white/60 text-sm mt-1">{formData.farmName}</p>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-[#2D5016]" />
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Birthday</label>
                  <div className="relative">
                    <Cake className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      disabled
                      placeholder="MM/DD/YYYY"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="street"
                      value={formData.address.street}
                      onChange={handleChange}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.address.city}
                      onChange={handleChange}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">State / Province</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="state"
                      value={formData.address.state}
                      onChange={handleChange}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Postal Code</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-[#2D5016]" />
                <h3 className="text-xl font-bold text-gray-900">Database Monitor</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbMonitor.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.path} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl transition-all hover:bg-gray-100">
                      <div className={`p-3 bg-white rounded-xl shadow-sm ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.name}</p>
                        <p className="text-xl font-black text-gray-900 leading-none">
                          {typeof item.count === 'number' ? item.count.toLocaleString() : item.count} 
                          <span className="text-[10px] text-gray-400 font-normal ml-1">DOCS</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-6 text-center italic">
                Firestore connection: <span className="text-green-600 font-bold uppercase">Active</span> • Sub-collections monitored for integrity
              </p>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Database className="w-5 h-5 text-[#2D5016]" />
                <h3 className="text-xl font-bold text-gray-900">Farm Data</h3>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="text-3xl font-black text-blue-900">{farmStats.days_running}</div>
                  <div className="text-sm font-bold text-blue-700 uppercase tracking-tighter">Days Running</div>
                </div>

                <div className="p-5 bg-green-50 border border-green-100 rounded-2xl">
                  <div className="text-3xl font-black text-[#2D5016]">{farmStats.total_quails.toLocaleString()}</div>
                  <div className="text-sm font-bold text-green-700 uppercase tracking-tighter">Total Birds</div>
                </div>

                <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl">
                  <div className="text-3xl font-black text-orange-900">{farmStats.active_cages}</div>
                  <div className="text-sm font-bold text-orange-700 uppercase tracking-tighter">Active Cages</div>
                </div>

                <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl">
                  <div className="text-lg font-bold text-purple-900 line-clamp-2">{farmStats.farm_location || 'Not Set'}</div>
                  <div className="text-sm font-bold text-purple-700 uppercase tracking-tighter">Farm Location</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-100"
            >
              <LogOut className="w-5 h-5" />
              Log out from Farm Management
            </button>

            <div className="bg-[#2D5016] text-white rounded-3xl p-6 text-center">
              <p className="text-white/60 text-xs mb-1">Authenticated via</p>
              <p className="font-mono text-sm">Waje's Internal Registry</p>
              <p className="text-[10px] text-white/40 mt-4">© 2026 Quail Management System</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
