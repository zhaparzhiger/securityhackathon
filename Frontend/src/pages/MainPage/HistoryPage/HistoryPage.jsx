import React from "react";
import "./ui/HistoryPage.css";
import burger_menu from "../../../../images/burger-menu.svg";

function HistoryPage({ visible, setVisible, history, clearHistory }) {
  return (
    <div className={`sidebar ${visible ? "visible" : "hidden"}`}>
      <div className="sidebarContent">
        <button className="toggleBtn" onClick={() => setVisible(!visible)}>
          <img className="burger__menu" src={burger_menu} alt="" />
        </button>
        <h2 className="title">Request History</h2>
        {history.length > 0 ? (
          <ul className="historyList">
            {history.map((item, index) => (
              <li key={index}>
                <strong>{item.type}</strong>: {item.url} - Status: {item.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="noHistory">No history available</p>
        )}
        {history.length > 0 && (
          <button className="clearHistoryBtn" onClick={clearHistory}>
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
