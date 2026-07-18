const PremiumHeader = ({ isPremium }) => (
  <div className="text-center mb-12">
    <h1 className="text-5xl font-bold mb-4">Unlock Cheer ET Premium</h1>
    <p className="text-xl text-gray-400">Get verified, advanced tools, and more for only 500 ETB/month</p>
    {isPremium && <p className="text-green-400 mt-4 text-2xl">⭐ You are already Premium</p>}
  </div>
);

export default PremiumHeader;