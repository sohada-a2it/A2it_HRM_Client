"use client"
import React, { useState, useEffect } from 'react';
import {
  DollarSign, Users, Calendar, FileText, PlusCircle, Edit, Trash2,
  Search, Filter, Download, CheckCircle, Clock, AlertCircle, X, Eye, Save,
  RefreshCw, TrendingUp, TrendingDown, UserPlus, Wallet, CreditCard,
  PieChart, BarChart3, Mail, Phone, Briefcase, Award, ChevronRight,
  Home, Settings, LogOut, Bell, User, Calculator, Loader2,
  Building, MapPin, CalendarDays, CreditCard as CardIcon, ChevronLeft,
  Shield, UserCheck, FileCheck, Receipt, Banknote, ArrowUpDown, CalendarRange,
  Users as UsersIcon, UserCog, FileSpreadsheet, BarChart, DownloadCloud,
  Percent, Clock as ClockIcon, Moon, Sun, Zap, Target, PieChart as PieChartIcon,
  Briefcase as BriefcaseIcon, Building2, Home as HomeIcon, Wallet as WalletIcon,
  Server, Wifi, WifiOff, AlertTriangle, Check, ExternalLink, 
  Calculator as CalcIcon, Zap as ZapIcon
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Configuration
const API_BASE_URL = 'https://a2itserver.onrender.com/api/v1';

// Main Component
const Page = () => {
  const router = useRouter();
  
  // States
  const [payrolls, setPayrolls] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('payrolls');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [employees, setEmployees] = useState([]);
  const [employeeSalaries, setEmployeeSalaries] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [salaryRequests, setSalaryRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState({
    payrolls: false,
    employees: true,
    employeeSalaries: false,
    action: false,
    calculation: false,
    generate: false
  });
  const [apiConnected, setApiConnected] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSalaryRequestsModal, setShowSalaryRequestsModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form states
  const [createForm, setCreateForm] = useState({
    employee: '',
    periodStart: '',
    periodEnd: '',
    status: 'Pending',
    notes: '',
    basicPay: '',
    monthlySalary: '',
    presentDays: 22,
    totalWorkingDays: 26,
    deductions: {
      lateDeduction: 0,
      absentDeduction: 0,
      taxDeduction: 0
    },
    earnings: {
      overtime: 0,
      bonus: 0,
      allowance: 0
    }
  });

  const [calculateForm, setCalculateForm] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: ''
  });

  const [bulkForm, setBulkForm] = useState({
    periodStart: '',
    periodEnd: ''
  });

  // Stats state
  const [stats, setStats] = useState({
    totalPayroll: 0,
    totalEmployees: 0,
    totalProcessed: 0,
    totalPending: 0,
    totalPaid: 0,
    totalRejected: 0,
    monthlyExpense: 0,
    pendingSalaryRequests: 0
  });

  // Helper Functions
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('employeeToken');
    
    if (token && token.startsWith('Bearer ')) {
      return token.slice(7);
    }
    return token;
  };

  const getUserRole = () => {
    if (typeof window === 'undefined') return null;
    
    const adminToken = localStorage.getItem('adminToken');
    return adminToken ? 'admin' : 'employee';
  };

  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed._id || parsed.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const getUserName = () => {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.firstName || parsed.lastName) {
          return `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
        }
        return parsed.name || 'User';
      } catch (e) {
        return 'User';
      }
    }
    return 'User';
  };

  // Save payrolls to localStorage
  const savePayrollsToLocalStorage = (payrollsData) => {
    try {
      localStorage.setItem('payrolls', JSON.stringify(payrollsData));
      localStorage.setItem('payrolls_last_saved', new Date().toISOString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Create axios instance
  const createApiInstance = () => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    instance.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          setTimeout(() => router.push('/login'), 1000);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  };

  const API = createApiInstance();

  // Check API Connection
  const checkApiConnection = async () => {
    try {
      const response = await axios.get(API_BASE_URL, { timeout: 5000 });
      if (response.status === 200) {
        setApiConnected(true);
        return true;
      }
    } catch (error) {
      setApiConnected(false);
      return false;
    }
  };

  // Load employees
  const loadEmployees = async () => {
    setLoading(prev => ({ ...prev, employees: true }));
    
    try {
      const response = await API.get('/admin/getAll-user');
      let employeesData = [];
      
      if (response.data.users && Array.isArray(response.data.users)) {
        employeesData = response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        employeesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      } else if (response.data.success && Array.isArray(response.data.users)) {
        employeesData = response.data.users;
      }
      
      const activeEmployees = employeesData.filter(emp => 
        !emp.status || 
        emp.status === 'active' || 
        emp.status === 'Active' ||
        (emp.status !== 'inactive' && emp.status !== 'terminated')
      );
      
      setEmployees(activeEmployees);
      
      const salaryMap = {};
      activeEmployees.forEach(emp => {
        if (emp._id) {
          salaryMap[emp._id] = {
            salary: emp.salary || emp.monthlySalary || emp.basicSalary || 30000,
            monthlyBasic: emp.monthlyBasic || emp.salary || emp.basicSalary || 30000,
            designation: emp.designation || emp.role || 'Employee',
            department: emp.department || 'General',
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Unknown'
          };
        }
      });
      setEmployeeSalaries(salaryMap);
      
      return activeEmployees;
      
    } catch (error) {
      console.error('Failed to load employees:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  };

  // Load attendance data
  const loadAttendanceData = async () => {
    try {
      const userId = getUserId();
      const role = getUserRole();
      
      let endpoint = '/attendance/all';
      if (role === 'employee') {
        endpoint = `/attendance/user/${userId}`;
      }
      
      const response = await API.get(endpoint);
      
      if (response.data && (response.data.attendances || response.data.data)) {
        const attendanceList = response.data.attendances || response.data.data || [];
        
        const attendanceMap = {};
        
        attendanceList.forEach(att => {
          const empId = att.employee || att.employeeId || att.user;
          if (!empId) return;
          
          if (!attendanceMap[empId]) {
            attendanceMap[empId] = {
              lateMinutes: 0,
              absentDays: 0,
              halfDays: 0,
              leaves: 0
            };
          }
          
          if (att.status === 'Late' || att.lateMinutes > 0) {
            attendanceMap[empId].lateMinutes += att.lateMinutes || 60;
          }
          if (att.status === 'Absent') {
            attendanceMap[empId].absentDays += 1;
          }
          if (att.status === 'Half Day') {
            attendanceMap[empId].halfDays += 1;
          }
          if (att.leaveDays && att.leaveDays > 0) {
            attendanceMap[empId].leaves += att.leaveDays;
          }
        });
        
        setAttendanceData(attendanceMap);
        return attendanceMap;
      }
      
      return {};
    } catch (error) {
      console.log('Could not load attendance data:', error.message);
      return {};
    }
  };

  // Calculate attendance based deductions
  const calculateAttendanceDeductions = (employeeId, monthlySalary, presentDays) => {
    const attendance = attendanceData[employeeId] || {};
    const dailyRate = Math.round(monthlySalary / 26);
    const hourlyRate = Math.round(dailyRate / 8);
    
    let lateDeduction = 0;
    let absentDeduction = 0;
    let leaveDeduction = 0;
    
    // Late deduction calculation
    if (attendance.lateMinutes > 0) {
      const lateHours = Math.ceil(attendance.lateMinutes / 30);
      lateDeduction = Math.min(lateHours * hourlyRate, dailyRate * 2); // Max 2 days deduction
    }
    
    // Absent deduction
    const totalWorkingDays = 26;
    const calculatedAbsentDays = totalWorkingDays - presentDays;
    const absentDays = Math.max(attendance.absentDays || 0, calculatedAbsentDays);
    absentDeduction = absentDays * dailyRate;
    
    // Half day deduction
    if (attendance.halfDays > 0) {
      absentDeduction += (attendance.halfDays * dailyRate) / 2;
    }
    
    // Leave deduction (if unpaid leaves)
    if (attendance.leaves > 0) {
      leaveDeduction = attendance.leaves * dailyRate;
    }
    
    return {
      lateDeduction,
      absentDeduction,
      leaveDeduction,
      total: lateDeduction + absentDeduction + leaveDeduction,
      breakdown: {
        lateMinutes: attendance.lateMinutes || 0,
        absentDays: absentDays,
        halfDays: attendance.halfDays || 0,
        leaveDays: attendance.leaves || 0
      }
    };
  };

  // Get employee name
  const getEmployeeName = (payroll) => {
    if (!payroll) return 'Unknown Employee';
    
    if (payroll.employeeName) {
      return payroll.employeeName;
    }
    
    if (payroll.employee && typeof payroll.employee === 'object') {
      if (payroll.employee.firstName || payroll.employee.lastName) {
        return `${payroll.employee.firstName || ''} ${payroll.employee.lastName || ''}`.trim();
      }
      if (payroll.employee.name) {
        return payroll.employee.name;
      }
    }
    
    const employee = employees.find(emp => emp._id === payroll.employeeId || emp._id === payroll.employee);
    if (employee) {
      if (employee.firstName || employee.lastName) {
        return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
      }
      if (employee.name) {
        return employee.name;
      }
    }
    
    return 'Unknown Employee';
  };

  // Load payrolls
  const loadPayrolls = async () => {
    setLoading(prev => ({ ...prev, payrolls: true }));
    
    try {
      let apiPayrolls = [];
      const role = getUserRole();
      const userId = getUserId();
      
      try {
        let endpoint = '/payrollAll';
        if (role === 'employee') {
          endpoint = `/employee/${userId}`;
        }
        
        const response = await API.get(endpoint);
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            apiPayrolls = response.data;
          } else if (response.data.payrolls && Array.isArray(response.data.payrolls)) {
            apiPayrolls = response.data.payrolls;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            apiPayrolls = response.data.data;
          }
          
          console.log(`Loaded ${apiPayrolls.length} payrolls from API`);
        }
      } catch (apiError) {
        console.log('API payrolls not available');
      }
      
      const localPayrolls = JSON.parse(localStorage.getItem('payrolls') || '[]');
      
      const allPayrolls = [...apiPayrolls, ...localPayrolls];
      const uniquePayrolls = [];
      const seenIds = new Set();
      
      allPayrolls.forEach(p => {
        const id = p._id || p.id;
        if (!id || !seenIds.has(id)) {
          if (id) seenIds.add(id);
          uniquePayrolls.push(p);
        }
      });
      
      uniquePayrolls.sort((a, b) => {
        return new Date(b.createdAt || b.createdDate || Date.now()) - 
               new Date(a.createdAt || a.createdDate || Date.now());
      });
      
      setPayrolls(uniquePayrolls);
      savePayrollsToLocalStorage(uniquePayrolls);
      
      calculateStats(uniquePayrolls);
      
      toast.success(`Loaded ${uniquePayrolls.length} payroll records`);
      
    } catch (error) {
      console.error('Error loading payrolls:', error);
      toast.error('Failed to load payrolls');
    } finally {
      setLoading(prev => ({ ...prev, payrolls: false }));
    }
  };

  // Load salary requests
  const loadSalaryRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem('salary_requests') || '[]');
    const role = getUserRole();
    const userId = getUserId();
    
    if (role === 'admin') {
      setSalaryRequests(allRequests);
    } else {
      const myRequests = allRequests.filter(req => req.employeeId === userId);
      setSalaryRequests(myRequests);
    }
    
    // Update stats
    const pendingRequests = allRequests.filter(req => req.status === 'pending_approval').length;
    setStats(prev => ({ ...prev, pendingSalaryRequests: pendingRequests }));
    
    return allRequests;
  };

  // Check and create auto salary requests
  const checkAutoSalaryRequests = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    if (currentDay === 5) {
      const lastProcessed = localStorage.getItem(`salary_request_${currentMonth}_${currentYear}`);
      if (lastProcessed) return;
      
      try {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        const periodStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(prevYear, prevMonth, 0).getDate();
        const periodEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`;
        
        const existingRequests = JSON.parse(localStorage.getItem('salary_requests') || '[]');
        const existingForMonth = existingRequests.filter(req => 
          req.month === prevMonth && req.year === prevYear
        );
        
        if (existingForMonth.length === 0 && employees.length > 0) {
          const newRequests = employees.map((emp, index) => ({
            _id: `salary_req_${Date.now()}_${index}`,
            employeeId: emp._id,
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Unknown',
            month: prevMonth,
            year: prevYear,
            periodStart,
            periodEnd,
            status: 'pending_approval',
            autoGenerated: true,
            createdAt: new Date().toISOString(),
            type: 'salary_request',
            amount: employeeSalaries[emp._id]?.salary || 30000
          }));
          
          const updatedRequests = [...existingRequests, ...newRequests];
          localStorage.setItem('salary_requests', JSON.stringify(updatedRequests));
          localStorage.setItem(`salary_request_${currentMonth}_${currentYear}`, 'processed');
          
          loadSalaryRequests();
          
          if (getUserRole() === 'employee') {
            const userRequest = newRequests.find(req => req.employeeId === getUserId());
            if (userRequest) {
              toast.info(
                <div>
                  <p className="font-medium">New Salary Request Generated!</p>
                  <p className="text-sm">Please check and approve your salary for {prevMonth}/{prevYear}</p>
                </div>
              );
            }
          }
        }
      } catch (error) {
        console.error('Error creating auto salary requests:', error);
      }
    }
  };

  // Calculate statistics
  const calculateStats = (payrollData) => {
    const totalPayroll = payrollData.reduce((sum, p) => {
      return sum + (p.summary?.netPayable || p.netSalary || p.earnings?.total || 0);
    }, 0);
    
    const totalProcessed = payrollData.length;
    const totalPending = payrollData.filter(p => p.status === 'Pending' || p.status === 'pending_approval').length;
    const totalPaid = payrollData.filter(p => p.status === 'Paid').length;
    const totalRejected = payrollData.filter(p => p.status === 'Rejected').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthPayrolls = payrollData.filter(p => {
      const payrollDate = new Date(p.createdAt || p.periodStart || Date.now());
      return payrollDate.getMonth() === currentMonth && payrollDate.getFullYear() === currentYear;
    });
    
    const monthlyExpense = currentMonthPayrolls.reduce((sum, p) => {
      return sum + (p.summary?.netPayable || p.netSalary || p.earnings?.total || 0);
    }, 0);
    
    const salaryRequests = JSON.parse(localStorage.getItem('salary_requests') || '[]');
    const pendingSalaryRequests = salaryRequests.filter(req => req.status === 'pending_approval').length;
    
    setStats({
      totalPayroll,
      totalEmployees: employees.length,
      totalProcessed,
      totalPending,
      totalPaid,
      totalRejected,
      monthlyExpense,
      pendingSalaryRequests
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('paid') || statusLower.includes('approved')) {
      return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={14} /> };
    } else if (statusLower.includes('pending')) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} /> };
    } else if (statusLower.includes('draft')) {
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FileText size={14} /> };
    } else if (statusLower.includes('rejected')) {
      return { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle size={14} /> };
    } else {
      return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FileText size={14} /> };
    }
  };

  // Convert number to words
  const convertToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero Dollars';
    
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    return str.trim() + ' Dollars Only';
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    const salaryData = employeeSalaries[employeeId] || {};
    const monthlySalary = salaryData.salary || 30000;
    const dailyRate = Math.round(monthlySalary / 26);
    const attendanceDeductions = calculateAttendanceDeductions(employeeId, monthlySalary, createForm.presentDays);
    
    const basicPay = Math.round(dailyRate * createForm.presentDays);
    const totalEarnings = 
      basicPay + 
      (createForm.earnings.overtime || 0) + 
      (createForm.earnings.bonus || 0) + 
      (createForm.earnings.allowance || 0);
    
    const totalDeductions = 
      attendanceDeductions.total + 
      (createForm.deductions.taxDeduction || 0);
    
    setCreateForm(prev => ({
      ...prev,
      employee: employeeId,
      monthlySalary,
      basicPay,
      deductions: {
        ...prev.deductions,
        lateDeduction: attendanceDeductions.lateDeduction,
        absentDeduction: attendanceDeductions.absentDeduction
      },
      netSalary: totalEarnings - totalDeductions
    }));
    
    toast.info(`Selected ${salaryData.name}. Monthly salary: ${formatCurrency(monthlySalary)}`);
  };

  // Handle create payroll
const handleCreatePayroll = async (e) => {
    e.preventDefault();
    
    if (!createForm.employee || !createForm.periodStart || !createForm.periodEnd) {
      toast.error('Please select employee and period dates');
      return;
    }
    
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      const selectedEmployee = employees.find(emp => emp._id === createForm.employee);
      if (!selectedEmployee) {
        throw new Error('Selected employee not found');
      }
      
      const salaryData = employeeSalaries[createForm.employee] || {};
      const monthlySalary = salaryData.salary || 30000;
      const dailyRate = Math.round(monthlySalary / 26);
      const hourlyRate = Math.round(dailyRate / 8);
      
      const attendanceDeductions = calculateAttendanceDeductions(
        createForm.employee,
        monthlySalary,
        createForm.presentDays
      );
      
      const basicPay = Math.round(dailyRate * createForm.presentDays);
      const overtimeAmount = createForm.earnings.overtime || 0;
      const bonusAmount = createForm.earnings.bonus || 0;
      const allowanceAmount = createForm.earnings.allowance || 0;
      const totalEarnings = basicPay + overtimeAmount + bonusAmount + allowanceAmount;
      
      const totalDeductions = 
        attendanceDeductions.total + 
        (createForm.deductions.taxDeduction || 0);
      
      const netPayable = totalEarnings - totalDeductions;
      
      const payrollData = {
        _id: `payroll_${Date.now()}_${createForm.employee}`,
        employee: createForm.employee,
        employeeName: salaryData.name || `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim(),
        employeeId: selectedEmployee.employeeId || selectedEmployee._id,
        periodStart: createForm.periodStart,
        periodEnd: createForm.periodEnd,
        status: createForm.status,
        notes: createForm.notes,
        
        salaryDetails: {
          monthlySalary,
          dailyRate,
          hourlyRate
        },
        
        attendance: {
          presentDays: createForm.presentDays,
          totalWorkingDays: createForm.totalWorkingDays,
          attendancePercentage: Math.round((createForm.presentDays / createForm.totalWorkingDays) * 100),
          lateMinutes: attendanceDeductions.breakdown.lateMinutes,
          absentDays: attendanceDeductions.breakdown.absentDays,
          halfDays: attendanceDeductions.breakdown.halfDays,
          leaveDays: attendanceDeductions.breakdown.leaveDays
        },
        
        earnings: {
          basicPay,
          overtime: overtimeAmount,
          bonus: bonusAmount,
          allowance: allowanceAmount,
          total: totalEarnings
        },
        
        deductions: {
          lateDeduction: attendanceDeductions.lateDeduction,
          absentDeduction: attendanceDeductions.absentDeduction,
          leaveDeduction: attendanceDeductions.leaveDeduction,
          taxDeduction: createForm.deductions.taxDeduction || 0,
          total: totalDeductions,
          breakdown: {
            autoCalculated: attendanceDeductions.total,
            manual: createForm.deductions.taxDeduction || 0
          }
        },
        
        summary: {
          grossEarnings: totalEarnings,
          totalDeductions,
          netPayable,
          inWords: convertToWords(netPayable)
        },
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: getUserId(),
        createdRole: getUserRole(),
        isAutoGenerated: false,
        hasLateLeaveCalculations: attendanceDeductions.total > 0,
        autoDeductionsApplied: true
      };
      
      // ✅ MongoDB তে save করার জন্য এই কোড implement করুন
      try {
        console.log('🔄 Sending to MongoDB...');
        
        // API call to backend
        const response = await fetch('https://a2itserver.onrender.com/api/v1/payrollCreate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payrollData)
        });

        const data = await response.json();
        console.log('MongoDB Response:', data);

        if (response.ok && data.status === "success") {
          // ✅ MongoDB থেকে আসা real ID update করুন
          payrollData._id = data.data._id;
          payrollData.isSyncedToMongoDB = true;
          console.log('✅ Saved to MongoDB with ID:', payrollData._id);
        } else {
          throw new Error(data.message || 'Failed to save to MongoDB');
        }

      } catch (apiError) {
        console.error('❌ MongoDB Save Error:', apiError);
        payrollData.isSyncedToMongoDB = false;
        payrollData.syncError = apiError.message;
        console.log('💾 Saving payroll locally only');
      }
      
      const updatedPayrolls = [payrollData, ...payrolls];
      setPayrolls(updatedPayrolls);
      savePayrollsToLocalStorage(updatedPayrolls);
      calculateStats(updatedPayrolls);
      
      setShowCreateModal(false);
      setCreateForm({
        employee: '',
        periodStart: '',
        periodEnd: '',
        status: 'Pending',
        notes: '',
        basicPay: '',
        monthlySalary: '',
        presentDays: 22,
        totalWorkingDays: 26,
        deductions: {
          lateDeduction: 0,
          absentDeduction: 0,
          taxDeduction: 0
        },
        earnings: {
          overtime: 0,
          bonus: 0,
          allowance: 0
        }
      });
      
      toast.success('Payroll created successfully!');
      
    } catch (error) {
      console.error('Create payroll error:', error);
      toast.error(error.message || 'Failed to create payroll');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle calculate payroll
  const handleCalculatePayroll = async (e) => {
    e.preventDefault();
    
    if (!calculateForm.employeeId || !calculateForm.periodStart || !calculateForm.periodEnd) {
      toast.error('Please select employee and period dates');
      return;
    }
    
    setLoading(prev => ({ ...prev, calculation: true }));
    
    try {
      const employee = employees.find(e => e._id === calculateForm.employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      const salaryData = employeeSalaries[calculateForm.employeeId] || {};
      const monthlySalary = salaryData.salary || 30000;
      const dailyRate = Math.round(monthlySalary / 26);
      const presentDays = 22;
      const totalWorkingDays = 26;
      
      const attendanceDeductions = calculateAttendanceDeductions(
        calculateForm.employeeId,
        monthlySalary,
        presentDays
      );
      
      const basicPay = Math.round(dailyRate * presentDays);
      const overtimeAmount = Math.round(dailyRate / 8 * 10 * 1.5);
      const totalEarnings = basicPay + overtimeAmount;
      const totalDeductions = attendanceDeductions.total + Math.round(monthlySalary * 0.1);
      const netPayable = totalEarnings - totalDeductions;
      
      const calculationResult = {
        employeeDetails: {
          name: salaryData.name || `${employee.firstName} ${employee.lastName}`.trim(),
          employeeId: employee.employeeId || employee._id,
          department: salaryData.department,
          designation: salaryData.designation
        },
        periodStart: calculateForm.periodStart,
        periodEnd: calculateForm.periodEnd,
        monthlySalary: monthlySalary,
        basicPay: basicPay,
        dailyRate: dailyRate,
        hourlyRate: Math.round(dailyRate / 8),
        presentDays: presentDays,
        totalWorkingDays: totalWorkingDays,
        attendancePercentage: Math.round((presentDays / totalWorkingDays) * 100),
        
        attendanceBreakdown: attendanceDeductions.breakdown,
        
        earnings: {
          basicPay: basicPay,
          overtime: overtimeAmount,
          bonus: 0,
          allowance: 0,
          total: totalEarnings
        },
        
        deductions: {
          lateDeduction: attendanceDeductions.lateDeduction,
          absentDeduction: attendanceDeductions.absentDeduction,
          leaveDeduction: attendanceDeductions.leaveDeduction,
          taxDeduction: Math.round(monthlySalary * 0.1),
          total: totalDeductions
        },
        
        summary: {
          grossEarnings: totalEarnings,
          totalDeductions: totalDeductions,
          netPayable: netPayable,
          inWords: convertToWords(netPayable)
        }
      };
      
      setCalculationResult(calculationResult);
      toast.success('Payroll calculated successfully!');
      
    } catch (error) {
      console.error('Calculate payroll error:', error);
      toast.error('Failed to calculate payroll');
    } finally {
      setLoading(prev => ({ ...prev, calculation: false }));
    }
  };

  // Handle bulk generate
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    
    if (!bulkForm.periodStart || !bulkForm.periodEnd) {
      toast.error('Please select period dates');
      return;
    }
    
    setLoading(prev => ({ ...prev, generate: true }));
    
    try {
      const newPayrolls = [];
      
      employees.forEach((emp, index) => {
        const salaryData = employeeSalaries[emp._id] || {};
        const monthlySalary = salaryData.salary || 30000;
        const dailyRate = Math.round(monthlySalary / 26);
        const presentDays = 22;
        
        const attendanceDeductions = calculateAttendanceDeductions(
          emp._id,
          monthlySalary,
          presentDays
        );
        
        const basicPay = Math.round(dailyRate * presentDays);
        const overtimeAmount = Math.round(dailyRate / 8 * 10 * 1.5);
        const totalEarnings = basicPay + overtimeAmount;
        const totalDeductions = attendanceDeductions.total + Math.round(monthlySalary * 0.1);
        const netPayable = totalEarnings - totalDeductions;
        
        const payrollData = {
          _id: `bulk_${Date.now()}_${emp._id}`,
          employee: emp._id,
          employeeName: salaryData.name || `${emp.firstName} ${emp.lastName}`.trim(),
          employeeId: emp.employeeId || emp._id,
          periodStart: bulkForm.periodStart,
          periodEnd: bulkForm.periodEnd,
          status: 'Pending',
          
          salaryDetails: {
            monthlySalary,
            dailyRate,
            hourlyRate: Math.round(dailyRate / 8)
          },
          
          attendance: {
            presentDays: presentDays,
            totalWorkingDays: 26,
            attendancePercentage: Math.round((presentDays / 26) * 100),
            lateMinutes: attendanceDeductions.breakdown.lateMinutes,
            absentDays: attendanceDeductions.breakdown.absentDays
          },
          
          earnings: {
            basicPay,
            overtime: overtimeAmount,
            total: totalEarnings
          },
          
          deductions: {
            lateDeduction: attendanceDeductions.lateDeduction,
            absentDeduction: attendanceDeductions.absentDeduction,
            taxDeduction: Math.round(monthlySalary * 0.1),
            total: totalDeductions
          },
          
          summary: {
            netPayable,
            inWords: convertToWords(netPayable)
          },
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            bulkGenerated: true,
            generationDate: new Date().toISOString(),
            autoDeductionsApplied: true
          }
        };
        
        newPayrolls.push(payrollData);
      });
      
      const updatedPayrolls = [...newPayrolls, ...payrolls];
      setPayrolls(updatedPayrolls);
      savePayrollsToLocalStorage(updatedPayrolls);
      calculateStats(updatedPayrolls);
      
      toast.success(`Created ${newPayrolls.length} payrolls for all employees`);
      setShowBulkModal(false);
      setBulkForm({ periodStart: '', periodEnd: '' });
      
    } catch (error) {
      console.error('Bulk generate error:', error);
      toast.error('Bulk generation failed');
    } finally {
      setLoading(prev => ({ ...prev, generate: false }));
    }
  };

  // Handle salary request action
  const handleSalaryRequestAction = (requestId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this salary request?`)) return;
    
    const allRequests = JSON.parse(localStorage.getItem('salary_requests') || '[]');
    const requestIndex = allRequests.findIndex(req => req._id === requestId);
    
    if (requestIndex === -1) {
      toast.error('Salary request not found');
      return;
    }
    
    const updatedRequests = [...allRequests];
    updatedRequests[requestIndex] = {
      ...updatedRequests[requestIndex],
      status: action === 'approve' ? 'approved' : 'rejected',
      respondedAt: new Date().toISOString(),
      respondedBy: getUserId()
    };
    
    localStorage.setItem('salary_requests', JSON.stringify(updatedRequests));
    loadSalaryRequests();
    
    if (action === 'approve') {
      const request = allRequests[requestIndex];
      
      const employee = employees.find(emp => emp._id === request.employeeId);
      if (employee) {
        const salaryData = employeeSalaries[request.employeeId] || {};
        const monthlySalary = salaryData.salary || 30000;
        const dailyRate = Math.round(monthlySalary / 26);
        const presentDays = 22;
        
        const attendanceDeductions = calculateAttendanceDeductions(
          request.employeeId,
          monthlySalary,
          presentDays
        );
        
        const basicPay = Math.round(dailyRate * presentDays);
        const totalEarnings = basicPay;
        const totalDeductions = attendanceDeductions.total + Math.round(monthlySalary * 0.1);
        const netPayable = totalEarnings - totalDeductions;
        
        const payrollData = {
          _id: `from_req_${Date.now()}_${request.employeeId}`,
          employee: request.employeeId,
          employeeName: request.employeeName,
          employeeId: employee.employeeId || employee._id,
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          status: 'Paid',
          
          salaryDetails: {
            monthlySalary,
            dailyRate,
            hourlyRate: Math.round(dailyRate / 8)
          },
          
          attendance: {
            presentDays: presentDays,
            totalWorkingDays: 26,
            attendancePercentage: Math.round((presentDays / 26) * 100)
          },
          
          earnings: {
            basicPay,
            total: totalEarnings
          },
          
          deductions: {
            lateDeduction: attendanceDeductions.lateDeduction,
            absentDeduction: attendanceDeductions.absentDeduction,
            taxDeduction: Math.round(monthlySalary * 0.1),
            total: totalDeductions
          },
          
          summary: {
            netPayable,
            inWords: convertToWords(netPayable)
          },
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdFromSalaryRequest: true,
          salaryRequestId: requestId
        };
        
        const updatedPayrolls = [payrollData, ...payrolls];
        setPayrolls(updatedPayrolls);
        savePayrollsToLocalStorage(updatedPayrolls);
        calculateStats(updatedPayrolls);
      }
      
      toast.success('Salary request approved and payroll created!');
    } else {
      toast.success('Salary request rejected');
    }
  };

  // Handle update status
  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Change status to ${status}?`)) return;
    
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      const updatedPayrolls = payrolls.map(p => 
        p._id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      );
      
      setPayrolls(updatedPayrolls);
      savePayrollsToLocalStorage(updatedPayrolls);
      calculateStats(updatedPayrolls);
      
      toast.success('Status updated successfully');
      
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle delete payroll
  const handleDeletePayroll = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll?')) return;
    
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      const updatedPayrolls = payrolls.filter(p => p._id !== id);
      setPayrolls(updatedPayrolls);
      savePayrollsToLocalStorage(updatedPayrolls);
      calculateStats(updatedPayrolls);
      
      toast.success('Payroll deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete payroll');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await loadEmployees();
    await loadAttendanceData();
    await loadPayrolls();
    loadSalaryRequests();
    checkAutoSalaryRequests();
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      toast.success('Logged out successfully');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  };

  // Handle auto-generate from calculation
  const handleAutoGenerate = async () => {
    if (!calculationResult) {
      toast.error('No calculation result available');
      return;
    }
    
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      const employee = employees.find(e => e._id === calculateForm.employeeId);
      if (employee) {
        const payrollData = {
          _id: `calc_${Date.now()}_${calculateForm.employeeId}`,
          employee: calculateForm.employeeId,
          employeeName: calculationResult.employeeDetails.name,
          employeeId: calculationResult.employeeDetails.employeeId,
          periodStart: calculateForm.periodStart,
          periodEnd: calculateForm.periodEnd,
          status: 'Pending',
          ...calculationResult,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            autoGenerated: true,
            fromCalculation: true
          }
        };
        
        const updatedPayrolls = [payrollData, ...payrolls];
        setPayrolls(updatedPayrolls);
        savePayrollsToLocalStorage(updatedPayrolls);
        calculateStats(updatedPayrolls);
        
        toast.success('Payroll created from calculation');
        setShowCalculateModal(false);
        setCalculationResult(null);
        setCalculateForm({ employeeId: '', periodStart: '', periodEnd: '' });
      }
    } catch (error) {
      console.error('Auto generate error:', error);
      toast.error('Failed to generate payroll');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle monthly generation
  const handleMonthlyGeneration = async () => {
    if (!window.confirm('Generate payroll for all employees for the previous month?')) return;
    
    setLoading(prev => ({ ...prev, generate: true }));
    
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const periodStart = firstDay.toISOString().split('T')[0];
      const periodEnd = lastDay.toISOString().split('T')[0];
      
      const newPayrolls = [];
      
      employees.forEach(emp => {
        const salaryData = employeeSalaries[emp._id] || {};
        const monthlySalary = salaryData.salary || 30000;
        const dailyRate = Math.round(monthlySalary / 26);
        const presentDays = 22;
        
        const attendanceDeductions = calculateAttendanceDeductions(
          emp._id,
          monthlySalary,
          presentDays
        );
        
        const basicPay = Math.round(dailyRate * presentDays);
        const overtimeAmount = Math.round(dailyRate / 8 * 10 * 1.5);
        const totalEarnings = basicPay + overtimeAmount;
        const totalDeductions = attendanceDeductions.total + Math.round(monthlySalary * 0.1);
        const netPayable = totalEarnings - totalDeductions;
        
        const payrollData = {
          _id: `monthly_${Date.now()}_${emp._id}`,
          employee: emp._id,
          employeeName: salaryData.name || `${emp.firstName} ${emp.lastName}`.trim(),
          employeeId: emp.employeeId || emp._id,
          periodStart,
          periodEnd,
          status: 'Pending',
          
          salaryDetails: {
            monthlySalary,
            dailyRate,
            hourlyRate: Math.round(dailyRate / 8)
          },
          
          attendance: {
            presentDays: presentDays,
            totalWorkingDays: 26,
            attendancePercentage: Math.round((presentDays / 26) * 100)
          },
          
          earnings: {
            basicPay,
            overtime: overtimeAmount,
            total: totalEarnings
          },
          
          deductions: {
            lateDeduction: attendanceDeductions.lateDeduction,
            absentDeduction: attendanceDeductions.absentDeduction,
            taxDeduction: Math.round(monthlySalary * 0.1),
            total: totalDeductions
          },
          
          summary: {
            netPayable,
            inWords: convertToWords(netPayable)
          },
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            monthlyGenerated: true,
            autoDeductionsApplied: true
          }
        };
        
        newPayrolls.push(payrollData);
      });
      
      const updatedPayrolls = [...newPayrolls, ...payrolls];
      setPayrolls(updatedPayrolls);
      savePayrollsToLocalStorage(updatedPayrolls);
      calculateStats(updatedPayrolls);
      
      toast.success(`Created ${newPayrolls.length} monthly payrolls`);
      
    } catch (error) {
      console.error('Monthly generation error:', error);
      toast.error('Monthly payroll generation failed');
    } finally {
      setLoading(prev => ({ ...prev, generate: false }));
    }
  };

  // Initialize app
  useEffect(() => {
    const init = async () => {
      console.log('Initializing payroll system...');
      
      const token = getToken();
      if (!token) {
        toast.error('Please login to access payroll');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
        return;
      }
      
      try {
        await checkApiConnection();
        await loadEmployees();
        await loadAttendanceData();
        await loadPayrolls();
        loadSalaryRequests();
        checkAutoSalaryRequests();
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Initialization failed:', error);
        toast.error('Failed to initialize app');
      }
    };
    
    init();
    
    const interval = setInterval(checkAutoSalaryRequests, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter payrolls
  const filteredPayrolls = payrolls.filter(payroll => {
    const employeeName = getEmployeeName(payroll).toLowerCase();
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || payroll.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginate payrolls
  const paginatedPayrolls = filteredPayrolls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);

  // Check if user is admin
  const isAdmin = getUserRole() === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Payroll Management System
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <p className="text-gray-600 text-sm">Dashboard</p>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  {isAdmin ? 'Admin Access' : 'Employee Access'}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {getUserName()}
                </span>
                <div className="flex items-center gap-2 ml-4">
                  {apiConnected ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Wifi size={16} />
                      <span className="text-sm">API Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <WifiOff size={16} />
                      <span className="text-sm">API Disconnected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all"
            >
              <HomeIcon size={18} />
              Dashboard
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading.payrolls}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading.payrolls ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:opacity-90 flex items-center gap-2 text-sm font-medium shadow-sm transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Total Payroll Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <WalletIcon size={16} />
                  Total Payroll
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalPayroll)}
                </p>
                <p className="text-xs text-gray-400 mt-1">All processed payrolls</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <DollarSign className="text-white" size={20} />
              </div>
            </div>
          </div>

          {/* Employees Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <UsersIcon size={16} />
                  Employees
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalEmployees}
                </p>
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  <UserCheck size={12} /> Active employees
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <ClockIcon size={16} />
                  Pending
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalPending}
                </p>
                <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Awaiting processing
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={20} />
              </div>
            </div>
          </div>

          {/* Monthly Expense Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <Banknote size={16} />
                  Monthly Expense
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.monthlyExpense)}
                </p>
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} /> Current month
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BarChart className="text-white" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Salary Requests Notification */}
        {stats.pendingSalaryRequests > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Salary Requests Pending</p>
                  <p className="text-sm opacity-90">
                    {stats.pendingSalaryRequests} salary request{stats.pendingSalaryRequests !== 1 ? 's' : ''} awaiting {isAdmin ? 'processing' : 'your approval'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSalaryRequestsModal(true)}
                className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                View Requests
              </button>
            </div>
          </div>
        )}

        {/* Action Cards - Show only for admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-5 hover:opacity-90 transition-all flex items-center justify-between shadow-lg"
            >
              <div className="text-left">
                <p className="font-semibold">Create Payroll</p>
                <p className="text-sm opacity-90">Manual creation</p>
              </div>
              <PlusCircle size={24} />
            </button>

            <button
              onClick={() => setShowCalculateModal(true)}
              disabled={loading.employees}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl p-5 hover:opacity-90 transition-all flex items-center justify-between shadow-lg disabled:opacity-50"
            >
              <div className="text-left">
                <p className="font-semibold">Calculate</p>
                <p className="text-sm opacity-90">Auto calculation</p>
              </div>
              {loading.employees ? <Loader2 size={24} className="animate-spin" /> : <CalcIcon size={24} />}
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-5 hover:opacity-90 transition-all flex items-center justify-between shadow-lg"
            >
              <div className="text-left">
                <p className="font-semibold">Bulk Generate</p>
                <p className="text-sm opacity-90">All employees</p>
              </div>
              <UsersIcon size={24} />
            </button>

            <button
              onClick={handleMonthlyGeneration}
              disabled={loading.generate}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl p-5 hover:opacity-90 transition-all flex items-center justify-between shadow-lg disabled:opacity-50"
            >
              <div className="text-left">
                <p className="font-semibold">Monthly Run</p>
                <p className="text-sm opacity-90">Auto process</p>
              </div>
              {loading.generate ? <Loader2 size={24} className="animate-spin" /> : <CalendarRange size={24} />}
            </button>
          </div>
        )}

        {/* Employee Actions */}
        {!isAdmin && salaryRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">My Salary Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salaryRequests.slice(0, 3).map(req => (
                <div key={req._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{req.month}/{req.year} Salary</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(req.periodStart)} - {formatDate(req.periodEnd)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${req.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {req.status === 'pending_approval' ? 'Pending' : req.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-purple-600 mb-3">
                    {formatCurrency(req.amount || 0)}
                  </p>
                  {req.status === 'pending_approval' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSalaryRequestAction(req._id, 'approve')}
                        className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSalaryRequestAction(req._id, 'reject')}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isAdmin ? 'Payroll Records' : 'My Payrolls'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Showing {paginatedPayrolls.length} of {filteredPayrolls.length} records
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-64 transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="pending_approval">Pending Approval</option>
              </select>

              {/* Export Button - Only for admin */}
              {isAdmin && (
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "Employee Name,Period,Basic Pay,Net Payable,Status,Auto Deductions\n" +
                      payrolls.map(p => 
                        `${getEmployeeName(p)},${formatDate(p.periodStart)}-${formatDate(p.periodEnd)},${formatCurrency(p.earnings?.basicPay || p.basicPay || 0)},${formatCurrency(p.summary?.netPayable || p.netSalary || 0)},${p.status},${p.autoDeductionsApplied ? 'Yes' : 'No'}`
                      ).join("\n");
                    
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `payroll_export_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    toast.success('Payroll data exported successfully');
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl hover:opacity-90 flex items-center gap-2 text-sm font-medium shadow-sm transition-all"
                >
                  <DownloadCloud size={18} />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        {loading.payrolls ? (
          <div className="p-12 text-center">
            <div className="inline-flex flex-col items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading payroll data...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the records</p>
            </div>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No payroll records found</h3>
              <p className="text-gray-500 text-sm mb-6">
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your search or filter'
                  : isAdmin
                  ? 'Get started by creating your first payroll'
                  : 'No payroll records available yet'}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 font-medium shadow-sm transition-all"
                >
                  Create Payroll
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Basic Pay</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Payable</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedPayrolls.map((payroll) => {
                    const statusColor = getStatusColor(payroll.status);
                    const netPayable = payroll.summary?.netPayable || payroll.netSalary || 0;
                    const basicPay = payroll.earnings?.basicPay || payroll.basicPay || 0;
                    
                    return (
                      <tr key={payroll._id || payroll.id} className="hover:bg-gray-50 transition-colors">
                        {/* Employee Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-semibold mr-3">
                              {getEmployeeName(payroll).charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{getEmployeeName(payroll)}</div>
                              <div className="text-sm text-gray-500">
                                {payroll.employee?.designation || payroll.designation || 'Employee'}
                              </div>
                              {payroll.attendance?.lateMinutes > 0 && (
                                <div className="text-xs text-yellow-600 mt-1">
                                  ⏰ Late: {payroll.attendance.lateMinutes} min
                                </div>
                              )}
                              {payroll.attendance?.absentDays > 0 && (
                                <div className="text-xs text-red-600">
                                  ❌ Absent: {payroll.attendance.absentDays} days
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Period Column */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600">
                              {formatDate(payroll.periodStart)}
                            </div>
                            <div className="text-xs text-gray-400 text-center">to</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(payroll.periodEnd)}
                            </div>
                          </div>
                        </td>

                        {/* Basic Pay Column */}
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(basicPay)}
                          </div>
                          {payroll.salaryDetails?.monthlySalary && (
                            <div className="text-xs text-gray-400">
                              Monthly: {formatCurrency(payroll.salaryDetails.monthlySalary)}
                            </div>
                          )}
                          {payroll.hasLateLeaveCalculations && (
                            <div className="text-xs text-green-500 mt-1">
                              ✓ Auto deductions applied
                            </div>
                          )}
                        </td>

                        {/* Net Payable Column */}
                        <td className="px-6 py-4">
                          <div className="text-xl font-bold text-purple-600">
                            {formatCurrency(netPayable)}
                          </div>
                          {payroll.attendance?.presentDays && (
                            <div className="text-xs text-gray-400 mt-1">
                              {payroll.attendance.presentDays} days present
                            </div>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                            {statusColor.icon}
                            <span className="ml-2">{payroll.status}</span>
                          </span>
                          {payroll.createdFromSalaryRequest && (
                            <div className="text-xs text-blue-500 mt-1">
                              From Salary Request
                            </div>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPayroll(payroll);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Admin only actions */}
                            {isAdmin && (
                              <>
                                {payroll.status === 'Pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(payroll._id, 'Paid')}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Mark as Paid"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}

                                {payroll.status === 'Paid' && (
                                  <button
                                    onClick={() => handleUpdateStatus(payroll._id, 'Pending')}
                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Mark as Pending"
                                  >
                                    <Clock size={16} />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeletePayroll(payroll._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages} • {filteredPayrolls.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg ${currentPage === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Payroll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create Payroll</h2>
                  <p className="text-gray-500 text-sm mt-1">Manual payroll creation with auto salary</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePayroll} className="p-6 space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee *
                </label>
                <select
                  value={createForm.employee}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  required
                  disabled={loading.employees || employees.length === 0}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50"
                >
                  <option value="">Choose an employee</option>
                  {employees.map((emp) => {
                    const salaryData = employeeSalaries[emp._id] || {};
                    const monthlySalary = salaryData.salary || salaryData.monthlyBasic || 30000;
                    const attendance = attendanceData[emp._id] || {};
                    let attendanceText = '';
                    
                    if (attendance.lateMinutes > 0) attendanceText += ` ⏰${attendance.lateMinutes}m`;
                    if (attendance.absentDays > 0) attendanceText += ` ❌${attendance.absentDays}d`;
                    
                    return (
                      <option key={emp._id} value={emp._id}>
                        {salaryData.name || `${emp.firstName} ${emp.lastName}`.trim()} • 
                        {emp.department || 'General'} • 
                        Salary: {formatCurrency(monthlySalary)}
                        {attendanceText}
                      </option>
                    );
                  })}
                </select>
                {employees.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    {loading.employees ? 'Loading employees...' : 'No employees available. Please add employees first.'}
                  </p>
                )}
                {createForm.employee && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-600">Monthly Salary:</span>
                        <p className="font-semibold text-blue-700">
                          {formatCurrency(employeeSalaries[createForm.employee]?.salary || 30000)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Designation:</span>
                        <p className="font-semibold">
                          {employeeSalaries[createForm.employee]?.designation || 'Employee'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pay Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Period *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={createForm.periodStart}
                      onChange={(e) => setCreateForm({ ...createForm, periodStart: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">Start Date</p>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={createForm.periodEnd}
                      onChange={(e) => setCreateForm({ ...createForm, periodEnd: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">End Date</p>
                  </div>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Present Days *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={createForm.presentDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 0;
                      setCreateForm(prev => {
                        const salaryData = employeeSalaries[prev.employee] || {};
                        const monthlySalary = salaryData.salary || 30000;
                        const dailyRate = Math.round(monthlySalary / 26);
                        const basicPay = Math.round(dailyRate * days);
                        
                        const attendanceDeductions = calculateAttendanceDeductions(prev.employee, monthlySalary, days);
                        
                        const totalEarnings = 
                          basicPay + 
                          (prev.earnings.overtime || 0) + 
                          (prev.earnings.bonus || 0) + 
                          (prev.earnings.allowance || 0);
                        
                        const totalDeductions = 
                          attendanceDeductions.total + 
                          (prev.deductions.taxDeduction || 0);
                        
                        return {
                          ...prev,
                          presentDays: days,
                          basicPay,
                          deductions: {
                            ...prev.deductions,
                            lateDeduction: attendanceDeductions.lateDeduction,
                            absentDeduction: attendanceDeductions.absentDeduction
                          },
                          netSalary: totalEarnings - totalDeductions
                        };
                      });
                    }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Working Days *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={createForm.totalWorkingDays}
                    onChange={(e) => setCreateForm({ ...createForm, totalWorkingDays: parseInt(e.target.value) || 26 })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Auto Calculated Deductions */}
              {createForm.employee && attendanceData[createForm.employee] && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-700 mb-2">
                    Auto Calculated Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {attendanceData[createForm.employee].lateMinutes > 0 && (
                      <div>
                        <span className="text-xs text-gray-600">Late Minutes:</span>
                        <p className="text-sm font-semibold text-yellow-600">
                          {attendanceData[createForm.employee].lateMinutes} min
                        </p>
                      </div>
                    )}
                    {attendanceData[createForm.employee].absentDays > 0 && (
                      <div>
                        <span className="text-xs text-gray-600">Absent Days:</span>
                        <p className="text-sm font-semibold text-red-600">
                          {attendanceData[createForm.employee].absentDays} days
                        </p>
                      </div>
                    )}
                    {attendanceData[createForm.employee].halfDays > 0 && (
                      <div>
                        <span className="text-xs text-gray-600">Half Days:</span>
                        <p className="text-sm font-semibold text-orange-600">
                          {attendanceData[createForm.employee].halfDays} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Earnings */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <h3 className="text-sm font-medium text-emerald-700 mb-3">Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Overtime Amount</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.earnings.overtime}
                      onChange={(e) => {
                        const overtime = parseInt(e.target.value) || 0;
                        setCreateForm(prev => ({
                          ...prev,
                          earnings: { ...prev.earnings, overtime },
                          netSalary: (prev.basicPay || 0) + overtime + (prev.earnings.bonus || 0) + (prev.earnings.allowance || 0) - 
                                    ((prev.deductions.lateDeduction || 0) + (prev.deductions.absentDeduction || 0) + (prev.deductions.taxDeduction || 0))
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Bonus</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.earnings.bonus}
                      onChange={(e) => {
                        const bonus = parseInt(e.target.value) || 0;
                        setCreateForm(prev => ({
                          ...prev,
                          earnings: { ...prev.earnings, bonus },
                          netSalary: (prev.basicPay || 0) + (prev.earnings.overtime || 0) + bonus + (prev.earnings.allowance || 0) - 
                                    ((prev.deductions.lateDeduction || 0) + (prev.deductions.absentDeduction || 0) + (prev.deductions.taxDeduction || 0))
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Allowance</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.earnings.allowance}
                      onChange={(e) => {
                        const allowance = parseInt(e.target.value) || 0;
                        setCreateForm(prev => ({
                          ...prev,
                          earnings: { ...prev.earnings, allowance },
                          netSalary: (prev.basicPay || 0) + (prev.earnings.overtime || 0) + (prev.earnings.bonus || 0) + allowance - 
                                    ((prev.deductions.lateDeduction || 0) + (prev.deductions.absentDeduction || 0) + (prev.deductions.taxDeduction || 0))
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <h3 className="text-sm font-medium text-rose-700 mb-3">Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Late Deduction</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.deductions.lateDeduction}
                      onChange={(e) => {
                        const lateDeduction = parseInt(e.target.value) || 0;
                        setCreateForm(prev => ({
                          ...prev,
                          deductions: { ...prev.deductions, lateDeduction },
                          netSalary: (prev.basicPay || 0) + (prev.earnings.overtime || 0) + (prev.earnings.bonus || 0) + (prev.earnings.allowance || 0) - 
                                    (lateDeduction + (prev.deductions.absentDeduction || 0) + (prev.deductions.taxDeduction || 0))
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Auto: {formatCurrency(calculateAttendanceDeductions(createForm.employee, employeeSalaries[createForm.employee]?.salary || 30000, createForm.presentDays).lateDeduction)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Absent Deduction</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.deductions.absentDeduction}
                      onChange={(e) => {
                        const absentDeduction = parseInt(e.target.value) || 0;
                        setCreateForm(prev => ({
                          ...prev,
                          deductions: { ...prev.deductions, absentDeduction },
                          netSalary: (prev.basicPay || 0) + (prev.earnings.overtime || 0) + (prev.earnings.bonus || 0) + (prev.earnings.allowance || 0) - 
                                    ((prev.deductions.lateDeduction || 0) + absentDeduction + (prev.deductions.taxDeduction || 0))
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Auto: {formatCurrency(calculateAttendanceDeductions(createForm.employee, employeeSalaries[createForm.employee]?.salary || 30000, createForm.presentDays).absentDeduction)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Tax Deduction</label>
                    <input
                      type="number"
                      min="0"
                      value={createForm.deductions.taxDeduction}
                      onChange={(e) => {
                        const taxDeduction = parseInt(e.target.value) || 0;
                        setCreateForm(prev => ({
                          ...prev,
                          deductions: { ...prev.deductions, taxDeduction },
                          netSalary: (prev.basicPay || 0) + (prev.earnings.overtime || 0) + (prev.earnings.bonus || 0) + (prev.earnings.allowance || 0) - 
                                    ((prev.deductions.lateDeduction || 0) + (prev.deductions.absentDeduction || 0) + taxDeduction)
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Salary Summary */}
              {createForm.employee && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="text-sm font-medium text-purple-700 mb-3">Salary Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs text-gray-600">Basic Pay</span>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(createForm.basicPay || 0)}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-600">Total Earnings</span>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(
                          (createForm.basicPay || 0) + 
                          (createForm.earnings.overtime || 0) + 
                          (createForm.earnings.bonus || 0) + 
                          (createForm.earnings.allowance || 0)
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-600">Total Deductions</span>
                      <p className="text-lg font-bold text-rose-600">
                        {formatCurrency(
                          (createForm.deductions.lateDeduction || 0) + 
                          (createForm.deductions.absentDeduction || 0) + 
                          (createForm.deductions.taxDeduction || 0)
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-600">Net Payable</span>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(createForm.netSalary || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calculator size={12} />
                      <span>Daily Rate: {formatCurrency(Math.round((employeeSalaries[createForm.employee]?.salary || 30000) / 26))}</span>
                      <span className="mx-2">•</span>
                      <span>Attendance: {Math.round((createForm.presentDays / createForm.totalWorkingDays) * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Status
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="Pending">Pending</option>
                  <option value="Draft">Draft</option>
                  <option value="Paid">Paid</option>
                  <option value="Approved">Approved</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  rows="3"
                  placeholder="Additional notes or remarks..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading.action}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action || !createForm.employee}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading.action ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      Create Payroll
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calculate Payroll Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {calculationResult ? 'Calculation Result' : 'Calculate Payroll'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {calculationResult ? 'Review and generate payroll' : 'Auto calculate from attendance data'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCalculateModal(false);
                    setCalculationResult(null);
                    setCalculateForm({ employeeId: '', periodStart: '', periodEnd: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!calculationResult ? (
                <form onSubmit={handleCalculatePayroll} className="space-y-6">
                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Employee *
                    </label>
                    <select
                      value={calculateForm.employeeId}
                      onChange={(e) => setCalculateForm({ ...calculateForm, employeeId: e.target.value })}
                      required
                      disabled={loading.employees || employees.length === 0}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50"
                    >
                      <option value="">Choose an employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {employeeSalaries[emp._id]?.name || `${emp.firstName} ${emp.lastName}`.trim()} • {emp.employeeId || emp._id} • {emp.department || 'No Department'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pay Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Period *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          value={calculateForm.periodStart}
                          onChange={(e) => setCalculateForm({ ...calculateForm, periodStart: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-2">Start Date</p>
                      </div>
                      <div>
                        <input
                          type="date"
                          value={calculateForm.periodEnd}
                          onChange={(e) => setCalculateForm({ ...calculateForm, periodEnd: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-2">End Date</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCalculateModal(false)}
                      disabled={loading.calculation}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading.calculation || employees.length === 0}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading.calculation ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <CalcIcon size={18} />
                          Calculate
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Result Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Calculation Result</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Employee</p>
                        <p className="font-semibold">{calculationResult.employeeDetails?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Period</p>
                        <p className="font-semibold">
                          {formatDate(calculationResult.periodStart)} - {formatDate(calculationResult.periodEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Present Days</p>
                        <p className="font-semibold">{calculationResult.presentDays || calculationResult.attendance?.presentDays || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Attendance</p>
                        <p className="font-semibold">{calculationResult.attendancePercentage?.toFixed(1) || calculationResult.attendance?.attendancePercentage?.toFixed(1) || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Earnings */}
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                      <h4 className="text-sm font-medium text-green-700 mb-3">Earnings</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Basic Pay:</span>
                          <span className="font-semibold">{formatCurrency(calculationResult.basicPay || calculationResult.earnings?.basicPay || 0)}</span>
                        </div>
                        {calculationResult.earnings?.overtime > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Overtime:</span>
                            <span className="font-semibold text-green-600">
                              +{formatCurrency(calculationResult.earnings?.overtime || 0)}
                            </span>
                          </div>
                        )}
                        {calculationResult.earnings?.bonus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Bonus:</span>
                            <span className="font-semibold text-green-600">
                              +{formatCurrency(calculationResult.earnings?.bonus || 0)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="text-sm font-medium text-gray-700">Total Earnings:</span>
                          <span className="font-bold text-green-700">
                            {formatCurrency(calculationResult.summary?.grossEarnings || calculationResult.earnings?.total || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                      <h4 className="text-sm font-medium text-red-700 mb-3">Deductions</h4>
                      <div className="space-y-2">
                        {calculationResult.deductions?.lateDeduction > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Late Deduction:</span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(calculationResult.deductions.lateDeduction)}
                            </span>
                            <span className="text-xs text-gray-500">(Auto)</span>
                          </div>
                        )}
                        {calculationResult.deductions?.absentDeduction > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Absent Deduction:</span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(calculationResult.deductions.absentDeduction)}
                            </span>
                            <span className="text-xs text-gray-500">(Auto)</span>
                          </div>
                        )}
                        {calculationResult.deductions?.taxDeduction > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tax Deduction:</span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(calculationResult.deductions.taxDeduction)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-red-200">
                          <span className="text-sm font-medium text-gray-700">Total Deductions:</span>
                          <span className="font-bold text-red-700">
                            -{formatCurrency(calculationResult.deductions?.total || calculationResult.summary?.totalDeductions || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Payable */}
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-purple-700">Net Payable</h4>
                        <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-1">
                          {formatCurrency(calculationResult.summary?.netPayable || calculationResult.netPayable || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Monthly Salary: {formatCurrency(calculationResult.monthlySalary || calculationResult.monthlyBasic || 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="text-white" size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setCalculationResult(null)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Calculate Again
                    </button>
                    <button
                      onClick={handleAutoGenerate}
                      disabled={loading.action}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading.action ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileCheck size={18} />
                          Generate Payroll
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bulk Generate Payroll</h2>
                  <p className="text-gray-500 text-sm mt-1">Generate payroll for all employees</p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkGenerate} className="p-6 space-y-6">
              {/* Pay Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Period *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={bulkForm.periodStart}
                      onChange={(e) => setBulkForm({ ...bulkForm, periodStart: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">Start Date</p>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={bulkForm.periodEnd}
                      onChange={(e) => setBulkForm({ ...bulkForm, periodEnd: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">End Date</p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">Bulk Generation Info</h4>
                    <ul className="text-green-100 text-sm mt-2 space-y-1">
                      <li>• Will generate payroll for {employees.length} active employees</li>
                      <li>• Auto-calculates late and absent deductions</li>
                      <li>• Applies attendance data automatically</li>
                      <li>• May take several minutes to complete</li>
                      <li>• Existing payrolls for the period will be skipped</li>
                    </ul>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  disabled={loading.generate}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.generate}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading.generate ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UsersIcon size={18} />
                      Generate All
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Requests Modal */}
      {showSalaryRequestsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isAdmin ? 'All Salary Requests' : 'My Salary Requests'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {isAdmin ? 'Approve or reject salary requests' : 'Review and approve your salary requests'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSalaryRequestsModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {salaryRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No salary requests found</h3>
                  <p className="text-gray-500">No salary requests available at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {salaryRequests.map((request) => (
                    <div key={request._id} className="p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold">
                              {request.employeeName?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{request.employeeName}</h4>
                              <p className="text-sm text-gray-500">
                                {request.month}/{request.year} • {formatDate(request.periodStart)} - {formatDate(request.periodEnd)}
                              </p>
                              {request.autoGenerated && (
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                                  Auto-generated
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-purple-600">
                            {formatCurrency(request.amount || 0)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                            request.status === 'pending_approval' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending_approval' ? 'Pending Approval' : request.status}
                          </span>
                          
                          {request.status === 'pending_approval' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSalaryRequestAction(request._id, 'approve')}
                                className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleSalaryRequestAction(request._id, 'reject')}
                                className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          
                          {request.respondedAt && (
                            <p className="text-xs text-gray-500">
                              Responded: {formatDate(request.respondedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Close Button */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowSalaryRequestsModal(false)}
                  className="w-full px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Details Modal */}
      {showDetailsModal && selectedPayroll && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payroll Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Complete breakdown of salary calculation</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getEmployeeName(selectedPayroll)}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayroll.status).bg} ${getStatusColor(selectedPayroll.status).text}`}>
                      {selectedPayroll.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      ID: {selectedPayroll._id?.substring(0, 8) || 'N/A'}
                    </span>
                    {selectedPayroll.metadata?.autoGenerated && (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        Auto-generated
                      </span>
                    )}
                    {selectedPayroll.autoDeductionsApplied && (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">
                        Auto Deductions
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-purple-600">
                  {formatCurrency(selectedPayroll.summary?.netPayable || selectedPayroll.netSalary || 0)}
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Details */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                    <User size={16} />
                    Employee Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Employee Name:</span>
                      <span className="font-semibold">{getEmployeeName(selectedPayroll)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Employee ID:</span>
                      <span className="font-semibold">{selectedPayroll.employeeId || selectedPayroll.employee?.employeeId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Department:</span>
                      <span className="font-semibold">{selectedPayroll.employee?.department || selectedPayroll.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Designation:</span>
                      <span className="font-semibold">{selectedPayroll.employee?.designation || selectedPayroll.designation || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                {selectedPayroll.attendance && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                      <Calendar size={16} />
                      Attendance Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Present Days:</span>
                        <span className="font-semibold">{selectedPayroll.attendance.presentDays || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Working Days:</span>
                        <span className="font-semibold">{selectedPayroll.attendance.totalWorkingDays || 0}</span>
                      </div>
                      {selectedPayroll.attendance.lateMinutes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Late Minutes:</span>
                          <span className="font-semibold text-yellow-600">{selectedPayroll.attendance.lateMinutes} min</span>
                        </div>
                      )}
                      {selectedPayroll.attendance.absentDays > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Absent Days:</span>
                          <span className="font-semibold text-red-600">{selectedPayroll.attendance.absentDays} days</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Attendance %:</span>
                        <span className="font-semibold">
                          {selectedPayroll.attendance.attendancePercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Salary Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Salary Breakdown</h4>

                {/* Earnings */}
                {(selectedPayroll.earnings || selectedPayroll.salaryDetails) && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <h5 className="text-xs font-medium text-emerald-700 mb-2">Earnings</h5>
                    <div className="space-y-2">
                      {selectedPayroll.earnings?.basicPay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Basic Pay:</span>
                          <span className="font-semibold">{formatCurrency(selectedPayroll.earnings.basicPay)}</span>
                        </div>
                      )}
                      {selectedPayroll.earnings?.overtime > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Overtime:</span>
                          <span className="font-semibold text-green-600">+{formatCurrency(selectedPayroll.earnings.overtime)}</span>
                        </div>
                      )}
                      {selectedPayroll.earnings?.bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Bonus:</span>
                          <span className="font-semibold text-green-600">+{formatCurrency(selectedPayroll.earnings.bonus)}</span>
                        </div>
                      )}
                      {selectedPayroll.earnings?.allowance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Allowance:</span>
                          <span className="font-semibold text-green-600">+{formatCurrency(selectedPayroll.earnings.allowance)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-emerald-200">
                        <span className="text-sm font-medium text-gray-700">Total Earnings:</span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(selectedPayroll.earnings?.total || selectedPayroll.summary?.grossEarnings || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deductions */}
                {selectedPayroll.deductions && (
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <h5 className="text-xs font-medium text-rose-700 mb-2">Deductions</h5>
                    <div className="space-y-2">
                      {selectedPayroll.deductions.lateDeduction > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Late Deduction:</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(selectedPayroll.deductions.lateDeduction)}</span>
                          {selectedPayroll.autoDeductionsApplied && (
                            <span className="text-xs text-gray-500">(Auto)</span>
                          )}
                        </div>
                      )}
                      {selectedPayroll.deductions.absentDeduction > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Absent Deduction:</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(selectedPayroll.deductions.absentDeduction)}</span>
                          {selectedPayroll.autoDeductionsApplied && (
                            <span className="text-xs text-gray-500">(Auto)</span>
                          )}
                        </div>
                      )}
                      {selectedPayroll.deductions.leaveDeduction > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Leave Deduction:</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(selectedPayroll.deductions.leaveDeduction)}</span>
                          {selectedPayroll.autoDeductionsApplied && (
                            <span className="text-xs text-gray-500">(Auto)</span>
                          )}
                        </div>
                      )}
                      {selectedPayroll.deductions.taxDeduction > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tax Deduction:</span>
                          <span className="font-semibold text-red-600">-{formatCurrency(selectedPayroll.deductions.taxDeduction)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-rose-200">
                        <span className="text-sm font-medium text-gray-700">Total Deductions:</span>
                        <span className="font-bold text-rose-700">
                          -{formatCurrency(selectedPayroll.deductions.total || selectedPayroll.summary?.totalDeductions || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Summary */}
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-purple-700">Net Payable</h5>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {formatCurrency(selectedPayroll.summary?.netPayable || selectedPayroll.netSalary || 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedPayroll.summary?.inWords || ''}
                      </p>
                      {selectedPayroll.autoDeductionsApplied && (
                        <p className="text-xs text-green-500 mt-2">
                          ✓ Late and absent deductions applied automatically
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-white" size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Information */}
              <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Period:</span>
                    <div className="mt-1">
                      {formatDate(selectedPayroll.periodStart)} - {formatDate(selectedPayroll.periodEnd)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <div className="mt-1">
                      {formatDate(selectedPayroll.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Calculation Method:</span>
                    <div className="mt-1">
                      {selectedPayroll.metadata?.calculationMethod || 
                       selectedPayroll.metadata?.source || 
                       (selectedPayroll.autoDeductionsApplied ? 'Auto with deductions' : 'Manual')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {isAdmin && selectedPayroll.status === 'Pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPayroll._id, 'Paid')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;