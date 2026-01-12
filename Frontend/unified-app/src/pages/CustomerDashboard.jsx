import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import CustomerNavbar from '../components/CustomerNavbar';
import '../App.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Order creation state
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    specialInstructions: '',
    orderTotal: '',
    paymentMethod: 'COD'
  });
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [createError, setCreateError] = useState('');

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.deliveryAddress || !orderForm.orderTotal) {
      setCreateError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    setCreateError('');
    setCreateSuccess(null);

    try {
      const orderData = {
        customerId: user?.userId || 1, // Use logged-in user's ID
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        deliveryAddress: orderForm.deliveryAddress,
        specialInstructions: orderForm.specialInstructions || null,
        orderTotal: parseFloat(orderForm.orderTotal),
        paymentMethod: orderForm.paymentMethod
      };

      const newOrder = await orderService.createOrder(orderData);
      setCreateSuccess(newOrder);
      
      // Reset form
      setOrderForm({
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        specialInstructions: '',
        orderTotal: '',
        paymentMethod: 'COD'
      });
      
      // Note: Track your order in the customer-app
    } catch (err) {
      // Better error handling
      let errorMessage = 'Failed to create order. Please try again.';
      
      if (err.errorData) {
        // Error data already parsed
        if (err.errorData.errors && Array.isArray(err.errorData.errors)) {
          errorMessage = err.errorData.errors.join(', ');
        } else if (err.errorData.message) {
          errorMessage = err.errorData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setCreateError(errorMessage);
      console.error('Create order error:', err);
      console.error('Error status:', err.status);
      console.error('Error data:', err.errorData);
      console.error('Full error:', err);
    } finally {
      setCreating(false);
    }
  };


  return (
    <>
      <CustomerNavbar />
      <div className="container-fluid page-container">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <h2 className="mb-4">
              <i className="bi bi-cart-plus"></i> Create New Order
            </h2>

            {/* Create Order Form */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Create New Order</h5>
              </div>
              <div className="card-body">
                  {createSuccess && (
                    <div className="alert alert-success" role="alert">
                      <strong>Order Created Successfully!</strong>
                      <br />
                      Order ID: <strong>#{createSuccess.orderId}</strong>
                      <br />
                      <small>You can track your order using the Track Order page.</small>
                    </div>
                  )}
                  
                  {createError && (
                    <div className="alert alert-danger" role="alert">
                      {createError}
                    </div>
                  )}

                  <form onSubmit={handleCreateOrder}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="customerName" className="form-label">
                          Your Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="customerName"
                          value={orderForm.customerName}
                          onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="customerPhone" className="form-label">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="customerPhone"
                          value={orderForm.customerPhone}
                          onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="deliveryAddress" className="form-label">
                        Delivery Address <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        id="deliveryAddress"
                        rows="3"
                        value={orderForm.deliveryAddress}
                        onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                        required
                      />
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="orderTotal" className="form-label">
                          Order Total ($) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="orderTotal"
                          step="0.01"
                          min="0"
                          value={orderForm.orderTotal}
                          onChange={(e) => setOrderForm({ ...orderForm, orderTotal: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="paymentMethod" className="form-label">
                          Payment Method
                        </label>
                        <select
                          className="form-select"
                          id="paymentMethod"
                          value={orderForm.paymentMethod}
                          onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
                        >
                          <option value="COD">Cash on Delivery (COD)</option>
                          <option value="Card">Credit/Debit Card</option>
                          <option value="Online">Online Payment</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="specialInstructions" className="form-label">
                        Special Instructions (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        id="specialInstructions"
                        rows="2"
                        value={orderForm.specialInstructions}
                        onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                        placeholder="e.g., Leave at door, Ring bell, etc."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100"
                      disabled={creating}
                    >
                      {creating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Order...
                        </>
                      ) : (
                        'Create Order'
                      )}
                    </button>
                  </form>
                </div>
              </div>

            <div className="card">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Want to track an existing order?</p>
                <button
                  className="btn btn-success"
                  onClick={() => navigate('/customer/track')}
                >
                  <i className="bi bi-truck"></i> Go to Track Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
