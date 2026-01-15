// riderService.js
import { mockRiderProfile } from '../../../shared-mock-data/deliveryHistoryMockData';


// IMPORTANT: mock mode ON
const USE_MOCK = true;

export const getRiderProfile = async () => {
  if (USE_MOCK) {
    console.log('Using MOCK rider profile');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockRiderProfile);
      }, 300);
    });
  }

  // REAL API (later)
  // return api.get('/rider/profile').then(res => res.data);
};
