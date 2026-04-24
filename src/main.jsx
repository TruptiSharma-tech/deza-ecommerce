import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ShopProvider>
        <Router>
          <App />
        </Router>
      </ShopProvider>
    </AuthProvider>
  </React.StrictMode>,
);
