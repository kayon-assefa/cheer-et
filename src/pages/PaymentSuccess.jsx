import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const txRef = searchParams.get('tx_ref');
    if (!txRef) {
      navigate('/premium');
    }

    const fetchUser = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());
      }
    };

    fetchUser();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center max-w-md mx-auto p-10 bg-gray-900 rounded-3xl">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold mb-4 text-green-400">Payment Successful!</h1>
        <p className="text-xl mb-8">You are now a Premium user for 30 days.</p>

        {userData && (
          <div className="bg-gray-800 p-6 rounded-2xl mb-8">
            <p><strong>Premium Expires:</strong> {new Date(userData.premiumExpiresAt?.seconds * 1000).toLocaleDateString()}</p>
          </div>
        )}

        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-yellow-400 text-black px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-yellow-300"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;