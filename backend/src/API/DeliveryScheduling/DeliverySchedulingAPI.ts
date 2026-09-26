
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
    res.json(schedule); 

  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error}); 
  }
});



// Route to Update delivery schedule details

router.put('/Delivery/:Scheduleid', async (req, res) => {

  const { Scheduleid } = req.params; // Extract deliveryScheduleId from the route parameter
  const updateData = req.body; // Extract the fields to be updated from the request body

  try {
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