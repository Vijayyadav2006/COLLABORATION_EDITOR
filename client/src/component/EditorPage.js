import React, { useState, useEffect, useRef } from "react";
import Client from "./Client";
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-monokai";
import $ from "jquery";
import "./style.css";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { initSocket } from "../socket";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

function EditorPage({ onCodeChange }) {
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("c");
  const editorRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!location.state?.username) {
      toast.error("Username is required");
      navigate("/");
      return;
    }

    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (error) => {
        toast.error(`Socket Connection failed: ${error.message}`);
        navigate("/");
      });

      socketRef.current.emit("join", { roomId, username: location.state.username });

      socketRef.current.on("joined", ({ clients }) => {
        setClients(clients);
      });

      socketRef.current.on("left", ({ socketId }) => {
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });

      socketRef.current.on("code-change", (data) => {
        if (socketRef.current.id !== data.senderSocketId) {
          editorRef.current.getSession().setValue(data.code);
        }
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, navigate, location.state?.username]);

  useEffect(() => {
    const editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/c_cpp");
    editor.setOptions({
      fontSize: "14px",
      fontFamily: "Courier New, monospace",
      cursorStyle: "slim",
      showPrintMargin: false,
      wrap: true,
      animatedScroll: true,
    });

    editorRef.current = editor;

    editor.on("change", debounce(() => {
      const code = editor.getSession().getValue();
      onCodeChange(code);
      socketRef.current.emit("code-change", { roomId, code, senderSocketId: socketRef.current.id });
    }, 100));

    return () => {
      editor.destroy();
    };
  }, [onCodeChange, roomId]);

  useEffect(() => {
    if (editorRef.current) {
      const modeMap = {
        c: "c_cpp",
        cpp: "c_cpp",
        php: "php",
        python: "python",
        node: "javascript",
        java: "java",
      };
      editorRef.current.session.setMode(`ace/mode/${modeMap[language]}`);
    }
  }, [language]);

  const executeCode = () => {
    const code = editorRef.current.getSession().getValue();
    if (!code.trim()) {
      toast.error("Code cannot be empty.");
      return;
    }

    $.ajax({
      url: "http://localhost/my_editor/compiler.php",
      method: "POST",
      data: { language, code },
      success: (response) => toast.success("Code executed successfully!"),
      error: (xhr) => toast.error("Execution Error: " + (xhr.responseJSON?.message || "An error occurred.")),
    });
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-md-2 d-flex flex-column h-100">
          <div className="d-flex justify-content-between align-items-center">
            <img src="/images/logo.png" alt="v_editor_logo" className="img-fluid mx-auto" />
          </div>
          <hr />
          <div className="d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <div className="mt-auto">
            <hr />
            <button onClick={() => navigator.clipboard.writeText(roomId)} className="btn btn-success mb-2">Copy Room Id</button>
            <button onClick={() => navigate("/home")} className="btn btn-danger mb-2">Leave</button>
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
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
