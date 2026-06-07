import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Schedular from "./pages/Schedular";
import AIComposer from "./pages/AIComposer";
import Accounts from "./pages/Accounts";

export default function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route element={<Layout/>}>
                    <Route path="/dashboard" element={<Dashboard/>}/>
                    <Route path="/accounts" element={<Accounts/>}/>
                    <Route path="/schedule" element={<Schedular/>}/>
                    <Route path="/ai-composer" element={<AIComposer/>}/>
                </Route>
            </Routes>
        </>
    );
}
