import { uploadToIPFS, getIPFSUrl, isIPFSAvailable } from './ipfsService';
import { storeImage, getImage } from './localStorageService';

const PREFER_IPFS = true;


export const uploadImage = async (imageData) => {
  try {
    if (PREFER_IPFS && isIPFSAvailable()) {
      try {
        console.log('Attempting to upload to IPFS...');
        const result = await uploadToIPFS(imageData);
        console.log('IPFS upload successful:', result);
        return {
          storageType: 'ipfs',
          ...result
        };
      } catch (ipfsError) {
        console.warn('IPFS upload failed, falling back to local storage:', ipfsError);
        
      }
    }
    
    
    console.log('Using local storage for image...');
    const result = await storeImage(imageData);
    return {
      storageType: 'local',
      ...result
    };
  } catch (error) {
    console.error('Storage error:', error);
    throw new Error(`Failed to store image: ${error.message}`);
  }
};


export const getImageUrl = (storageInfo) => {
  if (!storageInfo) return null;
  
  if (storageInfo.storageType === 'ipfs') {
    return getIPFSUrl(storageInfo.cid);
  } else {
    return getImage(storageInfo.id);
  }
};


export const parseStorageReference = (storageRef) => {
  try {
    if (!storageRef) return null;
    
    
    const parts = storageRef.split(':');
    if (parts.length < 2) return null;
    
    const storageType = parts[0];
    const identifier = parts.slice(1).join(':'); 
    
    if (storageType === 'ipfs') {
      return {
        storageType: 'ipfs',
        cid: identifier,
        url: getIPFSUrl(identifier)
      };
    } else if (storageType === 'local') {
      // Get the image data from localStorage
      const imageData = getImage(identifier);
      console.log('Retrieved local storage data for ID:', identifier, 'Data exists:', !!imageData);
      
      return {
        storageType: 'local',
        id: identifier,
        url: imageData
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing storage reference:', error);
    return null;
  }
};


export const createStorageReference = (storageInfo) => {
  if (!storageInfo) return '';
  
  if (storageInfo.storageType === 'ipfs') {
    return `ipfs:${storageInfo.cid}`;
  } else {
    return `local:${storageInfo.id}`;
  }
};

export default {
  uploadImage,
  getImageUrl,
  parseStorageReference,
  createStorageReference
};