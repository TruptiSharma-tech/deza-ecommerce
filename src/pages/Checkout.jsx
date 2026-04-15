import { getCart, getUserEmail } from "../utils/userStorage";

export default function Checkout() {
  const navigate = useNavigate();

  // Get cart safely (user-scoped)
  const cart = getCart(getUserEmail());

  // Get previous checkout info
  const prevInfo = JSON.parse(localStorage.getItem("checkoutInfo")) || {};

  const [name, setName] = useState(prevInfo.name || "");
  const [phone, setPhone] = useState(
    prevInfo.phone ? prevInfo.phone.replace("+91", "") : "",
  );

  // ✅ Professional Address Object
  const [address, setAddress] = useState(
    prevInfo.address || {
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  );

  // Calculate total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  // Validation
  const validateForm = () => {
    if (!name || name.trim().length === 0 || !/^[a-zA-Z\s]+$/.test(name)) {
      toast.error("Enter a valid full name!");
      return false;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number!");
      return false;
    }

    if (
      !address.street || !address.street.trim() ||
      !address.city || !address.city.trim() ||
      !address.state || !address.state.trim() ||
      !address.pincode || !address.pincode.trim()
    ) {
      toast.error("Please fill complete shipping address!");
      return false;
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error("Enter valid 6-digit pincode!");
      return false;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return false;
    }

    return true;
  };

  const handleProceedPayment = () => {
    if (!validateForm()) return;

    const checkoutData = {
      name,
      phone: "+91" + phone,
      address,
      cart,
      total: totalAmount,
    };

    localStorage.setItem("checkoutInfo", JSON.stringify(checkoutData));
    navigate("/payment");
  };

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-wrap">
        {/* LEFT SIDE */}
        <div className="checkout-form">
          <h2>Customer Details</h2>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
            }
          />

          <div className="phone-input-wrapper">
            <span className="country-code">+91</span>
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <h2>Shipping Address</h2>

          <input
            type="text"
            placeholder="House No / Building"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />

          <input
            type="text"
            placeholder="Area / Locality"
            value={address.area}
            onChange={(e) => setAddress({ ...address, area: e.target.value })}
          />

          <div className="row">
            <input
              type="text"
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />

            <input
              type="text"
              placeholder="State"
              value={address.state}
              onChange={(e) =>
                setAddress({ ...address, state: e.target.value })
              }
            />
          </div>

          <div className="row">
            <input
              type="text"
              placeholder="Pincode"
              maxLength={6}
              value={address.pincode}
              onChange={(e) =>
                setAddress({
                  ...address,
                  pincode: e.target.value.replace(/\D/g, ""),
                })
              }
            />

            <input
              type="text"
              placeholder="Country"
              value={address.country}
              onChange={(e) =>
                setAddress({ ...address, country: e.target.value })
              }
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {cart.length === 0 ? (
            <p className="empty-msg">Your cart is empty 💛</p>
          ) : (
            <div className="checkout-items">
              {cart.map((item) => (
                <div
                  className="checkout-item"
                  key={`${item._id}-${item.selectedSize}`}
                >
                  <img src={item.image} alt={item.name} />

                  <div>
                    <p className="item-name">{item.name}</p>
                    <p>Size: {item.selectedSize}</p>
                    <p>Qty: {item.qty}</p>
                    <p className="item-price">₹{item.price * item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="checkout-total">Total: ₹{totalAmount}</h3>

          <button className="checkout-btn" onClick={handleProceedPayment}>
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}
