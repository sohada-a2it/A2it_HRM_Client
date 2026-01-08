// app/lib/api.js
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://a2ithrmserver-2.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Helper function to get token
export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken");
  }
  return null;
};

// Users
export async function getUsers() {
  try {
    const res = await api.get("/admin/getAll-user");
    return res.data;
  } catch (err) {
    console.error(err);
    return { users: [] };
  }
}

export async function createUser(data) {
  try {
    const res = await api.post("/admin/create-user", data);
    return res.data;
  } catch (err) {
    console.error(err.response?.data || err);
    return { message: err.response?.data?.message || "Failed to create user" };
  }
}

export async function updateUser(id, data) {
  try {
    const res = await api.put(`/admin/update-user/${id}`, data);
    return res.data;
  } catch (err) {
    console.error(err.response?.data || err);
    return { message: err.response?.data?.message || "Failed to update user" };
  }
}

export async function deleteUser(id) {
  try {
    const res = await api.delete(`/admin/user-delete/${id}`);
    return res.data;
  } catch (err) {
    console.error(err.response?.data || err);
    return { message: err.response?.data?.message || "Failed to delete user" };
  }
} 

// Admin reset password functions   
const REQUEST_TIMEOUT = 10000; // 10 seconds

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();
    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Invalid JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed (${response.status})`);
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Server timeout. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};

/**
 * Admin: Request OTP
 */
export const adminRequestOtp = async (data) => {
  const token = getToken();

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  if (!data?.userEmail) {
    throw new Error('User email is required.');
  }

  console.log('🔄 Requesting OTP for:', data.userEmail);

  try {
    const result = await fetchWithTimeout(
      `${API_BASE}/admin/request-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    console.log('✅ OTP request successful:', result);
    return result;
  } catch (error) {
    console.error('❌ OTP request failed:', error.message);
    throw error;
  }
};

/**
 * Admin: Verify OTP & Reset Password
 */
export const adminResetPassword = async (data) => {
  const token = getToken();

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  if (!data?.userEmail || !data?.otp || !data?.newPassword) {
    throw new Error('User email, OTP, and new password are required.');
  }

  console.log('🔄 Resetting password for:', data.userEmail);

  try {
    const result = await fetchWithTimeout(
      `${API_BASE}/admin/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    console.log('✅ Password reset successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
    throw error;
  }
};

// Profile Picture Upload API
export const uploadProfilePicture = async (userId, formData) => {
  try {
    const response = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/upload-profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Remove Profile Picture API
export const removeProfilePicture = async (userId) => {
  try {
    const response = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/remove-profile-picture`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error removing profile picture:', error);
    throw error;
  }
};

// ================== ATTENDANCE API FUNCTIONS ==================

// Clock In
const handleClockIn = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("Please login first!");
      setLoading(false);
      return;
    }
    
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://a2ithrmserver-2.onrender.com/api/v1";
    
    const response = await fetch(`${API_BASE}/attendance/clock-in`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false })
      })
    });
    
    const data = await response.json();
    console.log("Clock In Raw Response:", data);
    
    if (response.ok && data.status === "success") {
      await fetchSummary();
      alert("✅ Clock In successful!");
    } else {
      alert(`Clock In failed: ${data.message || `Status: ${response.status}`}`);
    }
  } catch (error) {
    console.error("Clock In fetch error:", error);
    alert("Network error. Please check your connection.");
  }
  setLoading(false);
};

// Clock Out
// export async function clockOut() {
//   try {
//     const res = await api.post("/attendance/clock-out");
//     return res.data;
//   } catch (err) {
//     console.error("Clock Out Error:", err.response?.data || err);
//     return { 
//       status: "error", 
//       message: err.response?.data?.message || "Failed to clock out" 
//     };
//   }
// }

// Get Attendance Summary
// export async function getAttendanceSummary(userId, startDate, endDate) {
//   try {
//     const params = new URLSearchParams();
//     if (userId) params.append('userId', userId);
//     if (startDate) params.append('startDate', startDate);
//     if (endDate) params.append('endDate', endDate);
    
//  const res = await api.get(`/admin/attendance/summary?${params.toString()}`);
//     return res.data;
//   } catch (err) {
//     console.error("Attendance Summary Error:", err.response?.data || err);
//     return { 
//       status: "error", 
//       message: err.response?.data?.message || "Failed to fetch attendance summary" 
//     };
//   }
// }

// Get All Attendance Records
// export async function getAllAttendance(userId, startDate, endDate) {
//   try {
//     const params = new URLSearchParams();
//     if (userId) params.append('userId', userId);
//     if (startDate) params.append('startDate', startDate);
//     if (endDate) params.append('endDate', endDate);
    
//     const res = await api.get(`/attendance/all?${params.toString()}`);
//     return res.data;
//   } catch (err) {
//     console.error("All Attendance Error:", err.response?.data || err);
//     return { 
//       status: "error", 
//       message: err.response?.data?.message || "Failed to fetch attendance records" 
//     };
//   }
// }

// Correct Attendance (Admin)
// export async function correctAttendance(attendanceId, data) {
//   try {
//     const res = await api.put(`/attendance/admin-correct/${attendanceId}`, data);
//     return res.data;
//   } catch (err) {
//     console.error("Correct Attendance Error:", err.response?.data || err);
//     return { 
//       status: "error", 
//       message: err.response?.data?.message || "Failed to correct attendance" 
//     };
//   }
// }

// Get Today's Attendance Status
// export async function getTodayAttendance() {
//   try {
//     const res = await api.get("/attendance/today");
//     return res.data;
//   } catch (err) {
//     console.error("Today's Attendance Error:", err.response?.data || err);
//     return { 
//       status: "error", 
//       message: err.response?.data?.message || "Failed to fetch today's attendance" 
//     };
//   }
// }

// Get Monthly Attendance Report
// export async function getMonthlyAttendance(month, year) {
//   try {
//     const res = await api.get(`/attendance/monthly?month=${month}&year=${year}`);
//     return res.data;
//   } catch (err) {
//     console.error("Monthly Attendance Error:", err.response?.data || err);
//     return { 
//       status: "error", 
//       message: err.response?.data?.message || "Failed to fetch monthly attendance" 
//     };
//   }
// }
// app/lib/api.js
// Fetch employees
export const fetchEmployees = async () => {
  try {
    const response = await fetchWithAuth('/reports/employees');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    // Return sample data for demo if API fails
    return [
      { _id: '1', firstName: 'John', lastName: 'Doe', employeeId: 'EMP001', department: 'IT' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith', employeeId: 'EMP002', department: 'HR' },
      { _id: '3', firstName: 'Bob', lastName: 'Johnson', employeeId: 'EMP003', department: 'Sales' }
    ];
  }
};

// Fetch departments
export const fetchDepartments = async () => {
  try {
    const response = await fetchWithAuth('/reports/departments');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return ['IT', 'HR', 'Sales', 'Marketing', 'Finance'];
  }
};

// Export report
export const exportReport = async (reportType, format, filters) => {
  try {
    const token = getToken();
    
    const endpoint = `/reports/${reportType}`;
    const acceptHeader = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    const response = await fetchWithAuth(endpoint, {
      method: 'POST',
      headers: {
        'Accept': acceptHeader
      },
      body: JSON.stringify({ format, ...filters })
    });

    if (format === 'json') {
      return await response.json();
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Export error:', error);
    
    // If it's a JSON error (like when expecting blob but got JSON)
    if (error.message.includes('Unexpected token')) {
      const response = await fetchWithAuth(`/reports/${reportType}`, {
        method: 'POST',
        body: JSON.stringify({ format: 'json', ...filters })
      });
      return await response.json();
    }
    
    throw error;
  }
};
export default api;