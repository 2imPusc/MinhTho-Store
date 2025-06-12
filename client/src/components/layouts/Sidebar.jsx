const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-200 p-4">
      <h2 className="font-bold mb-2">Sidebar</h2>
      <ul>
        <li><a href="#home" className="block py-1">Home</a></li>
        <li><a href="#about" className="block py-1">About</a></li>
        <li><a href="#services" className="block py-1">Services</a></li>
        <li><a href="#contact" className="block py-1">Contact</a></li>
      </ul>
    </div>
  );
}
export default Sidebar;