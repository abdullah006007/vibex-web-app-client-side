import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import useAuth from '../../Hooks/useAuth';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FaCrown, FaCheckCircle, FaLock, FaCreditCard } from 'react-icons/fa';
import './Membership.css';

// Initialize Stripe with the publishable key from environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK_KEY);

const CheckoutForm = ({ price, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const axiosSecure = useAxiosSecure();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    // Validate Stripe and elements
    if (!stripe || !elements) {
      setError('Stripe has not loaded correctly. Please refresh the page.');
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card input not found. Please try again.');
      setProcessing(false);
      return;
    }

    try {
      // Log to debug environment variable
      console.log('Stripe Publishable Key:', import.meta.env.VITE_STRIPE_PK_KEY);

      // Create a payment intent on the backend
      const { data } = await axiosSecure.post('/create-payment-intent', { price });
      console.log('Payment Intent Response:', data); // Debug backend response
      const clientSecret = data.clientSecret;

      if (!clientSecret) {
        throw new Error('No client secret received from backend.');
      }

      // Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: data.email,
          },
        },
      });

      if (result.error) {
        console.error('Stripe Error:', result.error);
        setError(result.error.message);
        setProcessing(false);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        // Payment successful, notify backend to upgrade subscription
        const upgradeResponse = await axiosSecure.post('/user/membership/upgrade', {
          paymentIntentId: result.paymentIntent.id,
          subscription: 'premium', // Updated to set subscription to premium
        });
        console.log('Upgrade Response:', upgradeResponse.data); // Debug upgrade response
        onSuccess();
        alert('Payment successful! You are now a Premium member with a Gold badge.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to process payment. Please check your card details or try again later.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2 flex items-center">
          <FaCreditCard className="mr-2 text-blue-500" /> Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {processing ? (
          <span className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center">
            <FaLock className="mr-2" /> Pay ${price} Securely
          </span>
        )}
      </button>
      {error && (
        <p className="error-message mt-4 text-red-600 flex items-center">
          <FaCheckCircle className="mr-2" /> {error}
        </p>
      )}
    </form>
  );
};

const Membership = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  // Fetch user subscription status
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const response = await axiosSecure.get(`/users/subscription/${user.email}`);
      return response.data;
    },
    enabled: !!user && !authLoading,
  });

  // Fetch user post count
  const { data: postCount, isLoading: postCountLoading } = useQuery({
    queryKey: ['postCount', user?.uid],
    queryFn: async () => {
      if (!user) return 0;
      const response = await axiosSecure.get(`/user/post/count/${user.uid}`);
      return response.data.count;
    },
    enabled: !!user && !authLoading,
  });

  if (authLoading || userLoading || postCountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
        <div className="animate-pulse text-blue-600 text-2xl font-bold flex items-center">
          <svg className="animate-spin h-6 w-6 mr-3 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading Your Membership...
        </div>
      </div>
    );
  }

  const price = 10; // Example: $10 for membership (adjust to BDT if needed)

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries(['userSubscription', user.email]);
    navigate('/dashboard/home', { state: { fromMembership: true } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full transform hover:scale-105 transition-transform duration-500">
        <div className="text-center mb-8">
          <FaCrown className="text-yellow-400 text-5xl mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-extrabold text-gray-800">Unlock Premium Membership</h1>
          <p className="text-gray-500 mt-2">Elevate your experience with a Gold badge and premium features!</p>
        </div>
        {userData?.subscription === 'premium' ? (
          <div className="text-center bg-green-100 p-6 rounded-lg shadow-inner">
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
            <p className="text-green-600 text-2xl font-bold mb-4">
              You're a Premium Member with a Gold Badge! ✨
            </p>
            <p className="text-gray-600">
              Enjoy unlimited posts, your exclusive Gold badge, and more. Thank you for your support!
            </p>
            <button
              onClick={() => navigate('/dashboard/home')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 p-4 rounded-lg mb-6 shadow-inner">
              <p className="text-gray-700 font-semibold flex items-center justify-center">
                <FaCheckCircle className="mr-2 text-blue-500" /> Current Posts: {postCount || 0}/5
                <span className="text-gray-500 ml-2">(Upgrade to Premium for unlimited!)</span>
              </p>
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaCrown className="mr-2 text-yellow-400" /> Exclusive Premium Benefits
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <FaCheckCircle className="mr-3 text-green-500" /> Shiny Gold Badge on Your Profile
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="mr-3 text-green-500" /> Unlimited Posts (No 5-Post Limit)
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="mr-3 text-green-500" /> Priority Support & Community Perks
                </li>
              </ul>
            </div>
            <Elements stripe={stripePromise}>
              <CheckoutForm price={price} onSuccess={handlePaymentSuccess} />
            </Elements>
          </>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 font-semibold rounded-lg hover:from-gray-400 hover:to-gray-500 transition-all duration-300"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

// Wrap Membership with Elements to provide Stripe context
const MembershipWithStripe = () => (
  <Elements stripe={stripePromise}>
    <Membership />
  </Elements>
);

export default MembershipWithStripe;