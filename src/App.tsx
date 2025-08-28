import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from "@/routes/AppRoutes";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="top-center" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
