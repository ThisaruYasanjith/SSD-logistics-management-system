import React, { useState, useEffect } from 'react';
import {
  Download, Eye, Search, Pencil, User, Briefcase, CreditCard, X, ChevronDown, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data for employee salaries
const salaryData = [
  {
    id: '001',
    employee: 'Warehouse Manager',
    position: 'Warehouse Manager',
    email: 'warehouse@grocerease.com',
    joinDate: '12 Jan 2022',
    basicSalary: 5000,
    bonuses: 800,
    deductions: 200,
    netSalary: 5600
  },
  {
    id: '002',
    employee: 'Business Owner',
    position: 'Business Owner',
    email: 'owner@grocerease.com',
    joinDate: '03 Mar 2022',
    basicSalary: 4000,
    bonuses: 500,
    deductions: 150,
    netSalary: 4350
  },
  {
    id: '003',
    employee: 'Delivery Driver',
    position: 'Driver',
    email: 'driver@grocerease.com',
    joinDate: '18 Jul 2023',
    basicSalary: 3200,
    bonuses: 200,
    deductions: 100,
    netSalary: 3300
  },
  {
    id: '004',
    employee: 'General Staff',
    position: 'Other Staff',
    email: 'staff@grocerease.com',
    joinDate: '05 Apr 2021',
    basicSalary: 6000,
    bonuses: 1000,
    deductions: 300,
    netSalary: 6700
  },
  {
    id: '005',
    employee: 'Inventory Manager',
    position: 'Inventory Manager',
    email: 'inventory@grocerease.com',
    joinDate: '22 Sep 2023',
    basicSalary: 3200,
    bonuses: 300,
    deductions: 100,
    netSalary: 3400
  },
];

function ManageSalary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [updateData, setUpdateData] = useState({
    basicSalary: 0,
    bonuses: 0,
    deductions: 0,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [toasts, setToasts] = useState([]);

  // Filter salary data based on search term
  const filteredSalary = salaryData.filter(salary =>
    salary.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salary.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (title, description) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, title, description }]);

    // Auto remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 3000);
  };

  const handleViewSalary = (salary) => {
    setSelectedSalary(salary);
    setIsViewModalOpen(true);
    setActiveTab('details');
  };

  const handleUpdateSalary = (salary) => {
    setSelectedSalary(salary);
    setUpdateData({
      basicSalary: salary.basicSalary,
      bonuses: salary.bonuses,
      deductions: salary.deductions,
    });
    setIsUpdateModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateData({
      ...updateData,
      [name]: parseFloat(value) || 0,
    });
  };

  const calculateNetSalary = () => {
    return updateData.basicSalary + updateData.bonuses - updateData.deductions;
  };

  const handleSaveUpdate = () => {
    // In a real app, you would save the updated salary data to your database
    const updatedSalary = {
      ...selectedSalary,
      ...updateData,
      netSalary: calculateNetSalary(),
    };

    console.log('Saving updated salary data:', updatedSalary);

    showToast(
      "Salary information updated",
      `${selectedSalary.employee}'s salary details have been successfully updated.`
    );

    setIsUpdateModalOpen(false);
  };

  const handleDownloadPayslip = (employee, employeeId) => {
    // Simulate download process
    setIsDownloading(true);

    setTimeout(() => {
      console.log(`Downloading payslip for ${employee} (ID: ${employeeId})`);

      showToast(
        "Payslip downloaded",
        `Payslip for ${employee} has been downloaded successfully.`
      );

      setIsDownloading(false);
    }, 1500);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (isViewModalOpen) setIsViewModalOpen(false);
        if (isUpdateModalOpen) setIsUpdateModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isViewModalOpen, isUpdateModalOpen]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (isViewModalOpen || isUpdateModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isViewModalOpen, isUpdateModalOpen]);

  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="bg-white border border-gray-100 shadow-lg rounded-lg p-4 flex items-start gap-3 min-w-[320px] animate-slide-in-right"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{toast.title}</h4>
              <p className="text-gray-600 text-sm">{toast.description}</p>
            </div>
            <button
              onClick={() => setToasts(prevToasts => prevToasts.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Salary</h1>
        <div className="flex gap-2">
          <button className="bg-gradient-to-r from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white px-4 py-2 rounded-lg flex items-center">
            Process Payroll
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="border-b border-gray-50 p-4 sm:p-6 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Salary Information</h2>
          <p className="text-gray-500 text-sm">View and manage employee salary details</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="relative w-full sm:w-80 mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search employees..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Basic Salary</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Net Salary</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalary.map((salary, index) => (
                  <tr
                    key={salary.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white text-xs">
                          {getInitials(salary.employee)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{salary.employee}</div>
                          <div className="text-xs text-gray-500">{salary.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{salary.position}</div>
                      <div className="text-xs text-gray-500">{salary.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">${salary.basicSalary.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">${salary.netSalary.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewSalary(salary)}
                          className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-700 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateSalary(salary)}
                          className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-700 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(salary.employee, salary.id)}
                          className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-700 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-300"
                          disabled={isDownloading}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Salary Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[650px] animate-fade-in-up">
            <div className="bg-gradient-to-r from-violet-500 to-violet-700 p-6 text-white rounded-t-lg">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 border-2 border-white/50 bg-white/10 rounded-full flex items-center justify-center text-white text-lg">
                  {selectedSalary && getInitials(selectedSalary.employee)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedSalary?.employee}</h2>
                  <p className="text-violet-100">{selectedSalary?.position} • {selectedSalary?.department}</p>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="border-b border-gray-100 flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 text-sm font-medium ${activeTab === 'details'
                      ? 'border-b-2 border-violet-600 text-violet-700'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Employee Details
                </button>
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`px-6 py-3 text-sm font-medium ${activeTab === 'salary'
                      ? 'border-b-2 border-violet-600 text-violet-700'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Salary Breakdown
                </button>
              </div>

              {selectedSalary && (
                <>
                  {activeTab === 'details' && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="border border-gray-100 rounded-lg shadow-sm bg-white">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-violet-100 p-2 rounded-lg">
                                <User className="h-5 w-5 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Employee ID</p>
                                <p className="font-medium text-gray-900">{selectedSalary.id}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-100 rounded-lg shadow-sm bg-white">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-violet-100 p-2 rounded-lg">
                                <Briefcase className="h-5 w-5 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Join Date</p>
                                <p className="font-medium text-gray-900">{selectedSalary.joinDate}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-100 rounded-lg shadow-sm bg-white">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-violet-100 p-2 rounded-lg">

                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Basic Salary</p>
                                <p className="font-medium text-gray-900">${selectedSalary.basicSalary.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-gray-100 rounded-lg shadow-sm bg-white">
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-violet-100 p-2 rounded-lg">
                                <CreditCard className="h-5 w-5 text-violet-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Net Salary</p>
                                <p className="font-medium text-gray-900">${selectedSalary.netSalary.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Personal Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium text-gray-900">{selectedSalary.employee}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email Address</p>
                            <p className="font-medium text-gray-900">{selectedSalary.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Department</p>
                            <p className="font-medium text-gray-900">{selectedSalary.department}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Position</p>
                            <p className="font-medium text-gray-900">{selectedSalary.position}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={() => setActiveTab('salary')}
                          className="bg-gradient-to-r from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white px-4 py-2 rounded-lg"
                        >
                          View Salary Details
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'salary' && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 flex items-center">
                            <span className="bg-green-100 p-1 rounded-md mr-2">

                            </span>
                            Earnings
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-700">Basic Salary</div>
                              <div className="text-right text-gray-900">${selectedSalary.basicSalary.toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-700">Performance Bonus</div>
                              <div className="text-right text-green-600">${(selectedSalary.bonuses * 0.7).toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-700">Additional Allowances</div>
                              <div className="text-right text-green-600">${(selectedSalary.bonuses * 0.3).toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm font-medium border-t border-gray-200 pt-2">
                              <div className="text-gray-700">Total Earnings</div>
                              <div className="text-right text-gray-900">${(selectedSalary.basicSalary + selectedSalary.bonuses).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 flex items-center">
                            <span className="bg-red-100 p-1 rounded-md mr-2">
                              <CreditCard className="h-4 w-4 text-red-600" />
                            </span>
                            Deductions
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-700">Tax</div>
                              <div className="text-right text-red-600">-${(selectedSalary.deductions * 0.6).toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-700">Health Insurance</div>
                              <div className="text-right text-red-600">-${(selectedSalary.deductions * 0.3).toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-700">Other Deductions</div>
                              <div className="text-right text-red-600">-${(selectedSalary.deductions * 0.1).toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm font-medium border-t border-gray-200 pt-2">
                              <div className="text-gray-700">Total Deductions</div>
                              <div className="text-right text-gray-900">${selectedSalary.deductions.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                          <div className="grid grid-cols-2 gap-2 font-bold text-violet-900">
                            <div>Net Salary</div>
                            <div className="text-right">${selectedSalary.netSalary.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleUpdateSalary(selectedSalary)}
                            className="border border-violet-200 bg-white text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-lg flex items-center"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Salary
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(selectedSalary.employee, selectedSalary.id)}
                            className="bg-gradient-to-r from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white px-4 py-2 rounded-lg flex items-center"
                            disabled={isDownloading}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {isDownloading ? 'Downloading...' : 'Download Payslip'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-gray-100 p-4 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg flex items-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Salary Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] animate-fade-in-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Update Salary</h2>
              <p className="text-gray-500 text-sm">
                Update salary information for {selectedSalary?.employee}
              </p>
            </div>

            {selectedSalary && (
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="basicSalary" className="block text-sm font-medium text-gray-700">
                    Basic Salary ($)
                  </label>
                  <input
                    id="basicSalary"
                    name="basicSalary"
                    type="number"
                    min="0"
                    step="100"
                    value={updateData.basicSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bonuses" className="block text-sm font-medium text-gray-700">
                    Bonuses ($)
                  </label>
                  <input
                    id="bonuses"
                    name="bonuses"
                    type="number"
                    min="0"
                    step="50"
                    value={updateData.bonuses}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="deductions" className="block text-sm font-medium text-gray-700">
                    Deductions ($)
                  </label>
                  <input
                    id="deductions"
                    name="deductions"
                    type="number"
                    min="0"
                    step="10"
                    value={updateData.deductions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                  />
                </div>

                <div className="bg-violet-50 p-4 rounded-lg border border-violet-100 mt-4">
                  <div className="grid grid-cols-2 gap-2 font-medium text-violet-900">
                    <div>Net Salary:</div>
                    <div className="text-right">${calculateNetSalary().toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 p-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUpdate}
                className="bg-gradient-to-r from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white px-4 py-2 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {(isViewModalOpen || isUpdateModalOpen) && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          aria-hidden="true"
        ></div>
      )}


      <button onClick={() => navigate(-1)} className="flex items-center gap-2 border border-gray-300  text-gray-700  px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>


    </div>

  )
}

export default ManageSalary;
