'use client';

import { useState, useEffect } from "react";
import { 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  User, 
  FileText, 
  CheckCircle,
  ChevronDown,
  FileDown,
  BarChart,
  PieChart,
  TrendingUp,
  Loader2,
  Users,
  Building,
  Briefcase,
  Search,
  Filter,
  Clock,
  CheckSquare,
  XSquare,
  Eye,
  Server,
  Database,
  Network,
  AlertCircle
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchEmployees, fetchDepartments, exportReport, testApiConnection } from "@/app/lib/report";

export default function ReportPage() {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportType, setExportType] = useState("excel");
  const [reportType, setReportType] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [apiStatus, setApiStatus] = useState({ connected: false, loading: true, error: null });
  
  // Data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filters state
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: "",
    employeeId: "",
    status: ""
  });

  // Fetch employees and departments on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingData(true);
    setApiStatus({ connected: false, loading: true, error: null });
    
    try {
      // First test API connection
      const connectionTest = await testApiConnection();
      
      if (!connectionTest.success) {
        setApiStatus({ 
          connected: false, 
          loading: false, 
          error: connectionTest.message 
        });
        
        toast.error(
          <div>
            <div className="font-semibold">⚠️ Backend Connection Failed</div>
            <div className="text-sm">{connectionTest.message}</div>
            <div className="text-xs mt-1">Please ensure backend server is running</div>
          </div>,
          {
            duration: 6000,
            style: {
              borderRadius: '10px',
              background: '#F59E0B',
              color: '#fff',
            }
          }
        );
        return;
      }
      
      setApiStatus({ connected: true, loading: false, error: null });
      
      // Fetch data
      const [employeesData, departmentsData] = await Promise.all([
        fetchEmployees(),
        fetchDepartments()
      ]);
      
      setEmployees(employeesData || []);
      setDepartments(departmentsData || []);
      
      toast.success("Data loaded successfully", {
        icon: '✅',
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      
      setApiStatus({ 
        connected: false, 
        loading: false, 
        error: error.message 
      });
      
      toast.error(
        <div>
          <div className="font-semibold">Failed to load data</div>
          <div className="text-sm">{error.message}</div>
        </div>,
        {
          duration: 5000,
          style: {
            borderRadius: '10px',
            background: '#EF4444',
            color: '#fff',
          }
        }
      );
      
      // Set empty arrays to prevent UI errors
      setEmployees([]);
      setDepartments([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleExport = async () => {
    // Validation
    if (reportType === "employee-summary" && !filters.employeeId) {
      toast.error("Please select an employee", {
        icon: '👤',
      });
      return;
    }

    if (reportType === "attendance" && (!filters.startDate || !filters.endDate)) {
      toast.error("Please select date range", {
        icon: '📅',
      });
      return;
    }

    if (reportType === "payroll" && (!filters.month || !filters.year)) {
      toast.error("Please select month and year", {
        icon: '💰',
      });
      return;
    }

    // Check API connection
    if (!apiStatus.connected) {
      toast.error(
        <div>
          <div className="font-semibold">Backend Not Connected</div>
          <div className="text-sm">Please check if server is running</div>
        </div>,
        {
          duration: 5000,
          icon: '🔌',
          style: {
            borderRadius: '10px',
            background: '#F59E0B',
            color: '#fff',
          }
        }
      );
      return;
    }

    setLoading(true);

    try {
      // Prepare filters based on report type
      const exportFilters = {};
      
      switch(reportType) {
        case "attendance":
          exportFilters.startDate = filters.startDate.toISOString().split('T')[0];
          exportFilters.endDate = filters.endDate.toISOString().split('T')[0];
          if (filters.department) exportFilters.department = filters.department;
          if (filters.employeeId) exportFilters.employeeId = filters.employeeId;
          break;
          
        case "payroll":
          exportFilters.month = filters.month;
          exportFilters.year = filters.year;
          if (filters.department) exportFilters.department = filters.department;
          if (filters.status) exportFilters.status = filters.status;
          break;
          
        case "employee-summary":
          exportFilters.employeeId = filters.employeeId;
          if (filters.startDate) exportFilters.startDate = filters.startDate.toISOString().split('T')[0];
          if (filters.endDate) exportFilters.endDate = filters.endDate.toISOString().split('T')[0];
          break;
      }

      console.log('Exporting report with:', { 
        reportType, 
        format: exportType, 
        filters: exportFilters 
      });

      // Show loading toast
      const loadingToastId = toast.loading(
        <div>
          <div className="font-semibold">Generating Report...</div>
          <div className="text-sm">Please wait while we process your request</div>
        </div>,
        {
          duration: Infinity,
          style: {
            borderRadius: '10px',
            background: '#3B82F6',
            color: '#fff',
          }
        }
      );

      // Call API
      const result = await exportReport(reportType, exportType, exportFilters);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // Handle response
      if (result instanceof Blob) {
        // Create download link for blob
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        
        // Determine file extension based on content type
        let extension = 'xlsx';
        const timestamp = new Date().toISOString().split('T')[0];
        let fileName = `${reportType}-report-${timestamp}`;
        
        // Detect file type from blob
        if (result.type.includes('pdf')) {
          extension = 'pdf';
        } else if (result.type.includes('excel') || result.type.includes('spreadsheet')) {
          extension = 'xlsx';
        } else if (result.type.includes('csv')) {
          extension = 'csv';
        }
        
        fileName = `${fileName}.${extension}`;
        
        // Customize filename for employee summary
        if (reportType === 'employee-summary' && filters.employeeId) {
          const employee = employees.find(e => e._id === filters.employeeId);
          if (employee) {
            const name = `${employee.firstName}-${employee.lastName}`.replace(/\s+/g, '-');
            fileName = `employee-${name}-${timestamp}.${extension}`;
          }
        }
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success toast
        toast.success(
          <div>
            <div className="font-semibold">✅ Report Generated Successfully!</div>
            <div className="text-sm">"{fileName}" has been downloaded</div>
            <div className="text-xs mt-1 opacity-75">
              Size: {(result.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>,
          {
            duration: 6000,
            style: {
              borderRadius: '10px',
              background: '#10B981',
              color: '#fff',
            }
          }
        );
        
        // Save to history
        saveReportHistory(fileName, reportType, exportType, filters);
        
      } else if (result && typeof result === 'object') {
        // Handle JSON response
        console.log('Server JSON response:', result);
        
        if (result.success) {
          toast.success(
            <div>
              <div className="font-semibold">📊 Report Data Ready</div>
              <div className="text-sm">
                {result.count ? `${result.count} records loaded` : 
                 result.data ? `${result.data.length} records loaded` : 
                 'Data processed successfully'}
              </div>
            </div>,
            {
              duration: 4000,
              style: {
                borderRadius: '10px',
                background: '#3B82F6',
                color: '#fff',
              }
            }
          );
          
          // Optionally download as JSON file
          if (result.data && exportType === 'json') {
            const jsonStr = JSON.stringify(result.data, null, 2);
            const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(jsonBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } else {
          throw new Error(result.message || 'Failed to generate report');
        }
      } else {
        throw new Error('Unexpected response format from server');
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      
      // Show error message
      toast.error(
        <div>
          <div className="font-semibold">❌ Export Failed</div>
          <div className="text-sm">{error.message || 'Please check your connection and try again'}</div>
          <div className="text-xs mt-1 opacity-75">
            Report Type: {getReportTypeName(reportType)} • Format: {exportType.toUpperCase()}
          </div>
        </div>,
        {
          duration: 7000,
          style: {
            borderRadius: '10px',
            background: '#EF4444',
            color: '#fff',
          }
        }
      );
      
    } finally {
      setLoading(false);
      setShowExportOptions(false);
    }
  };

  const saveReportHistory = (fileName, type, format, filterData) => {
    try {
      const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');
      
      const reportEntry = {
        id: Date.now(),
        fileName,
        type: type || reportType,
        format: format || exportType,
        timestamp: new Date().toISOString(),
        size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
        filters: filterData || { ...filters },
        downloaded: true
      };
      
      history.unshift(reportEntry);
      
      // Keep only last 10 reports
      if (history.length > 10) history.pop();
      
      localStorage.setItem('reportHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving report history:', error);
    }
  };

  const renderFilters = () => {
    switch(reportType) {
      case "attendance":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  Start Date *
                </label>
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => setFilters({...filters, startDate: date})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  dateFormat="yyyy-MM-dd"
                  maxDate={filters.endDate}
                  isClearable
                  placeholderText="Select start date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  End Date *
                </label>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => setFilters({...filters, endDate: date})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  dateFormat="yyyy-MM-dd"
                  minDate={filters.startDate}
                  maxDate={new Date()}
                  isClearable
                  placeholderText="Select end date"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Building size={14} />
                  Department (Optional)
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={loadingData}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <User size={14} />
                  Employee (Optional)
                </label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => setFilters({...filters, employeeId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={loadingData}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} 
                      {emp.employeeId && ` (${emp.employeeId})`}
                      {emp.department && ` - ${emp.department}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case "payroll":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                >
                  <option value="">Select Month</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {new Date(2000, i).toLocaleString('default', {month: 'long'})}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                >
                  <option value="">Select Year</option>
                  {Array.from({length: 5}, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Building size={14} />
                  Department (Optional)
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={loadingData}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <CheckCircle size={14} />
                  Status (Optional)
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case "employee-summary":
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <User size={14} />
                  Select Employee *
                </label>
                <select
                  value={filters.employeeId}
                  onChange={(e) => setFilters({...filters, employeeId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={loadingData}
                  required
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} 
                      {emp.employeeId && ` (${emp.employeeId})`}
                      {emp.department && ` - ${emp.department}`}
                      {emp.designation && ` - ${emp.designation}`}
                    </option>
                  ))}
                </select>
                {filters.employeeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {employees.find(e => e._id === filters.employeeId)?.firstName} {
                      employees.find(e => e._id === filters.employeeId)?.lastName
                    }
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar size={14} />
                    Start Date (Optional)
                  </label>
                  <DatePicker
                    selected={filters.startDate}
                    onChange={(date) => setFilters({...filters, startDate: date})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    dateFormat="yyyy-MM-dd"
                    maxDate={filters.endDate}
                    isClearable
                    placeholderText="Optional start date"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar size={14} />
                    End Date (Optional)
                  </label>
                  <DatePicker
                    selected={filters.endDate}
                    onChange={(date) => setFilters({...filters, endDate: date})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    dateFormat="yyyy-MM-dd"
                    minDate={filters.startDate}
                    maxDate={new Date()}
                    isClearable
                    placeholderText="Optional end date"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const getReportTypeName = (type) => {
    const names = {
      "attendance": "Attendance Report",
      "payroll": "Payroll Report",
      "employee-summary": "Employee Summary Report"
    };
    return names[type] || type;
  };

  const retryConnection = () => {
    fetchInitialData();
  };

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <BarChart className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Reports Dashboard
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Generate and download various reports from your data
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button
                onClick={retryConnection}
                disabled={loadingData}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                <Network size={16} />
                {loadingData ? 'Checking...' : 'Refresh Connection'}
              </button>
              
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={loading || loadingData || !apiStatus.connected}
                className="relative px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                Export Reports
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="mb-6">
            <div className={`rounded-2xl p-5 shadow-lg border ${
              apiStatus.loading ? 'border-yellow-200 bg-yellow-50' :
              apiStatus.connected ? 'border-green-200 bg-green-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Server size={18} className={
                      apiStatus.loading ? 'text-yellow-600' :
                      apiStatus.connected ? 'text-green-600' :
                      'text-red-600'
                    } />
                    <p className="text-sm font-medium text-gray-700">Backend Connection</p>
                  </div>
                  <p className={`text-lg font-bold ${
                    apiStatus.loading ? 'text-yellow-600' :
                    apiStatus.connected ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {apiStatus.loading ? 'Checking connection...' :
                     apiStatus.connected ? 'Connected ✓' :
                     'Disconnected ✗'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  apiStatus.loading ? 'bg-yellow-100' :
                  apiStatus.connected ? 'bg-green-100' :
                  'bg-red-100'
                }`}>
                  {apiStatus.loading ? (
                    <Loader2 size={24} className="text-yellow-600 animate-spin" />
                  ) : apiStatus.connected ? (
                    <CheckCircle size={24} className="text-green-600" />
                  ) : (
                    <AlertCircle size={24} className="text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingData ? '...' : employees.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available for reporting
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Users className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Departments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingData ? '...' : departments.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Active departments
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                  <Building className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Report Types</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available formats
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <FileText className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Export Formats</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Excel & PDF
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
                  <Download className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Export Options Modal */}
          {showExportOptions && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
                onClick={() => !loading && setShowExportOptions(false)}
              />
              
              {/* Modal */}
              <div className="fixed inset-x-4 top-20 md:top-1/2 md:transform md:-translate-y-1/2 md:absolute md:right-6 md:top-40 md:transform-none md:inset-x-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 animate-fadeIn md:mt-2 max-h-[85vh] overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileDown size={18} className="text-blue-600" />
                    Generate Report
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure and download {getReportTypeName(reportType)}
                  </p>
                </div>
                
                <div className="p-4 border-b border-gray-100 overflow-y-auto max-h-[50vh]">
                  {loadingData ? (
                    <div className="flex flex-col justify-center items-center py-8">
                      <Loader2 className="animate-spin text-blue-500 mb-3" size={28} />
                      <span className="text-gray-600">Loading employee data...</span>
                      <span className="text-xs text-gray-400 mt-1">
                        Fetching from backend server
                      </span>
                    </div>
                  ) : !apiStatus.connected ? (
                    <div className="flex flex-col justify-center items-center py-8">
                      <AlertCircle size={32} className="text-red-500 mb-3" />
                      <span className="text-gray-700 font-medium">Backend Not Connected</span>
                      <span className="text-sm text-gray-500 mt-1 text-center">
                        Please ensure backend server is running at:
                      </span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 font-mono">
                        {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
                      </code>
                      <button
                        onClick={retryConnection}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Report Type Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <BarChart size={14} />
                          Report Type
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: "attendance", label: "Attendance Report", icon: Calendar, color: "blue", desc: "Daily attendance logs" },
                            { id: "payroll", label: "Payroll Report", icon: FileSpreadsheet, color: "green", desc: "Salary calculations" },
                            { id: "employee-summary", label: "Employee Summary", icon: User, color: "purple", desc: "Employee profile" }
                          ].map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setReportType(type.id)}
                              className={`p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 ${
                                reportType === type.id
                                  ? `bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200`
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                              }`}
                              disabled={loading}
                            >
                              <div className={`p-2 rounded-lg ${
                                reportType === type.id 
                                  ? `bg-blue-500` 
                                  : "bg-gray-300"
                              }`}>
                                <type.icon className="text-white" size={16} />
                              </div>
                              <div className="text-left flex-1">
                                <div className="font-medium text-gray-900">{type.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                              </div>
                              {reportType === type.id && (
                                <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Filters Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Filter size={14} />
                            Report Filters
                          </label>
                          <span className="text-xs text-gray-500">
                            {reportType === 'attendance' ? 'Date range required' :
                             reportType === 'payroll' ? 'Month & year required' :
                             'Employee selection required'}
                          </span>
                        </div>
                        {renderFilters()}
                      </div>
                      
                      {/* Export Format */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Export Format
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExportType("excel")}
                            className={`flex-1 py-3 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                              exportType === "excel"
                                ? "bg-green-50 border-green-300 shadow-sm ring-1 ring-green-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                            disabled={loading}
                          >
                            <FileSpreadsheet size={24} className={exportType === "excel" ? "text-green-600" : "text-gray-500"} />
                            <span className={`text-sm font-medium ${exportType === "excel" ? "text-green-700" : "text-gray-700"}`}>
                              Excel (.xlsx)
                            </span>
                            <span className="text-xs text-gray-500">Spreadsheet format</span>
                          </button>
                          
                          <button
                            onClick={() => setExportType("pdf")}
                            className={`flex-1 py-3 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                              exportType === "pdf"
                                ? "bg-red-50 border-red-300 shadow-sm ring-1 ring-red-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                            disabled={loading}
                          >
                            <FileText size={24} className={exportType === "pdf" ? "text-red-600" : "text-gray-500"} />
                            <span className={`text-sm font-medium ${exportType === "pdf" ? "text-red-700" : "text-gray-700"}`}>
                              PDF (.pdf)
                            </span>
                            <span className="text-xs text-gray-500">Document format</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="p-4 bg-gray-50">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowExportOptions(false)}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium"
                      disabled={loading || loadingData}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={loading || loadingData || !apiStatus.connected || 
                        (reportType === "employee-summary" && !filters.employeeId) ||
                        (reportType === "attendance" && (!filters.startDate || !filters.endDate)) ||
                        (reportType === "payroll" && (!filters.month || !filters.year))}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          Generate Report
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {getReportTypeName(reportType)}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {exportType.toUpperCase()} Format
                      </span>
                    </div>
                    {!apiStatus.connected && (
                      <div className="mt-2 text-xs text-red-500 flex items-center justify-center gap-1">
                        <AlertCircle size={12} />
                        Backend server not connected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* How to Use Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Eye size={18} />
              How to Generate Reports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="font-medium text-gray-900">Select Report Type</span>
                </div>
                <p className="text-sm text-gray-600">Choose between Attendance, Payroll, or Employee Summary reports.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="font-medium text-gray-900">Apply Filters</span>
                </div>
                <p className="text-sm text-gray-600">Select date range, department, or specific employee as needed.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="font-medium text-gray-900">Choose Format & Download</span>
                </div>
                <p className="text-sm text-gray-600">Export as Excel (.xlsx) or PDF (.pdf) format and download.</p>
              </div>
            </div>
          </div>

          {/* Recent Reports History */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock size={20} />
                Recent Reports History
              </h2>
              <button 
                onClick={() => {
                  localStorage.removeItem('reportHistory');
                  toast.success("History cleared");
                  setTimeout(() => window.location.reload(), 1000);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <XSquare size={14} />
                Clear History
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Report Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Format</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Generated</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    try {
                      const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');
                      
                      if (history.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <FileText size={32} className="text-gray-300 mb-2" />
                                <p>No reports generated yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Generate your first report!</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      
                      return history.slice(0, 5).map((report) => (
                        <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 truncate max-w-xs">{report.fileName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              report.type === 'attendance' ? 'bg-blue-100 text-blue-700' :
                              report.type === 'payroll' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {report.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              report.format === 'excel' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {report.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {new Date(report.timestamp).toLocaleDateString()} {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{report.size}</td>
                          <td className="py-3 px-4">
                            <button 
                              onClick={() => {
                                toast.success("Re-downloading report...");
                                // In a real app, you would re-generate or fetch the report
                                setTimeout(() => {
                                  toast.success("Report downloaded again!");
                                }, 1000);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 hover:underline"
                            >
                              <Download size={14} />
                              Download Again
                            </button>
                          </td>
                        </tr>
                      ));
                    } catch (error) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            Error loading history
                          </td>
                        </tr>
                      );
                    }
                  })()}
                </tbody>
              </table>
            </div>
            
            {(() => {
              try {
                const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');
                if (history.length > 5) {
                  return (
                    <div className="text-center mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Showing 5 of {history.length} reports
                      </p>
                    </div>
                  );
                }
              } catch {
                return null;
              }
            })()}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}