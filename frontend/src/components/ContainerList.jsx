import React from "react";
import axios from "axios";

const badgeStyle = (state) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "12px",
  color: "white",
  background: state === "running" ? "green" : "red",
});

const ContainerList = ({ containers }) => {
  const handleAction = async (id, action) => {
    try {
      await axios.post(`/api/containers/${id}/${action}`);
    } catch (err) {
      console.error(`Error on ${action}:`, err);
    }
  };

  return (
    <div>
      {containers.map((c) => (
        <div
          key={c.Id}
          style={{
            margin: "10px 0",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <h3>{c.Names?.[0] || c.Id.slice(0, 12)}</h3>
          <p>
            Status: <span style={badgeStyle(c.State)}>{c.State}</span>
          </p>
          <button onClick={() => handleAction(c.Id, "start")}>Start</button>
          <button onClick={() => handleAction(c.Id, "stop")}>Stop</button>
          <button onClick={() => handleAction(c.Id, "restart")}>Restart</button>
        </div>
      ))}
    </div>
  );
};

export default ContainerList;

