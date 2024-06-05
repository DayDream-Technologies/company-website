import dotenv from 'dotenv';

dotenv.config();

export const config = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

console.log('AWS Region:', config.region);
console.log('AWS Access Key ID:', config.accessKeyId ? 'Loaded' : 'Not Loaded');
console.log('AWS Secret Access Key:', config.secretAccessKey ? 'Loaded' : 'Not Loaded');