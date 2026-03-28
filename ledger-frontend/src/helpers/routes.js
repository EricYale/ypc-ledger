import AdminPage from "../components/AdminPage";
import AdminPasswordEntryPage from "../components/AdminPasswordEntryPage";
import HomePage from "../components/HomePage";
import TableNumberRedirectPage from "../components/TableNumberRedirectPage";
import TablePage from "../components/TablePage";
import LeaderboardPage from "../components/LeaderboardPage";
import EmailsPage from "../components/EmailsPage";

const ROUTES = [
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "/sharks",
        element: <LeaderboardPage />,
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
    {
        path: "/admin/emails",
        element: <EmailsPage />,
    },
];

export default ROUTES;
