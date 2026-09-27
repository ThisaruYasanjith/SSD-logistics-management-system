import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Escape HTML special characters to prevent HTML injection in emails
const escapeHtml = (str: string): string => {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export const sendReturnReportEmail = async (
    to: string,
    subject: string,
    damageReport: any,
    additionalDetails: string
): Promise<void> => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: `
      <h2>Return Report for Damaged Item</h2>
      <p><strong>Item Name:</strong> ${escapeHtml(damageReport.itemName)}</p>
      <p><strong>Quantity:</strong> ${escapeHtml(String(damageReport.quantity))}</p>
      <p><strong>Damage Type:</strong> ${escapeHtml(damageReport.damageType)}</p>
      <p><strong>Action Required:</strong> ${escapeHtml(damageReport.actionRequired)}</p>
      <p><strong>Supplier Name:</strong> ${escapeHtml(damageReport.supplierName || 'N/A')}</p>
      <p><strong>Description:</strong> ${escapeHtml(damageReport.description)}</p>
      <p><strong>Date Reported:</strong> ${escapeHtml(damageReport.date)}</p>
      <p><strong>Reported By:</strong> ${escapeHtml(damageReport.reportedBy)}</p>
      <p><strong>Additional Details:</strong> ${escapeHtml(additionalDetails || 'None')}</p>
      <p>Please process the return at your earliest convenience.</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', to);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};