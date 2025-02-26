

 //A simple fallback storage service when IPFS is not available
//This stores images in localStorage (with size limitations)
 
const generateUniqueId = () => {
    return `img_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  };
 
  export const storeImage = async (dataUrl) => {
    try {
      if (dataUrl.length > 4 * 1024 * 1024) {
        throw new Error('Image is too large for local storage (max 4MB)');
      }
  
      const imageId = generateUniqueId();
      localStorage.setItem(imageId, dataUrl);
      
      return {
        id: imageId,
        url: dataUrl
      };
    } catch (error) {
      console.error('Error storing image in localStorage:', error);
      throw new Error(`Failed to store image: ${error.message}`);
    }
  };
 
  export const getImage = (imageId) => {
    return localStorage.getItem(imageId);
  };
  
  export default {
    storeImage,
    getImage
  };