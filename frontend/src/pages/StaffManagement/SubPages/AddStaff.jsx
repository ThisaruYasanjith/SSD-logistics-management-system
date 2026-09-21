import React, { useState, useEffect } from 'react';
import { Upload, X, ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const roles = ["Business Owner", "Warehouse Manager", "Inventory Manager", "Driver", "Maintenance Staff", "Other Staff"];
const genders = ["Male", "Female"];
const statuses = ["Active", "Inactive", "On Leave", "Suspended", "Terminated"];
const warehouses = ["Warehouse A", "Warehouse B", "Warehouse C", "Warehouse D"];

function AddStaff() {
  const [staff, setStaff] = useState({
    fullName: '',
    email: '',
    phoneNo: '',
    DOB: '',
    gender: '',
    address: '',
    dateJoined: new Date().toISOString().split('T')[0],
    warehouseAssigned: '',
    status: 'Active',
    role: '',
    NIC: '', // Changed from 'nic' to 'NIC'
  });
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Calculate max date for DOB (18 years ago from today) and min date (100 years ago)
  const calculateMaxDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  };

  const calculateMinDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 100);
    return today.toISOString().split('T')[0];
  };

  const handleInputChange = (e) => {
    setStaff({ ...staff, [e.target.id]: e.target.value });
    if (errors[e.target.id]) {
      setErrors({ ...errors, [e.target.id]: null });
    }
  };

  const handleSelectChange = (field, value) => {
    setStaff({ ...staff, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, profilePic: 'Only JPG, JPEG, and PNG files are allowed' });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, profilePic: 'File size should not exceed 2MB' });
        return;
      }

      // Validate image dimensions
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          setErrors({ ...errors, profilePic: 'Image dimensions must be at least 100x100 pixels' });
          return;
        }
        if (img.width > 2000 || img.height > 2000) {
          setErrors({ ...errors, profilePic: 'Image dimensions must not exceed 1000x1000 pixels' });
          return;
        }

        // If all validations pass, set the profile image
        setErrors({ ...errors, profilePic: null });
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            setProfileImage(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        setErrors({ ...errors, profilePic: 'Invalid image file' });
      };
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setErrors({ ...errors, profilePic: null });
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name: Only letters and spaces, 2-50 characters
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!staff.fullName || staff.fullName.trim() === "") {
      newErrors.fullName = "Full name is required";
    } else if (!nameRegex.test(staff.fullName)) {
      newErrors.fullName = "Full name must contain only letters and spaces";
    } else if (staff.fullName.length < 2 || staff.fullName.length > 50) {
      newErrors.fullName = "Full name must be between 2 and 50 characters";
    }

    // Email: Valid email format, 5-100 characters
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!staff.email || staff.email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(staff.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (staff.email.length < 5 || staff.email.length > 100) {
      newErrors.email = "Email must be between 5 and 100 characters";
    }

    // Phone Number: Exactly 10 digits starting with 0
    if (!staff.phoneNo || !/^0\d{9}$/.test(staff.phoneNo)) {
      newErrors.phoneNo = "Phone number must be exactly 10 digits and start with 0";
    }

    // Date of Birth: Must be a valid date, between 18 and 100 years ago
    if (!staff.DOB) {
      newErrors.DOB = "Date of birth is required";
    } else {
      const dob = new Date(staff.DOB);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minDate = new Date(calculateMinDate());
      const maxDate = new Date(calculateMaxDate());
      if (isNaN(dob.getTime())) {
        newErrors.DOB = "Date of birth must be a valid date";
      } else if (dob > maxDate) {
        newErrors.DOB = "Staff must be at least 18 years old";
      } else if (dob < minDate) {
        newErrors.DOB = "Staff cannot be older than 100 years";
      } else if (dob > today) {
        newErrors.DOB = "Date of birth cannot be in the future";
      }
    }

    // Gender: Must be one of the predefined options
    if (!staff.gender) {
      newErrors.gender = "Gender is required";
    } else if (!genders.includes(staff.gender)) {
      newErrors.gender = "Invalid gender selected";
    }

    // Role: Must be one of the predefined options
    if (!staff.role) {
      newErrors.role = "Role is required";
    } else if (!roles.includes(staff.role)) {
      newErrors.role = "Invalid role selected";
    }

    // Date Joined: Must be a valid date, not before 18 years after DOB
    if (!staff.dateJoined) {
      newErrors.dateJoined = "Date joined is required";
    } else {
      const dateJoined = new Date(staff.dateJoined);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(dateJoined.getTime())) {
        newErrors.dateJoined = "Date joined must be a valid date";
      } else if (dateJoined > today) {
        newErrors.dateJoined = "Date joined cannot be in the future";
      } else if (staff.DOB) {
        const dob = new Date(staff.DOB);
        const minJoinDate = new Date(dob);
        minJoinDate.setFullYear(minJoinDate.getFullYear() + 18);
        if (dateJoined < minJoinDate) {
          newErrors.dateJoined = "Staff cannot join before they are 18 years old";
        }
      }
    }

    // Warehouse Assigned: Must be one of the predefined options
    if (!staff.warehouseAssigned) {
      newErrors.warehouseAssigned = "Warehouse assignment is required";
    } else if (!warehouses.includes(staff.warehouseAssigned)) {
      newErrors.warehouseAssigned = "Invalid warehouse selected";
    }

    // Status: Must be one of the predefined options
    if (!statuses.includes(staff.status)) {
      newErrors.status = "Invalid status selected";
    }

    // Address: 5-200 characters, no harmful scripts
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (!staff.address || staff.address.trim() === "") {
      newErrors.address = "Address is required";
    } else if (staff.address.length < 5 || staff.address.length > 200) {
      newErrors.address = "Address must be between 5 and 200 characters";
    } else if (scriptRegex.test(staff.address)) {
      newErrors.address = "Address must not contain script tags";
    }

    // NIC: Sri Lankan format (9 digits + V/X or 12 digits)
    const nicRegexOld = /^[0-9]{9}[VX]$/;
    const nicRegexNew = /^[0-9]{12}$/;
    if (!staff.NIC || staff.NIC.trim() === "") {
      newErrors.NIC = "NIC is required";
    } else if (!nicRegexOld.test(staff.NIC) && !nicRegexNew.test(staff.NIC)) {
      newErrors.NIC = "NIC must be either 9 digits followed by V/X (e.g., 123456789V) or 12 digits (e.g., 200012345678)";
    }

    // Profile Picture is optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      const formData = new FormData();
      formData.append("fullName", staff.fullName.trim());
      formData.append("email", staff.email.trim());
      formData.append("phoneNo", staff.phoneNo);
      formData.append("DOB", staff.DOB);
      formData.append("gender", staff.gender);
      formData.append("address", staff.address.trim());
      formData.append("dateJoined", staff.dateJoined);
      formData.append("warehouseAssigned", staff.warehouseAssigned);
      formData.append("status", staff.status);
      formData.append("role", staff.role);
      formData.append("NIC", staff.NIC.trim().toUpperCase()); // Changed from 'nic' to 'NIC'

      // Profile image conversion (convert data URL to blob)
      if (profileImage) {
        const response = await fetch(profileImage);
        const blob = await response.blob();
        formData.append("profilePic", blob, `${staff.NIC.trim().toUpperCase()}-profile.jpg`); // Changed from 'staff.nic' to 'staff.NIC'
      }

      // Debug FormData
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setErrors({ submit: "You must be logged in to add a staff member" });
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/staff/add-staff", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          if (errorData.missingFields) {
            throw new Error(`All fields are required. Missing: ${errorData.missingFields.join(", ")}`);
          }
          throw new Error(errorData.message || "Failed to add staff member");
        }

        alert(`Employee: ${staff.fullName} added successfully!`);

        // Reset after submission
        setStaff({
          fullName: '',
          email: '',
          phoneNo: '',
          DOB: '',
          gender: '',
          address: '',
          dateJoined: new Date().toISOString().split('T')[0],
          warehouseAssigned: '',
          status: 'Active',
          role: '',
          NIC: '', // Changed from 'nic' to 'NIC'
        });
        setProfileImage(null);
      } catch (err) {
        console.error("Error adding employee:", err);
        setErrors({ submit: err.message });

        if (err.message.includes("Invalid or expired token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Form validation failed', errors);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStaff(prev => ({ ...prev, dateJoined: today }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Staff Member</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              type='text'
              id="fullName"
              value={staff.fullName}
              onChange={handleInputChange}
              placeholder="Enter the name..."
              required
              className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              id="email"
              type="email"
              value={staff.email}
              onChange={handleInputChange}
              placeholder="Enter valid email"
              required
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            <p className="text-xs text-gray-500">Login credential sent to this email</p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input
              id="phoneNo"
              value={staff.phoneNo}
              onChange={handleInputChange}
              required
              pattern="0[0-9]{9}"
              maxLength="10"
              onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
              placeholder="Enter 10-digit phone number starting with 0"
              className={`w-full border ${errors.phoneNo ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            {errors.phoneNo && <p className="text-red-500 text-xs mt-1">{errors.phoneNo}</p>}
            <p className="text-xs text-gray-500">Must be exactly 10 digits starting with 0</p>
          </div>

          {/* NIC */}
          <div className="space-y-2">
            <label htmlFor="NIC" className="block text-sm font-medium text-gray-700">National Identity Card (NIC) *</label>
            <input
              id="NIC"
              type="text"
              value={staff.NIC}
              onChange={handleInputChange}
              placeholder="e.g., 123456789V or 200012345678"
              required
              className={`w-full border ${errors.NIC ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200`}
            />
            {errors.NIC && <p className="text-red-500 text-xs mt-1">{errors.NIC}</p>}
            <p className="text-xs text-gray-500">Enter 9 digits followed by V/X or 12 digits</p>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label htmlFor="DOB" className="block text-sm font-medium text-gray-700">Date of Birth *</label>
            <div className="relative">
              <input
                id="DOB"
                type="date"
                value={staff.DOB}
                onChange={handleInputChange}
                required
                min={calculateMinDate()}
                max={calculateMaxDate()}
                className={`w-full border ${errors.DOB ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.DOB && <p className="text-red-500 text-xs mt-1">{errors.DOB}</p>}
            <p className="text-xs text-gray-500">Must be at least 18 years old and not older than 100 years</p>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender *</label>
            <select
              id="gender"
              value={staff.gender}
              onChange={(e) => handleSelectChange('gender', e.target.value)}
              required
              className={`w-full border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="">Select Gender</option>
              {genders.map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role *</label>
            <select
              id="role"
              value={staff.role}
              onChange={(e) => handleSelectChange('role', e.target.value)}
              required
              className={`w-full border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
          </div>

          {/* Date Joined */}
          <div className="space-y-2">
            <label htmlFor="dateJoined" className="block text-sm font-medium text-gray-700">Date Joined *</label>
            <div className="relative">
              <input
                id="dateJoined"
                type="date"
                value={staff.dateJoined}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className={`w-full border ${errors.dateJoined ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.dateJoined && <p className="text-red-500 text-xs mt-1">{errors.dateJoined}</p>}
          </div>

          {/* Warehouse Assigned */}
          <div className="space-y-2">
            <label htmlFor="warehouseAssigned" className="block text-sm font-medium text-gray-700">Warehouse Assigned *</label>
            <select
              id="warehouseAssigned"
              value={staff.warehouseAssigned}
              onChange={(e) => handleSelectChange('warehouseAssigned', e.target.value)}
              required
              className={`w-full border ${errors.warehouseAssigned ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse} value={warehouse}>{warehouse}</option>
              ))}
            </select>
            {errors.warehouseAssigned && <p className="text-red-500 text-xs mt-1">{errors.warehouseAssigned}</p>}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              value={staff.status}
              onChange={(e) => handleSelectChange('status', e.target.value)}
              className={`w-full border ${errors.status ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address *</label>
          <textarea
            id="address"
            value={staff.address}
            onChange={handleInputChange}
            placeholder="Enter full address"
            required
            rows={3}
            className={`w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Profile Picture */}
        <div className="space-y-2">
          <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture (Optional)</label>
          {profileImage ? (
            <div className="relative w-32 h-32">
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-lg border" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className={`flex items-center justify-center border-2 border-dashed ${errors.profilePic ? 'border-red-500' : 'border-gray-300'} rounded-lg h-32 w-full md:w-64 p-4 hover:border-purple-500 transition-colors cursor-pointer relative`}>
              <input
                id="profilePicture"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center text-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400">JPG, JPEG, or PNG (max. 2MB, 100x100 to 1000x1000 pixels)</p>
              </div>
            </div>
          )}
          {errors.profilePic && <p className="text-red-500 text-xs mt-1">{errors.profilePic}</p>}
        </div>
        {errors.submit && <p className="text-red-500 text-sm mt-2">{errors.submit}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-2 rounded-lg shadow hover:from-purple-600 hover:to-purple-800 transition ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Adding...
              </>
            ) : (
              "Add Staff Member"
            )}
          </button>
        </div>
      </form>

      <div className='p-3'>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}

export default AddStaff;