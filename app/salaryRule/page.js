"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  Clock,
  Calendar,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Award,
  Coffee,
  Zap,
  Info,
  FileText,
  Save,
  Users,
  Building,
  Percent,
  TrendingUp
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function page() {
  const router = useRouter();
  const [salaryRules, setSalaryRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // ✅ Updated form state to match backend controller
  const [form, setForm] = useState({
    title: "",
    description: "",
    salaryType: "fixed", // ✅ Backend required
    rate: 0, // ✅ Backend required
    overtimeRate: 0,
    overtimeEnabled: false,
    leaveRule: {
      enabled: false,
      perDayDeduction: 0,
      paidLeaves: 0
    },
    lateRule: {
      enabled: false,
      lateDaysThreshold: 3,
      equivalentLeaveDays: 0.5
    },
    bonusAmount: 0,
    bonusConditions: "",
    isActive: true,
    department: "",
    applicableTo: ["all_employees"]
  });

  // Get user role and token
  const getUserInfo = () => {
    try {
      const token = localStorage.getItem("token") || 
                    localStorage.getItem("jwt") || 
                    localStorage.getItem("authToken") ||
                    localStorage.getItem("accessToken") ||
                    localStorage.getItem("adminToken") || 
                    localStorage.getItem("employeeToken");

      if (!token) {
        console.warn("No authentication token found");
        return null;
      }

      const role = localStorage.getItem("role") || 
                   localStorage.getItem("userRole") ||
                   (token === localStorage.getItem("adminToken") ? "admin" : 
                    token === localStorage.getItem("employeeToken") ? "employee" : 
                    "user");

      return { 
        role, 
        token, 
        isAdmin: role === "admin" || role === "superadmin" 
      };
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  };

  // API Base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://a2itserver.onrender.com/api/v1";

  // ✅ Fetch salary rules based on user role
  const fetchSalaryRules = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Loading salary rules...");
    
    try {
      const userInfo = getUserInfo();
      
      if (!userInfo || !userInfo.token) {
        toast.dismiss(loadingToast);
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      setUserRole(userInfo.role);
      setIsAdmin(userInfo.isAdmin);

      console.log("User Info:", {
        role: userInfo.role,
        isAdmin: userInfo.isAdmin
      });

      // ✅ Role based endpoint selection
      let endpoint;
      
      if (userInfo.isAdmin) {
        // Admin: GET /api/v1/getSalaryRule
        endpoint = `${API_BASE_URL}/getSalaryRule`;
      } else {
        // Employee: GET /api/v1/active
        endpoint = `${API_BASE_URL}/active`;
      }

      console.log("Using endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Content-Type": "application/json"
        },
        cache: 'no-cache'
      });

      console.log("Response Status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          toast.dismiss(loadingToast);
          toast.error("Session expired. Please login again.");
          router.push("/login");
          return;
        } else if (response.status === 403) {
          toast.dismiss(loadingToast);
          toast.error("Access denied. You don't have permission.");
          return;
        }
        
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);
      
      if (data.success || data.status === "success") {
        const rules = data.data || data.rules || [];
        
        if (Array.isArray(rules)) {
          setSalaryRules(rules);
          toast.dismiss(loadingToast);
          toast.success(`Loaded ${rules.length} salary rules`, {
            icon: '💰',
            duration: 3000,
          });
          
          console.log("Rules loaded:", rules.length);
        } else {
          toast.dismiss(loadingToast);
          toast.error("Invalid data format received from server");
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.message || "Failed to load salary rules");
      }
      
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Error loading salary rules: ${error.message}`);
      console.error("Fetch salary rules error details:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle form change for nested objects
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects (leaveRule, lateRule)
    if (name.startsWith("leaveRule.") || name.startsWith("lateRule.")) {
      const [parent, child] = name.split(".");
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "number" ? parseFloat(value) || 0 : 
                   type === "checkbox" ? checked : 
                   value
        }
      }));
    } 
    // Handle other fields
    else {
      setForm(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : 
                type === "number" ? parseFloat(value) || 0 : 
                value
      }));
    }
  };

  // ✅ Reset form 
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      salaryType: "fixed",
      rate: 0,
      overtimeRate: 0,
      overtimeEnabled: false,
      leaveRule: {
        enabled: false,
        perDayDeduction: 0,
        paidLeaves: 0
      },
      lateRule: {
        enabled: false,
        lateDaysThreshold: 3,
        equivalentLeaveDays: 0.5
      },
      bonusAmount: 0,
      bonusConditions: "",
      isActive: true,
      department: "",
      applicableTo: ["all_employees"]
    });
  };

  // ✅ Create salary rule - Matches backend controller
  const handleCreateRule = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error("Only admin can create salary rules");
      return;
    }
    
    setFormLoading(true);
    const loadingToast = toast.loading("Creating salary rule...");
    
    try {
      const userInfo = getUserInfo();
      
      if (!userInfo || !userInfo.token) {
        toast.dismiss(loadingToast);
        toast.error("Authentication required");
        setFormLoading(false);
        return;
      }

      // ✅ Backend validation
      if (!form.title || !form.salaryType || form.rate === undefined) {
        toast.dismiss(loadingToast);
        toast.error("Please fill all required fields: Title, Salary Type, and Rate");
        setFormLoading(false);
        return;
      }

      // ✅ Prepare data matching backend structure
      const ruleData = {
        title: form.title,
        salaryType: form.salaryType,
        rate: parseFloat(form.rate),
        description: form.description || "",
        overtimeRate: parseFloat(form.overtimeRate) || 0,
        overtimeEnabled: form.overtimeEnabled,
        leaveRule: {
          enabled: form.leaveRule.enabled,
          perDayDeduction: parseFloat(form.leaveRule.perDayDeduction) || 0,
          paidLeaves: parseInt(form.leaveRule.paidLeaves) || 0
        },
        lateRule: {
          enabled: form.lateRule.enabled,
          lateDaysThreshold: parseInt(form.lateRule.lateDaysThreshold) || 3,
          equivalentLeaveDays: parseFloat(form.lateRule.equivalentLeaveDays) || 0.5
        },
        bonusAmount: parseFloat(form.bonusAmount) || 0,
        bonusConditions: form.bonusConditions || "",
        isActive: form.isActive,
        department: form.department || null,
        applicableTo: Array.isArray(form.applicableTo) ? form.applicableTo : ["all_employees"]
      };

      console.log("📤 Creating rule:", ruleData);

      const response = await fetch(`${API_BASE_URL}/createSalaryRule`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ruleData)
      });

      const data = await response.json();
      console.log("Backend response:", data);
      
      if (response.ok && data.success) {
        toast.dismiss(loadingToast);
        toast.success("✅ Salary rule created successfully!");
        setShowAddModal(false);
        resetForm();
        fetchSalaryRules();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.message || "Failed to create rule");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error:", error);
      toast.error(error.message || "Network error");
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ Update salary rule
  const handleUpdateRule = async (e) => {
    e.preventDefault();
    
    if (!isAdmin || !selectedRule) {
      toast.error("Only admin can update salary rules");
      return;
    }
    
    setFormLoading(true);
    const loadingToast = toast.loading("Updating salary rule...");
    
    try {
      const userInfo = getUserInfo();
      
      if (!userInfo) {
        toast.dismiss(loadingToast);
        toast.error("Authentication required");
        setFormLoading(false);
        return;
      }

      // ✅ Backend validation
      if (!form.title || !form.salaryType || form.rate === undefined) {
        toast.dismiss(loadingToast);
        toast.error("Please fill all required fields");
        setFormLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/updateSalaryRule/${selectedRule._id}`;

      // ✅ Prepare data matching backend structure
      const updateData = {
        title: form.title,
        salaryType: form.salaryType,
        rate: parseFloat(form.rate),
        description: form.description || "",
        overtimeRate: parseFloat(form.overtimeRate) || 0,
        overtimeEnabled: form.overtimeEnabled,
        leaveRule: {
          enabled: form.leaveRule.enabled,
          perDayDeduction: parseFloat(form.leaveRule.perDayDeduction) || 0,
          paidLeaves: parseInt(form.leaveRule.paidLeaves) || 0
        },
        lateRule: {
          enabled: form.lateRule.enabled,
          lateDaysThreshold: parseInt(form.lateRule.lateDaysThreshold) || 3,
          equivalentLeaveDays: parseFloat(form.lateRule.equivalentLeaveDays) || 0.5
        },
        bonusAmount: parseFloat(form.bonusAmount) || 0,
        bonusConditions: form.bonusConditions || "",
        isActive: form.isActive,
        department: form.department || null,
        applicableTo: Array.isArray(form.applicableTo) ? form.applicableTo : ["all_employees"]
      };

      console.log("📤 Updating rule:", updateData);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.dismiss(loadingToast);
        toast.success("✅ Salary rule updated successfully!");
        setShowEditModal(false);
        setSelectedRule(null);
        resetForm();
        fetchSalaryRules();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.message || "Failed to update salary rule");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error updating salary rule");
      console.error("Update rule error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ Delete salary rule
  const handleDeleteRule = async () => {
    if (!isAdmin || !selectedRule) {
      toast.error("Only admin can delete salary rules");
      return;
    }
    
    setFormLoading(true);
    const loadingToast = toast.loading("Deleting salary rule...");
    
    try {
      const userInfo = getUserInfo();
      
      if (!userInfo) {
        toast.dismiss(loadingToast);
        toast.error("Authentication required");
        setFormLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/deleteSalaryRule/${selectedRule._id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.dismiss(loadingToast);
        toast.success("🗑️ Salary rule deleted successfully!");
        setShowDeleteModal(false);
        setSelectedRule(null);
        fetchSalaryRules();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.message || "Failed to delete salary rule");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error deleting salary rule");
      console.error("Delete rule error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  // ✅ Edit rule click 
  const handleEditClick = (rule) => {
    if (!isAdmin) {
      toast.error("Only admin can edit salary rules");
      return;
    }
    
    setSelectedRule(rule);
    setForm({
      title: rule.title || "",
      description: rule.description || "",
      salaryType: rule.salaryType || "fixed",
      rate: rule.rate || 0,
      overtimeRate: rule.overtimeRate || 0,
      overtimeEnabled: rule.overtimeEnabled || false,
      leaveRule: rule.leaveRule || {
        enabled: false,
        perDayDeduction: 0,
        paidLeaves: 0
      },
      lateRule: rule.lateRule || {
        enabled: false,
        lateDaysThreshold: 3,
        equivalentLeaveDays: 0.5
      },
      bonusAmount: rule.bonusAmount || 0,
      bonusConditions: rule.bonusConditions || "",
      isActive: rule.isActive !== undefined ? rule.isActive : true,
      department: rule.department || "",
      applicableTo: Array.isArray(rule.applicableTo) ? rule.applicableTo : ["all_employees"]
    });
    setShowEditModal(true);
  };

  // ✅ View details click
  const handleViewDetails = (rule) => {
    setSelectedRule(rule);
    setShowDetailsModal(true);
  };

  // ✅ Delete confirmation click
  const handleDeleteClick = (rule) => {
    if (!isAdmin) {
      toast.error("Only admin can delete salary rules");
      return;
    }
    
    setSelectedRule(rule);
    setShowDeleteModal(true);
  };

  // ✅ Get rule type label based on salaryType
  const getRuleTypeLabel = (type) => {
    switch(type) {
      case 'fixed': return 'Fixed Salary';
      case 'hourly': return 'Hourly Rate';
      case 'commission': return 'Commission Based';
      case 'contract': return 'Contract Based';
      default: return type || 'Fixed Salary';
    }
  };

  // ✅ Get rule type color
  const getRuleTypeColor = (type) => {
    switch(type) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'hourly': return 'bg-green-100 text-green-800';
      case 'commission': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ Filter rules
  const filteredRules = salaryRules.filter(rule => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
      rule.title?.toLowerCase().includes(searchLower) ||
      rule.description?.toLowerCase().includes(searchLower);
    
    const matchesType = selectedType === "all" || rule.salaryType === selectedType;
    
    return matchesSearch && matchesType;
  });

  // ✅ Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    fetchSalaryRules();
  }, []);

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      {/* Add Rule Modal */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create Salary Rule</h2>
                  <p className="text-gray-500 text-sm mt-1">Define new salary calculation rule</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateRule} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="E.g., Senior Developer Salary"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Type *
                    </label>
                    <select
                      name="salaryType"
                      value={form.salaryType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="fixed">Fixed Salary</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="commission">Commission Based</option>
                      <option value="contract">Contract Based</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe this salary rule..."
                    rows="2"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Rate/Amount (BDT) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                    <input
                      type="number"
                      name="rate"
                      value={form.rate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Overtime Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overtime Settings</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="overtimeEnabled"
                      checked={form.overtimeEnabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Enable Overtime
                    </span>
                  </label>
                </div>
                
                {form.overtimeEnabled && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overtime Rate (per hour)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                      <input
                        type="number"
                        name="overtimeRate"
                        value={form.overtimeRate}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Leave Rule Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Rule Settings</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="leaveRule.enabled"
                      checked={form.leaveRule.enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Enable Leave Rule
                    </span>
                  </label>
                </div>
                
                {form.leaveRule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Day Deduction
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                        <input
                          type="number"
                          name="leaveRule.perDayDeduction"
                          value={form.leaveRule.perDayDeduction}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Leaves (days per month)
                      </label>
                      <input
                        type="number"
                        name="leaveRule.paidLeaves"
                        value={form.leaveRule.paidLeaves}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Late Rule Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Late Rule Settings</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="lateRule.enabled"
                      checked={form.lateRule.enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Enable Late Rule
                    </span>
                  </label>
                </div>
                
                {form.lateRule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Days Threshold
                      </label>
                      <input
                        type="number"
                        name="lateRule.lateDaysThreshold"
                        value={form.lateRule.lateDaysThreshold}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Equivalent Leave Days
                      </label>
                      <input
                        type="number"
                        name="lateRule.equivalentLeaveDays"
                        value={form.lateRule.equivalentLeaveDays}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bonus Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bonus Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                      <input
                        type="number"
                        name="bonusAmount"
                        value={form.bonusAmount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus Conditions
                    </label>
                    <input
                      type="text"
                      name="bonusConditions"
                      value={form.bonusConditions}
                      onChange={handleChange}
                      placeholder="E.g., Performance > 90%"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
{/* Additional Settings এর applicableTo সেকশনে */}
<div className="border border-gray-200 rounded-xl p-4">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Department (Optional)
      </label>
      <input
        type="text"
        name="department"
        value={form.department}
        onChange={handleChange}
        placeholder="E.g., Engineering"
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Applicable To
      </label>
      <select
        multiple
        name="applicableTo"
        value={form.applicableTo}
        onChange={(e) => {
          const options = e.target.options;
          const selectedValues = [];
          for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
              selectedValues.push(options[i].value);
            }
          }
          setForm(prev => ({ ...prev, applicableTo: selectedValues }));
        }}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-32"
      >
        <option value="all_employees">All Employees</option>
        <option value="permanent">Permanent Staff</option>
        <option value="contractual">Contractual Staff</option>
        <option value="probation">Probation Staff</option>
        <option value="intern">Interns</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Hold Ctrl/Cmd to select multiple
      </p>
    </div>
  </div>
</div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                  <p className="text-gray-500 text-sm mt-1">Set rule as active or inactive</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
              
              <div className="pt-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Create Rule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal - Similar to Add but with pre-filled data */}
      {showEditModal && selectedRule && isAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Salary Rule</h2>
                  <p className="text-gray-500 text-sm mt-1">Update salary calculation rule</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRule(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateRule} className="p-6 space-y-6">
              {/* Same form structure as Add Modal */}
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Type *
                    </label>
                    <select
                      name="salaryType"
                      value={form.salaryType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="fixed">Fixed Salary</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="commission">Commission Based</option>
                      <option value="contract">Contract Based</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Rate/Amount (BDT) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                    <input
                      type="number"
                      name="rate"
                      value={form.rate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Overtime Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overtime Settings</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="overtimeEnabled"
                      checked={form.overtimeEnabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Enable Overtime
                    </span>
                  </label>
                </div>
                
                {form.overtimeEnabled && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overtime Rate (per hour)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                      <input
                        type="number"
                        name="overtimeRate"
                        value={form.overtimeRate}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Leave Rule Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Rule Settings</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="leaveRule.enabled"
                      checked={form.leaveRule.enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Enable Leave Rule
                    </span>
                  </label>
                </div>
                
                {form.leaveRule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Day Deduction
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                        <input
                          type="number"
                          name="leaveRule.perDayDeduction"
                          value={form.leaveRule.perDayDeduction}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Leaves (days per month)
                      </label>
                      <input
                        type="number"
                        name="leaveRule.paidLeaves"
                        value={form.leaveRule.paidLeaves}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Late Rule Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Late Rule Settings</h3>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="lateRule.enabled"
                      checked={form.lateRule.enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Enable Late Rule
                    </span>
                  </label>
                </div>
                
                {form.lateRule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Days Threshold
                      </label>
                      <input
                        type="number"
                        name="lateRule.lateDaysThreshold"
                        value={form.lateRule.lateDaysThreshold}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Equivalent Leave Days
                      </label>
                      <input
                        type="number"
                        name="lateRule.equivalentLeaveDays"
                        value={form.lateRule.equivalentLeaveDays}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bonus Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bonus Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">৳</span>
                      <input
                        type="number"
                        name="bonusAmount"
                        value={form.bonusAmount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus Conditions
                    </label>
                    <input
                      type="text"
                      name="bonusConditions"
                      value={form.bonusConditions}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applicable To
                    </label>
                    <select
                      multiple
                      name="applicableTo"
                      value={form.applicableTo}
                      onChange={(e) => {
                        const options = e.target.options;
                        const selectedValues = [];
                        for (let i = 0; i < options.length; i++) {
                          if (options[i].selected) {
                            selectedValues.push(options[i].value);
                          }
                        }
                        setForm(prev => ({ ...prev, applicableTo: selectedValues }));
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-32"
                    >
                      <option value="all_employees">All Employees</option>
                      <option value="permanent">Permanent Staff</option>
                      <option value="contractual">Contractual Staff</option>
                      <option value="probation">Probation Staff</option>
                      <option value="intern">Interns</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hold Ctrl/Cmd to select multiple
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                  <p className="text-gray-500 text-sm mt-1">Set rule as active or inactive</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
              
              <div className="pt-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedRule(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Update Rule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRule && isAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delete Salary Rule</h2>
                  <p className="text-gray-500 text-sm mt-1">This action cannot be undone</p>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedRule(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Are you sure?</h3>
                  <p className="text-sm text-gray-500">
                    You are about to delete "{selectedRule.title}"
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedRule(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRule}
                  disabled={formLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Rule
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRule && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Rule Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Complete information about this rule</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRule(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedRule.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRuleTypeColor(selectedRule.salaryType)}`}>
                      {getRuleTypeLabel(selectedRule.salaryType)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedRule.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {selectedRule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  ID: {selectedRule._id?.substring(0, 8)}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-700">{selectedRule.description || "No description"}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">Salary Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="font-medium">{getRuleTypeLabel(selectedRule.salaryType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rate:</span>
                      <span className="font-medium text-green-700">{formatCurrency(selectedRule.rate)}</span>
                    </div>
                    {selectedRule.overtimeEnabled && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Overtime Rate:</span>
                        <span className="font-medium text-blue-700">{formatCurrency(selectedRule.overtimeRate)}/hour</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Bonus Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-medium text-green-700">{formatCurrency(selectedRule.bonusAmount)}</span>
                    </div>
                    {selectedRule.bonusConditions && (
                      <div className="text-sm text-gray-600">
                        Conditions: {selectedRule.bonusConditions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Leave Rule Details */}
              {selectedRule.leaveRule?.enabled && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Leave Rule Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Per Day Deduction</div>
                      <div className="font-medium">{formatCurrency(selectedRule.leaveRule.perDayDeduction)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Paid Leaves</div>
                      <div className="font-medium">{selectedRule.leaveRule.paidLeaves} days/month</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Late Rule Details */}
              {selectedRule.lateRule?.enabled && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Late Rule Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Late Days Threshold</div>
                      <div className="font-medium">{selectedRule.lateRule.lateDaysThreshold} days</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Equivalent Leave Days</div>
                      <div className="font-medium">{selectedRule.lateRule.equivalentLeaveDays} days</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Applicable To */}
              <div className="border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-500">
                  {selectedRule.createdBy && (
                    <span>Created by: {selectedRule.createdBy.name || 'Admin'} • </span>
                  )}
                  {selectedRule.createdAt && (
                    <span>Created: {new Date(selectedRule.createdAt).toLocaleDateString()}</span>
                  )}
                  {selectedRule.updatedAt && selectedRule.createdAt !== selectedRule.updatedAt && (
                    <span> • Updated: {new Date(selectedRule.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              {isAdmin && (
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleEditClick(selectedRule);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Rule
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleDeleteClick(selectedRule);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Rule
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Page */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Salary Rules Management
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-gray-600">Define and manage salary calculation rules</p>
                {userRole && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    isAdmin 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800' 
                      : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                  }`}>
                    {isAdmin ? <Shield size={12} /> : <User size={12} />}
                    {userRole.toUpperCase()}
                    {!isAdmin && " (View Only)"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchSalaryRules}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Plus size={18} />
                  Add Rule
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Rules</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{salaryRules.length}</p>
                  <p className="text-xs text-gray-400 mt-1">All salary rules</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Rules</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                    {salaryRules.filter(r => r.isActive).length}
                  </p>
                  <p className="text-xs text-green-500 mt-1">Currently active</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-white" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Fixed Salary</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                    {salaryRules.filter(r => r.salaryType === 'fixed').length}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Fixed rate rules</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Hourly Rate</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                    {salaryRules.filter(r => r.salaryType === 'hourly').length}
                  </p>
                  <p className="text-xs text-orange-500 mt-1">Hourly based rules</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Clock className="text-white" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Salary Rules</h2>
                <p className="text-gray-500 text-sm">
                  {filteredRules.length} of {salaryRules.length} rules
                  {!isAdmin && " (View Only)"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search rules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="fixed">Fixed Salary</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="commission">Commission</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Rules List */}
          {loading ? (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Loading salary rules...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
              </div>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No salary rules found</h3>
                <p className="text-gray-500 max-w-md text-sm md:text-base">
                  {searchTerm || selectedType !== "all" 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by creating your first salary rule'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Add Salary Rule
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRules.map((rule) => (
                <div 
                  key={rule._id}
                  className="group p-4 md:p-6 hover:bg-gray-50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Rule Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                          {rule.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRuleTypeColor(rule.salaryType)}`}>
                            {getRuleTypeLabel(rule.salaryType)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rule.isActive 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {rule.overtimeEnabled && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              Overtime
                            </span>
                          )}
                          {rule.bonusAmount > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Bonus
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 text-sm md:text-base">{rule.description || "No description"}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign size={14} className="text-green-500" />
                          <span className="font-medium">Base Rate:</span>
                          <span className="font-bold text-green-700">{formatCurrency(rule.rate)}</span>
                        </div>
                        
                        {rule.overtimeEnabled && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} className="text-blue-500" />
                            <span className="font-medium">Overtime:</span>
                            <span>{formatCurrency(rule.overtimeRate)}/hour</span>
                          </div>
                        )}
                        
                        {rule.leaveRule?.enabled && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} className="text-red-500" />
                            <span className="font-medium">Leave Deduction:</span>
                            <span>{formatCurrency(rule.leaveRule.perDayDeduction)}/day</span>
                          </div>
                        )}
                        
                        {rule.bonusAmount > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Award size={14} className="text-yellow-500" />
                            <span className="font-medium">Bonus:</span>
                            <span className="font-bold text-yellow-700">{formatCurrency(rule.bonusAmount)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>ID: {rule._id?.substring(0, 8)}</span>
                        {rule.createdBy?.name && (
                          <span>Created by: {rule.createdBy.name}</span>
                        )}
                        {rule.createdAt && (
                          <span>• {new Date(rule.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewDetails(rule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEditClick(rule)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Rule"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rule)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 md:mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info size={20} className="text-blue-600" />
            How Salary Rules Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-500" />
                <span className="font-medium text-gray-700">Fixed Salary Rule</span>
              </div>
              <p className="text-sm text-gray-600">
                Fixed monthly salary with predefined rate. Suitable for full-time employees.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-blue-500" />
                <span className="font-medium text-gray-700">Hourly Rate Rule</span>
              </div>
              <p className="text-sm text-gray-600">
                Payment based on hours worked. Includes overtime calculations.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Note for Admins</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Salary rules determine how employee salaries are calculated. Make sure to assign appropriate rules to employees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}