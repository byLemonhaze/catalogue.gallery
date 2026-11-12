import { DispatchSignal } from './DispatchSignal';
import { Link } from 'react-router-dom';
import { useDispatches } from '../hooks/useDispatches';
export function DispatchSection() {
    const post = useDispatches()[0];
    return <section className="dispatch" aria-label="Daily news">
        {post && <article><DispatchSignal key={post.id} post={post}/></article>}
        <Link className="dispatch-all-editions" to="/dispatch/">All editions</Link>
    </section>;
}
