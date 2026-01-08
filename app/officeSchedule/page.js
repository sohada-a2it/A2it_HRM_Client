"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://a2ithrmserver-2.onrender.com/api/v1";

export default function page() {
  // State management
  const [currentRole, setCurrentRole] = useState('employee');
  const [currentToken, setCurrentToken] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overrideHistory, setOverrideHistory] = useState([]);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  
  // Token input state
  const [tokenInput, setTokenInput] = useState({
    adminToken: '',
    employeeToken: ''
  });
  
  // Override form state
  const [overrideData, setOverrideData] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    weeklyOffDays: ['Friday', 'Saturday']
  });

  // Days of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check localStorage on component mount
  useEffect(() => {
    const checkTokens = () => {
      if (typeof window !== 'undefined') {
        const adminToken = localStorage.getItem('adminToken');
        const employeeToken = localStorage.getItem('employeeToken');
        
        if (adminToken) {
          // Admin is logged in
          setCurrentRole('admin');
          setCurrentToken(adminToken);
          fetchSchedule(adminToken);
          // Fetch override history immediately
          fetchOverrideHistory(adminToken);
        } else if (employeeToken) {
          // Employee is logged in
          setCurrentRole('employee');
          setCurrentToken(employeeToken);
          fetchSchedule(employeeToken);
        } else {
          // No one is logged in - default to employee view
          setCurrentRole('employee');
          // Show token input option
          setShowTokenInput(true);
        }
      }
    };

    checkTokens();
  }, []);

  // Create axios instance with token
  const getApiInstance = (token) => {
    return axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  };

  // Fetch schedule data
  const fetchSchedule = async (token = null) => {
    try {
      setLoading(true);
      const api = getApiInstance(token || currentToken);
      const response = await api.get('/weekly-off');
      
      if (response.data.status === 'success') {
        setSchedule(response.data);
      } else {
        toast.error('Failed to fetch schedule');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      
      if (error.response?.status === 401) {
        toast.error('Token expired or invalid');
        handleLogout();
      } else if (error.response?.status === 403) {
        toast.error('Access denied for this role');
      } else {
        // Fallback to default schedule
        setSchedule({
          status: "success",
          weeklyOffDays: ["Friday", "Saturday"],
          override: false
        });
        toast.info('Using default schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch override history (admin only) - FIXED TO ALWAYS FETCH
  const fetchOverrideHistory = async (token = null) => {
    if (currentRole !== 'admin') return;

    try {
      const api = getApiInstance(token || currentToken);
      const response = await api.get('/override/history');
      if (response.data.status === 'success') {
        setOverrideHistory(response.data.overrides || []);
        console.log('Override history fetched:', response.data.overrides?.length);
      } else {
        console.log('No override history found');
        setOverrideHistory([]);
      }
    } catch (error) {
      console.error('Error fetching override history:', error);
      setOverrideHistory([]);
    }
  };

  // Handle Admin Token Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    
    const { adminToken } = tokenInput;
    
    if (!adminToken || adminToken.length < 10) {
      toast.error('Please enter a valid admin token');
      return;
    }

    // Save to localStorage
    localStorage.setItem('adminToken', adminToken);
    localStorage.removeItem('employeeToken');
    
    // Update state
    setCurrentToken(adminToken);
    setCurrentRole('admin');
    setShowTokenInput(false);
    
    toast.success('Admin login successful');
    
    // Fetch data - IMPORTANT: Fetch override history immediately
    fetchSchedule(adminToken);
    fetchOverrideHistory(adminToken);
    
    // Clear input
    setTokenInput({ ...tokenInput, adminToken: '' });
  };

  // Handle Employee Token Login
  const handleEmployeeLogin = (e) => {
    e.preventDefault();
    
    const { employeeToken } = tokenInput;
    
    if (!employeeToken || employeeToken.length < 10) {
      toast.error('Please enter a valid employee token');
      return;
    }

    // Save to localStorage
    localStorage.setItem('employeeToken', employeeToken);
    localStorage.removeItem('adminToken');
    
    // Update state
    setCurrentToken(employeeToken);
    setCurrentRole('employee');
    setShowTokenInput(false);
    
    toast.success('Employee login successful');
    
    // Fetch data
    fetchSchedule(employeeToken);
    
    // Clear input
    setTokenInput({ ...tokenInput, employeeToken: '' });
  };

  // Handle logout
  // const handleLogout = () => {
  //   localStorage.removeItem('adminToken');
  //   localStorage.removeItem('employeeToken');
    
  //   setCurrentToken(null);
  //   setCurrentRole('employee');
  //   setSchedule(null);
  //   setOverrideHistory([]);
  //   setShowTokenInput(true);
    
  //   toast.success('Logged out successfully');
  // };

  // Update schedule (admin only)
  const updateSchedule = async (weeklyOffDays) => {
    if (currentRole !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    try {
      setLoading(true);
      const api = getApiInstance(currentToken);
      const response = await api.put('/updateWeekly-off', { weeklyOffDays });
      
      if (response.data.status === 'success') {
        toast.success('Schedule updated successfully');
        fetchSchedule();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Admin access required.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired');
        handleLogout();
      } else {
        toast.error('Failed to update schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create override (admin only) - FIXED TO REFRESH HISTORY
  const createOverride = async () => {
    if (currentRole !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    try {
      setLoading(true);
      const api = getApiInstance(currentToken);
      
      const dataToSend = {
        startDate: overrideData.startDate.toISOString().split('T')[0],
        endDate: overrideData.endDate.toISOString().split('T')[0],
        weeklyOffDays: overrideData.weeklyOffDays
      };

      const response = await api.put('/override', dataToSend);
      
      if (response.data.status === 'success') {
        toast.success('Override created successfully');
        setShowOverrideForm(false);
        
        // Reset override form
        setOverrideData({
          startDate: new Date(),
          endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
          weeklyOffDays: ['Friday', 'Saturday']
        });
        
        // IMPORTANT: Refresh both schedule AND history
        fetchSchedule();
        setTimeout(() => {
          fetchOverrideHistory();
        }, 500); // Small delay to ensure backend has processed
        
      } else {
        toast.error('Override creation failed');
      }
    } catch (error) {
      console.error('Error creating override:', error);
      
      if (error.response?.status === 403) {
        toast.error('Permission denied. Admin access required.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired');
        handleLogout();
      } else {
        toast.error('Failed to create override');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete override (admin only) - FIXED TO REFRESH HISTORY
  const deleteOverride = async (id) => {
    if (currentRole !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    if (!confirm('Are you sure you want to delete this override?')) return;

    try {
      setLoading(true);
      const api = getApiInstance(currentToken);
      const response = await api.delete(`/overrideDelete/${id}`);
      
      if (response.data.status === 'success') {
        toast.success('Override deleted successfully');
        
        // IMPORTANT: Refresh both schedule AND history
        fetchSchedule();
        setTimeout(() => {
          fetchOverrideHistory();
        }, 500); // Small delay to ensure backend has processed
        
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting override:', error);
      toast.error('Failed to delete override');
    } finally {
      setLoading(false);
    }
  };

  // Toggle day for override
  const toggleOverrideDay = (day) => {
    const updatedDays = overrideData.weeklyOffDays.includes(day)
      ? overrideData.weeklyOffDays.filter(d => d !== day)
      : [...overrideData.weeklyOffDays, day];

    setOverrideData({
      ...overrideData,
      weeklyOffDays: updatedDays
    });
  };

  // Toggle day in schedule (admin only)
  const toggleScheduleDay = (day) => {
    if (currentRole !== 'admin') return;

    if (!schedule) return;

    const updatedDays = schedule.weeklyOffDays.includes(day)
      ? schedule.weeklyOffDays.filter(d => d !== day)
      : [...schedule.weeklyOffDays, day];

    setSchedule({
      ...schedule,
      weeklyOffDays: updatedDays
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Refresh everything - New function to refresh all data
  const refreshAllData = () => {
    if (!currentToken) return;
    
    fetchSchedule();
    if (currentRole === 'admin') {
      fetchOverrideHistory();
    }
  };

  // Render Token Input Modal
  const renderTokenInputModal = () => {
    if (!showTokenInput) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Office Schedule Access</h2>
            <p className="text-gray-600 mt-2">Select your role to continue</p>
          </div>

          <div className="space-y-6">
            {/* Admin Token Input */}
            <div className="border-2 border-purple-300 rounded-xl p-5 bg-purple-50">
              <h3 className="font-semibold text-purple-800 mb-3">Admin Access</h3>
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <input
                  type="text"
                  value={tokenInput.adminToken}
                  onChange={(e) => setTokenInput({...tokenInput, adminToken: e.target.value})}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter admin token"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-all"
                >
                  Login as Admin
                </button>
              </form>
              <p className="text-xs text-purple-600 mt-2">
                Full access: Edit schedule, create overrides, view history
              </p>
            </div>

            {/* Employee Token Input */}
            <div className="border-2 border-blue-300 rounded-xl p-5 bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-3">Employee Access</h3>
              <form onSubmit={handleEmployeeLogin} className="space-y-3">
                <input
                  type="text"
                  value={tokenInput.employeeToken}
                  onChange={(e) => setTokenInput({...tokenInput, employeeToken: e.target.value})}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee token"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 px-4 rounded-lg font-medium transition-all"
                >
                  Login as Employee
                </button>
              </form>
              <p className="text-xs text-blue-600 mt-2">
                View-only access: See schedule, no editing permissions
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Tokens are stored locally in your browser
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Token Input Modal */}
      {renderTokenInputModal()}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Office Schedule</h1>
                <p className="text-xs text-gray-500">
                  {currentRole === 'admin' ? 'Administrator Dashboard' : 'Employee View'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentRole === 'admin' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              }`}>
                {currentRole === 'admin' ? 'Administrator' : 'Employee'}
              </div>
              
              {currentToken && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={refreshAllData}
                    disabled={loading}
                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Refresh All
                  </button>
                  {/* <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all"
                  >
                    Logout
                  </button> */}
                </div>
              )}
              
              {!currentToken && (
                <button
                  onClick={() => setShowTokenInput(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Off Days This Week</p>
                <p className="text-3xl font-bold mt-2">
                  {schedule?.weeklyOffDays?.length || 2}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Working Days</p>
                <p className="text-3xl font-bold mt-2">
                  {7 - (schedule?.weeklyOffDays?.length || 2)}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl shadow-lg p-6 ${
            schedule?.override 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
          } text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Schedule Status</p>
                <p className="text-xl font-bold mt-2">
                  {schedule?.override ? 'Temporary Override' : 'Default Schedule'}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Schedule Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Weekly Schedule</h2>
                <p className="text-gray-600 mt-1">
                  {currentRole === 'admin' ? 'Click days to toggle, then save changes' : 'View-only schedule'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchSchedule()}
                  disabled={loading || !currentToken}
                  className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing
                    </span>
                  ) : 'Refresh Schedule'}
                </button>
                
                {currentRole === 'admin' && (
                  <button
                    onClick={() => setShowOverrideForm(!showOverrideForm)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/25"
                  >
                    {showOverrideForm ? 'Cancel Override' : 'Create Override'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="p-6">
            {loading && !schedule ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Loading schedule...</p>
              </div>
            ) : (
              <>
                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-3 mb-8">
                  {daysOfWeek.map((day, index) => {
                    const isOffDay = schedule?.weeklyOffDays?.includes(day);
                    return (
                      <div
                        key={day}
                        onClick={() => currentRole === 'admin' && toggleScheduleDay(day)}
                        className={`relative rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
                          isOffDay 
                            ? 'bg-gradient-to-br from-red-100 to-red-50 border-2 border-red-300' 
                            : 'bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-300'
                        } ${currentRole === 'admin' ? 'hover:scale-105 hover:shadow-lg' : 'cursor-default'}`}
                      >
                        <div className={`text-sm font-medium mb-2 ${isOffDay ? 'text-red-800' : 'text-green-800'}`}>
                          {shortDays[index]}
                        </div>
                        <div className={`text-2xl font-bold ${isOffDay ? 'text-red-600' : 'text-green-600'}`}>
                          {isOffDay ? 'OFF' : 'ON'}
                        </div>
                        {currentRole === 'admin' && (
                          <div className="absolute -top-2 -right-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isOffDay ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Schedule Info */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Current Schedule Details</h3>
                      <p className="text-gray-600">
                        Weekly off days: <span className="font-bold text-gray-900">
                          {schedule?.weeklyOffDays?.join(', ') || 'Friday, Saturday'}
                        </span>
                      </p>
                      {schedule?.override && (
                        <p className="text-amber-600 mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Temporary override is active
                        </p>
                      )}
                    </div>
                    
                    {currentRole === 'admin' && (
                      <div className="mt-4 md:mt-0">
                        <button
                          onClick={() => updateSchedule(schedule?.weeklyOffDays || ['Friday', 'Saturday'])}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-green-500/25 transition-all"
                        >
                          Save Changes
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Click days to toggle, then save
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Admin Override Form */}
        {currentRole === 'admin' && showOverrideForm && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create Temporary Override</h2>
              <p className="text-gray-600 mt-1">Set temporary schedule for specific dates</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <DatePicker
                      selected={overrideData.startDate}
                      onChange={(date) => setOverrideData({...overrideData, startDate: date})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      minDate={new Date()}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <DatePicker
                      selected={overrideData.endDate}
                      onChange={(date) => setOverrideData({...overrideData, endDate: date})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      minDate={overrideData.startDate}
                    />
                  </div>
                </div>

                {/* Days Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Off Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {shortDays.map((day, index) => {
                      const fullDay = daysOfWeek[index];
                      const isSelected = overrideData.weeklyOffDays.includes(fullDay);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleOverrideDay(fullDay)}
                          className={`py-3 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-sm font-medium">{day}</div>
                          <div className="text-xs mt-1">{isSelected ? 'OFF' : 'ON'}</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Selected: {overrideData.weeklyOffDays.join(', ')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={createOverride}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Override'}
                </button>
                <button
                  onClick={() => setShowOverrideForm(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Override History (Admin Only) - ALWAYS SHOW IF ADMIN */}
        {currentRole === 'admin' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Override History</h2>
                  <p className="text-gray-600 mt-1">Previous temporary schedules</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchOverrideHistory}
                    className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:from-blue-200 hover:to-blue-300"
                  >
                    Refresh History
                  </button>
                  <span className="text-sm text-gray-500">
                    {overrideHistory.length} overrides found
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {overrideHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No override history found</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first override to see it here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Off Days</th>
                       
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overrideHistory.map((override, index) => (
                        <tr key={override._id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(override.startDate)} - {formatDate(override.endDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Duration: {Math.ceil((new Date(override.endDate) - new Date(override.startDate)) / (1000 * 60 * 60 * 24)) + 1} days
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {override.weeklyOffDays.map((day, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                >
                                  {day.substring(0, 3)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              override.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {override.isActive ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => deleteOverride(override._id)}
                              className="px-3 py-1 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 rounded-lg text-sm font-medium transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Card for Employees */}
        {currentRole === 'employee' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mt-8">
            <div className="flex items-start">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Employee Information</h3>
                <p className="text-gray-600 mb-3">
                  As an employee, you have view-only access to the office schedule. 
                  You can see the regular weekly schedule and any temporary overrides that are in effect.
                </p>
                <div className="text-sm text-gray-500">
                  <p>• View current schedule and off days</p>
                  <p>• See if any temporary overrides are active</p>
                  <p>• Schedule updates in real-time</p>
                  <p>• Contact your administrator for schedule changes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-500">
                  Office Schedule System • Version 1.0.0
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {currentToken && (
                  <span className="inline-block px-3 py-1 bg-gray-100 rounded-full">
                    Token active • Role: {currentRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}