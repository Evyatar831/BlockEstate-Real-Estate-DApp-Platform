
import { create } from 'ipfs-http-client';

// Configure IPFS client - connect to public IPFS gateway or your own node

const projectId = ''; 
const projectSecret = ''; 


const hasInfuraCredentials = projectId && projectSecret;


let ipfs = null;

if (hasInfuraCredentials) {
  try {
    
    const auth = 'Basic ' + btoa(projectId + ':' + projectSecret);
    
    ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: auth,
      },
    });
    console.log('IPFS client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IPFS client:', error);
    ipfs = null;
  }
}


export const uploadToIPFS = async (file) => {
  
  if (!ipfs) {
    throw new Error('IPFS client not initialized - credentials missing or invalid');
  }

  try {
    
    let fileData;
    if (typeof file === 'string' && file.startsWith('data:')) {
      
      const base64Data = file.split(',')[1];
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileData = bytes;
    } else {
      fileData = file;
    }

    
    const added = await ipfs.add(fileData, {
      progress: (prog) => console.log(`IPFS upload progress: ${prog}`),
    });

    
    const ipfsUrl = `https://ipfs.io/ipfs/${added.path}`;
    console.log('IPFS URL:', ipfsUrl);
    
    return {
      cid: added.path,
      url: ipfsUrl
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};


export const getIPFSUrl = (cid) => {
  return `https://ipfs.io/ipfs/${cid}`;
};


export const isIPFSAvailable = () => {
  return ipfs !== null;
};

export default {
  uploadToIPFS,
  getIPFSUrl,
  isIPFSAvailable
};