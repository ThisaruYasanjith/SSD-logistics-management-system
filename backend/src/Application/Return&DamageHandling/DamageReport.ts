import { Request, Response } from 'express';
import DamageReport from '../../Infrastructure/schemas/damageReport';
import Inventory from '../../Infrastructure/schemas/InventoryManagement';
import Supplier from '../../Infrastructure/schemas/suppliers';
import { sendReturnReportEmail } from '../../Infrastructure/services/emailService';

interface DamageReportInput {
    itemName: string;
    quantity: number;
    damageType: string;
    actionRequired: string;
    supplierName?: string;
    description: string;
    date: string;
    reportedBy: string;
    productName: string;
    brandName: string;
}

// Server-side validation helpers
const VALID_DAMAGE_TYPES = ['Physical', 'Water', 'Chemical', 'Temperature', 'Production'];
const VALID_ACTIONS = ['Return', 'Dispose'];

const validateDamageReportInput = (data: any, isUpdate = false): string | null => {
    const { itemName, quantity, damageType, actionRequired, description, date, reportedBy, productName, brandName } = data;

    if (!isUpdate) {
        // Required field presence checks for create
        if (!itemName || !quantity || !damageType || !actionRequired || !description || !date || !reportedBy || !productName || !brandName) {
            return 'All required fields must be provided';
        }
    }

    // Validate quantity if provided
    if (quantity !== undefined) {
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
            return 'Quantity must be a positive integer';
        }
    }

    // Validate damageType if provided
    if (damageType !== undefined && !VALID_DAMAGE_TYPES.includes(damageType)) {
        return `Invalid damage type. Must be one of: ${VALID_DAMAGE_TYPES.join(', ')}`;
    }

    // Validate actionRequired if provided
    if (actionRequired !== undefined && !VALID_ACTIONS.includes(actionRequired)) {
        return `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`;
    }

    // Validate date format if provided
    if (date !== undefined) {
        if (typeof date !== 'string' || isNaN(Date.parse(date))) {
            return 'Invalid date format';
        }
    }

    // Validate string fields are not excessively long
    if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0 || description.length > 1000)) {
        return 'Description must be a non-empty string (max 1000 characters)';
    }

    if (reportedBy !== undefined && (typeof reportedBy !== 'string' || reportedBy.trim().length === 0 || reportedBy.length > 100)) {
        return 'Reported By must be a non-empty string (max 100 characters)';
    }

    if (itemName !== undefined && (typeof itemName !== 'string' || itemName.trim().length === 0 || itemName.length > 200)) {
        return 'Item Name must be a non-empty string (max 200 characters)';
    }

    return null;
};

// Create a damage report
export const createDamageReport = async (req: Request<{}, {}, DamageReportInput>, res: Response): Promise<void> => {
    try {
        const { itemName, quantity, damageType, actionRequired, supplierName, description, date, reportedBy, productName, brandName } = req.body;

        // Server-side validation
        const validationError = validateDamageReportInput(req.body, false);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }

        const inventoryItem = await Inventory.findOne({ productName, brandName });
        if (!inventoryItem) {
            res.status(404).json({ message: 'Item not found in inventory' });
            return;
        }
        if (inventoryItem.quantity < quantity) {
            res.status(400).json({ message: 'Insufficient quantity in inventory' });
            return;
        }

        const newDamageReport = await DamageReport.create({
            itemName: itemName.trim(),
            quantity: Number(quantity),
            damageType,
            actionRequired,
            supplierName: supplierName ? supplierName.trim() : undefined,
            description: description.trim(),
            date,
            reportedBy: reportedBy.trim(),
        });

        inventoryItem.quantity -= quantity;
        await inventoryItem.save();

        res.status(201).json({ message: 'Damage report created successfully', data: newDamageReport });
    } catch (error: unknown) {
        console.error('Error in createDamageReport:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all damage reports
export const getAllDamageReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const damageReports = await DamageReport.find();
        const enrichedReports = await Promise.all(
            damageReports.map(async (report) => {
                const supplier = report.supplierName
                    ? await Supplier.findOne({ name: report.supplierName })
                    : null;
                return {
                    ...report.toObject(),
                    id: report.id.toString(),
                    supplierEmail: supplier ? supplier.email : 'N/A',
                };
            })
        );
        res.status(200).json(enrichedReports);
    } catch (error: unknown) {
        console.error('Error in getAllDamageReports:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a damage report
export const updateDamageReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { itemName, quantity, damageType, actionRequired, supplierName, description, date, reportedBy, productName, brandName } = req.body;

        if (!id) {
            res.status(400).json({ message: 'Damage report ID is required' });
            return;
        }

        // Server-side validation for update
        const validationError = validateDamageReportInput(req.body, true);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }

        const damageReport = await DamageReport.findById(id);
        if (!damageReport) {
            res.status(404).json({ message: 'Damage report not found' });
            return;
        }

        // Validate inventory if quantity changes
        if (quantity !== undefined && quantity !== damageReport.quantity) {
            const inventoryItem = await Inventory.findOne({ productName, brandName });
            if (!inventoryItem) {
                res.status(404).json({ message: 'Item not found in inventory' });
                return;
            }

            // Adjust inventory quantity: revert the old quantity and apply the new one
            inventoryItem.quantity += damageReport.quantity; // Revert previous deduction
            if (inventoryItem.quantity < quantity) {
                res.status(400).json({ message: 'Insufficient quantity in inventory' });
                return;
            }
            inventoryItem.quantity -= quantity; // Apply new quantity
            await inventoryItem.save();
        }

        // Build whitelisted update payload
        const updatePayload: Record<string, any> = {};
        if (itemName !== undefined) updatePayload.itemName = itemName.trim();
        if (quantity !== undefined) updatePayload.quantity = Number(quantity);
        if (damageType !== undefined) updatePayload.damageType = damageType;
        if (actionRequired !== undefined) updatePayload.actionRequired = actionRequired;
        if (supplierName !== undefined) updatePayload.supplierName = supplierName.trim();
        if (description !== undefined) updatePayload.description = description.trim();
        if (date !== undefined) updatePayload.date = date;
        if (reportedBy !== undefined) updatePayload.reportedBy = reportedBy.trim();

        // Update the damage report using $set to prevent mass assignment
        const updatedDamageReport = await DamageReport.findByIdAndUpdate(
            id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Damage report updated successfully', data: updatedDamageReport });
    } catch (error: unknown) {
        console.error('Error in updateDamageReport:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a damage report
export const deleteDamageReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: 'Damage report ID is required' });
            return;
        }

        const damageReport = await DamageReport.findById(id);
        if (!damageReport) {
            res.status(404).json({ message: 'Damage report not found' });
            return;
        }

        // Revert inventory quantity
        const [productName, brandName] = damageReport.itemName.split(' (');
        const cleanedBrandName = brandName ? brandName.replace(')', '') : '';
        const inventoryItem = await Inventory.findOne({ productName, brandName: cleanedBrandName });
        if (inventoryItem) {
            inventoryItem.quantity += damageReport.quantity;
            await inventoryItem.save();
        }

        await DamageReport.findByIdAndDelete(id);
        res.status(200).json({ message: 'Damage report deleted successfully' });
    } catch (error: unknown) {
        console.error('Error in deleteDamageReport:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Send return report email
export const sendReturnReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { damageReportId, additionalDetails } = req.body;

        if (!damageReportId || !additionalDetails) {
            res.status(400).json({ message: 'Damage report ID and additional details are required' });
            return;
        }

        // Validate additionalDetails length
        if (typeof additionalDetails !== 'string' || additionalDetails.length > 2000) {
            res.status(400).json({ message: 'Additional details must be a string (max 2000 characters)' });
            return;
        }

        const damageReport = await DamageReport.findById(damageReportId);
        if (!damageReport) {
            res.status(404).json({ message: 'Damage report not found' });
            return;
        }

        const supplier = damageReport.supplierName
            ? await Supplier.findOne({ name: damageReport.supplierName })
            : null;
        if (!supplier || !supplier.email) {
            res.status(404).json({ message: 'Supplier email not found' });
            return;
        }

        await sendReturnReportEmail(
            supplier.email,
            `Return Report for ${damageReport.itemName}`,
            damageReport,
            additionalDetails
        );

        res.status(200).json({ message: 'Return report email sent successfully' });
    } catch (error: unknown) {
        console.error('Error in sendReturnReport:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all inventory items for dropdown
export const getInventoryItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const items = await Inventory.find();
        const validItems = items.filter(item => item.productName && item.brandName);
        if (validItems.length === 0) {
            res.status(404).json({ message: 'No valid inventory items found' });
            return;
        }
        res.status(200).json(validItems);
    } catch (error: unknown) {
        console.error('Error fetching inventory items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};