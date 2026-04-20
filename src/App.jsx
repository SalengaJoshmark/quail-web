import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import EggCount from "./pages/EggCount";
import Analytics from "./pages/Analytics";
import FeedInventory from "./pages/FeedInventory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Home />} />
        <Route path="egg-count" element={<EggCount />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="feed-inventory" element={<FeedInventory />} />
      </Route>
    </Routes>
  );
}

export default App;