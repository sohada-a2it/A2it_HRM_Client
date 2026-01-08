"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios"; // ✅ এই line টা যোগ করো
import { EyeOff, Key, Eye } from 'lucide-react';
import { 
  createUser as createUserAPI, 
  getUsers, 
  updateUser as updateUserAPI,
  deleteUser as deleteUserAPI,
  uploadProfilePicture,
  removeProfilePicture,
  adminRequestOtp as adminRequestOtpAPI,
  adminResetPassword as adminResetPasswordAPI
} from "@/app/lib/api";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Check,
  UserPlus,
  Shield,
  UserCog,
  Download,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Building,
  ChevronDown,
  MoreVertical,
  UserCheck,
  UserX,
  TrendingUp,
  Users,
  X,
  CheckCircle,
  AlertCircle,
  Image,
  Camera,
  Upload,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function page() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [removingProfile, setRemovingProfile] = useState(false);
  const fileInputRef = useRef(null); 
  const [adminEmail, setAdminEmail] = useState(''); 

// useEffect-এর মধ্যে admin email সেট করুন
useEffect(() => {
  const envAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  console.log('📧 Setting admin email:', envAdminEmail);
  setAdminEmail(envAdminEmail);
}, []);
// API Configuration setup
const setupAxios = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Reset Password Page state
  const [showResetPasswordPage, setShowResetPasswordPage] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
    salary: "",
    status: "active",
    department: "IT",
    phone: "",
    joiningDate: new Date().toISOString().split('T')[0],
    profilePicture: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({
    adminEmail: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Loading users...");
    try {
      const data = await getUsers();
      const usersWithPictures = data.users?.map(user => ({
        ...user,
        profilePicture: user.profilePicture || user.picture || null
      })) || [];
      setUsers(usersWithPictures);
      toast.dismiss(loadingToast);
      toast.success(`Loaded ${usersWithPictures.length} users successfully!`, {
        icon: '👥',
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to load users!", {
        icon: '❌',
        duration: 4000,
      });
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); 
const handleChange = (e) => {
  const { name, value } = e.target;
  setForm(prev => ({
    ...prev,
    [name]: value
  }));
  
  // Debug log
  if (name === 'password') {
    console.log('Password changed:', value.length, 'characters');
  }
};

  // Password field-এর জন্য আলাদা onChange হ্যান্ডলার
  const handlePasswordChange = (e) => {
    setForm({ ...form, password: e.target.value });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle profile picture upload for existing user
  const handleProfilePictureUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (!currentUserId) {
      toast.error('Please save the user first before uploading profile picture');
      return;
    }

    setUploadingProfile(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const result = await uploadProfilePicture(currentUserId, formData);
      
      if (result.success) {
        setForm(prev => ({
          ...prev,
          profilePicture: result.pictureUrl || result.data?.pictureUrl
        }));
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === currentUserId 
              ? { ...user, profilePicture: result.pictureUrl || result.data?.pictureUrl }
              : user
          )
        );
        
        toast.success('Profile picture uploaded successfully!');
        setSelectedFile(null);
        setProfilePreview(null);
      } else {
        toast.error(result.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      toast.error('Failed to upload profile picture');
      console.error('Upload error:', error);
    } finally {
      setUploadingProfile(false);
    }
  };

  // Handle profile picture removal
  const handleRemoveProfilePicture = async () => {
    if (!currentUserId) return;

    if (!confirm('Are you sure you want to remove the profile picture?')) return;

    setRemovingProfile(true);

    try {
      const result = await removeProfilePicture(currentUserId);
      
      if (result.success) {
        setForm(prev => ({
          ...prev,
          profilePicture: null
        }));
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === currentUserId 
              ? { ...user, profilePicture: null }
              : user
          )
        );
        
        toast.success('Profile picture removed successfully!');
      } else {
        toast.error(result.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      toast.error('Failed to remove profile picture');
      console.error('Remove error:', error);
    } finally {
      setRemovingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const loadingMessage = isEditMode ? "Updating user..." : "Creating user...";
    const loadingToast = toast.loading(loadingMessage, {
      duration: Infinity,
    });

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
        salaryType: "monthly",
        rate: Number(form.salary),
        status: form.status,
        department: form.department,
        phone: form.phone,
        joiningDate: new Date().toISOString().split('T')[0],
        profilePicture: form.profilePicture
      };

      let res;
      
      if (isEditMode) {
        res = await updateUserAPI(currentUserId, payload);
        if (res.message === "User updated successfully" || res.success) {
          toast.dismiss(loadingToast);
          toast.success("User updated successfully!", {
            icon: '✅',
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            }
          });
        }
      } else {
        res = await createUserAPI(payload);
        if (res.message === "User created successfully" || res.success) {
          toast.dismiss(loadingToast);
          toast.success("User created successfully!", {
            icon: '🎉',
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            }
          });
          if (res.user?._id) {
            setCurrentUserId(res.user._id);
            setIsEditMode(true);
          }
        }
      }

      if (res.message?.includes("successfully") || res.success) {
        fetchUsers();
        
        if (selectedFile && (currentUserId || res.user?._id)) {
          const userId = currentUserId || res.user._id;
          await handleProfilePictureUploadForUser(userId);
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.message || "Something went wrong!", {
          icon: '⚠️',
          duration: 4000,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error: " + error.message, {
        icon: '❌',
        duration: 5000,
      });
    }

    setFormLoading(false);
  };

  // Separate function for profile picture upload after user creation
  const handleProfilePictureUploadForUser = async (userId) => {
    if (!selectedFile) return;

    setUploadingProfile(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const result = await uploadProfilePicture(userId, formData);
      
      if (result.success) {
        setForm(prev => ({
          ...prev,
          profilePicture: result.pictureUrl || result.data?.pictureUrl
        }));
        
        toast.success('Profile picture uploaded successfully!');
        setSelectedFile(null);
        setProfilePreview(null);
        fetchUsers();
      } else {
        toast.error(result.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      toast.error('Failed to upload profile picture');
      console.error('Upload error:', error);
    } finally {
      setUploadingProfile(false);
    }
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "employee",
      salary: "",
      status: "active",
      department: "IT",
      phone: "",
      joiningDate: new Date().toISOString().split('T')[0],
      profilePicture: null
    });
    setIsEditMode(false);
    setCurrentUserId(null);
    setSelectedFile(null);
    setProfilePreview(null);
    
    toast.success("Form reset successfully!", {
      duration: 2000,
    });
  };

  const handleEdit = (user) => {
    setIsEditMode(true);
    setCurrentUserId(user._id);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "", // Don't show existing password (it's hashed anyway)
      role: user.role || "employee",
      salary: user.rate || "",
      status: user.status || "active",
      department: user.department || "IT",
      phone: user.phone || "",
      joiningDate: user.joiningDate || new Date().toISOString().split('T')[0],
      profilePicture: user.profilePicture || user.picture || null
    });
    setSelectedFile(null);
    setProfilePreview(null);
    
    toast("Edit mode activated. Scroll to form.", {
      icon: '✏️',
      duration: 2000,
    });
    
    setTimeout(() => {
      document.getElementById("userForm")?.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };

  const handleDelete = async (userId, userName) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Delete User
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Are you sure you want to delete <span className="font-semibold">{userName}</span>? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(userId, userName);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const confirmDelete = async (userId, userName) => {
    const loadingToast = toast.loading(`Deleting ${userName}...`);
    
    try {
      const res = await deleteUserAPI(userId);
      if (res.message === "User deleted successfully" || res.success) {
        toast.dismiss(loadingToast);
        toast.success(`${userName} deleted successfully!`, {
          icon: '🗑️',
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          }
        });
        fetchUsers();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.message || "Failed to delete user", {
          icon: '❌',
          duration: 4000,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error deleting user: " + error.message, {
        icon: '❌',
        duration: 5000,
      });
    }
  };

  const handleView = (user) => {
    const userPicture = user.profilePicture || user.picture;
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-gradient-to-br from-purple-50 to-white shadow-xl rounded-xl pointer-events-auto ring-1 ring-purple-100`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-r from-purple-500 to-pink-500">
                {userPicture ? (
                  <img 
                    src={userPicture} 
                    alt={user.firstName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      parent.innerHTML = `
                        <div class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                          ${(user.firstName?.charAt(0) || '')}${(user.lastName?.charAt(0) || '')}
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(user.firstName?.charAt(0) || '')}{(user.lastName?.charAt(0) || '')}
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-500">{user.role?.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <Mail className="w-4 h-4 mr-3 text-purple-500" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-3 text-blue-500" />
              <span>{user.phone || "Not provided"}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Building className="w-4 h-4 mr-3 text-green-500" />
              <span>{user.department || "Not assigned"}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CreditCard className="w-4 h-4 mr-3 text-yellow-500" />
              <span>৳{(user.rate || 0).toLocaleString()}/month</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.status?.toUpperCase()}
              </span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  handleEdit(user);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-right',
    });
  };

  // Password input component with show/hide 
const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  required,
  show,
  toggleShow
}) => (
  <div className="relative">
    <input
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange} // 👈 সরাসরি onChange ব্যবহার
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 pr-12 hover:border-purple-300"
    />
    <button
      type="button"
      onClick={toggleShow}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {show ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  </div>
);

  // Filter users based on search, role, and status
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower);

    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle Reset Password Page
const handleOpenResetPasswordPage = (user) => {
  setSelectedUserForReset(user);
  
  // Admin email ব্যবহার করুন
  setResetData({
    email: adminEmail, // Admin email
    userEmail: user.email, // User's email আলাদা ভাবে সংরক্ষণ
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  setResetStep(1);
  setShowResetPasswordPage(true);
  
  console.log('Opening reset for:', {
    adminEmail: adminEmail,
    userEmail: user.email
  });
}; 

// Admin Request OTP - API কল ঠিক করে
const handleAdminRequestOtp = async () => {
  if (!selectedUserForReset?.email) {
    toast.error('Please select a user first');
    return;
  }

  setOtpLoading(true);
  
  const loadingToast = toast.custom(
    (t) => (
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-xl max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="font-bold">Generating OTP...</p>
            <p className="text-sm opacity-90">For: {selectedUserForReset.email}</p>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity, position: 'top-center' }
  );

  try {
    setupAxios();
    
    // তোমার backend endpoint: router.post('/auth/admin/request-otp', ...)
    const response = await axios.post('/admin/request-otp', {
      userEmail: selectedUserForReset.email
    });

    console.log('OTP Response:', response.data);
    toast.dismiss(loadingToast);

    if (response.data?.status === "success") {
      // Success - OTP sent to admin email
      toast.custom(
        (t) => (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">✅ OTP Sent!</h3>
                  <p className="text-sm opacity-90">{selectedUserForReset.email}</p>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* OTP Info */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-600 mb-2">OTP Information</div>
                <div className="flex items-center justify-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                    <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Sent to:</p>
                    <p className="text-sm font-semibold text-gray-900">{adminEmail}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setResetStep(2);
                    toast.dismiss(t.id);
                    toast.success('Proceed to OTP verification', { duration: 2000 });
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Verify OTP
                </button>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold">Important:</p>
                      <p>Check {adminEmail} for the OTP code. Check spam folder if not found.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <span>OTP valid for 10 minutes</span>
                <span>Step 1 of 3</span>
              </div>
            </div>
          </div>
        ),
        {
          duration: 15000,
          position: 'top-center'
        }
      );
      
      // Auto move to step 2 after 3 seconds
      setTimeout(() => {
        if (resetStep === 1) {
          setResetStep(2);
          toast.success('Proceeding to OTP verification...', { duration: 2000 });
        }
      }, 3000);
      
    } else {
      toast.error(response.data?.message || 'Failed to send OTP');
    }
    
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error('OTP Error:', error);
    
    // User-friendly error messages
    let errorMessage = 'Failed to generate OTP';
    if (error.response?.status === 404) {
      errorMessage = 'User not found in system';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Admin permission required.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check connection.';
    } else if (error.message.includes('request failed')) {
      errorMessage = 'Server error. Please try again.';
    }
    
    toast.error(`❌ ${errorMessage}`);
  } finally {
    setOtpLoading(false);
  }
};


// Admin Verify OTP and Reset Password - API কল ঠিক করে
const handleAdminVerifyOtpAndReset = async () => {
  // Validation
  if (!resetData.otp || resetData.otp.length !== 6) {
    toast.error('Please enter a valid 6-digit OTP');
    return;
  }

  if (resetData.newPassword.length < 6) {
    toast.error('Password must be at least 6 characters');
    return;
  }

  if (resetData.newPassword !== resetData.confirmPassword) {
    toast.error("Passwords don't match!");
    return;
  }

  setResetPasswordLoading(true);
  
  const loadingToast = toast.custom(
    (t) => (
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-4 rounded-xl shadow-xl max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="font-bold">Resetting Password...</p>
            <p className="text-sm opacity-90">For: {selectedUserForReset?.email}</p>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity, position: 'top-center' }
  );

  try {
    setupAxios();
    
    console.log('🔐 Resetting password for user:', {
      userEmail: selectedUserForReset?.email,
      otp: resetData.otp,
      passwordLength: resetData.newPassword.length
    });

    // তোমার backend endpoint: router.post('/auth/admin/reset-password', ...)
    const response = await axios.post('/admin/reset-password', {
      userEmail: selectedUserForReset?.email, // User's email
      otp: parseInt(resetData.otp), // OTP as number
      newPassword: resetData.newPassword
    });

    console.log('🔑 Reset Password Response:', response.data);
    toast.dismiss(loadingToast);

    if (response.data?.status === "success") {
      toast.success(
        <div className="text-center">
          <div className="font-bold text-lg">✅ Password Reset Successful!</div>
          <div className="text-sm text-gray-600 mt-1">
            Password updated for {selectedUserForReset?.email}
          </div>
        </div>,
        {
          duration: 5000,
          icon: '🔑',
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          }
        }
      );
      
      // Close reset page and go back to users list
      handleCloseResetPasswordPage();
      
      // Refresh user list
      fetchUsers();
      
    } else {
      throw new Error(response.data?.message || 'Failed to reset password');
    }
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error('Reset Password Error:', error);
    
    let errorMessage = 'Failed to reset password';
    if (error.response?.status === 400) {
      if (error.response.data?.message?.includes('Invalid OTP')) {
        errorMessage = '❌ Invalid OTP. Please check and try again.';
      } else if (error.response.data?.message?.includes('expired')) {
        errorMessage = '❌ OTP expired. Please request a new one.';
      } else {
        errorMessage = error.response.data?.message || 'Invalid request';
      }
    } else if (error.response?.status === 404) {
      errorMessage = '❌ User not found';
    } else if (error.response?.status === 403) {
      errorMessage = '❌ Admin permission required';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message.includes('network')) {
      errorMessage = '❌ Network error. Check your connection.';
    }

    toast.error(errorMessage, {
      duration: 5000,
      icon: '🔴'
    });
  } finally {
    setResetPasswordLoading(false);
  }
};
// Handle Close Reset Password Page
const handleCloseResetPasswordPage = () => {
  setShowResetPasswordPage(false);
  setSelectedUserForReset(null);
  setResetStep(1);
  setResetData({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
};

// Step 2 এর JSX অংশ আপডেট করুন - Verify OTP section
{resetStep === 2 && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Verify OTP</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter 6-digit OTP
        </label>
        <input
          type="text"
          value={resetData.otp}
          onChange={(e) => setResetData(prev => ({ 
            ...prev, 
            otp: e.target.value.replace(/\D/g, '').slice(0, 6) 
          }))}
          placeholder="Enter OTP sent to admin email"
          maxLength={6}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 text-center text-2xl tracking-widest font-mono"
        />
        <div className="text-center mt-2 space-y-1">
          <p className="text-sm text-gray-500">
            OTP sent to: 
            <span className="font-medium text-blue-600 ml-1">{adminEmail}</span>
          </p>
          <p className="text-xs text-gray-400">
            (Password reset for: {selectedUserForReset?.email})
          </p>
          <p className="text-xs text-amber-600">
            ⚠️ Check spam folder if not found in inbox
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <button
          onClick={handleAdminRequestOtp}
          disabled={otpLoading}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={otpLoading ? 'animate-spin' : ''} />
          {otpLoading ? 'Sending...' : 'Resend OTP'}
        </button>
        
        <button
          onClick={() => {
            // Test OTP (development only - production এ remove করবেন)
            if (process.env.NODE_ENV === 'development') {
              setResetData(prev => ({ 
                ...prev, 
                otp: '123456' 
              }));
              toast.success('Demo OTP: 123456', { duration: 2000 });
            }
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Demo OTP
        </button>
      </div>
    </div>
  </div>
)}


  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.role === "admin").length,
    employees: users.filter(u => u.role === "employee").length,
    totalSalary: users.reduce((sum, user) => sum + (user.rate || 0), 0)
  };

  // Function to get user initials
  const getUserInitials = (user) => {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Reset Password Page Component
  const ResetPasswordPage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleCloseResetPasswordPage}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Users
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Admin: Reset User Password
                </h1>
                <p className="text-gray-600 mt-2">
                  Secure password reset process for {selectedUserForReset?.firstName} {selectedUserForReset?.lastName}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  Step {resetStep} of 3
                </div>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500">
                {selectedUserForReset?.profilePicture ? (
                  <img 
                    src={selectedUserForReset.profilePicture} 
                    alt={selectedUserForReset.firstName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getUserInitials(selectedUserForReset)}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedUserForReset?.firstName} {selectedUserForReset?.lastName}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedUserForReset?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCog size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600 capitalize">{selectedUserForReset?.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedUserForReset?.department || 'Not assigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Steps */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    resetStep === step 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : resetStep > step 
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {resetStep > step ? <Check size={20} /> : step}
                  </div>
                  <span className={`text-xs font-medium ${
                    resetStep === step ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Request OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Request OTP */}   
{resetStep === 1 && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Request OTP</h3>
    <div className="space-y-4">
      {/* User Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            {selectedUserForReset?.firstName?.charAt(0)}{selectedUserForReset?.lastName?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {selectedUserForReset?.firstName} {selectedUserForReset?.lastName}
            </p>
            <p className="text-sm text-gray-600">{selectedUserForReset?.email}</p>
          </div>
        </div>
      </div>

      {/* Admin Email Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Mail className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">OTP Destination</h4>
            <p className="text-sm text-blue-600 mt-1">
              OTP will be sent to: <span className="font-bold">{process.env.NEXT_PUBLIC_ADMIN_EMAIL}</span>
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Make sure this email is accessible. Check spam folder if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
 
{/* Step 2: Verify OTP */}
{resetStep === 2 && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Verify OTP</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter 6-digit OTP
        </label>
        <input
          type="text"
          value={resetData.otp}
          onChange={(e) => setResetData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
          placeholder="Enter OTP sent to admin email"
          maxLength={6}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 text-center text-2xl tracking-widest"
        />
        <p className="text-sm text-gray-500 mt-2 text-center">
          OTP sent to: 
          <span className="font-medium"> {adminEmail} </span>
        </p>
        <p className="text-sm text-gray-400 mt-1 text-center">
          (Password reset for: {selectedUserForReset?.email})
        </p>
      </div>
      
      <button
        onClick={handleAdminRequestOtp}
        disabled={otpLoading}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm"
      >
        <RefreshCw size={14} className={otpLoading ? 'animate-spin' : ''} />
        {otpLoading ? 'Sending...' : 'Resend OTP'}
      </button>
    </div>
  </div>
)}
 
{resetStep === 3 && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Set New Password</h3>
    <div className="space-y-4">
      {/* ... existing password fields ... */}
      
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">About This Process</h4>
            <ul className="text-sm text-blue-600 mt-1 space-y-1">
              <li>• Password reset is done via Admin OTP verification</li>
              <li>• User will receive no notification about password change</li>
              <li>• For security, notify the user separately</li>
              <li>• User will be logged out from all sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between">
                  {resetStep > 1 ? (
                    <button
                      onClick={() => setResetStep(resetStep - 1)}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                    >
                      <ArrowLeft size={18} />
                      Previous Step
                    </button>
                  ) : (
                    <button
                      onClick={handleCloseResetPasswordPage}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (resetStep === 1) handleAdminRequestOtp();
                      else if (resetStep === 2) setResetStep(3);
                      else if (resetStep === 3) handleAdminVerifyOtpAndReset();
                    }}
                    disabled={otpLoading || resetPasswordLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {otpLoading || resetPasswordLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {resetStep === 1 ? 'Sending OTP...' : 
                         resetStep === 2 ? 'Verifying...' : 
                         'Resetting Password...'}
                      </>
                    ) : (
                      <>
                        {resetStep === 1 ? 'Send OTP to Admin' : 
                         resetStep === 2 ? 'Verify OTP & Continue' : 
                         'Reset Password'}
                        {resetStep === 3 && <Key size={18} />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Users Page
  if (showResetPasswordPage) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '16px',
            },
          }}
        />
        <ResetPasswordPage />
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#8B5CF6',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Employee Management
              </h1>
              <p className="text-gray-600 mt-2">Manage all system users with advanced controls</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          {/* Stats Cards - Compact Version */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Users</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="text-white" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Active Users</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stats.active}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="text-white" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Administrators</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stats.admins}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Shield className="text-white" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Monthly Salary</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">৳{(stats.totalSalary/1000).toFixed(0)}k</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-white" size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User List (No Scroll, Fixed Height) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Employee Directory</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Showing {startIndex + 1}-{endIndex} of {filteredUsers.length} users
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1); // Reset to first page on search
                        }}
                        className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedRole}
                        onChange={(e) => {
                          setSelectedRole(e.target.value);
                          setCurrentPage(1); // Reset to first page on filter
                        }}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                      </select>
                      <select
                        value={selectedStatus}
                        onChange={(e) => {
                          setSelectedStatus(e.target.value);
                          setCurrentPage(1); // Reset to first page on filter
                        }}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* User List Container - Fixed Height with Scroll */}
              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3 mx-auto"></div>
                      <p className="text-gray-600 font-medium">Loading users...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Role & Status
                          </th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentUsers.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-8 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                  <UserCog className="text-gray-400" size={24} />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">No users found</h3>
                                <p className="text-xs text-gray-500">
                                  {searchTerm || selectedRole !== "all" || selectedStatus !== "all" 
                                    ? 'Try adjusting your search or filters' 
                                    : 'Start by creating your first user'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentUsers.map((user) => {
                            const userPicture = user.profilePicture || user.picture;
                            return (
                              <tr key={user._id} className="hover:bg-gray-50">
                                <td className="p-3">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500">
                                      {userPicture ? (
                                        <img 
                                          src={userPicture} 
                                          alt={user.firstName} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                            const parent = e.target.parentElement;
                                            parent.innerHTML = `
                                              <div class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                ${getUserInitials(user)}
                                              </div>
                                            `;
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm">
                                          {getUserInitials(user)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-3 min-w-0">
                                      <div className="font-semibold text-gray-900 text-sm truncate">
                                        {user.firstName} {user.lastName}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate flex items-center">
                                        <Mail size={10} className="mr-1 flex-shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <div className={`p-1.5 rounded ${
                                        user.role === 'admin' 
                                          ? 'bg-purple-100 text-purple-800' 
                                          : user.role === 'manager'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {user.role === 'admin' && <Shield size={12} />}
                                        {user.role === 'manager' && <UserCog size={12} />}
                                        {user.role === 'employee' && <Users size={12} />}
                                      </div>
                                      <span className="ml-2 text-xs font-medium capitalize">{user.role}</span>
                                    </div>
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                      ${user.status === 'active' 
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                      {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleView(user)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleEdit(user)}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Edit User"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete User"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleOpenResetPasswordPage(user)}
                                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Reset Password"
                                    >
                                      <Lock size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {filteredUsers.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} />
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
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1.5 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-1">
            <div id="userForm" className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-6">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {isEditMode ? "Edit User" : "Create Employee"}
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                      {isEditMode ? "Update user details" : "Add a new user to the system"}
                    </p>
                  </div>
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetForm}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Profile Picture Upload Section */}
<div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Full Name
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          placeholder="First"
          required
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        />
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder="Last"
          required
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="user@company.com"
        required
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
      />
    </div>

    {/* ✅ FIXED PASSWORD FIELD */}
    {!isEditMode && (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            required={!isEditMode}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Password must be at least 6 characters
        </p>
      </div>
    )}

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Role & Status
      </label>
      <div className="grid grid-cols-2 gap-2">
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Additional Information
      </label>
      <div className="space-y-2">
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        />
        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        >
          <option value="IT">IT Department</option>
          <option value="HR">Human Resources</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
        </select>
        <input
          name="salary"
          type="number"
          value={form.salary}
          onChange={handleChange}
          placeholder="Monthly Salary (৳)"
          required
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-colors hover:border-purple-300"
        />
      </div>
    </div>
  </div>

  {/* Reset Password Button */}
  {isEditMode && (
    <div className="pt-2 border-t border-gray-100">
      <button
        type="button"
        onClick={() => handleOpenResetPasswordPage({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName
        })}
        className="group w-full inline-flex items-center justify-center gap-2 text-xs text-purple-600 hover:text-purple-700 font-medium py-2 px-3 border border-purple-100 rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300"
      >
        <Lock size={12} className="group-hover:scale-110 transition-transform duration-300" />
        <span className="truncate">Admin: Reset Password</span>
        {adminEmail && (
          <span className="text-[10px] text-purple-400 group-hover:text-purple-500 ml-auto">
            {adminEmail.split('@')[0]}
          </span>
        )}
      </button>
    </div>
  )}

  <button
    type="submit"
    disabled={formLoading}
    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
  >
    {formLoading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {isEditMode ? "Updating..." : "Creating..."}
      </>
    ) : (
      <>
        {isEditMode ? (
          <>
            <CheckCircle size={16} />
            Update User
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Create Employee
          </>
        )}
      </>
    )}
  </button>

  {isEditMode && (
    <button
      type="button"
      onClick={resetForm}
      className="w-full border border-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 text-sm"
    >
      Cancel Edit
    </button>
  )}
</form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}