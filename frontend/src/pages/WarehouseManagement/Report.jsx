import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

import api, { errorMessage } from "../../utils/apiClient";
const reportgenarate = async () => {
  try {
    // Fetch both maintenance and routing maintenance data
    const maintenanceResponse = await api.get("/maintenance");
    const routingResponse = await api.get("/routingmaintenance");

    const maintenanceData = maintenanceResponse.data || [];
    const routingMaintenanceData = routingResponse.data || [];

    // Create a new PDF
    const pdf = new jsPDF();
    pdf.setFontSize(10);
    let y = 20;
    const lineHeight = 8;
    const headerColor = [171, 71, 188]; // Purple header color
    const maxTextWidth = 40; // Max width for text fields to prevent overflow

    // Title and Date
    pdf.setFontSize(14);
    pdf.text("Maintenance & Routing Maintenance Report", 10, y);
    y += lineHeight * 2;
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, y);
    y += lineHeight * 2;

    // === Maintenance Section ===
    pdf.setFontSize(12);
    pdf.text("Maintenance Requests", 10, y);
    y += lineHeight * 2;

    if (maintenanceData.length === 0) {
      pdf.setFontSize(10);
      pdf.text("No maintenance requests available.", 10, y);
      y += lineHeight * 2;
    } else {
      // Maintenance Table Headers
      const maintenanceHeaders = [
        "Request ID",
        "Warehouse ID",
        "Issue",
        "Priority",
        "Scheduled Date",
        "Completion Date",
      ];
      const maintenanceColWidths = [40, 40, 40, 20, 30, 20];
      let startX = 10;

      // Draw header background
      pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      pdf.rect(
        startX,
        y - lineHeight + 4,
        maintenanceColWidths.reduce((sum, width) => sum + width, 0),
        lineHeight - 1,
        "F"
      );

      // Add headers
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      let currentX = startX;
      maintenanceHeaders.forEach((header, index) => {
        pdf.text(header, currentX + 2, y);
        currentX += maintenanceColWidths[index];
      });
      pdf.setTextColor(0);
      pdf.setFont("helvetica", "normal");
      y += lineHeight + 2;

      // Maintenance Data
      maintenanceData.forEach((item) => {
        let currentX = startX;
        pdf.text(String(item.requestId || ""), currentX + 2, y);
        currentX += maintenanceColWidths[0];
        pdf.text(String(item.warehouseId || ""), currentX + 2, y);
        currentX += maintenanceColWidths[1];
        const issueText = item.issueDescription
          ? pdf.splitTextToSize(item.issueDescription, maxTextWidth)[0]
          : "";
        pdf.text(issueText, currentX + 2, y);
        currentX += maintenanceColWidths[2];
        pdf.text(item.priority || "", currentX + 2, y);
        currentX += maintenanceColWidths[3];
        pdf.text(
          item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : "",
          currentX + 2,
          y
        );
        currentX += maintenanceColWidths[4];
        pdf.text(
          item.completionDate ? new Date(item.completionDate).toLocaleDateString() : "",
          currentX + 2,
          y
        );
        currentX += maintenanceColWidths[5];

        y += lineHeight;
        if (y > pdf.internal.pageSize.height - 10) {
          pdf.addPage();
          y = 10;
        }
      });
    }

    // === Routing Maintenance Section ===
    y += lineHeight * 2;
    pdf.setFontSize(12);
    pdf.text("Routing Maintenance Records", 10, y);
    y += lineHeight * 2;

    if (routingMaintenanceData.length === 0) {
      pdf.setFontSize(10);
      pdf.text("No routing maintenance records available.", 10, y);
      y += lineHeight * 2;
    } else {
      // Routing Maintenance Table Headers
      const routingHeaders = ["RID", "Warehouse", "Date", "Water Bill", "Current Bill", "Description"];
      const routingColWidths = [40, 40, 30, 25, 25, 50];
      const startX = 10;

      // Draw header background
      pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      pdf.rect(
        startX,
        y - lineHeight + 4,
        routingColWidths.reduce((sum, width) => sum + width, 0),
        lineHeight - 1,
        "F"
      );

      // Add headers
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      let currentX = startX;
      routingHeaders.forEach((header, index) => {
        pdf.text(header, currentX + 2, y);
        currentX += routingColWidths[index];
      });
      pdf.setTextColor(0);
      pdf.setFont("helvetica", "normal");
      y += lineHeight + 2;

      // Routing Maintenance Data
      routingMaintenanceData.forEach((item) => {
        let currentX = startX;
        pdf.text(String(item.RID || ""), currentX + 2, y);
        currentX += routingColWidths[0];
        pdf.text(item.warehouse || "", currentX + 2, y);
        currentX += routingColWidths[1];
        pdf.text(item.date ? new Date(item.date).toLocaleDateString() : "", currentX + 2, y);
        currentX += routingColWidths[2];
        pdf.text(String(item.waterbill || ""), currentX + 2, y);
        currentX += routingColWidths[3];
        pdf.text(String(item.currentbill || ""), currentX + 2, y);
        currentX += routingColWidths[4];
        const descText = item.description
          ? pdf.splitTextToSize(item.description, maxTextWidth)[0]
          : "";
        pdf.text(descText, currentX + 2, y);
        currentX += routingColWidths[5];

        y += lineHeight;
        if (y > pdf.internal.pageSize.height - 10) {
          pdf.addPage();
          y = 10;
        }
      });
    }

    pdf.save("maintenance_routing_report.pdf");
    toast.success("PDF report generated and downloaded successfully!");
  } catch (error) {
    const message =
      error.response?.status === 401 || error.response?.status === 403
        ? "Authentication failed. Please log in again."
        : errorMessage(error, "Failed to generate report.");
    console.error("Error generating report:", error);
    toast.error(message);
    throw new Error(message);
  }
};

export default reportgenarate;