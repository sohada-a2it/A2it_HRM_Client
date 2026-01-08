"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Calendar, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  BarChart3,
  TrendingUp,
  Moon,
  Sun,
  Zap,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Printer,
  Share2,
  User,
  Shield,
  Loader2,
  LogIn,
  LogOut,
  Users,
  Home,
  Briefcase,
  Coffee,
  Activity,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function page({ userId }) {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [clockDetails, setClockDetails] = useState(() => {
    if (typeof window !== "undefined") {
      const storedDetails = localStorage.getItem("attendanceClockDetails");
      if (storedDetails) {
        try {
          return JSON.parse(storedDetails);
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  });
  
  const [showRecentDetails, setShowRecentDetails] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("attendanceShowDetails") === "true";
    }
    return false;
  });
  
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [todayStatus, setTodayStatus] = useState(() => {
    if (typeof window !== "undefined") {
      const storedToday = localStorage.getItem("attendanceTodayStatus");
      const todayDate = new Date().toDateString();
      const storedDate = localStorage.getItem("attendanceDate");
      
      if (storedDate !== todayDate) {
        localStorage.setItem("attendanceDate", todayDate);
        localStorage.removeItem("attendanceTodayStatus");
        localStorage.removeItem("attendanceClockDetails");
        localStorage.removeItem("attendanceShowDetails");
        return {
          clockedIn: false,
          clockedOut: false,
          clockInTime: null,
          clockOutTime: null,
          status: "Not Clocked",
          date: todayDate
        };
      }
      
      if (storedToday) {
        try {
          return JSON.parse(storedToday);
        } catch (error) {
          return {
            clockedIn: false,
            clockedOut: false,
            clockInTime: null,
            clockOutTime: null,
            status: "Not Clocked",
            date: todayDate
          };
        }
      }
    }
    
    return {
      clockedIn: false,
      clockedOut: false,
      clockInTime: null,
      clockOutTime: null,
      status: "Not Clocked",
      date: new Date().toDateString()
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("attendanceTodayStatus", JSON.stringify(todayStatus));
      localStorage.setItem("attendanceDate", todayStatus.date);
    }
  }, [todayStatus]);

  useEffect(() => {
    if (typeof window !== "undefined" && clockDetails) {
      localStorage.setItem("attendanceClockDetails", JSON.stringify(clockDetails));
    }
  }, [clockDetails]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("attendanceShowDetails", showRecentDetails.toString());
    }
  }, [showRecentDetails]);

  // Auto Clock-Out at 6:30 PM
  useEffect(() => {
    const checkAutoClockOut = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      // Check if it's 6:30 PM (18:30)
      if (currentHours === 18 && currentMinutes === 30) {
        if (todayStatus.clockedIn && !todayStatus.clockedOut && userRole === "employee") {
          handleAutoClockOut();
        }
      }
    };
    
    const interval = setInterval(checkAutoClockOut, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [todayStatus, userRole]);

  const handleAutoClockOut = async () => {
    if (userRole !== "employee") return;
    
    try {
      const token = getToken();
      
      if (!token) {
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auto-clock-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location: "Office - Auto",
          device: navigator.userAgent,
          autoClockOut: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        const newStatus = {
          ...todayStatus,
          clockedOut: true,
          clockOutTime: data.attendance?.clockOut || new Date().toISOString(),
          status: "Present (Auto)"
        };
        setTodayStatus(newStatus);
        
        if (data.attendance) {
          setClockDetails(data.attendance);
        }
        
        toast.success(`✓ Auto Clock Out at 6:30 PM successful`);
        
        // Refresh data
        await fetchTodayStatus();
        const roleInfo = { role: userRole, isAdmin, userData };
        await fetchSummary(roleInfo);
      }
    } catch (err) {
      console.error("Auto clock out error:", err);
    }
  };

  const getUserType = () => {
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("adminToken");
      const employeeToken = localStorage.getItem("employeeToken");
      
      if (adminToken) {
        return "admin";
      } else if (employeeToken) {
        return "employee";
      }
    }
    return null;
  };

  const getToken = () => {
    const userType = getUserType();
    if (userType === "admin") {
      return localStorage.getItem("adminToken");
    } else if (userType === "employee") {
      return localStorage.getItem("employeeToken");
    }
    return null;
  };

  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      const currentDate = now.toDateString();
      const storedDate = localStorage.getItem("attendanceDate");
      
      if (storedDate !== currentDate) {
        localStorage.setItem("attendanceDate", currentDate);
        localStorage.removeItem("attendanceTodayStatus");
        localStorage.removeItem("attendanceClockDetails");
        localStorage.setItem("attendanceShowDetails", "false");
        
        setTodayStatus({
          clockedIn: false,
          clockedOut: false,
          clockInTime: null,
          clockOutTime: null,
          status: "Not Clocked",
          date: currentDate
        });
        
        setClockDetails(null);
        setShowRecentDetails(false);
        
        toast.success("New day! Attendance reset.");
        
        if (userRole === "employee") {
          fetchTodayStatus();
        }
        if (userRole) {
          const roleInfo = { role: userRole, isAdmin, userData };
          fetchSummary(roleInfo);
        }
      }
    };
    
    const interval = setInterval(checkMidnightReset, 60000);
    
    return () => clearInterval(interval);
  }, [userRole, isAdmin, userData]);

  const fetchUserProfile = async () => {
    try {
      const userType = getUserType();
      const token = getToken();
      
      if (!token) {
        router.push("/");
        return { role: "employee", isAdmin: false, userData: null };
      }

      const endpoint = userType === "admin" 
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/getAdminProfile`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/getProfile`;

      const response = await fetch(endpoint, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        localStorage.clear();
        router.push("/");
        return { role: "employee", isAdmin: false, userData: null };
      }

      const data = await response.json();
      
      if (data.user || (data && typeof data === 'object' && (data.email || data._id))) {
        const userData = data.user || data;
        return { 
          role: userType, 
          isAdmin: userType === "admin", 
          userData 
        };
      } else {
        return { role: "employee", isAdmin: false, userData: null };
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      return { role: "employee", isAdmin: false, userData: null };
    }
  };

  // ================== Fetch Today's Status ==================
  const fetchTodayStatus = useCallback(async () => {
    try {
      const userType = getUserType();
      const token = getToken();
      
      if (!token || userType !== "employee") {
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/today`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const newStatus = {
          clockedIn: data.clockedIn || false,
          clockedOut: data.clockedOut || false,
          clockInTime: data.attendance?.clockIn || null,
          clockOutTime: data.attendance?.clockOut || null,
          status: data.attendance?.status || "Not Clocked",
          date: new Date().toDateString()
        };
        
        setTodayStatus(newStatus);
        
        if (data.attendance) {
          setClockDetails(data.attendance);
        }
      } else if (response.status === 401) {
        localStorage.clear();
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to fetch today's status:", error);
    }
  }, []);

  // ================== Fetch Summary ==================
  const fetchSummary = useCallback(async (roleInfo) => {
    setLoading(true);
    try {
      const token = getToken();
      
      if (!token) {
        router.push("/");
        return;
      }

      const query = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(roleInfo.isAdmin && userId && { employeeId: userId })
      }).toString();

      let endpoint;
      let headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      if (roleInfo.isAdmin) {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/admin/attendance/summary?${query}`;
      } else {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/summary?${query}`;
      }

      const response = await fetch(endpoint, { headers });

      if (response.ok) {
        const data = await response.json();
        if (roleInfo.isAdmin) {
          setSummary(data.summary || data);
        } else {
          setSummary(data.summary || data);
        }
      } else if (response.status === 401) {
        localStorage.clear();
        router.push("/");
      } else {
        setSummary(null);
      }
      
      await fetchAttendanceRecords(roleInfo);
    } catch (err) {
      console.error("Fetch summary error:", err);
      setSummary(null);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, userId]);

  // ================== Fetch Attendance Records ==================
  const fetchAttendanceRecords = useCallback(async (roleInfo) => {
    try {
      const token = getToken();
      
      if (!token) {
        return;
      }

      const query = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(roleInfo.isAdmin && userId && { employeeId: userId })
      }).toString();

      let endpoint;
      if (roleInfo.isAdmin) {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/admin/attendance/all?${query}`;
      } else {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/records?${query}`;
      }

      const response = await fetch(endpoint, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.records || data || []);
      } else if (response.status === 401) {
        localStorage.clear();
        router.push("/");
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error("Fetch records error:", error);
      setAttendance([]);
    }
  }, [dateRange, userId]);

  // ================== Initialize Data ==================
  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      const roleInfo = await fetchUserProfile();
      
      if (roleInfo) {
        setUserRole(roleInfo.role);
        setIsAdmin(roleInfo.isAdmin);
        setUserData(roleInfo.userData);
        
        if (roleInfo.role === "employee") {
          await fetchTodayStatus();
        }
        
        await fetchSummary(roleInfo);
      }
    } catch (error) {
      console.error("Initialize data error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchTodayStatus, fetchSummary]);

  // ================== Handle Refresh ==================
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const roleInfo = { role: userRole, isAdmin, userData };
      
      if (userRole === "employee") {
        await fetchTodayStatus();
      }
      
      await fetchSummary(roleInfo);
      toast.success("Data refreshed");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  // ================== View Attendance Details ==================
  const handleViewDetails = async (attendanceId) => {
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/${attendanceId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClockDetails(data.attendance);
        setShowRecentDetails(true);
        
        toast.success("Attendance details loaded");
      } else {
        toast.error("Failed to load attendance details");
      }
    } catch (err) {
      console.error("View details error:", err);
      toast.error("Error loading attendance details");
    }
  };

  // ================== Toggle Details Visibility ==================
  const toggleDetailsVisibility = () => {
    setShowRecentDetails(!showRecentDetails);
  };

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // ================== Clock In ==================
  const handleClockIn = async () => {
    if (userRole !== "employee") {
      toast.error("Only employees can clock in/out");
      return;
    }
    
    setLoading(true);
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location: "Office",
          device: navigator.userAgent
        })
      });

      const data = await response.json();

      if (response.ok) {
        const newStatus = {
          ...todayStatus,
          clockedIn: true,
          clockInTime: data.attendance?.clockIn || new Date().toISOString(),
          status: "Clocked In"
        };
        setTodayStatus(newStatus);
        
        if (data.attendance) {
          setClockDetails(data.attendance);
        }
        setShowRecentDetails(true);
        
        toast.success(`✓ ${data.message || "Clock In successful"}`);
        
        await fetchTodayStatus();
        const roleInfo = { role: userRole, isAdmin, userData };
        await fetchSummary(roleInfo);
      } else {
        toast.error(data.message || "Failed to clock in");
      }
    } catch (err) {
      console.error("Clock in error:", err);
      toast.error("Clock In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ================== Clock Out ==================
  const handleClockOut = async () => {
    if (userRole !== "employee") {
      toast.error("Only employees can clock in/out");
      return;
    }
    
    setLoading(true);
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clock-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location: "Office",
          device: navigator.userAgent
        })
      });

      const data = await response.json();

      if (response.ok) {
        const newStatus = {
          ...todayStatus,
          clockedOut: true,
          clockOutTime: data.attendance?.clockOut || new Date().toISOString(),
          status: "Present"
        };
        setTodayStatus(newStatus);
        
        if (data.attendance) {
          setClockDetails(data.attendance);
        }
        setShowRecentDetails(true);
        
        toast.success(`✓ ${data.message || "Clock Out successful"}`);
        
        await fetchTodayStatus();
        const roleInfo = { role: userRole, isAdmin, userData };
        await fetchSummary(roleInfo);
      } else {
        toast.error(data.message || "Failed to clock out");
      }
    } catch (err) {
      console.error("Clock out error:", err);
      toast.error("Clock Out failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ================== Admin Correct Attendance ==================
  const handleCorrectAttendance = async (attendanceId) => {
    if (userRole !== "admin") {
      toast.error("Only admin can correct attendance");
      return;
    }
    
    const clockIn = prompt("Enter new Clock In time (HH:mm, e.g., 09:00)", "09:00"); 
    const clockOut = prompt("Enter new Clock Out time (HH:mm, e.g., 18:00)", "18:00");
    const status = prompt("Enter status (present / absent / leave / late / govt holiday / weekly off / off day)", "present");

    if (!attendanceId || (!clockIn && !clockOut && !status)) return;

    try {
      const token = getToken();
      
      const today = new Date().toISOString().split('T')[0];
      const clockInFull = clockIn ? `${today}T${clockIn}:00` : null;
      const clockOutFull = clockOut ? `${today}T${clockOut}:00` : null;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/attendance/correct//${attendanceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          clockIn: clockInFull,
          clockOut: clockOutFull,
          status: status.toLowerCase()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("✓ Attendance corrected successfully!");
        const roleInfo = { role: userRole, isAdmin, userData };
        await fetchSummary(roleInfo);
      } else {
        toast.error(data.message || "Failed to correct attendance");
      }
    } catch (err) {
      console.error("Correction error:", err);
      toast.error("Correction failed. Please try again.");
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(attendance.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = attendance.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeFromISO = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const formatDateDisplay = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'leave': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'govt holiday': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'weekly off': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'off day': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'clocked in': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTodayStatusText = () => {
    if (todayStatus.clockedOut) return "Clocked Out";
    if (todayStatus.clockedIn) return "Clocked In";
    return "Not Clocked In";
  };

  const getTodayStatusColor = () => {
    if (todayStatus.clockedOut) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (todayStatus.clockedIn) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && !userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading attendance...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 overflow-hidden">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Attendance Management
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-gray-600">
                  {isAdmin ? "Manage all employee attendance" : "Track your attendance"}
                </p>
                {userRole && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    isAdmin 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800' 
                      : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                  }`}>
                    {isAdmin ? <Shield size={12} /> : <User size={12} />}
                    {userRole.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <div className="text-right">
                <div className="text-sm text-gray-500">Current Time</div>
                <div className="text-xl font-bold text-purple-700">{formatTime(currentTime)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(new Date().toISOString())}
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              {isAdmin && (
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Printer size={18} />
                  Print Report
                </button>
              )}
            </div>
          </div>

          {/* Clock In/Out Card - Only for Employees */}
          {userRole === "employee" && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-gray-100 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="text-purple-600" size={24} />
                    Today's Attendance
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {formatDate(new Date().toISOString())}
                    <span className="ml-2 text-xs text-purple-500">
                      • Auto clock-out at 6:30 PM
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleClockIn}
                    disabled={loading || todayStatus.clockedIn || todayStatus.clockedOut}
                    className="group px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                    {todayStatus.clockedIn || todayStatus.clockedOut ? "Clocked In" : "Clock In"}
                  </button>
                  <button
                    onClick={handleClockOut}
                    disabled={loading || !todayStatus.clockedIn || todayStatus.clockedOut}
                    className="group px-6 py-3.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    {todayStatus.clockedOut ? "Clocked Out" : "Clock Out"}
                  </button>
                  
                  {(clockDetails || todayStatus.clockedIn) && (
                    <button
                      onClick={toggleDetailsVisibility}
                      className="group px-4 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {showRecentDetails ? (
                        <>
                          <EyeOff size={20} className="group-hover:scale-110 transition-transform" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <Eye size={20} className="group-hover:scale-110 transition-transform" />
                          Show Details
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${
                    todayStatus.clockedIn 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sun className={todayStatus.clockedIn ? "text-green-600" : "text-gray-400"} size={20} />
                        <span className="font-medium text-gray-700">Clock In</span>
                      </div>
                      {todayStatus.clockedIn && (
                        <CheckCircle className="text-green-600 animate-pulse" size={20} />
                      )}
                    </div>
                    <div className="text-sm">
                      {todayStatus.clockedIn ? (
                        <div>
                          <div className="font-semibold text-green-700">✓ Completed</div>
                          <div className="text-green-600 mt-1 font-mono">
                            {formatTimeFromISO(todayStatus.clockInTime)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Not clocked in yet</div>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all duration-300 ${
                    todayStatus.clockedOut 
                      ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Moon className={todayStatus.clockedOut ? "text-blue-600" : "text-gray-400"} size={20} />
                        <span className="font-medium text-gray-700">Clock Out</span>
                      </div>
                      {todayStatus.clockedOut && (
                        <CheckCircle className="text-blue-600" size={20} />
                      )}
                    </div>
                    <div className="text-sm">
                      {todayStatus.clockedOut ? (
                        <div>
                          <div className="font-semibold text-blue-700">✓ Completed</div>
                          <div className="text-blue-600 mt-1 font-mono">
                            {formatTimeFromISO(todayStatus.clockOutTime)}
                          </div>
                        </div>
                      ) : todayStatus.clockedIn ? (
                        <div className="text-yellow-600 flex items-center gap-1">
                          <Clock size={14} />
                          Waiting to clock out
                        </div>
                      ) : (
                        <div className="text-gray-500">Clock in first</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:border-purple-200 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="text-purple-600" size={20} />
                        <span className="font-medium text-gray-700">Today's Status</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        todayStatus.clockedOut ? 'bg-blue-500' :
                        todayStatus.clockedIn ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="text-sm">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTodayStatusColor()}`}>
                        {getTodayStatusText()}
                      </div>
                      {todayStatus.clockedIn && todayStatus.clockedOut && (
                        <div className="text-xs text-gray-500 mt-2">
                          ✅ Attendance completed for today
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Info Card */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 shadow-xl border border-purple-100 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Shield className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    View and manage all employee attendance records. You can edit attendance and generate reports.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="text-gray-500" size={16} />
                    <div className="text-sm text-gray-500">Total Employees</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalEmployees || 0}</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-green-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="text-green-500" size={16} />
                    <div className="text-sm text-gray-500">Active Today</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">{summary?.presentToday || 0}</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-red-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="text-red-500" size={16} />
                    <div className="text-sm text-gray-500">Absent Today</div>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">{summary?.absentToday || 0}</div>
                </div>
              </div>
            </div>
          )}

          {(clockDetails && showRecentDetails) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-xl border border-blue-100 mb-8 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="text-blue-600" size={24} />
                  Recent Clock Details
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleDetailsVisibility}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
                  >
                    <EyeOff size={16} />
                    Hide
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(clockDetails, null, 2));
                      toast.success("Details copied to clipboard!");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300"
                  >
                    <FileText size={16} />
                    Copy JSON
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Date</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDateDisplay(clockDetails.date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(clockDetails.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                {clockDetails.clockIn && (
                  <div className="p-4 bg-white rounded-xl border border-green-100 hover:border-green-200 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun size={16} className="text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Clock In</span>
                    </div>
                    <div className="text-lg font-semibold text-green-700">
                      {new Date(clockDetails.clockIn).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateDisplay(clockDetails.clockIn)}
                    </div>
                  </div>
                )}
                
                {clockDetails.clockOut && (
                  <div className="p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Clock Out</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-700">
                      {new Date(clockDetails.clockOut).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateDisplay(clockDetails.clockOut)}
                    </div>
                  </div>
                )}
                
                {clockDetails.totalHours > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-purple-100 hover:border-purple-200 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Total Hours</span>
                    </div>
                    <div className="text-lg font-semibold text-purple-700">
                      {parseFloat(clockDetails.totalHours).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Hours worked
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    clockDetails.status === 'Present' ? 'bg-green-100 text-green-800' : 
                    clockDetails.status === 'Absent' ? 'bg-red-100 text-red-800' : 
                    clockDetails.status === 'Leave' ? 'bg-blue-100 text-blue-800' : 
                    clockDetails.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                    clockDetails.status === 'Clocked In' ? 'bg-blue-100 text-blue-800' : 
                    clockDetails.status === 'Govt Holiday' ? 'bg-purple-100 text-purple-800' :
                    clockDetails.status === 'Weekly Off' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {clockDetails.status}
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Device</span>
                  </div>
                  <div className="text-sm text-gray-900 space-y-1">
                    <div className="flex items-center gap-1">
                      <Briefcase size={12} className="text-gray-400" />
                      <span>Type: {clockDetails.device?.type || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Home size={12} className="text-gray-400" />
                      <span>OS: {clockDetails.device?.os || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coffee size={12} className="text-gray-400" />
                      <span>Browser: {clockDetails.device?.browser || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">IP Address</span>
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    {clockDetails.ipAddress || 'Unknown'}
                  </div>
                </div>
                
                {clockDetails.correctedByAdmin && (
                  <div className="p-4 bg-white rounded-xl border border-orange-100 hover:border-orange-200 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit size={16} className="text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Admin Correction</span>
                    </div>
                    <div className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                      Corrected by Admin
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Modified by administrator
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-100 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const today = new Date().toDateString();
                    localStorage.setItem("attendanceDate", today);
                    localStorage.removeItem("attendanceTodayStatus");
                    localStorage.removeItem("attendanceClockDetails");
                    localStorage.setItem("attendanceShowDetails", "false");
                    
                    setTodayStatus({
                      clockedIn: false,
                      clockedOut: false,
                      clockInTime: null,
                      clockOutTime: null,
                      status: "Not Clocked",
                      date: today
                    });
                    
                    setClockDetails(null);
                    setShowRecentDetails(false);
                    
                    toast.success("Local storage cleared for new day");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <RefreshCw size={16} />
                  Simulate New Day
                </button>
                <button
                  onClick={() => {
                    setShowRecentDetails(false);
                    toast.success("Details hidden");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <EyeOff size={16} />
                  Close Details
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Days Present</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.daysPresent || 0}</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center">
                    <TrendingUp size={12} className="mr-1" />
                    Current period
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Days Absent</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.daysAbsent || 0}</p>
                  <p className="text-xs text-red-500 mt-1">Needs attention</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <XCircle className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.totalHours?.toFixed(2) || "0.00"}</p>
                  <p className="text-xs text-blue-500 mt-1">Total for period</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Clock className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Attendance Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.attendanceRate?.toFixed(1) || "0.0"}%</p>
                  <p className="text-xs text-purple-500 mt-1 flex items-center">
                    <BarChart3 size={12} className="mr-1" />
                    Performance
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className=" ">
            <div className=" ">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-full">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
                      <p className="text-gray-500 text-sm">
                        Showing {currentItems.length} of {attendance.length} records
                        {userId && ` for Employee ID: ${userId}`}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex gap-2">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full transition-all duration-300"
                          />
                        </div>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full transition-all duration-300"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setCurrentPage(1);
                            handleRefresh();
                          }}
                          disabled={loading}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Filter size={18} />
                          Apply Filter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[calc(100%-80px)] overflow-auto">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="inline-flex flex-col items-center">
                        <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
                        <p className="text-gray-600 font-medium">Loading attendance records...</p>
                      </div>
                    </div>
                  ) : attendance.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No attendance records</h3>
                        <p className="text-gray-500 max-w-md">
                          No records found for the selected date range
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10">
                            <tr>
                              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                              {isAdmin && <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Employee</th>}
                              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Clock In</th>
                              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Clock Out</th>
                              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Total Hours</th>
                              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {currentItems.map((a) => (
                              <tr key={a._id} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-4 px-6">
                                  <div className="font-medium text-gray-900">
                                    {new Date(a.date).toLocaleDateString('en-US', { 
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </td>
                                {isAdmin && (
                                  <td className="py-4 px-6">
                                    <div className="font-medium text-gray-900">
                                      {a.employee?.firstName ? `${a.employee.firstName} ${a.employee.lastName}` : `Employee ${a.employee?._id?.slice(-6) || 'N/A'}`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {a.employee?.email || ''}
                                    </div>
                                  </td>
                                )}
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                                    <span className="font-medium">{formatTimeFromISO(a.clockIn)}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <Moon className="w-4 h-4 mr-2 text-indigo-500" />
                                    <span className="font-medium">{formatTimeFromISO(a.clockOut)}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                    <span className={`font-bold ${a.totalHours >= 8 ? 'text-green-600' : 'text-yellow-600'}`}>
                                      {a.totalHours?.toFixed(2) || "-"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(a.status)}`}>
                                    {a.status || "Pending"}
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleViewDetails(a._id)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                      title="View Details"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleCorrectAttendance(a._id)}
                                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                        title="Edit Attendance"
                                      >
                                        <Edit size={18} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft size={18} />
                              </button>
                              
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => paginate(pageNum)}
                                    className={`w-10 h-10 rounded-lg transition-all ${
                                      currentPage === pageNum
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                              
                              <button
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRightIcon size={18} />
                              </button>
                            </div>
                            <div className="text-sm text-gray-500">
                              {itemsPerPage} per page
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 mt-6">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 h-full">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Attendance Summary</h2>
                  <p className="text-gray-500 text-sm mt-1">Selected period overview</p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[500px]">
                  {summary ? (
                    <>
                      <div className="space-y-4">
                        {isAdmin && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Total Employees</span>
                              <span className="font-semibold text-gray-900">{summary.totalEmployees || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Present Today</span>
                              <span className="font-semibold text-green-600">{summary.presentToday || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Absent Today</span>
                              <span className="font-semibold text-red-600">{summary.absentToday || 0}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Working Days</span>
                          <span className="font-semibold text-gray-900">{summary.workingDays || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Days Present</span>
                          <span className="font-semibold text-green-600">{summary.daysPresent || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Days Absent</span>
                          <span className="font-semibold text-red-600">{summary.daysAbsent || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Days Leave</span>
                          <span className="font-semibold text-blue-600">{summary.daysLeave || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Late Arrivals</span>
                          <span className="font-semibold text-yellow-600">{summary.lateArrivals || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Holidays/Off</span>
                          <span className="font-semibold text-purple-600">{summary.daysHoliday || 0}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Hours</span>
                            <span className="font-bold text-lg text-purple-700">{summary.totalHours?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Average Hours/Day</span>
                          <span className="font-semibold text-gray-900">{summary.averageHours?.toFixed(2) || "0.00"}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600 font-medium">Attendance Rate</span>
                          <span className="font-bold text-lg text-purple-700">{summary.attendanceRate?.toFixed(1) || "0.0"}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(summary.attendanceRate || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No summary data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .max-h-[500px] {
          max-height: 500px;
        }
        
        .h-[calc(100%-80px)] {
          height: calc(100% - 80px);
        }
      `}</style>
    </>
  );
}