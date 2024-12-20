import AdminPage from "../components/AdminPage";
import AdminPasswordEntryPage from "../components/AdminPasswordEntryPage";
import HomePage from "../components/HomePage";
import TableNumberRedirectPage from "../components/TableNumberRedirectPage";
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
    {
        path: "/pw",
        element: <AdminPasswordEntryPage />,
    },
    {
        path: "/:tableNumber",
        element: <TableNumberRedirectPage />,
    },
];

export default ROUTES;
