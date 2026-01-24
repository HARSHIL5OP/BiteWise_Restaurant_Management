const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

// WARNING: exposing API_SECRET on the client side is insecure.
// This is done here only because it was explicitly requested for this demo project.
// In a production app, the signature should be generated on the backend.

async function sha1(str: string) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-1", buffer);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function uploadToCloudinary(file: File) {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Parameters to sign (must be sorted alphabetically)
    const paramsToSign = `timestamp=${timestamp}${API_SECRET}`;

    const signature = await sha1(paramsToSign);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const data = await response.json();
    return data.secure_url;
}
