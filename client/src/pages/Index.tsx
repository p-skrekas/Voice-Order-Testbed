import { Link } from "react-router-dom";

export default function Index() {
    return (
        <div>
            <h1>Home</h1>
            <Link to="/test-catalog">Test Catalog</Link>
        </div>
    )
}