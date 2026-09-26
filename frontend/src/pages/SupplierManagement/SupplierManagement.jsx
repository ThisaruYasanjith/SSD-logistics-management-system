import AddSupplier from "./AddSupplier.jsx";
import { useState } from "react";
import SupplierDetails from "./SupplierDetails.jsx";
import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";




function SupplierManagement() {
  const location = useLocation();

  const isBaseRoute = location.pathname === "/suppliers";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    itemsName: "",
    quantity: "",
    unitPrice: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div>

      {isBaseRoute && (



        <div>


          <div className="p-5">
            <Link to={'Add-Supplier'} >
              <button className="bg-indigo-400 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
                + Add Suppliers
              </button>
            </Link>
          </div>

          <SupplierDetails />

        </div>
      )}
      <main className="p-3">
        <Outlet />
      </main>
    </div>

  );
}

export default SupplierManagement;
