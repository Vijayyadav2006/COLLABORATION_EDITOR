import logo from './logo.svg';
import './App.css';
import './App.css';
import Home from './component/Home';
import { Routes, Route } from "react-router-dom";
import EditorPage from "./component/EditorPage";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/editor/:roomId" element={<EditorPage onCodeChange={handleCodeChange} />} />
    </Routes>
  </div>
);
}

export default App;
