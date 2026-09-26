import Attendance from "../../Infrastructure/schemas/attendance";
import staffMembers from "../../Infrastructure/schemas/staff";
import dayjs from "dayjs";

// Define the return type for the functions
interface AttendanceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const checkInEmployee = async (nic: string): Promise<AttendanceResponse> => {
  const today = dayjs().format("YYYY-MM-DD");

  try {
    // Only create attendance for a nic belonging to an existing staff member
    const employeeExists = await staffMembers.exists({ NIC: nic });
    if (!employeeExists) {
      return { success: false, message: "Staff member not found" };
    }

    const existingAttendance = await Attendance.findOne({ nic, date: today });
    if (existingAttendance && existingAttendance.checkInTime) {
      return { success: false, message: "Already checked in today!" };
    }

    const now = new Date();
    // Set startOfWork to 8:00 AM on the current day
    const startOfWork = dayjs(today).hour(8).minute(0).second(0);
    const gracePeriod = startOfWork.add(15, "minute");
    const isLate = dayjs(now).isAfter(gracePeriod);

    const attendance = await Attendance.create({
      nic,
      date: today,
      checkInTime: now,
      isLate,
    });

    return { success: true, message: "Check-in successful", data: attendance };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const checkOutEmployee = async (nic: string): Promise<AttendanceResponse> => {
  const today = dayjs().format("YYYY-MM-DD");

  try {
    const attendance = await Attendance.findOne({ nic, date: today });
    if (!attendance) {
      return { success: false, message: "No check-in record found for today!" };
    }
    if (attendance.checkOutTime) {
      return { success: false, message: "Already checked out today!" };
    }

    const now = new Date();
    // Set officialEndTime to 5:00 PM on the current day
    const officialEndTime = dayjs(today).hour(17).minute(0).second(0);
    let overtimeHours = 0;

    if (dayjs(now).isAfter(officialEndTime)) {
      overtimeHours = dayjs(now).diff(officialEndTime, "hour", true);
    }

    attendance.checkOutTime = now;
    attendance.overTimeHours = overtimeHours;
    await attendance.save();

    return { success: true, message: "Check-out successful", data: attendance };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const autoCheckOutEmployees = async (): Promise<AttendanceResponse> => {
  const today = dayjs().format("YYYY-MM-DD");

  try {
    const attendances = await Attendance.find({
      date: today,
      checkOutTime: { $exists: false },
    });

    // Set officialEndTime to 5:00 PM on the current day
    const officialEndTime = dayjs(today).hour(17).minute(0).second(0).toDate();

    for (const attendance of attendances) {
      attendance.checkOutTime = officialEndTime;
      attendance.overTimeHours = 0;
      await attendance.save();
    }

    return {
      success: true,
      message: `${attendances.length} employees auto-checked out.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};