// import axios from "axios";
// const api = axios.create({
//   baseURL: "/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true, // important for auth cookies later
// });

// export default api;



import axios from "axios";
import { signOut } from "next-auth/react";

const api = axios.create({
  baseURL: "/api",
  // headers: {
  //   "Content-Type": "application/json",
  // },
  withCredentials: true,
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {

      await signOut({
        callbackUrl: "/onboarding/login",
        redirect: true,
      });
    }

    return Promise.reject(error);
  }
);

export default api;