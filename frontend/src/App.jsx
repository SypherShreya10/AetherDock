import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then(res => res.json())
      .then(data => setMessage(data.message));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>AetherDock 🚀</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> 0e28e0c2ae16fe6d8d2bb013edaef4c34af091ab
