
import express from 'express';
import {createDeliverySchedule,getDeliverySchedules,getDeliveryScheduleById,updateDeliveryScheduleById,deleteDeliveryScheduleByID} from "../../Application/DeliveryScheduling/DeliveryApp"
import { authenticateToken as secureAuthenticateToken } from "../../middleware/authentication";


const router = express.Router();

// Delivery management routes - V01 JWT Authentication Bypass Fix - Sithum
router.use(secureAuthenticateToken);


// create delivery schedule
router.post('/Delivery', async (req, res) => {
    const {
      pickupLocation,
      dropoffLocation,
      deliveryDate,
      packageType,
      quantity,
      vehicle,
      driverName,
      driverUsername,
      specialInstructions,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      status
    } = req.body;
  
    try {
      // Call the service function to create and save the new delivery schedule
      const newDeliverySchedule = await createDeliverySchedule(
        pickupLocation,
        dropoffLocation,
        deliveryDate,
        packageType,
        quantity,
        vehicle,
        driverName,
        driverUsername,
        specialInstructions,
        pickupLatitude,
        pickupLongitude,
        dropoffLatitude,
        dropoffLongitude,
        status
      );
  
      // Return the created delivery schedule data as JSON
      res.status(201).json(newDeliverySchedule);
    } catch (error) {
      res.status(400).json({ message: 'Error creating delivery schedule', error });
    }
  });

  


  // get all delivery schedules
router.get('/Delivery', async (req, res) => {
    try {
      const deliverySchedules = await getDeliverySchedules();
      res.status(200).json(deliverySchedules);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching delivery schedules', error });
    }
  });
  

// Get a specific delivery schedule by scheduleID

router.get('/Delivery/:Scheduleid', async (req, res) => {

  const { Scheduleid } = req.params; 
  
  try {

    const schedule = await getDeliveryScheduleById(Scheduleid);

      // Delivery ownership validation - V03 BOLA IDOR Fix - Sithum
      const user = (req as any).user;

      if (
        user?.role === "Driver" &&
        schedule.driverUsername?.toLowerCase() !== user.email?.toLowerCase()
      ) {
        return res.status(403).json({
          message: "Access denied: You can only access your own delivery schedules"
        });
      } 
    res.json(schedule); 

  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error}); 
  }
});



// Route to Update delivery schedule details

router.put('/Delivery/:Scheduleid', async (req, res) => {

  const { Scheduleid } = req.params; // Extract deliveryScheduleId from the route parameter
  let updateData = req.body; // Extract the fields to be updated from the request body

  try {
    const user = (req as any).user;

    // Driver field authorization - V04 Delivery Field Authorization Fix - Sithum
    if (user?.role === "Driver") {
      const schedule = await getDeliveryScheduleById(Scheduleid);

      if (
        schedule.driverUsername?.toLowerCase() !== user.email?.toLowerCase()
      ) {
        return res.status(403).json({
          message: "Access denied: You can only update your own delivery schedules"
        });
      }

      const requestedFields = Object.keys(req.body);

      if (
        requestedFields.length !== 1 ||
        requestedFields[0] !== "status"
      ) {
        return res.status(403).json({
          message: "Access denied: Drivers can only update delivery status"
        });
      }

      updateData = { status: req.body.status };
    }
    const result = await updateDeliveryScheduleById(Scheduleid, updateData); 
    res.json(result); // Send a success message if the update is successful
  } catch (error) {
    res.status(500).json({ message: "Error updating delivery schedule", error });
  }
});


// Delete delivery schedule by ID
router.delete('/Delivery/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params; 

  try {
    const result = await deleteDeliveryScheduleByID(scheduleId); // Call the delete service function
    res.json(result); // Send a success message if deleted
  } catch (error) {
    res.status(500).json({ message: 'Error deleting delivery schedule', error });
  }
});




  export default router;