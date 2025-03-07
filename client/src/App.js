import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./component/Home";
import Editor from "./component/Editor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/editor/:roomId" element={<Editor />} />
    </Routes>
  );
}

export default App;
