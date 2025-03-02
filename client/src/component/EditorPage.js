import React, { useState, useEffect, useRef } from "react";
import Client from "./Client";
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-java";
import $ from "jquery";
import "./style.css";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { initSocket } from "../socket";

function EditorPage({ onCodeChange }) {
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [output, setOutput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("c");
  const editorRef = useRef(null);
  const socketRef = useRef(null);

  const username = location.state?.username;
  const email = location.state?.email;

  useEffect(() => {
    if (!username) {
      toast.error("Username is required");
      navigate('/');
      return;
    }
    if (socketRef.current) return;

    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.emit("join", { roomId, username });

      socketRef.current.on("joined", ({ clients, username: joinedUser }) => {
        setClients(clients);
        if (joinedUser !== username) toast.success(`${joinedUser} joined`);
      });

      socketRef.current.on("left", ({ socketId, username }) => {
        toast.success(`${username} left`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        ['joined', 'left'].forEach(event => socketRef.current.off(event));
      }
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [roomId, username, navigate]);

  useEffect(() => {
    const editor = ace.edit("editor");
    editor.session.setMode("ace/mode/c_cpp");
    editor.setOptions({
      fontSize: "14px",
      fontFamily: "Courier New, monospace",
      cursorStyle: "slim",
      showPrintMargin: false,
      wrap: true,
    });
    editorRef.current = editor;
    return () => {
      editor.destroy();
    };
  }, []);

  const executeCode = () => {
    const code = editorRef.current.getSession().getValue();
    if (!code.trim()) {
      toast.error("Code cannot be empty.");
      return;
    }
    $.ajax({
      url: "http://localhost/my_editor/compiler.php",
      method: "POST",
      data: { language, code, input: userInput },
      success: function (response) {
        setOutput(response);
      },
      error: function () {
        toast.error("Execution Error.");
      }
    });
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-md-2 d-flex flex-column h-100">
          <img src="/images/logo.png" alt="v_editor_logo" className="img-fluid mx-auto" />
          <hr />
          <div className="d-flex flex-column overflow-auto">
            {clients.length > 0 ? clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            )) : <div>No clients connected</div>}
          </div>
          <div className="mt-auto">
            <hr />
            <button onClick={() => navigator.clipboard.writeText(roomId)} className="btn btn-success mb-2">Copy Room Id</button>
            <button onClick={() => navigate('/home')} className="btn btn-danger mb-2">Leave</button>
          </div>
        </div>
        <div className="col-md-10 d-flex flex-column h-100">
          <div className="header">V EDITOR</div>
          <div className="control-panel">
            <label htmlFor="language-select">Select Language:</label>
            <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="php">PHP</option>
              <option value="python">Python</option>
              <option value="node">Node JS</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="editor" id="editor"></div>
          <div className="d-flex justify-content-end p-2">
            <button className="btn btn-primary" onClick={executeCode}>Run</button>
          </div>
          <div className="input-output-section">
            <textarea className="form-control" placeholder="Enter input here..." value={userInput} onChange={(e) => setUserInput(e.target.value)}></textarea>
            <pre className="output">{output}</pre>
          </div>
          <div className="user-info">
            <p>Logged in as: {username} ({email})</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
