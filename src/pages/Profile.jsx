import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Camera, Save, LogOut, Shield, Database } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, collection, onSnapshot, query, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [farmStats, setFarmStats] = useState({
    total_quails: 0,
    active_cages: 0,
    days_running: 0,
    farm_location: ''
  });
  
  const [formData, setFormData] = useState({
    name: storedUser?.name || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    address: '', // Will be populated by formatted string
    role: storedUser?.role || '',
    farmName: "Waje's Quail Farm",
  });

  useEffect(() => {
    if (!storedUser.email) return;

    // 1. Lively reflect User Info from user_access
    const userDocRef = doc(db, 'user_access', storedUser.email);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const addr = data.address;
        // Format the address object into a single string for the UI input
        const formattedAddress = addr ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}` : '';
        
        // Only update state automatically if user isn't currently editing
        if (!isEditing) {
          setFormData(prev => ({
            ...prev,
            name: data.name || '',
            phone: data.phone || '',
            address: formattedAddress,
            role: data.role || '',
          }));
        }
        // Sync localStorage to keep the session data fresh for other components
        const updatedUser = { ...storedUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setLoading(false);
    });

    // Fetch Farm Statistics from Firestore
    const statsDocRef = doc(db, 'farm_data', 'stats');
    const unsubscribeStats = onSnapshot(statsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Calculate Days Running based on real current time and farmStartDate
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
  }, [isEditing, storedUser.email]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      // Update user_access document in Firestore
      const userRef = doc(db, 'user_access', storedUser.email);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });

      // Update local storage to keep session in sync
      const updatedUser = { ...storedUser, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile');
    }
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
              <button className="absolute bottom-1 right-1 w-9 h-9 bg-[#2D5016] rounded-full flex items-center justify-center border-2 border-white hover:bg-[#3d6b1f] transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
              </button>
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

          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center gap-2 bg-white text-[#2D5016] px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
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
                    disabled={!isEditing}
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
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D5016] outline-none transition-all disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Settings Placeholder */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-[#2D5016]" />
              <h3 className="text-xl font-bold text-gray-900">Account Security</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex flex-col items-start p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors text-left group">
                <span className="font-bold text-gray-900">Change Password</span>
                <span className="text-xs text-gray-500 mt-1">Last changed 3 months ago</span>
              </button>
              <button className="flex flex-col items-start p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors text-left group">
                <span className="font-bold text-gray-900">Export Data</span>
                <span className="text-xs text-gray-500 mt-1">Download farm activity logs</span>
              </button>
            </div>
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