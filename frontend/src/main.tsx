import { createRoot } from "react-dom/client";
import "./index.css";
import "./reset.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Result from "./Result.tsx";
import Landing from "./Landing.tsx";
import Layout from "./Layout.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/:slug" element={<Result />} />
      </Route>
    </Routes>
    {/* <App /> */}
  </BrowserRouter>
  // </StrictMode>
);
