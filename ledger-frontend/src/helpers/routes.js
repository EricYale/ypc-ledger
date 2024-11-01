import AdminPage from "../components/AdminPage";
import HomePage from "../components/HomePage";
import TablePage from "../components/TablePage";

const ROUTES = [
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "/table/:id",
        element: <TablePage />,
    },
    {
        path: "/table/:id/admin",
        element: <AdminPage />,
    },
];

export default ROUTES;
