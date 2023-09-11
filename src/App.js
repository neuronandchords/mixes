import React, { StrictMode } from "react";
import {Route, Routes} from "react-router-dom";
import RoutesMap from "./Routes";

function App() {
  return (
    <StrictMode>
      <div className="App">
        <RoutesMap/>
      </div>
    </StrictMode>
  )
}

export default App;