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
  //baseURL: 'http://localhost:5001', // local
  baseURL: 'http://13.239.222.44:5001', // live

  // frontend/src/axiosConfig.js

  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
