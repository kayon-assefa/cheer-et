import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import PremiumHeader from '../components/premium/PremiumHeader';
import PricingCard from '../components/premium/PricingCard';
import PremiumFeatures from '../components/premium/PremiumFeatures';

const Premium = () => {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const isPremium = userData?.premium === true;

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <PremiumHeader isPremium={isPremium} />

        {!isPremium ? (
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Free Plan */}
            <PricingCard 
              plan="FREE"
              price={0}
              features={["Basic Profile", "Standard Dashboard", "Limited Features"]}
              buttonText="Current Plan"
              disabled={true}
            />

            {/* Premium Plan */}
            <PricingCard 
              plan="PREMIUM"
              price={500}
              features={[
                "Verified Badge",
                "Advanced Analytics",
                "Custom Themes",
                "Remove Ads/Limits",
                "Priority Support",
                "Premium Creator Tools"
              ]}
              buttonText="Upgrade Now - 30 Days"
              onUpgrade={() => handleUpgrade(user, userData)}
              highlighted={true}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold text-green-400">🎉 You are Premium!</h2>
            <p className="mt-4">Expires: {new Date(userData.premiumExpiresAt?.seconds * 1000).toLocaleDateString()}</p>
          </div>
        )}

        <PremiumFeatures />
      </div>
    </div>
  );
};

const handleUpgrade = async (user, userData) => {
  if (!user) return alert("Please login first");

  try {
  const response = await fetch('https://cheerapi.onrender.com/api/premium/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        email: user.email,
        amount: 500,
        first_name: userData?.username || 'User'
      })
    });

    const data = await response.json();
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    }
  } catch (error) {
    console.error(error);
    alert("Payment initialization failed");
  }
};

export default Premium;