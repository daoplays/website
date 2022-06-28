import React from "react";
import ReactDOM from "react-dom/client";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
// Bootstrap Bundle JS
import "bootstrap/dist/js/bootstrap.bundle.min";

import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
  Navigation,
  Footer,
  Home,
  Blog,
  Posts,
  SolanaIntro
} from "./components";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <Navigation />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<Blog />}>
        <Route path="" element={<Posts />} />
        <Route path="solana_getting_started" element={<SolanaIntro />} />
      </Route>
    </Routes>
    <Footer />
  </Router>
);



serviceWorker.unregister();
