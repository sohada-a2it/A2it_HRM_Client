"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";

const EmployeeLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const formRef = useRef(null);

  // Real-time validation on change
  useEffect(() => {
    if (email) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setErrors(prev => ({ 
        ...prev, 
        email: isValid ? "" : "Please enter a valid email address" 
      }));
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      const isValid = password.length >= 6;
      setErrors(prev => ({ 
        ...prev, 
        password: isValid ? "" : "Password must be at least 6 characters" 
      }));
    }
  }, [password]);

  const isLocalStorageAvailable = () => {
    try {
      return typeof window !== 'undefined' && window.localStorage;
    } catch (e) {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "", general: "" };
    let isValid = true;

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setErrors({ email: "", password: "", general: "" });
    setLoading(true);

    try {
      const { data } = await api.post("/employees/employeeLogin", { email, password });
      
      if (isLocalStorageAvailable()) {
        localStorage.setItem("employeeToken", data.token);
        localStorage.setItem("employeeData", JSON.stringify({
          email: data.email,
          name: data.name,
          loginTime: new Date().toISOString(),
          role: data.role
        }));
        
        const expiration = Date.now() + 60 * 60 * 1000;
        localStorage.setItem("cacheExpiry", expiration.toString());
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect based on employee role
      if (data.role === "employee") {
        router.push("/employee-dashboard");
      } else if (data.role === "staff") {
        router.push("/staff-dashboard");
      } else if (data.role === "manager") {
        router.push("/manager-dashboard");
      } else {
        router.push("/employee-dashboard");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setErrors(prev => ({ ...prev, general: errorMsg }));
      
      if (formRef.current) {
        formRef.current.classList.add('animate-shake');
        setTimeout(() => {
          formRef.current?.classList.remove('animate-shake');
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50 to-white p-4 overflow-hidden relative">
      {/* Background effects - purple theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-white opacity-80" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40" />

      {/* Login Card - Compact height */}
      <div className="relative w-full max-w-md">
        <div ref={formRef} className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
          {/* Top accent line - purple theme */}
        <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />

          <div className="p-6 md:p-8">
            {/* Compact Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Employee Portal</h2>
              <p className="text-gray-500 text-xs mt-0.5">Log in to your account</p>
            </div>

            {/* General Error - Compact */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-xs font-medium">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Compact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field - Compact */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, email: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, email: false }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 text-sm text-gray-800 placeholder-transparent ${
                      errors.email 
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}
                    placeholder="Email Address"
                  />
                  
                  {/* Floating label - Compact */}
                  <label 
                    className={`absolute left-4 pointer-events-none transition-all duration-300 transform origin-left ${
                      isFocused.email || email
                        ? 'top-0 -translate-y-1/2 px-1 text-[10px] text-purple-600 font-medium bg-white'
                        : 'top-1/2 -translate-y-1/2 text-gray-400 text-sm'
                    }`}
                  >
                    Email Address
                  </label>
                </div>
                
                {/* Error message - Compact */}
                {errors.email && (
                  <div className="flex items-center text-red-600 text-xs animate-slideDown mt-0.5">
                    <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field - Compact with Eye Icon */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 text-sm text-gray-800 placeholder-transparent ${
                      errors.password 
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}
                    placeholder="Password"
                  />
                  
                  {/* Floating label - Compact */}
                  <label 
                    className={`absolute left-4 pointer-events-none transition-all duration-300 transform origin-left ${
                      isFocused.password || password
                        ? 'top-0 -translate-y-1/2 px-1 text-[10px] text-purple-600 font-medium bg-white'
                        : 'top-1/2 -translate-y-1/2 text-gray-400 text-sm'
                    }`}
                  >
                    Password
                  </label>

                  {/* Eye Icon - Show/Hide Password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors duration-200 p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Error message - Compact */}
                {errors.password && (
                  <div className="flex items-center text-red-600 text-xs animate-slideDown mt-0.5">
                    <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Submit Button - Compact */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span className="text-sm">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm">Log In</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Compact Security Note */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex flex-col items-center space-y-2 text-gray-500 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    <span>Secure Connection</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center space-x-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Privacy Protected</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-3px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 50px;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
          overflow: hidden;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default EmployeeLogin;