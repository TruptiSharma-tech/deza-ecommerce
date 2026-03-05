import os

base_dir = r"c:\Users\TRUPTI D SHARMA\deza-ecommerce"
files_to_check = [
    "frontend/public/index.html",
    "frontend/public/vite.svg",
    "frontend/src/assets/about-bg.jpg",
    "frontend/src/assets/deza-logo.png",
    "frontend/src/assets/deza-perfume.png",
    "frontend/src/components/Navbar.jsx",
    "frontend/src/components/Navbar.css",
    "frontend/src/components/Footer.jsx",
    "frontend/src/components/Footer.css",
    "frontend/src/components/AccountSidebar.jsx",
    "frontend/src/components/AccountSidebar.css",
    "frontend/src/components/ProtectedRoute.jsx",
    "frontend/src/components/UserProtectedRoute.jsx",
    "frontend/src/components/AdminProtectedRoute.jsx",
    "frontend/src/components/AdminChangePassword.jsx",
    "frontend/src/components/AdminChangePassword.css",
    "frontend/src/context/AuthContext.jsx",
    "frontend/src/pages/Home.jsx",
    "frontend/src/pages/Home.css",
    "frontend/src/pages/Shop.jsx",
    "frontend/src/pages/Shop.css",
    "frontend/src/pages/ProductDetails.jsx",
    "frontend/src/pages/ProductDetails.css",
    "frontend/src/pages/Cart.jsx",
    "frontend/src/pages/Cart.css",
    "frontend/src/pages/Checkout.jsx",
    "frontend/src/pages/Checkout.css",
    "frontend/src/pages/PaymentGateway.jsx",
    "frontend/src/pages/PaymentGateway.css",
    "frontend/src/pages/PaymentSuccess.jsx",
    "frontend/src/pages/PaymentSuccess.css",
    "frontend/src/pages/Orders.jsx",
    "frontend/src/pages/Orders.css",
    "frontend/src/pages/OrderSuccess.jsx",
    "frontend/src/pages/OrderSuccess.css",
    "frontend/src/pages/TrackOrder.jsx",
    "frontend/src/pages/TrackOrder.css",
    "frontend/src/pages/Wishlist.jsx",
    "frontend/src/pages/Wishlist.css",
    "frontend/src/pages/Login.jsx",
    "frontend/src/pages/Register.jsx",
    "frontend/src/pages/ForgotPassword.jsx",
    "frontend/src/pages/ResetPassword.jsx",
    "frontend/src/pages/Contact.jsx",
    "frontend/src/pages/Contact.css",
    "frontend/src/pages/About.jsx",
    "frontend/src/pages/About.css",
    "frontend/src/pages/Policies.jsx",
    "frontend/src/pages/Policies.css",
    "frontend/src/pages/Terms.jsx",
    "frontend/src/pages/PrivacyPolicy.jsx",
    "frontend/src/pages/ReturnRefund.jsx",
    "frontend/src/services/authService.js",
    "frontend/src/services/productService.js",
    "frontend/src/services/orderService.js",
    "frontend/src/services/cartService.js",
    "frontend/src/services/paymentService.js",
    "frontend/src/utils/auth.js",
    "frontend/src/utils/CreateAdmin.js",
    "frontend/src/utils/productDB.js",
    "frontend/src/utils/productStorage.js",
    "frontend/src/App.jsx",
    "frontend/src/main.jsx",
    "frontend/src/index.css",
    "frontend/package.json",
    "frontend/vite.config.js",
    "frontend/tailwind.config.js",
    "frontend/postcss.config.js",
    "backend/config/db.js",
    "backend/controllers/authController.js",
    "backend/controllers/productController.js",
    "backend/controllers/orderController.js",
    "backend/controllers/cartController.js",
    "backend/controllers/paymentController.js",
    "backend/controllers/adminController.js",
    "backend/models/User.js",
    "backend/models/Product.js",
    "backend/models/Order.js",
    "backend/models/Cart.js",
    "backend/models/Payment.js",
    "backend/routes/authRoutes.js",
    "backend/routes/productRoutes.js",
    "backend/routes/orderRoutes.js",
    "backend/routes/cartRoutes.js",
    "backend/routes/paymentRoutes.js",
    "backend/routes/adminRoutes.js",
    "backend/middleware/authMiddleware.js",
    "backend/middleware/adminMiddleware.js",
    "backend/middleware/errorMiddleware.js",
    "backend/utils/generateToken.js",
    "backend/utils/sendEmail.js",
    "backend/.env",
    "backend/server.js",
    "backend/package.json"
]

directories_to_check = [
    "backend/uploads/products"
]

missing_files = []
created_files = []

for rel_path in directories_to_check:
    full_path = os.path.join(base_dir, rel_path)
    if not os.path.exists(full_path):
        os.makedirs(full_path)
        print(f"Created directory: {rel_path}")

for rel_path in files_to_check:
    full_path = os.path.join(base_dir, rel_path)
    
    # Check if a different case variation exists, since Windows is case-insensitive
    # Use os.path.exists (which is case insensitive on Windows)
    if not os.path.exists(full_path):
        missing_files.append(rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        # Create empty file
        with open(full_path, 'w', encoding='utf-8') as f:
            # Let's write a comment or basic import so the file is not entirely totally blank
            if full_path.endswith('.jsx'):
                f.write('import React from "react";\n')
            elif full_path.endswith('.js'):
                f.write('// TODO\n')
            elif full_path.endswith('.json'):
                f.write('{}\n')
            else:
                pass
        created_files.append(rel_path)

if created_files:
    print(f"Created {len(created_files)} missing files:")
    for f in created_files:
        print(f" - {f}")
else:
    print("All required files are already present.")
