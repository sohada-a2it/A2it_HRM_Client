"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Calendar,
  Activity,
  Edit,
  Save,
  X,
  Clock,
  MapPin,
  Building,
  Briefcase,
  CreditCard,
  Eye,
  EyeOff,
  History,
  Users,
  CheckCircle,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  DollarSign,
  Hash,
  BadgeCheck,
  ChevronRight,
  Key,
  Upload,
  Camera,
  Trash2,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // ইউজারের টাইপ চেক করার জন্য
  const getUserType = () => {
    if (localStorage.getItem("adminToken")) return "admin";
    if (localStorage.getItem("employeeToken")) return "employee";
    return null;
  };

  // নতুন Model এর জন্য updated profile form
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    department: "",
    designation: "",
    employeeId: "",
    salaryType: "",
    rate: "",
    basicSalary: "", // নতুন field
    joiningDate: "",
    // Admin-specific fields (নতুন Model থেকে)
    companyName: "",
    adminPosition: "", // আগেরটা position ছিল
    adminLevel: "",
    permissions: [],
    isSuperAdmin: false,
    canManageUsers: false,
    canManagePayroll: false,
    // Employee-specific fields (নতুন Model থেকে)
    managerId: "",
    attendanceId: "",
    shiftTiming: {
      start: "09:00",
      end: "17:00"
    },
    // অন্যান্য fields
    salary: "", // আপনার original থেকে
    salaryRule: "" // আপনার original থেকে
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch user profile - Updated for new model
  const fetchUserProfile = async () => {
    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      if (!token) {
        router.push("/");
        return;
      }

      // নতুন Model এ সব user একই endpoint থেকে fetch হবে
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/users/getProfile`;

      console.log("Fetching profile from:", endpoint);

      const response = await fetch(endpoint, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        if (userType === "admin") {
          localStorage.removeItem("adminToken");
        } else {
          localStorage.removeItem("employeeToken");
        }
        router.push("/");
        return;
      }

      const data = await response.json();
      
      if (data.user || (data && typeof data === 'object' && (data.email || data._id))) {
        const userData = data.user || data;
        
        // Check for locally stored picture
        const currentUserType = getUserType();
        const localUserKey = `${currentUserType}UserData`;
        const localData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
        
        // Picture persistence improvement
        const pictureToUse = userData.picture || localData.picture || null;
        
        setUser({
          ...userData,
          picture: pictureToUse
        });
        
        // নতুন Model এর জন্য updated profile form
        setProfileForm({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          phone: userData.phone || "",
          address: userData.address || "",
          department: userData.department || "",
          designation: userData.designation || "",
          employeeId: userData.employeeId || "",
          salaryType: userData.salaryType || "",
          rate: userData.rate || "",
          basicSalary: userData.basicSalary || userData.salary || "", // নতুন field
          joiningDate: userData.joiningDate || "",
          // Admin-specific fields
          companyName: userData.companyName || "",
          adminPosition: userData.adminPosition || userData.position || "", // backward compatibility
          adminLevel: userData.adminLevel || "",
          permissions: userData.permissions || [],
          isSuperAdmin: userData.isSuperAdmin || false,
          canManageUsers: userData.canManageUsers || false,
          canManagePayroll: userData.canManagePayroll || false,
          // Employee-specific fields
          managerId: userData.managerId || "",
          attendanceId: userData.attendanceId || "",
          shiftTiming: userData.shiftTiming || { start: "09:00", end: "17:00" },
          // অন্যান্য fields
          salary: userData.salary || "",
          salaryRule: userData.salaryRule || ""
        });

        console.log("User data loaded:", {
          role: userData.role,
          hasPicture: !!pictureToUse,
          isAdmin: userData.role === 'admin'
        });
      } else {
        console.error("Invalid response data:", data);
        toast.error("Failed to load user data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user sessions
  const fetchUserSessions = async () => {
    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserSessions();
  }, []);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target.result;
      
      // Update state for immediate preview
      setUser(prev => ({
        ...prev,
        picture: previewUrl
      }));
      
      // Save to localStorage for persistence
      const userType = getUserType();
      const localUserKey = `${userType}UserData`;
      const existingData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
      localStorage.setItem(localUserKey, JSON.stringify({
        ...existingData,
        picture: previewUrl,
        isPreview: true
      }));
      
      toast.success('Preview updated! Click "Upload Photo" to save.');
    };
    
    reader.onerror = () => {
      toast.error('Failed to load image preview');
    };
    
    reader.readAsDataURL(file);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      setUploadProgress(30);

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/upload-profile-picture`;
      
      console.log('Uploading to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(70);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Server error response:', errorData);
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setUploadProgress(100);
      
      if (data.success) {
        // Immediately update state with new picture
        const pictureUrl = data.pictureUrl;
        
        setUser(prev => ({
          ...prev,
          picture: pictureUrl
        }));
        
        // Also save to localStorage as backup
        const userType = getUserType();
        const localUserKey = `${userType}UserData`;
        const existingData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
        localStorage.setItem(localUserKey, JSON.stringify({
          ...existingData,
          picture: pictureUrl,
          serverPicture: pictureUrl,
          lastUpdated: new Date().toISOString(),
          isPreview: false
        }));
        
        toast.success(data.message || 'Profile picture uploaded successfully!');
        
        // Delay refresh to ensure update
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
        
      } else {
        toast.error(data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Fallback: Save to localStorage temporarily
      const reader = new FileReader();
      reader.onload = (e) => {
        const localUrl = e.target.result;
        
        // Update state
        setUser(prev => ({
          ...prev,
          picture: localUrl
        }));
        
        // Save to localStorage
        const userType = getUserType();
        const localUserKey = `${userType}UserData`;
        const existingData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
        localStorage.setItem(localUserKey, JSON.stringify({
          ...existingData,
          picture: localUrl,
          isLocal: true,
          lastUpdated: new Date().toISOString(),
          isPreview: false
        }));
        
        toast.success('Profile picture saved locally (server unavailable)');
      };
      reader.readAsDataURL(selectedFile);
      
      toast.error(error.message || 'Failed to upload profile picture to server');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      setShowUploadConfirm(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete profile picture
  const handleDeleteProfilePicture = async () => {
    if (!user?.picture) {
      toast.error('No profile picture to remove');
      return;
    }

    if (!confirm("Are you sure you want to remove your profile picture? This will delete it from Cloudinary.")) return;

    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/remove-profile-picture`;
      
      console.log("Deleting profile picture from:", endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Response status:", response.status);

      if (response.status === 400) {
        const errorData = await response.json();
        toast.error(errorData.message || 'No profile picture exists');
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Delete failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Server error response:', errorData);
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Delete response data:", data);
      
      if (data.success) {
        // Update local user state
        setUser(prev => ({
          ...prev,
          picture: null
        }));
        
        // Also remove from localStorage
        const userType = getUserType();
        const localUserKey = `${userType}UserData`;
        const existingData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
        const { picture, serverPicture, isLocal, isPreview, ...restData } = existingData;
        localStorage.setItem(localUserKey, JSON.stringify(restData));
        
        toast.success(data.message || 'Profile picture removed successfully from Cloudinary!');
        
        // Refresh profile data
        setTimeout(() => {
          fetchUserProfile();
        }, 300);
      } else {
        toast.error(data.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Delete error:', error);
      
      if (error.message.includes('No profile picture') || error.message.includes('404')) {
        toast.error('No profile picture exists to remove');
        
        // Still update UI to remove any local references
        setUser(prev => ({
          ...prev,
          picture: null
        }));
        
        // Remove from localStorage
        const userType = getUserType();
        const localUserKey = `${userType}UserData`;
        const existingData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
        const { picture, serverPicture, isLocal, isPreview, ...restData } = existingData;
        localStorage.setItem(localUserKey, JSON.stringify(restData));
      } else {
        toast.error(error.message || 'Failed to remove profile picture');
      }
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Cancel file selection
  const cancelFileSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Restore previous picture
    const userType = getUserType();
    const localUserKey = `${userType}UserData`;
    const localData = JSON.parse(localStorage.getItem(localUserKey) || '{}');
    
    // Better picture restoration logic
    if (localData.picture && !localData.isPreview) {
      setUser(prev => ({
        ...prev,
        picture: localData.picture
      }));
    } else if (user?.picture && !user.picture.includes('data:') && !user.picture.includes('preview')) {
      // Keep server picture if exists
    } else {
      setUser(prev => ({
        ...prev,
        picture: null
      }));
    }
  };

  // Update profile - Updated for new model
  const handleUpdateProfile = async () => {
    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      // নতুন Model এ সব user একই endpoint এ update হবে
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/users/updateProfile`;

      const updateData = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        address: profileForm.address,
        department: profileForm.department,
        designation: profileForm.designation,
        employeeId: profileForm.employeeId,
        salaryType: profileForm.salaryType,
        rate: profileForm.rate,
        basicSalary: profileForm.basicSalary, // নতুন field
        joiningDate: profileForm.joiningDate,
        salary: profileForm.salary, // আপনার original থেকে
        // Role-specific fields
        ...(user?.role === "admin" && {
          companyName: profileForm.companyName,
          adminPosition: profileForm.adminPosition,
          adminLevel: profileForm.adminLevel,
          permissions: profileForm.permissions,
          isSuperAdmin: profileForm.isSuperAdmin,
          canManageUsers: profileForm.canManageUsers,
          canManagePayroll: profileForm.canManagePayroll
        }),
        ...(user?.role === "employee" && {
          managerId: profileForm.managerId,
          attendanceId: profileForm.attendanceId,
          shiftTiming: profileForm.shiftTiming
        })
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!");
        setEditMode(false);
        fetchUserProfile();
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      // নতুন Model এ সব user একই endpoint এ password change হবে
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/users/change-password`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Password changed successfully!");
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        } else {
          toast.error(data.message || "Failed to change password");
        }
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  // Logout from all sessions
  const handleLogoutAllSessions = async () => {
    if (!confirm("Are you sure you want to logout from all devices?")) return;

    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/logout-all`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Logged out from all devices");
          fetchUserSessions();
        } else {
          toast.error(data.message || "Failed to logout");
        }
      } else {
        toast.error("Failed to logout from all sessions");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  // Terminate specific session
  const handleTerminateSession = async (sessionId) => {
    if (!confirm("Terminate this session?")) return;

    try {
      const userType = getUserType();
      const token = userType === "admin" 
        ? localStorage.getItem("adminToken") 
        : localStorage.getItem("employeeToken");
      
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/terminate-session/${sessionId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Session terminated");
          fetchUserSessions();
        } else {
          toast.error(data.message || "Failed to terminate session");
        }
      } else {
        toast.error("Failed to terminate session");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || user.name?.split(' ')[0] || user.email?.split('@')[0] || "U";
    const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || "";
    return `${firstName.charAt(0)}${lastName.charAt(0) || ''}`.toUpperCase();
  };

  // Check if user has a valid picture
  const hasValidPicture = () => {
    return user?.picture && user.picture !== null && user.picture !== '' && user.picture !== 'null' && user.picture !== 'undefined';
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === "admin";
  };

  // Check if user is employee
  const isEmployee = () => {
    return user?.role === "employee";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your personal information and security</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronRight className="rotate-180" size={18} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 relative">
                <div className="flex flex-col items-center relative">
                  {/* Profile Picture Container */}
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                      {hasValidPicture() ? (
                        <img
                          src={user.picture}
                          alt={user.firstName || user.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span class="text-white text-2xl font-bold">${getUserInitials()}</span>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {getUserInitials()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Overlay - Show only when in edit mode */}
                    {editMode && (
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={triggerFileInput}
                          disabled={uploading}
                          className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
                          title="Change photo"
                        >
                          <Camera className="text-gray-700" size={20} />
                        </button>
                        
                        {hasValidPicture() && !selectedFile && (
                          <button
                            onClick={handleDeleteProfilePicture}
                            disabled={uploading}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Upload Progress */}
                    {uploading && (
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-xs">{uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  
                  <h2 className="text-xl font-bold text-white text-center">
                    {user?.firstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0]} {user?.lastName || user?.name?.split(' ').slice(1).join(' ') || ''}
                  </h2>
                  <p className="text-purple-100 mt-1 text-center">{user?.email}</p>
                  <div className="mt-3">
                    <span className={`px-3 py-1 text-white rounded-full text-sm font-medium ${
                      isAdmin() 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500" 
                        : "bg-gradient-to-r from-blue-500 to-cyan-500"
                    }`}>
                      {isAdmin() ? "ADMINISTRATOR" : "EMPLOYEE"}
                    </span>
                  </div>
                  
                  {/* Upload/Cancel Buttons - Show only in edit mode */}
                  {editMode && (
                    <div className="mt-4 flex flex-col gap-2 w-full">
                      <button
                        onClick={triggerFileInput}
                        disabled={uploading}
                        className="w-full px-4 py-2 bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera size={14} />
                        {uploading ? 'Uploading...' : selectedFile ? 'Change Selection' : 'Upload Photo'}
                      </button>
                      
                      {selectedFile && (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => setShowUploadConfirm(true)}
                            disabled={uploading}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="animate-spin" size={14} />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload size={14} />
                                Save Photo
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelFileSelection}
                            disabled={uploading}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Stats */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Account Status</p>
                        <p className={`text-sm font-semibold ${
                          user?.status === "active" ? "text-green-600" : "text-red-600"
                        }`}>
                          {user?.status?.toUpperCase() || "ACTIVE"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Designation</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.designation || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Building className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Department</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.department || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isAdmin() && user?.adminLevel && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <ShieldCheck className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Admin Level</p>
                          <p className="text-sm font-semibold text-indigo-600 capitalize">
                            {user?.adminLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setActiveTab("sessions")}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <History className="text-gray-600" size={20} />
                      <span className="font-medium text-gray-700">Session History</span>
                    </div>
                    <span className="text-sm text-gray-500">{sessions.length}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("security")}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="text-gray-600" size={20} />
                      <span className="font-medium text-gray-700">Security Settings</span>
                    </div>
                    <span className="text-sm text-purple-600">Update</span>
                  </button>

                  {isAdmin() && (
                    <button
                      onClick={() => router.push("/user-roles")}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="text-gray-600" size={20} />
                        <span className="font-medium text-gray-700">Manage Users</span>
                      </div>
                      <ChevronRight className="text-gray-400" size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === "personal"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === "security"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab("sessions")}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === "sessions"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Sessions
                </button>
              </div>

              {/* Personal Info Tab */}
              {activeTab === "personal" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                      <p className="text-gray-600 mt-1">Update your personal details</p>
                    </div>
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditMode(false);
                            fetchUserProfile();
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* View Mode - No change options */}
                  {!editMode ? (
                    <div className="space-y-6">
                      {/* Profile Picture View Card - NO CHANGE OPTIONS */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <ImageIcon className="text-purple-600" size={22} />
                            </div>
                            Profile Picture
                          </h4>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                              {hasValidPicture() ? (
                                <img
                                  src={user.picture}
                                  alt={user.firstName || user.name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <span class="text-white text-4xl font-bold">${getUserInitials()}</span>
                                      </div>
                                    `;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-4xl font-bold">
                                    {getUserInitials()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-gray-700">
                              {hasValidPicture() ? 
                                "Your profile picture is visible to other users" : 
                                "No profile picture uploaded yet"
                              }
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Click "Edit Profile" to upload or change your profile picture
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info Card */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <User className="text-purple-600" size={22} />
                            </div>
                            Basic Information
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Full Name</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {user?.firstName || user?.name?.split(' ')[0] || user?.email?.split('@')[0]} 
                                {user?.lastName && ` ${user.lastName}`}
                                {!user?.lastName && user?.name?.split(' ').slice(1).join(' ') && ` ${user.name.split(' ').slice(1).join(' ')}`}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Email Address</p>
                              <div className="flex items-center gap-2">
                                <Mail className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                  Verified
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                              <div className="flex items-center gap-2">
                                <Phone className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{user?.phone || "Not provided"}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">address</p>
                              <div className="flex items-center gap-2">
                                <MapPin className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{user?.address || "Not provided"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin Information Card */}
                      {isAdmin() && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                          <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Shield className="text-indigo-600" size={22} />
                            </div>
                            Administrator Information
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Company</p>
                                <div className="flex items-center gap-2">
                                  <Building className="text-gray-400" size={16} />
                                  <p className="text-lg font-semibold text-gray-900">
                                    {user?.companyName || "Not specified"}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Admin Position</p>
                                <div className="flex items-center gap-2">
                                  <BadgeCheck className="text-gray-400" size={16} />
                                  <p className="text-lg font-semibold text-gray-900">
                                    {user?.adminPosition || user?.position || "Administrator"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Admin Level</p>
                                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                                  user?.adminLevel === 'super' ? 'bg-purple-50 text-purple-800' :
                                  user?.adminLevel === 'admin' ? 'bg-blue-50 text-blue-800' :
                                  user?.adminLevel === 'manager' ? 'bg-green-50 text-green-800' :
                                  'bg-gray-50 text-gray-800'
                                }`}>
                                  <ShieldCheck className={
                                    user?.adminLevel === 'super' ? 'text-purple-600' :
                                    user?.adminLevel === 'admin' ? 'text-blue-600' :
                                    user?.adminLevel === 'manager' ? 'text-green-600' :
                                    'text-gray-600'
                                  } size={18} />
                                  <p className="font-semibold capitalize">{user?.adminLevel || 'Admin'}</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Permissions</p>
                                <div className="flex flex-wrap gap-2">
                                  {user?.permissions?.map((perm, index) => (
                                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium">
                                      {perm}
                                    </span>
                                  )) || (
                                    <span className="text-gray-500">No specific permissions</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Professional Info Card */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Briefcase className="text-blue-600" size={22} />
                          </div>
                          Professional Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Department</p>
                              <div className="flex items-center gap-2">
                                <Building className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{user?.department || "Not assigned"}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Designation</p>
                              <div className="flex items-center gap-2">
                                <Briefcase className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{user?.designation || "Not assigned"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                              <div className="flex items-center gap-2">
                                <Hash className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{user?.employeeId || "Not assigned"}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Joining Date</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{formatDate(user?.joiningDate)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Salary Info Card (Employee এর জন্য) */}
                      {isEmployee() && user?.salaryType && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                          <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <CreditCard className="text-green-600" size={22} />
                            </div>
                            Salary Information
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Salary Type</p>
                              <div className="flex items-center gap-2">
                                <CreditCard className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900 capitalize">{user?.salaryType}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Rate</p>
                              <div className="flex items-center gap-2">
                                <DollarSign className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">
                                  ৳{formatCurrency(user?.rate)} {user?.salaryType ? `/${user.salaryType}` : ''}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Basic Salary</p>
                              <div className="flex items-center gap-2">
                                <DollarSign className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">
                                  ৳{formatCurrency(user?.basicSalary || user?.salary)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Account Status Card */}
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <ShieldCheck className="text-gray-600" size={22} />
                          </div>
                          Account Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Account Status</p>
                              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                                user?.status === 'active' ? 'bg-green-50 text-green-800' :
                                user?.status === 'inactive' ? 'bg-red-50 text-red-800' :
                                'bg-gray-50 text-gray-800'
                              }`}>
                                {user?.status === 'active' ? (
                                  <CheckCircle className="text-green-600" size={18} />
                                ) : (
                                  <AlertCircle className="text-red-600" size={18} />
                                )}
                                <p className="font-semibold capitalize">{user?.status || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Account Role</p>
                              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                                isAdmin() ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'
                              }`}>
                                <Shield className={isAdmin() ? "text-purple-600" : "text-blue-600"} size={18} />
                                <p className="font-semibold capitalize">{user?.role || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Account Created</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{formatDate(user?.createdAt)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                              <div className="flex items-center gap-2">
                                <Activity className="text-gray-400" size={16} />
                                <p className="text-lg font-semibold text-gray-900">{formatDate(user?.updatedAt)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode - Input Forms - With upload options */
                    <div className="space-y-6">
                      {/* Profile Picture Upload Section - Edit mode has upload */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="text-purple-600" size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">Profile Picture</h4>
                              <p className="text-sm text-gray-600">Update your profile photo</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={triggerFileInput}
                              disabled={uploading}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Camera size={16} />
                              {selectedFile ? 'Change' : 'Change Photo'}
                            </button>
                            
                            {selectedFile && (
                              <button
                                onClick={() => setShowUploadConfirm(true)}
                                disabled={uploading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Upload size={16} />
                                Save
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                              {hasValidPicture() ? (
                                <img
                                  src={user.picture}
                                  alt={user.firstName || user.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-2xl font-bold">
                                    {getUserInitials()}
                                  </span>
                                </div>
                              )}
                              
                              {uploading && (
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-70 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">
                                Click the upload button to change your profile picture.
                              </p>
                              <div className="flex gap-2">
                                {selectedFile && (
                                  <button
                                    onClick={cancelFileSelection}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                  >
                                    <X size={14} />
                                    Cancel Preview
                                  </button>
                                )}
                                
                                {hasValidPicture() && !selectedFile && (
                                  <button
                                    onClick={handleDeleteProfilePicture}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                  >
                                    <Trash2 size={14} />
                                    Remove current photo
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Upload Confirmation Modal */}
                        {showUploadConfirm && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Upload</h3>
                              <p className="text-gray-600 mb-6">
                                Are you sure you want to upload this image as your new profile picture?
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setShowUploadConfirm(false)}
                                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleProfilePictureUpload}
                                  disabled={uploading}
                                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                  {uploading ? 'Uploading...' : 'Yes, Upload'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Basic Info Section */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.firstName}
                              onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.lastName}
                              onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email Section (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
                          <Mail className="text-gray-400" size={20} />
                          <span className="text-gray-900">{user?.email}</span>
                          <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                      </div>

                      {/* Contact Info Section */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                              placeholder="+8801XXXXXXXXX"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              address
                            </label>
                            <input
                              type="text"
                              value={profileForm.address}
                              onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                              placeholder="City, Country"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Admin Information Section */}
                      {isAdmin() && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                            <Shield size={18} />
                            Administrator Information
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.companyName}
                                onChange={(e) => setProfileForm({...profileForm, companyName: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Position
                              </label>
                              <input
                                type="text"
                                value={profileForm.adminPosition}
                                onChange={(e) => setProfileForm({...profileForm, adminPosition: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Level
                              </label>
                              <select
                                value={profileForm.adminLevel}
                                onChange={(e) => setProfileForm({...profileForm, adminLevel: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                              >
                                <option value="">Select Level</option>
                                <option value="super">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="moderator">Moderator</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Permissions
                              </label>
                              <input
                                type="text"
                                value={profileForm.permissions.join(', ')}
                                onChange={(e) => setProfileForm({...profileForm, permissions: e.target.value.split(',').map(p => p.trim())})}
                                placeholder="user:read, user:write, etc."
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                              />
                              <p className="text-xs text-gray-500 mt-1">Comma separated values</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Professional Info Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                          <Briefcase size={18} />
                          Professional Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Department
                            </label>
                            <input
                              type="text"
                              value={profileForm.department}
                              onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Designation
                            </label>
                            <input
                              type="text"
                              value={profileForm.designation}
                              onChange={(e) => setProfileForm({...profileForm, designation: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Employee ID
                            </label>
                            <input
                              type="text"
                              value={profileForm.employeeId}
                              onChange={(e) => setProfileForm({...profileForm, employeeId: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Joining Date
                            </label>
                            <input
                              type="date"
                              value={profileForm.joiningDate ? new Date(profileForm.joiningDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => setProfileForm({...profileForm, joiningDate: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Salary Info Section (Employee এর জন্য) */}
                      {isEmployee() && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                            <CreditCard size={18} />
                            Salary Information
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Salary Type
                              </label>
                              <select
                                value={profileForm.salaryType}
                                onChange={(e) => setProfileForm({...profileForm, salaryType: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              >
                                <option value="">Select Type</option>
                                <option value="monthly">Monthly</option>
                                <option value="hourly">Hourly</option>
                                <option value="weekly">Weekly</option>
                                <option value="yearly">Yearly</option>
                                <option value="project">Project</option>
                                <option value="commission">Commission</option>
                                <option value="fixed">Fixed</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rate (৳)
                              </label>
                              <input
                                type="number"
                                value={profileForm.rate}
                                onChange={(e) => setProfileForm({...profileForm, rate: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Basic Salary (৳)
                              </label>
                              <input
                                type="number"
                                value={profileForm.basicSalary}
                                onChange={(e) => setProfileForm({...profileForm, basicSalary: e.target.value})}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="p-6"> 

                  <div className="space-y-6"> 

                    {/* Session Management */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <History className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">Session Management</h4>
                            <p className="text-sm text-gray-600">Manage your active sessions</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Smartphone className="text-gray-400" size={20} />
                            <div>
                              <p className="font-medium text-gray-900">Current Session</p>
                              <p className="text-sm text-gray-500">This device • Just now</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        </div>

                        <button
                          onClick={handleLogoutAllSessions}
                          className="w-full py-3 border-2 border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                        >
                          Logout From All Devices
                        </button>
                      </div>
                    </div>

                    {/* Password Guidelines */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Password Guidelines
                      </h5>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-600 mt-0.5" size={14} />
                          <p className="text-sm text-gray-600">Minimum 6 characters in length</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-600 mt-0.5" size={14} />
                          <p className="text-sm text-gray-600">Include numbers and special characters for better security</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-600 mt-0.5" size={14} />
                          <p className="text-sm text-gray-600">Avoid using personal information in passwords</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === "sessions" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Session History</h3>
                      <p className="text-gray-600 mt-1">View and manage your login sessions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {sessions.filter(s => !s.logoutAt).length} active • {sessions.length} total
                      </span>
                    </div>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="text-gray-400" size={24} />
                      </div>
                      <p className="text-gray-700 font-medium">No session history found</p>
                      <p className="text-gray-500 text-sm mt-1">Your login sessions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session, index) => (
                        <div
                          key={session._id || `session-${index}`}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-white transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                session.logoutAt ? "bg-gray-300" : "bg-green-500 animate-pulse"
                              }`}></div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {session.device || "Unknown Device"}
                                </p>
                                <p className="text-sm text-gray-500">{session.ip || "Unknown IP"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {session.loginAt ? new Date(session.loginAt).toLocaleDateString() : "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {session.loginAt ? new Date(session.loginAt).toLocaleTimeString() : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">
                                <Clock size={14} className="inline mr-1" />
                                Login: {session.loginAt ? new Date(session.loginAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                              </span>
                              {session.logoutAt && (
                                <span className="text-gray-600">
                                  <Clock size={14} className="inline mr-1" />
                                  Logout: {new Date(session.logoutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              )}
                            </div>

                            {!session.logoutAt && index !== 0 && (
                              <button
                                onClick={() => handleTerminateSession(session._id)}
                                className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
                              >
                                Terminate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}