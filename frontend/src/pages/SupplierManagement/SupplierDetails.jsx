import React, { useState, useEffect } from "react";
import { Search, Edit2, Trash2, ArrowLeft, X, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function SupplierDetails() {
  const navigate = useNavigate();

  // State declarations (unchanged)
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [formErrors, setFormErrors] = useState({});

  // normalizeSupplierData function (unchanged)
  const normalizeSupplierData = (data) => {
    return data.map((supplier) => {
      let quantity = Array.isArray(supplier.quantity)
        ? supplier.quantity
        : typeof supplier.quantity === "string"
          ? supplier.quantity
            .split(",")
            .map((qty) => {
              const num = parseFloat(qty);
              return isNaN(num) ? 0 : num;
            })
            .filter((num) => num !== null)
          : [];

      let price = Array.isArray(supplier.price)
        ? supplier.price
        : typeof supplier.price === "string"
          ? supplier.price
            .split(",")
            .map((price) => {
              const num = parseFloat(price);
              return isNaN(num) ? 0 : num;
            })
            .filter((num) => num !== null)
          : [];

      let items = Array.isArray(supplier.items)
        ? supplier.items
        : typeof supplier.items === "string"
          ? supplier.items.split(",").map((item) => item.trim())
          : [];

      let email = typeof supplier.email === "string" ? supplier.email : "N/A";
      let contact = typeof supplier.contact === "string" ? supplier.contact : "N/A";

      return {
        ...supplier,
        id: supplier._id,
        items,
        quantity,
        price,
        email,
        contact,
      };
    });
  };

  // validateForm function (unchanged)
  const validateForm = (supplier) => {
    const errors = {};
    if (Array.isArray(supplier.quantity)) {
      const invalidQuantity = supplier.quantity.some((qty) => isNaN(qty) || qty < 0);
      if (invalidQuantity) {
        errors.quantity = "Quantities must be valid positive numbers";
      }
    } else {
      errors.quantity = "Quantities must be provided";
    }
    if (Array.isArray(supplier.price)) {
      const invalidPrice = supplier.price.some((price) => isNaN(price) || price < 0);
      if (invalidPrice) {
        errors.price = "Prices must be valid positive numbers";
      }
    } else {
      errors.price = "Prices must be provided";
    }
    if (!Array.isArray(supplier.items) || supplier.items.length === 0) {
      errors.items = "At least one item must be provided";
    }
    if (!supplier.name || supplier.name.trim() === "") {
      errors.name = "Name is required";
    }
    if (!supplier.email || supplier.email.trim() === "") {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) {
      errors.email = "Invalid email format";
    }
    if (!supplier.contact || supplier.contact.trim() === "") {
      errors.contact = "Contact is required";
    }
    if (!supplier.date || supplier.date.trim() === "") {
      errors.date = "Date is required";
    }
    return errors;
  };

  // Fetch suppliers useEffect (unchanged)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be looged in to view Supplier Details");
      setIsLoading(false);
      navigate("/login");
      return;
    }

    const getSuppliers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8000/suppliers", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const normalizedData = normalizeSupplierData(data);
        setSuppliers(normalizedData);
        setFilteredSuppliers(normalizedData);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getSuppliers();
  }, []);

  // Modified Search and Sort useEffect - Added quantity search
  useEffect(() => {
    if (!suppliers || !Array.isArray(suppliers)) return;

    let results = [...suppliers];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter((supplier) => {
        return (
          (supplier.id?.toString().toLowerCase() || "").includes(lowerSearchTerm) ||
          (supplier.name?.toLowerCase() || "").includes(lowerSearchTerm) ||
          (supplier.email?.toLowerCase() || "").includes(lowerSearchTerm) ||
          (supplier.contact?.toLowerCase() || "").includes(lowerSearchTerm) ||
          (supplier.date?.toLowerCase() || "").includes(lowerSearchTerm) ||
          supplier.items?.some((item) => item.toLowerCase().includes(lowerSearchTerm)) ||
          supplier.quantity?.some((qty) => qty.toString().includes(lowerSearchTerm))
        );
      });
    }

    results = results.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredSuppliers(results);
  }, [searchTerm, sortOrder, suppliers]);

  // Rest of the pagination functions (unchanged)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => {
    if (currentPage < Math.ceil(filteredSuppliers.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "latest" ? "oldest" : "latest");
  };

  // Rest of the handler functions (unchanged)
  const handleEditClick = (supplier) => {
    setEditSupplier({ ...supplier });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const errors = validateForm(editSupplier);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/suppliers/${editSupplier.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editSupplier.name,
          email: editSupplier.email,
          contact: editSupplier.contact,
          items: editSupplier.items,
          quantity: editSupplier.quantity,
          price: editSupplier.price,
          date: editSupplier.date,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update supplier");
      } else {
        alert(`Supplier: ${editSupplier.name} Update Successful!`);
      }
      const updatedSupplier = await res.json();
      const normalizedUpdatedSupplier = normalizeSupplierData([updatedSupplier])[0];
      setSuppliers(
        suppliers.map((sup) =>
          sup.id === normalizedUpdatedSupplier.id ? normalizedUpdatedSupplier : sup
        )
      );
      setFilteredSuppliers(
        filteredSuppliers.map((sup) =>
          sup.id === normalizedUpdatedSupplier.id ? normalizedUpdatedSupplier : sup
        )
      );
      setIsEditModalOpen(false);
      setFormErrors({});
      location.reload();
    } catch (err) {
      console.error("Error updating supplier:", err);
      setError(err.message);
    }
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/suppliers/${supplierToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      if (!res.ok) {
        throw new Error("Failed to delete supplier");
      }
      setSuppliers(suppliers.filter((sup) => sup.id !== supplierToDelete.id));
      setFilteredSuppliers(
        filteredSuppliers.filter((sup) => sup.id !== supplierToDelete.id)
      );
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting supplier:", err);
      setError(err.message);
    }
  };

  const handleDetailClick = (supplier) => {
    setSelectedSupplier(supplier);
    setIsViewModalOpen(true);
  };

  const downloadReport = (supplier) => {
    const report = `
      Supplier Report
      ------------------
      ID: ${supplier.id}
      Name: ${supplier.name}
      Email: ${supplier.email}
      Contact: ${supplier.contact}
      Items: ${supplier.items.join(", ")}
      Quantities: ${supplier.quantity.join(", ")}
      Prices: ${supplier.price.join(", ")}
      Date: ${supplier.date}
    `;
    const blob = new Blob([report], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supplier_${supplier.id}_report.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAllReports = () => {
    filteredSuppliers.forEach(downloadReport);
  };

  // JSX Return (unchanged except placeholder text)
  return (
    <div className="space-y-6 px-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Suppliers</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, ID, date, item, or quantity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={toggleSortOrder}
            className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all"
          >
            Sort by Date (
            {sortOrder === "latest" ? "Latest to Oldest" : "Oldest to Latest"})
          </button>
          <button
            onClick={downloadAllReports}
            className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all"
          >
            Download All Reports
          </button>
        </div>
      </div>

      {isLoading && <div className="text-center py-4">Loading suppliers...</div>}
      {error && (
        <div className="text-center py-4 text-red-600">Error: {error}</div>
      )}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Supplier ID",
                  "Name",
                  "Email",
                  "Contact",
                  "Items",
                  "Quantity",
                  "Unit Price",
                  "Date",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentSuppliers.length > 0 ? (
                currentSuppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id + index}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.id}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-indigo-600"
                      onClick={() => handleDetailClick(supplier)}
                    >
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.contact}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray- Linkgray-900">
                      {Array.isArray(supplier.items) && supplier.items.length > 0 ? (
                        supplier.items.map((item, idx) => (
                          <div key={idx}>{item}</div>
                        ))
                      ) : (
                        <div>N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {Array.isArray(supplier.quantity) && supplier.quantity.length > 0 ? (
                        supplier.quantity.map((qty, idx) => (
                          <div key={idx}>{isNaN(qty) ? "N/A" : qty}</div>
                        ))
                      ) : (
                        <div>N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {Array.isArray(supplier.price) && supplier.price.length > 0 ? (
                        supplier.price.map((price, idx) => (
                          <div key={idx}>{isNaN(price) ? "N/A" : price}</div>
                        ))
                      ) : (
                        <div>N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleEditClick(supplier)}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          onClick={() => handleDeleteClick(supplier)}
                          style={{ display: "inline-flex" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No suppliers found matching the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-white">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredSuppliers.length)}
              </span>{" "}
              of <span className="font-medium">{filteredSuppliers.length}</span>{" "}
              results
            </p>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 ${currentPage === 1
                  ? "bg-gray-200 text-gray-600"
                  : "bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700"
                  } rounded-lg transition-colors`}
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className={`px-4 py-2 ${currentPage >=
                  Math.ceil(filteredSuppliers.length / itemsPerPage)
                  ? "bg-gray-200 text-gray-600"
                  : "bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700"
                  } rounded-lg transition-colors`}
                onClick={nextPage}
                disabled={
                  currentPage >=
                  Math.ceil(filteredSuppliers.length / itemsPerPage)
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {isEditModalOpen && editSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Supplier</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supplier ID
                </label>
                <input
                  type="text"
                  value={editSupplier.id}
                  readOnly
                  className="mt-1 bg-gray-100 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editSupplier.name}
                  onChange={(e) =>
                    setEditSupplier({ ...editSupplier, name: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={editSupplier.email}
                  onChange={(e) =>
                    setEditSupplier({ ...editSupplier, email: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.email && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact
                </label>
                <input
                  type="text"
                  value={editSupplier.contact}
                  onChange={(e) =>
                    setEditSupplier({ ...editSupplier, contact: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.contact && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.contact}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Items (comma-separated)
                </label>
                <input
                  type="text"
                  value={Array.isArray(editSupplier.items) ? editSupplier.items.join(", ") : ""}
                  onChange={(e) =>
                    setEditSupplier({
                      ...editSupplier,
                      items: e.target.value.split(",").map((item) => item.trim()),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.items && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.items}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantities (comma-separated numbers)
                </label>
                <input
                  type="text"
                  value={Array.isArray(editSupplier.quantity) ? editSupplier.quantity.join(", ") : ""}
                  onChange={(e) =>
                    setEditSupplier({
                      ...editSupplier,
                      quantity: e.target.value
                        .split(",")
                        .map((qty) => {
                          const num = parseFloat(qty.trim());
                          return isNaN(num) ? 0 : num;
                        }),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.quantity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prices (comma-separated numbers)
                </label>
                <input
                  type="text"
                  value={Array.isArray(editSupplier.price) ? editSupplier.price.join(", ") : ""}
                  onChange={(e) =>
                    setEditSupplier({
                      ...editSupplier,
                      price: e.target.value
                        .split(",")
                        .map((price) => {
                          const num = parseFloat(price.trim());
                          return isNaN(num) ? 0 : num;
                        }),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.price && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={editSupplier.date}
                  onChange={(e) =>
                    setEditSupplier({ ...editSupplier, date: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.date && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Supplier Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">ID:</p>
                  <span className="font-medium text-gray-900">
                    {selectedSupplier.id}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Name:</p>
                  <span className="font-medium text-gray-900">
                    {selectedSupplier.name}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Email:</p>
                  <span className="font-medium text-gray-900">
                    {selectedSupplier.email}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Contact:</p>
                  <span className="font-medium text-gray-900">
                    {selectedSupplier.contact}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Items:</p>
                  <span className="font-medium text-gray-900">
                    {Array.isArray(selectedSupplier.items) && selectedSupplier.items.length > 0
                      ? selectedSupplier.items.join(", ")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Quantities:</p>
                  <span className="font-medium text-gray-900">
                    {Array.isArray(selectedSupplier.quantity) && selectedSupplier.quantity.length > 0
                      ? selectedSupplier.quantity
                        .map((qty) => (isNaN(qty) ? "N/A" : qty))
                        .join(", ")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Prices:</p>
                  <span className="font-medium text-gray-900">
                    {Array.isArray(selectedSupplier.price) && selectedSupplier.price.length > 0
                      ? selectedSupplier.price
                        .map((price) => (isNaN(price) ? "N/A" : price))
                        .join(", ")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex">
                  <p className="text-sm text-gray-600 w-28">Date:</p>
                  <span className="font-medium text-gray-900">
                    {selectedSupplier.date}
                  </span>
                </div>
              </div>
              <button
                onClick={() => downloadReport(selectedSupplier)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700"
              >
                <Download size={18} /> Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && supplierToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Confirm Delete</h2>
            </div>
            <p className="mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{supplierToDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg hover:from-red-500 hover:to-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierDetails;