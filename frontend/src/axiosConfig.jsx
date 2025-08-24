/*
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://3.27.187.70:5001', // live
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
*/

import axios from 'axios';

const axiosInstance = axios.create({
  // REPLACE <YOUR_EC2_IP> with 3.27.187.70 (keep http and :5001)
  baseURL: 'http://3.27.187.70:5001',
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
