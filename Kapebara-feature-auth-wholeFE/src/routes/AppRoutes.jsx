import React from "react";
import { Navbar } from "../components";
import { Route, Routes } from "react-router-dom";
import {
  AboutUs,
  DeliveryList,
  Home,
  Login,
  MenuList,
  NotificationList,
  OrderList,
  PaymentList,
  SignUp,
} from "../pages";

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/menu" element={<MenuList />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/delivery" element={<DeliveryList />} />
        <Route path="/payments" element={<PaymentList />} />
        <Route path="/notifications" element={<NotificationList />} />

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </>
  );
};

export default AppRoutes;
