const PricingCard = ({ plan, price, features, buttonText, onUpgrade, highlighted = false, disabled = false }) => (
  <div className={`p-8 rounded-3xl ${highlighted ? 'border-2 border-yellow-400 scale-105' : 'border border-gray-700'} bg-gray-900`}>
    <h2 className="text-3xl font-bold">{plan}</h2>
    <div className="mt-6">
      <span className="text-5xl font-bold">ETB {price}</span>
      <span className="text-gray-400">/month</span>
    </div>

    <ul className="mt-8 space-y-4">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-3">
          ✅ {feature}
        </li>
      ))}
    </ul>

    <button
      onClick={onUpgrade}
      disabled={disabled}
      className={`w-full mt-10 py-4 rounded-2xl font-semibold text-lg transition ${highlighted 
        ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
        : 'bg-gray-700 cursor-not-allowed'}`}
    >
      {buttonText}
    </button>
  </div>
);

export default PricingCard;