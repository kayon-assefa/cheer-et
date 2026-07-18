import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
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

  const handleUpgrade = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      console.log("🔄 Starting premium upgrade for:", user.uid);

      const response = await fetch('https://cheerapi.onrender.com/api/premium/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          amount: 500,
          first_name: userData?.username || user.displayName || 'User'
        })
      });

      const data = await response.json();
      console.log("📥 Backend Response:", data);

      // Chapa response structure handling
      if (data.status === "success" && data.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
      } 
      else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } 
      else {
        console.error("No checkout URL found in response:", data);
        alert("Failed to get payment link. Please try again.");
      }

    } catch (error) {
      console.error("❌ Upgrade Error:", error);
      alert("Payment initialization failed. Check console for details (F12)");
    }
  };

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
              onUpgrade={handleUpgrade}
              highlighted={true}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold text-green-400">🎉 You are Premium!</h2>
            <p className="mt-4">
              Expires: {userData?.premiumExpiresAt 
                ? new Date(userData.premiumExpiresAt.seconds * 1000).toLocaleDateString() 
                : "Soon"}
            </p>
          </div>
        )}

        <PremiumFeatures />
      </div>
    </div>
  );
};

export default Premium;