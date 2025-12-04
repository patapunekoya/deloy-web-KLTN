// Cloudinary configuration for client-side upload
export const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

// Debug: Kiểm tra biến môi trường
console.log('Cloudinary Config:', {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
});


export const uploadAvatarFromUrl = async (imageUrl) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary config missing!');
  }

  const formData = new FormData();
  formData.append('file', imageUrl); // truyền URL thay vì file
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url; // URL ảnh trên Cloudinary
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    throw error;
  }
};


export const uploadToCloudinary = async (file) => {
  // Kiểm tra biến môi trường
  if (!CLOUDINARY_CONFIG.cloud_name || !CLOUDINARY_CONFIG.upload_preset) {
    throw new Error('Cloudinary configuration missing. Please check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url; // <-- chỉ trả về secure_url
    } else {
      console.error('Cloudinary response:', data);
      throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}; 