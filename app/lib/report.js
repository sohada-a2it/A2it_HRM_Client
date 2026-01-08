// /app/lib/report.js
const API_BASE_URL = 'https://a2itserver.onrender.com'; // শুধু domain

// Simple connection test
export const testApiConnection = async () => {
  // SSR এর সময় fetch করবেন না
  if (typeof window === 'undefined') {
    return { success: false, message: 'Checking on client side...' };
  }
  
  try {
    // সরাসরি domain টেস্ট করুন
    console.log('Testing connection to:', API_BASE_URL);
    
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    console.log('Connection response status:', response.status);
    
    // 404 হলেও মানে server reachable
    return { 
      success: response.status !== 0, // 0 মানে network error
      message: response.status === 404 
        ? 'Server is reachable (endpoint may not exist)' 
        : 'Connected to server'
    };
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return { 
      success: false, 
      message: `Cannot connect: ${error.message}` 
    };
  }
};

// Fetch employees
export const fetchEmployees = async () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("employeeToken");
    
    if (!token) {
      console.log('No token found');
      return [];
    }
    
    // বিভিন্ন endpoint চেষ্টা করুন
    const endpoints = [
      `${API_BASE_URL}/api/v1/reports/employees`,
      `${API_BASE_URL}/api/v1/employees`,
      `${API_BASE_URL}/api/employees`,
      `${API_BASE_URL}/employees`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log('Trying endpoint:', endpoint);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Employees response:', data);
          return data.data || data.employees || data || [];
        }
      } catch (error) {
        continue;
      }
    }
    
    return [];
    
  } catch (error) {
    console.error('Fetch employees error:', error);
    return [];
  }
};

// Fetch departments
export const fetchDepartments = async () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("employeeToken");
    
    if (!token) return [];
    
    const endpoints = [
      `${API_BASE_URL}/api/v1/reports/departments`,
      `${API_BASE_URL}/api/v1/departments`,
      `${API_BASE_URL}/api/departments`,
      `${API_BASE_URL}/departments`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.data || data.departments || data || [];
        }
      } catch (error) {
        continue;
      }
    }
    
    return [];
    
  } catch (error) {
    console.error('Fetch departments error:', error);
    return [];
  }
};

// Export report
export const exportReport = async (reportType, format, filters) => {
  if (typeof window === 'undefined') {
    throw new Error('Export只能在客户端进行');
  }
  
  try {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("employeeToken");
    
    if (!token) {
      throw new Error('请先登录');
    }
    
    // Report endpoints
    const endpoints = {
      "attendance": [
        `${API_BASE_URL}/api/v1/reports/attendance`,
        `${API_BASE_URL}/api/v1/attendance/export`,
        `${API_BASE_URL}/api/attendance/export`
      ],
      "payroll": [
        `${API_BASE_URL}/api/v1/reports/payroll`,
        `${API_BASE_URL}/api/v1/payroll/export`,
        `${API_BASE_URL}/api/payroll/export`
      ],
      "employee-summary": [
        `${API_BASE_URL}/api/v1/reports/employee-summary`,
        `${API_BASE_URL}/api/v1/employee/export`,
        `${API_BASE_URL}/api/employee/export`
      ]
    };
    
    const endpointList = endpoints[reportType];
    if (!endpointList) throw new Error('无效的报告类型');
    
    let lastError;
    
    for (const endpoint of endpointList) {
      try {
        console.log('Trying export endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...filters,
            format: format
          })
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          } else {
            return await response.blob();
          }
        } else {
          lastError = `Endpoint ${endpoint} failed with status ${response.status}`;
        }
      } catch (error) {
        lastError = error.message;
        continue;
      }
    }
    
    throw new Error(lastError || '所有端点都失败了');
    
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};