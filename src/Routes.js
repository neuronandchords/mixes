import React from "react";
import {Route, Routes} from "react-router-dom";
import Home from "./components/Home";
import Auth from "./components/Auth";

const RoutesMap = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/auth" element={<Auth/>}/>
      </Routes>
    </div>
  )
}

export default RoutesMap;

