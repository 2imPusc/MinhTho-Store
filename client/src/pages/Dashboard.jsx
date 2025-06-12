import Footer from "../components/layouts/Footer";
import Sidebar from "../components/layouts/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 bg-gray-100">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p>Welcome to your dashboard!</p>
          {/* Add more dashboard content here */}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Dashboard;