import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FormStep1({ formData, setFormData, onNext, errors, setErrors }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (name === 'itemName') {
      updatedFormData.searchTerm = '';
      const selectedItem = items.find(
        (item) => `${item.productName} (${item.brandName})` === value
      );
      updatedFormData.supplierName = selectedItem ? selectedItem.supplierName : '';
      updatedFormData.productName = selectedItem ? selectedItem.productName : '';
      updatedFormData.brandName = selectedItem ? selectedItem.brandName : '';
    }
    setFormData(updatedFormData);

    if (name === 'quantity' || name === 'itemName') {
      const selectedItemName = name === 'itemName' ? value : updatedFormData.itemName;
      const quantityValue = name === 'quantity' ? value : updatedFormData.quantity;

      const selectedItem = items.find(
        (item) => `${item.productName} (${item.brandName})` === selectedItemName
      );
      if (selectedItem && quantityValue) {
        const quantityNum = Number(quantityValue);
        if (quantityNum <= 0) {
          setErrors({ ...errors, quantity: 'Quantity must be greater than 0' });
        } else if (quantityNum > selectedItem.quantity) {
          setErrors({
            ...errors,
            quantity: `Quantity cannot exceed ${selectedItem.quantity}`,
          });
        } else {
          setErrors({ ...errors, quantity: '' });
        }
      } else {
        setErrors({ ...errors, quantity: '' });
      }
    }
  };

  const handleSearch = (e) => {
    setFormData({ ...formData, searchTerm: e.target.value });
  };

  const filteredItems = items.filter((item) =>
    (`${item.productName} (${item.brandName})` || '').toLowerCase().includes(
      (formData.searchTerm || '').toLowerCase()
    )
  );

  const validate = () => {
    const newErrors = {};
    if (!formData.itemName) newErrors.itemName = 'Item Name is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    else if (errors.quantity) newErrors.quantity = errors.quantity;
    if (!formData.damageType) newErrors.damageType = 'Damage Type is required';
    if (!formData.actionRequired) newErrors.actionRequired = 'Action Required is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('FormStep1: useEffect running, token exists:', !!token);
    if (!token) {
      setErrors({ general: 'You must be logged in to view items' });
      setIsLoading(false);
      navigate('/login');
      return;
    }

    const getItem = async () => {
      setIsLoading(true);
      setErrors({});

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE_URL}/inventory`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('FormStep1: Backend response:', data);
        const mappedItems = data
          .map((item) => {
            if (!item.productName || !item.brandName) {
              console.warn('Item missing productName or brandName:', item);
              return null;
            }
            return {
              productName: item.productName,
              brandName: item.brandName,
              quantity: item.quantity,
              supplierName: item.supplierName,
            };
          })
          .filter((item) => item !== null);
        setItems(mappedItems);
      } catch (err) {
        const errorMessage = err.message || 'An unknown error occurred';
        setErrors({ general: errorMessage });
        console.error('Error fetching items:', err);

        if (errorMessage.includes('Invalid or expired token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    getItem();
  }, [navigate]);

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Step 1: Item Info</h2>
      {isLoading ? (
        <div className="text-center text-gray-600">Loading items...</div>
      ) : errors.general ? (
        <div className="text-red-600 text-center">{errors.general}</div>
      ) : (
        <>
          <div className="mb-4">
            <label htmlFor="searchTerm" className="block text-gray-700 font-medium mb-2">
              Search Items
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Search items..."
              value={formData.searchTerm || ''}
              onChange={handleSearch}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Search items"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="itemName" className="block text-gray-700 font-medium mb-2">
              Item Name
            </label>
            <select
              id="itemName"
              name="itemName"
              value={formData.itemName || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-required="true"
            >
              <option value="">Select an item</option>
              {filteredItems.length === 0 ? (
                <option value="" disabled>
                  No items found
                </option>
              ) : (
                filteredItems.map((item) => (
                  <option key={`${item.productName}-${item.brandName}`} value={`${item.productName} (${item.brandName})`}>
                    {item.productName} ({item.brandName}) (Available: {item.quantity})
                  </option>
                ))
              )}
            </select>
            {errors.itemName && <div className="text-red-600 text-sm mt-1">{errors.itemName}</div>}
          </div>
          <div className="mb-4">
            <label htmlFor="quantity" className="block text-gray-700 font-medium mb-2">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleChange}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-required="true"
            />
            {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
          </div>
          <div className="mb-4">
            <label htmlFor="damageType" className="block text-gray-700 font-medium mb-2">
              Damage Type
            </label>
            <select
              id="damageType"
              name="damageType"
              value={formData.damageType || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-required="true"
            >
              <option value="">Select damage type</option>
              <option value="Physical">Physical</option>
              <option value="Water">Water</option>
              <option value="Chemical">Chemical</option>
              <option value="Temperature">Temperature</option>
              <option value="Production">Production</option>
            </select>
            {errors.damageType && <div className="text-red-600 text-sm mt-1">{errors.damageType}</div>}
          </div>
          <div className="mb-4">
            <label htmlFor="actionRequired" className="block text-gray-700 font-medium mb-2">
              Action Required
            </label>
            <select
              id="actionRequired"
              name="actionRequired"
              value={formData.actionRequired || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-required="true"
            >
              <option value="">Select action</option>
              <option value="Dispose">Dispose</option>
              <option value="Return">Return</option>
            </select>
            {errors.actionRequired && (
              <div className="text-red-600 text-sm mt-1">{errors.actionRequired}</div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default FormStep1;