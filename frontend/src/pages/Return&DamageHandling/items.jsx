import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

function Items({ type }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [updateError, setUpdateError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editReport, setEditReport] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    itemName: '',
    quantity: 0,
    damageType: '',
    actionRequired: '',
    supplierName: '',
    description: '',
    date: '',
    reportedBy: '',
    productName: '',
    brandName: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const title = type === "returns" ? "Recent Returns" : "Damage Reports";
  const statusLabel = type === "returns" ? "condition" : "damageType";
  const dateLabel = type === "returns" ? "returnDate" : "date";

  // Fetch damage reports
  useEffect(() => {
    const fetchDamageReports = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          throw new Error('You must be logged in to view damage reports');
        }

        const response = await fetch(`${API_BASE_URL}/returns/add-damage`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setItems(data);
      } catch (err) {
        setFetchError(err.message || 'Failed to fetch damage reports');
        console.error('Error fetching damage reports:', err);
        if (err.message.includes('Invalid or expired token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDamageReports();
  }, [navigate]);

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleSendReturnReport = (report) => {
    setSelectedReport(report);
    setAdditionalDetails('');
    setEmailStatus(null);
    setEmailError(null);
    setShowModal(true);
  };

  const handleSendEmail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/returns/send-return-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          damageReportId: selectedReport.id,
          additionalDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      setEmailStatus('Email sent successfully!');
      showToast('Email sent successfully!', 'success');
      setTimeout(() => {
        setShowModal(false);
        setEmailStatus(null);
      }, 2000);
    } catch (err) {
      setEmailError(err.message || 'Failed to send email');
      showToast(err.message || 'Failed to send email', 'error');
      console.error('Error sending email:', err);
    }
  };

  const handleEdit = (report) => {
    const [productName, brandName] = report.itemName.split(' (');
    const cleanedBrandName = brandName ? brandName.replace(')', '') : '';
    setEditReport(report);
    setEditFormData({
      itemName: report.itemName,
      quantity: report.quantity,
      damageType: report.damageType,
      actionRequired: report.actionRequired,
      supplierName: report.supplierName || '',
      description: report.description,
      date: report.date,
      reportedBy: report.reportedBy,
      productName,
      brandName: cleanedBrandName,
    });
    setUpdateError(null);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/returns/add-damage/${editReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update damage report');
      }

      const updatedReport = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === editReport.id ? { ...item, ...updatedReport.data } : item))
      );
      setShowEditModal(false);
      setEditReport(null);
      showToast('Damage report updated successfully!', 'success');
    } catch (err) {
      setUpdateError(err.message || 'Failed to update damage report');
      showToast(err.message || 'Failed to update damage report', 'error');
      console.error('Error updating damage report:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/returns/add-damage/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete damage report');
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirm(null);
      showToast('Damage report deleted successfully!', 'success');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete damage report');
      showToast(err.message || 'Failed to delete damage report', 'error');
      console.error('Error deleting damage report:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Damage Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Item Name: ${report.itemName}`, 20, 40);
    doc.text(`Quantity: ${report.quantity}`, 20, 50);
    doc.text(`Damage Type: ${report.damageType}`, 20, 60);
    doc.text(`Action Required: ${report.actionRequired}`, 20, 70);
    doc.text(`Supplier Name: ${report.supplierName || 'N/A'}`, 20, 80);
    doc.text(`Description: ${report.description}`, 20, 90);
    doc.text(`Date Reported: ${report.date}`, 20, 100);
    doc.text(`Reported By: ${report.reportedBy}`, 20, 110);
    doc.save(`Damage_Report_${report.itemName}_${report.id}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
        >
          {toast.message}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>

      {loading ? (
        <p className="text-gray-500 text-center py-4">Loading...</p>
      ) : fetchError ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex justify-between items-center">
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)} className="text-red-700 font-bold">
            ✕
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No damage reports to display</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-indigo-600 text-white">
              <tr>
                {[
                  "Item Name",
                  "Quantity",
                  type === "returns" ? "Condition" : "Damage Type",
                  "Date",
                  "Reported By",
                  "Action",
                  "Download",
                  "Edit",
                  "Delete",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border border-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-indigo-50 transition-colors`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {item.itemName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item[statusLabel]}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(item[dateLabel]), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.reportedBy}</td>
                  <td className="px-6 py-4 text-center">
                    {item.actionRequired === 'Return' ? (
                      <button
                        onClick={() => handleSendReturnReport(item)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
                      >
                        Send Return Report
                      </button>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDownloadPDF(item)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105"
                    >
                      Download PDF
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-transform transform hover:scale-105"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Sending Return Report */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Send Return Report</h2>
            {emailError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex justify-between items-center">
                <span>{emailError}</span>
                <button onClick={() => setEmailError(null)} className="text-red-700 font-bold">
                  ✕
                </button>
              </div>
            )}
            <div className="mb-4 space-y-2">
              <p className="text-gray-700">
                <strong>Item Name:</strong> {selectedReport.itemName}
              </p>
              <p className="text-gray-700">
                <strong>Quantity:</strong> {selectedReport.quantity}
              </p>
              <p className="text-gray-700">
                <strong>Damage Type:</strong> {selectedReport.damageType}
              </p>
              <p className="text-gray-700">
                <strong>Action Required:</strong> {selectedReport.actionRequired}
              </p>
              <p className="text-gray-700">
                <strong>Supplier Name:</strong> {selectedReport.supplierName || 'N/A'}
              </p>
              <p className="text-gray-700">
                <strong>Description:</strong> {selectedReport.description}
              </p>
              <p className="text-gray-700">
                <strong>Date Reported:</strong> {selectedReport.date}
              </p>
              <p className="text-gray-700">
                <strong>Reported By:</strong> {selectedReport.reportedBy}
              </p>
              <p className="text-gray-700">
                <strong>Supplier Email:</strong> {selectedReport.supplierEmail}
              </p>
            </div>
            <div className="mb-4">
              <label htmlFor="additionalDetails" className="block text-gray-700 font-medium mb-2">
                Additional Details
              </label>
              <textarea
                id="additionalDetails"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Add any additional details for the supplier..."
              ></textarea>
            </div>
            {emailStatus && (
              <p className="text-center mb-4 text-green-600">{emailStatus}</p>
            )}
            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Editing Damage Report */}
      {showEditModal && editReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Damage Report</h2>
            {updateError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex justify-between items-center">
                <span>{updateError}</span>
                <button onClick={() => setUpdateError(null)} className="text-red-700 font-bold">
                  ✕
                </button>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  value={editFormData.itemName}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={editFormData.quantity}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Damage Type</label>
                <input
                  type="text"
                  name="damageType"
                  value={editFormData.damageType}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Action Required</label>
                <select
                  name="actionRequired"
                  value={editFormData.actionRequired}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="Return">Return</option>
                  <option value="Dispose">Dispose</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Supplier Name</label>
                <input
                  type="text"
                  name="supplierName"
                  value={editFormData.supplierName}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date Reported</label>
                <input
                  type="date"
                  name="date"
                  value={editFormData.date}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Reported By</label>
                <input
                  type="text"
                  name="reportedBy"
                  value={editFormData.reportedBy}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 flex items-center"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                ) : null}
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h2>
            {deleteError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex justify-between items-center">
                <span>{deleteError}</span>
                <button onClick={() => setDeleteError(null)} className="text-red-700 font-bold">
                  ✕
                </button>
              </div>
            )}
            <p className="text-gray-700 mb-4">Are you sure you want to delete this damage report?</p>
            <div className="flex justify-between">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                ) : null}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Items;