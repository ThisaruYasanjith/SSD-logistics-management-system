import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layouts
import RootLayout from './layouts/root.layout.jsx';
import DashboardLayout from './component/DashBoard1.jsx';
import StaffLayout from './layouts/staff.layout.jsx';
import ProtectedRoute from './component/ProtectedRoute.jsx';

// Pages
import Home from './pages/Home/Home.jsx';
import WarehouseManagement from './pages/WarehouseManagement/WarehouseManagement.jsx';
import VehicleFleetManagement from './pages/VehicleFleet/VehicleFleetManagement.jsx';
import DeliveryManagement from './pages/DeliveryScheduling/DeliveryManagement.jsx';
import InventoryManagement from './pages/InventoryManagement/InventoryManagement.jsx';
import StaffManagement from './pages/StaffManagement/StaffManagement.jsx';
import SupplierManagement from './pages/SupplierManagement/SupplierManagement.jsx';
import Help from './pages/Help/Help.jsx';
import Login from './pages/login/login.jsx';
import Unauthorized from './pages/login/Unauthorized.jsx';

// Vehicle Fleet Management
import VehicleRegistrationForm from './pages/VehicleFleet/VehicleRegistration.jsx';
import Vehicleprofile from './pages/VehicleFleet/VehicleProfile.jsx';
import VehicleMaintenanceForm from './pages/VehicleFleet/VehicleMaintainance.jsx';
import UpdateVehicleMaintenanceForm from './pages/VehicleFleet/VehicleMaintenanceUpdate.jsx';

// Delivery Management
import NewDeliverySchedule from './pages/DeliveryScheduling/SchedulingForm.jsx';
import DeliveryScheduleProfile from './pages/DeliveryScheduling/ScheduleDetailProfile.jsx';
import DeliveryManagementEmployee from './component/DeliveryScheduling/DeliveryManagementEmployee.jsx';
import DeliveryScheduleUpdate from './component/DeliveryScheduling/DeliveryScheduleEmp.jsx';

// Warehouse Management
import CreateWarehouse from './pages/WarehouseManagement/CreateWarehouse.jsx';
import WarehouseForm from './pages/WarehouseManagement/WarehouseProfile.jsx';
import Maintainance from './pages/WarehouseManagement/Mantainance.jsx';
import MaintenanceForm from './pages/WarehouseManagement/CreateMaintenance.jsx';
import MaintenanceFormTwo from './pages/WarehouseManagement/MaintenanceProfile.jsx';
import RoutingMaintenanceForm from './pages/WarehouseManagement/RoutingForm.jsx';

// Staff Management
import ManageStaff from './pages/StaffManagement/SubPages/ManageStaff.jsx';
import AddStaff from './pages/StaffManagement/SubPages/AddStaff.jsx';
import AssignTask from './pages/StaffManagement/SubPages/AssignTask.jsx';
import LeaveReq from './pages/StaffManagement/SubPages/LeaveReq.jsx';
import ManageSalary from './pages/StaffManagement/SubPages/ManageSalary.jsx';
import Concerns from './pages/StaffManagement/SubPages/Concerns.jsx';
import AttendanceTracking from './pages/StaffManagement/SubPages/AttendanceTracking.jsx';
import StaffAttendance from './pages/StaffManagement/SubPages/StaffAttendanceTracking.jsx';

// Supplier Management
import AddSupplier from './pages/SupplierManagement/AddSupplier.jsx';

// Return & Damage Handling
import ReturnForm from './pages/Return&DamageHandling/ReturnForm.jsx';
import DamageHandling from './pages/Return&DamageHandling/DamageHandling.jsx';
import AddDamage from './pages/Return&DamageHandling/AddDamage.jsx';
import Items from './pages/Return&DamageHandling/items.jsx';
import ReturnReport from './pages/Return&DamageHandling/ReturnReport.jsx';

// Staff Member Pages
import Dashboard from './pages/StaffMember/Dashboard.jsx';
import Profile from './pages/StaffMember/Profile.jsx';
import QRCode from './pages/StaffMember/QRCode.jsx';
import LeaveRequest from './pages/StaffMember/leaveRequest.jsx';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                <Home />
              </ProtectedRoute>
            )
          },
          // Warehouse Management Routes
          {
            path: "warehouse",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff"]}>
                <WarehouseManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/Addwarehouse",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <CreateWarehouse />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/WarehouseDetails/:WarehouseID",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff"]}>
                <WarehouseForm />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/Maintainance",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Staff"]}>
                <Maintainance />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/Maintainance/AddMaintenance",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <MaintenanceForm />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/Maintainance/AddMaintenance/:requestId",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <MaintenanceForm />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/Maintainance/Routing-Form",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <RoutingMaintenanceForm />
              </ProtectedRoute>
            )
          },
          {
            path: "warehouse/Maintainance/Routing-Form/:RID",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <RoutingMaintenanceForm />
              </ProtectedRoute>
            )
          },
          // Vehicle Fleet Management Routes
          {
            path: "fleet",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff", "Driver"]}>
                <VehicleFleetManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "fleet/vehicleRegistration",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <VehicleRegistrationForm />
              </ProtectedRoute>
            )
          },
          {
            path: "fleet/VehicleProfile/:VehicleNumber",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff", "Driver"]}>
                <Vehicleprofile />
              </ProtectedRoute>
            )
          },
          {
            path: "fleet/vehicleMaintenance",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <VehicleMaintenanceForm />
              </ProtectedRoute>
            )
          },
          {
            path: "fleet/VehicleProfile/:VehicleNumber/vehicleMaintenance",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <VehicleMaintenanceForm />
              </ProtectedRoute>
            )
          },
          {
            path: "fleet/VehicleProfile/:VehicleNumber/vehicleMaintenance/:MaintenanceID",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <UpdateVehicleMaintenanceForm />
              </ProtectedRoute>
            )
          },
          // Delivery Management Routes
          {
            path: "delivery",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Driver"]}>
                <DeliveryManagement />
              </ProtectedRoute>
            )
          },
          {
            path: "delivery/NewDeliveryScheduling",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                <NewDeliverySchedule />
              </ProtectedRoute>
            )
          },
          {
            path: "delivery/DeliveryProfile/:ScheduleID",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                <DeliveryScheduleProfile />
              </ProtectedRoute>
            )
          },
          // Inventory Management Routes
          {
            path: "inventory",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                <InventoryManagement />
              </ProtectedRoute>
            )
          },
          // Staff Management Routes
          {
            path: "staff",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                <StaffManagement />
              </ProtectedRoute>
            ),
            children: [
              {
                path: "manage-staff",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <ManageStaff />
                  </ProtectedRoute>
                ),
              },
              {
                path: "add-staff",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <AddStaff />
                  </ProtectedRoute>
                ),
              },
              {
                path: "assign-tasks",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <AssignTask />
                  </ProtectedRoute>
                ),
              },
              {
                path: "leave-requests",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <LeaveReq />
                  </ProtectedRoute>
                ),
              },
              {
                path: "manage-salary",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <ManageSalary />
                  </ProtectedRoute>
                ),
              },
              {
                path: "concerns",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <Concerns />
                  </ProtectedRoute>
                ),
              },
              {
                path: "Attendance-Tracking",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <AttendanceTracking />
                  </ProtectedRoute>
                ),
              },
              {
                path: "attendance",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <StaffAttendance />
                  </ProtectedRoute>
                ),
              }
            ],
          },
          // Supplier Management Routes
          {
            path: "suppliers",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <SupplierManagement />
              </ProtectedRoute>
            ),
            children: [
              {
                path: "Add-Supplier",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                    <AddSupplier />
                  </ProtectedRoute>
                )
              }
            ]
          },
          // Return & Damage Handling Routes
          {
            path: "returns",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <DamageHandling />
              </ProtectedRoute>
            ),
            children: [
              {
                path: "add-damage",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                    <AddDamage />
                  </ProtectedRoute>
                ),
              },
              {
                path: "view-damage-reports",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <Items />
                  </ProtectedRoute>
                ),
              },
              {
                path: "return-form",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <ReturnForm />
                  </ProtectedRoute>
                )
              },
              {
                path: "view-returned-items",
                element: (
                  <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager"]}>
                    <ReturnReport />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          // Help Route
          {
            path: "help",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager"]}>
                <Help />
              </ProtectedRoute>
            )
          }
        ]
      }
    ]
  },
  // Staff Layout Routes
  {
    element: <StaffLayout />,
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Driver", "Maintenance Staff", "Other Staff"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "my-qr",
            element: (
              <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Driver", "Maintenance Staff", "Other Staff"]}>
                <QRCode />
              </ProtectedRoute>
            ),
          },
          {
            path: "leave-request",
            element: (
              <ProtectedRoute allowedRoles={["Driver", "Maintenance Staff", "Other Staff"]}>
                <LeaveRequest />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute allowedRoles={["Business Owner", "Warehouse Manager", "Inventory Manager", "Driver", "Maintenance Staff", "Other Staff"]}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "deliveryEmp",
        element: (
          <ProtectedRoute allowedRoles={["Driver"]}>
            <DeliveryManagementEmployee />
          </ProtectedRoute>
        )
      },
      {
        path: "deliveryEmp/DeliveryProfile/:ScheduleID",
        element: (
          <ProtectedRoute allowedRoles={["Driver"]}>
            <DeliveryScheduleUpdate />
          </ProtectedRoute>
        )
      },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);