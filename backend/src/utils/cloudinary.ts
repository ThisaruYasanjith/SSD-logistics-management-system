import { v2 as cloudinary } from "cloudinary";

// Defining the shape of the Cloudinary upload response
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  asset_id?: string;
  created_at: string;
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (file: Express.Multer.File, fileName: string, folder: string) => {
  try {
    // Debug: Check if file and file.buffer exist
    if (!file || !file.buffer) {
      throw new Error("File or file buffer is missing");
    }
    console.log("Uploading file to Cloudinary:", { fileName, folder, bufferSize: file.buffer.length });

    const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: fileName,
          folder: folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            const msg = error instanceof Error
              ? error.message
              : typeof error === "object" && error && "message" in error
              ? String((error as any).message)
              : JSON.stringify(error);
            reject(new Error(msg));
          } else {
            resolve(result as CloudinaryUploadResponse);
          }
        }
      );
      stream.end(file.buffer);
    });

    console.log("Cloudinary upload successful:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Cloudinary upload failed with error:", error); // Log the full error object
    throw new Error(`Cloudinary upload failed: ${errorMessage}`);
  }
};

export const uploadQRCodeToCloudinary = async (qrCodeBuffer: Buffer, fileName: string, folder: string) => {
  try {
    const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: fileName,
          folder: folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            const msg = error instanceof Error
              ? error.message
              : typeof error === "object" && error && "message" in error
              ? String((error as any).message)
              : JSON.stringify(error);
            reject(new Error(msg));
          } else {
            resolve(result as CloudinaryUploadResponse);
          }
        }
      );
      stream.end(qrCodeBuffer);
    });
    return result.secure_url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Cloudinary QR code upload failed: ${errorMessage}`);
  }
};