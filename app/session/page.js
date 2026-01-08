// app/sessions/page.js - সম্পূর্ণ আপডেটেড ভার্সন
'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  Clock, Users, Filter, Search, Download,
  Eye, Trash2, User, Smartphone, Activity,
  ChevronLeft, ChevronRight, Shield, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, Settings, PieChart,
  Laptop, ShieldCheck, Edit2, Plus, X,
  ArrowUpRight, ArrowDownRight,
  MoreVertical, DownloadCloud, Phone, Mail,
  LogIn, LogOut
} from 'lucide-react';

// API Configuration - তোমার backend URL অনুযায়ী সেট করো
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Main Component
export default function SessionsPage() {
  const [activeView, setActiveView] = useState('sessions');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    avgDuration: '0h',
    attendanceRate: '0%',
    totalHours: '0h',
    daysClockedIn: 0
  });
  
  const [currentSession, setCurrentSession] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    startDate: '',
    endDate: '',
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  
  const router = useRouter();

  // Get user type and token
  const getUserType = () => {
    if (typeof window === 'undefined') return null;
    
    if (localStorage.getItem('adminToken')) {
      return 'admin';
    }
    if (localStorage.getItem('employeeToken') || localStorage.getItem('userToken')) {
      return 'employee';
    }
    return null;
  };

  const getCurrentToken = () => {
    const userType = getUserType();
    if (userType === 'admin') {
      return localStorage.getItem('adminToken');
    } else if (userType === 'employee') {
      return localStorage.getItem('employeeToken') || localStorage.getItem('userToken');
    }
    return null;
  };

  // Set axios defaults with token
  const setupAxios = () => {
    const token = getCurrentToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    axios.defaults.baseURL = API_BASE_URL;
  };

  // Verify token and fetch user data
  const verifyAndFetchUser = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      const token = getCurrentToken();
      const userType = getUserType();
      
      if (!token || !userType) {
        throw new Error('No authentication token found');
      }

      setupAxios();
      
      let userResponse;
      try {
        if (userType === 'admin') { 
          userResponse = await axios.get('/admin/getAdminProfile');
        } else {
          userResponse = await axios.get('/users/getProfile');
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        throw new Error('Failed to fetch user profile');
      }

      if (userResponse?.data) {
        const userData = userResponse.data.user || userResponse.data.data || userResponse.data;
        
        if (!userData) {
          throw new Error('Invalid user data received');
        }

        const formattedUserData = {
          _id: userData._id,
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
          email: userData.email,
          role: userData.role || userType,
          firstName: userData.firstName,
          lastName: userData.lastName,
          department: userData.department,
          designation: userData.designation,
          phone: userData.phone,
          address: userData.address,
          profileImage: userData.profileImage
        };

        setUserData(formattedUserData);
        localStorage.setItem('userData', JSON.stringify(formattedUserData));
        
        await fetchInitialData(userType);
        
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(true);
      
      // Clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data based on user type
  const fetchInitialData = async (userType) => {
    try {
      if (userType === 'admin') {
        await Promise.all([
          fetchAdminSessions(),
          fetchAdminStats()
        ]);
      } else {
        await Promise.all([
          fetchMySessions(),
          fetchMyStats(),
          fetchMyCurrentSession()
        ]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // ✅ আপডেটেড: Fetch admin sessions - তোমার backend এর রাউট অনুযায়ী
  const fetchAdminSessions = async (page = 1) => {
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.userId?.trim() && { userId: filters.userId }),
        ...(filters.status?.trim() && { status: filters.status }),
        ...(filters.startDate?.trim() && { startDate: filters.startDate }),
        ...(filters.endDate?.trim() && { endDate: filters.endDate }),
        ...(filters.searchQuery?.trim() && { search: filters.searchQuery }),
      };

      // তোমার backend রাউট: router.get('/allSession', ...)
      const response = await axios.get('/allSession', { params });

      if (response.data?.success) {
        const sessionsData = response.data.data || [];
        setSessions(sessionsData);

        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching admin sessions:', error);
      setSessions([]);
    }
  };

  // ✅ আপডেটেড: Fetch my sessions - তোমার backend রাউট অনুযায়ী
  const fetchMySessions = async () => {
    try {
      // তোমার backend রাউট: router.get('/sessions/my-sessions', ...)
      const response = await axios.get('/sessions/my-sessions');
      
      if (response.data && (response.data.status === 'success' || response.data.success)) {
        const sessionsData = response.data.data || [];
        setSessions(sessionsData);
        
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total || sessionsData.length,
            pages: response.data.pagination.pages || 1
          }));
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    }
  };

  // ✅ আপডেটেড: Fetch admin stats
  const fetchAdminStats = async () => {
    try {
      // তোমার backend রাউট: router.get('/admin/statistics', ...)
      const response = await axios.get('/admin/statistics');
      
      if (response.data && (response.data.status === 'success' || response.data.success)) {
        const data = response.data.data || {};
        setStats(prev => ({
          ...prev,
          totalSessions: data.totalSessions || 0,
          activeSessions: data.activeSessions || 0,
          avgDuration: data.avgDuration || '0h',
          attendanceRate: data.attendanceRate || '0%'
        }));
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  // ✅ আপডেটেড: Fetch my stats
  const fetchMyStats = async () => {
    try {
      // তোমার backend রাউট: router.get('/sessions/stats/attendance', ...)
      const response = await axios.get('/sessions/sessions/stats/attendance');
      
      if (response.data && (response.data.status === 'success' || response.data.success)) {
        const data = response.data.data || {};
        
        setStats(prev => ({
          ...prev,
          totalSessions: data.totalSessions || 0,
          totalHours: data.totalHoursWorked ? `${data.totalHoursWorked}h` : '0h',
          daysClockedIn: data.daysClockedIn || 0,
          attendanceRate: data.attendanceRate || '0%',
          avgDuration: data.totalDurationHours ? `${data.totalDurationHours}h` : '0h'
        }));
      }
    } catch (error) {
      console.error('Error fetching my stats:', error);
    }
  };

  // ✅ আপডেটেড: Fetch my current session
  const fetchMyCurrentSession = async () => {
    try {
      // তোমার backend রাউট: router.get('/my-current-session', ...)
      const response = await axios.get('/sessions/my-current-session');
      
      if (response.data && (response.data.status === 'success' || response.data.success)) {
        setCurrentSession(response.data.data);
      } else {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
      setCurrentSession(null);
    }
  };

  // ✅ NEW: Clock In function
  const handleClockIn = async () => {
    try {
      setClockingIn(true);
      // তোমার backend রাউট: router.post('/clock-in', ...)
      const response = await axios.post('/sessions/clock-in');
      
      if (response.data?.success) {
        alert('Successfully clocked in!');
        await fetchMyCurrentSession();
        await fetchMySessions();
      } else {
        alert(response.data?.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      alert(error.response?.data?.message || 'Failed to clock in');
    } finally {
      setClockingIn(false);
    }
  };

  // ✅ NEW: Clock Out function
  const handleClockOut = async () => {
    try {
      setClockingOut(true);
      // তোমার backend রাউট: router.post('/clock-out', ...)
      const response = await axios.post('/sessions/clock-out');
      
      if (response.data?.success) {
        alert('Successfully clocked out!');
        await fetchMyCurrentSession();
        await fetchMySessions();
      } else {
        alert(response.data?.message || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      alert(error.response?.data?.message || 'Failed to clock out');
    } finally {
      setClockingOut(false);
    }
  };

  // ✅ NEW: Delete session (admin only)
  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      // তোমার backend রাউট: router.delete('/admin/session/:id', ...)
      const response = await axios.delete(`/sessions/admin/session/${sessionId}`);
      
      if (response.data?.success) {
        alert('Session deleted successfully!');
        await fetchAdminSessions(pagination.page);
      } else {
        alert('Failed to delete session');
      }
    } catch (error) {
      console.error('Delete session error:', error);
      alert('Failed to delete session');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    const userType = getUserType();
    const promises = [];
    
    if (userType === 'admin') {
      promises.push(fetchAdminSessions(pagination.page));
      promises.push(fetchAdminStats());
    } else {
      promises.push(fetchMySessions());
      promises.push(fetchMyStats());
      promises.push(fetchMyCurrentSession());
    }
    
    await Promise.all(promises);
  };

  // Export sessions
  const handleExport = async () => {
    try {
      const userType = getUserType();
      const endpoint = userType === 'admin' 
        ? '/sessions/admin/export' 
        : '/sessions/export';
      
      const response = await axios.get(endpoint, {
        responseType: 'blob',
        params: filters
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sessions-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export sessions');
    }
  };

  // Initialize on component mount
  useEffect(() => {
    verifyAndFetchUser();
  }, []);

  // Handle filter changes for admin
  useEffect(() => {
    if (getUserType() === 'admin') {
      const timeoutId = setTimeout(() => {
        fetchAdminSessions(1);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.searchQuery, filters.status, filters.startDate, filters.endDate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              Your session has expired or you need to login first.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Go to Login
              </button>
              <button
                onClick={verifyAndFetchUser}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = getUserType() === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Session Management</h1>
                <p className="text-sm text-gray-600">
                  {isAdmin ? 'Admin Dashboard' : 'Employee Portal'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {userData?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{userData?.role}</p>
                </div> 
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 border-t border-gray-200">
          <div className="flex space-x-1 overflow-x-auto py-1"> 
            <NavTab
              icon={<Clock className="w-4 h-4" />}
              label="Sessions"
              active={activeView === 'sessions'}
              onClick={() => setActiveView('sessions')}
            />
            {isAdmin && (
              <>
                <NavTab
                  icon={<PieChart className="w-4 h-4" />}
                  label="Analytics"
                  active={activeView === 'analytics'}
                  onClick={() => setActiveView('analytics')}
                />
                <NavTab
                  icon={<Users className="w-4 h-4" />}
                  label="Users"
                  active={activeView === 'users'}
                  onClick={() => setActiveView('users')}
                />
              </>
            )}
            <NavTab
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              active={activeView === 'settings'}
              onClick={() => setActiveView('settings')}
            />
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6"> 
        {/* শুধু Sessions ভিউ */}
        {activeView === 'sessions' && (
          <SessionsView 
            isAdmin={isAdmin}
            sessions={sessions}
            filters={filters}
            setFilters={setFilters}
            pagination={pagination}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fetchAdminSessions={fetchAdminSessions}
            fetchMySessions={fetchMySessions}
            userData={userData}
            currentSession={currentSession}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onDeleteSession={handleDeleteSession}
            onExport={handleExport}
            onRefresh={handleRefresh}
            clockingIn={clockingIn}
            clockingOut={clockingOut}
          />
        )}

        {isAdmin && activeView === 'analytics' && (
          <AnalyticsView 
            stats={stats}
            sessions={sessions}
          />
        )}

        {isAdmin && activeView === 'users' && (
          <UsersView userData={userData} />
        )}

        {activeView === 'settings' && (
          <SettingsView userData={userData} isAdmin={isAdmin} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
          <div className="mb-2 sm:mb-0">
            <span>Session Management System v2.0</span>
            <span className="hidden sm:inline"> • </span>
            <span className="block sm:inline">
              Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="capitalize">Role: {userData?.role}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">User ID: {userData?._id?.substring(0, 8)}...</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Navigation Tab Component
const NavTab = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
      active 
        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span className="font-medium text-sm sm:text-base">{label}</span>
  </button>
);

// Sessions View Component
const SessionsView = ({ 
  isAdmin, 
  sessions, 
  filters, 
  setFilters, 
  pagination, 
  activeTab,
  setActiveTab,
  fetchAdminSessions,
  fetchMySessions,
  userData,
  currentSession,
  onClockIn,
  onClockOut,
  onDeleteSession,
  onExport,
  onRefresh,
  clockingIn,
  clockingOut
}) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Tabs definition
  const tabs = isAdmin 
    ? [
        { id: 'all', label: 'All Sessions', count: pagination.total },
        { id: 'active', label: 'Active', count: sessions.filter(s => s.status === 'active' || s.isActive).length },
        { id: 'completed', label: 'Completed', count: sessions.filter(s => s.status === 'completed' || s.isClockedOut).length },
      ]
    : [
        { id: 'my-sessions', label: 'My Sessions', count: sessions.length },
        { id: 'active', label: 'Active', count: sessions.filter(s => s.isActive).length },
        { id: 'completed', label: 'Completed', count: sessions.filter(s => s.isClockedOut || s.status === 'completed').length },
      ];

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'all' || activeTab === 'my-sessions') return true;
    if (activeTab === 'active') return session.isActive || session.status === 'active';
    if (activeTab === 'completed') return session.isClockedOut || session.status === 'completed';
    return true;
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      status: '',
      startDate: '',
      endDate: '',
      searchQuery: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Session Management</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {isAdmin 
                ? 'Monitor and manage all user sessions'
                : 'View and manage your work sessions and attendance'
              }
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Clock In/Out buttons for employees */}
            {!isAdmin && (
              <div className="flex gap-3">
                {currentSession?.isClockedIn ? (
                  <button
                    onClick={onClockOut}
                    disabled={clockingOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm sm:text-base disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {clockingOut ? 'Processing...' : 'Clock Out'}
                  </button>
                ) : (
                  <button
                    onClick={onClockIn}
                    disabled={clockingIn}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm sm:text-base disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    {clockingIn ? 'Processing...' : 'Clock In'}
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <button
              onClick={onExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm sm:text-base"
            >
              <DownloadCloud className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Current Session Status (for employees) */}
        {!isAdmin && currentSession && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Session Status</h3>
                  <p className="text-sm text-gray-600">
                    {currentSession.isClockedIn ? (
                      <>
                        Clocked in at {currentSession.formattedClockIn || '--:--'} • 
                        Duration: {currentSession.formattedDuration || '0m'}
                      </>
                    ) : (
                      'No active session'
                    )}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSession.isClockedIn 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentSession.isClockedIn ? 'Working' : 'Not Clocked In'}
              </span>
            </div>
          </div>
        )}

        {/* Filters - Admin Only */}
        {isAdmin && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by user..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="clocked-in">Clocked In</option>
              <option value="clocked-out">Clocked Out</option>
            </select>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full min-w-[24px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table */}
<div className="bg-white rounded-2xl shadow-lg border border-gray-200">
  {/* Header with Summary */}
  <div className="p-6 border-b border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Session History</h2>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {sessions.filter(s => s.isActive).length}
              </span> Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {sessions.filter(s => s.isClockedIn).length}
              </span> Clocked In
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {sessions.filter(s => s.isClockedOut).length}
              </span> Completed
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Session Cards - Grid Layout */}
  <div className="p-6">
    {filteredSessions.length > 0 ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSessions.map((session, index) => (
          <div 
            key={session.id || session._id || index}
            className="group relative bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${
              session.isActive 
                ? 'bg-green-500' 
                : session.isClockedIn 
                ? 'bg-blue-500' 
                : 'bg-gray-400'
            }`}></div>

            <div className="pl-5 pr-6 py-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {session.userName || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {session.userEmail || 'No email'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="ml-auto">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        session.isActive
                          ? 'bg-green-100 text-green-800'
                          : session.isClockedIn
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.isActive ? 'Active' : 
                         session.isClockedIn ? 'Clocked In' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Session Date & Time */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Session Date</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(session.loginAt || session.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(session.loginAt || session.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Clock In/Out Times */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-green-600" />
                        </div>
                        <p className="text-xs font-medium text-gray-700">Clock In</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {session.formattedClockIn || '--:--'}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-red-600" />
                        </div>
                        <p className="text-xs font-medium text-gray-700">Clock Out</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {session.formattedClockOut || '--:--'}
                      </p>
                    </div>
                  </div>

                  {/* Duration & Device Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
                          <p className="text-sm font-bold text-blue-700">
                            {session.formattedDuration || '0m'}
                          </p>
                        </div>
                        {session.formattedTotalHours && (
                          <span className="text-xs text-gray-500">
                            ({session.formattedTotalHours})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Device</p>
                      <div className="flex items-center gap-2">
                        {session.device?.toLowerCase().includes('mobile') ? (
                          <Smartphone className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Laptop className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700 truncate max-w-[120px]">
                          {session.device || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {session.ip && (
                    <span className="text-xs text-gray-500">
                      IP: {session.ip}
                    </span>
                  )}
                  {session.autoLogout && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Auto logout
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSessionClick(session)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => onDeleteSession(session.id || session._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={() => alert('More options')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No sessions found
          </h3>
          <p className="text-gray-600 mb-8">
            {activeTab !== 'all' && activeTab !== 'my-sessions'
              ? `There are no ${activeTab} sessions available`
              : 'No sessions match your current filters. Try adjusting your search or filters.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                clearFilters();
                onRefresh();
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear Filters
            </button>
            <button
              onClick={onRefresh}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Pagination */}
  {filteredSessions.length > 0 && pagination.total > pagination.limit && (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          <span className="font-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} sessions
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => isAdmin ? fetchAdminSessions(pagination.page - 1) : fetchMySessions()}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => isAdmin ? fetchAdminSessions(pageNum) : fetchMySessions()}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    pagination.page === pageNum
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white border border-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => isAdmin ? fetchAdminSessions(pagination.page + 1) : fetchMySessions()}
            disabled={pagination.page === pagination.pages}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div> 
      </div>
    </div>
  )}
</div>

      {/* Session Details Modal */}
      {showDetails && selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          isAdmin={isAdmin}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

// Analytics View Component (Admin Only)
const AnalyticsView = ({ stats, sessions }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
      <p className="text-gray-600 mb-8">Analytics features coming soon...</p>
    </div>
  );
};

// Users View Component (Admin Only)
const UsersView = ({ userData }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
      <p className="text-gray-600 mb-8">User management features coming soon...</p>
    </div>
  );
};

// Settings View Component
const SettingsView = ({ userData, isAdmin }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
        <p className="text-gray-600 mb-8">Settings features coming soon...</p>
      </div>
    </div>
  );
};

// Session Details Modal Component
const SessionDetailsModal = ({ session, isAdmin, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Session Details</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(session.loginAt || session.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Information */}
            {isAdmin && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </h4>
                <div className="space-y-4">
                  {session.userName && (
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{session.userName}</p>
                    </div>
                  )}
                  {session.userEmail && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{session.userEmail}</p>
                    </div>
                  )}
                  {session.userRole && (
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium capitalize">{session.userRole}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Information */}
            <div className={`rounded-xl p-6 ${
              session.isActive ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Session Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Login Time</p>
                  <p className="font-medium">
                    {new Date(session.loginAt || session.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{session.formattedDuration || '0m'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clock In</p>
                  <p className="font-medium">{session.formattedClockIn || '--:--'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clock Out</p>
                  <p className="font-medium">{session.formattedClockOut || '--:--'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="font-medium">{session.formattedTotalHours || '0 hours'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    session.isActive
                      ? 'bg-green-100 text-green-800'
                      : session.isClockedIn
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.isActive ? 'Active' : 
                     session.isClockedIn ? 'Clocked In' : 'Completed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Information */}
            <div className="bg-gray-50 rounded-xl p-6 lg:col-span-2">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Laptop className="w-5 h-5" />
                Device Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Device</p>
                  <p className="font-medium">{session.device || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Browser</p>
                  <p className="font-medium">{session.browser || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">OS</p>
                  <p className="font-medium">{session.os || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="font-medium">{session.ip || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};