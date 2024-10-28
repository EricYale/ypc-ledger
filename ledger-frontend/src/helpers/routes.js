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
    }
];

export default ROUTES;
