import { DispatchSignal } from './DispatchSignal';
import { Link } from 'react-router-dom';
import { useDispatches } from '../hooks/useDispatches';
export function DispatchSection() {
    const post = useDispatches()[0];
    return <section className="dispatch" aria-labelledby="dispatch-title">
        <div className="rail-heading"><h2 id="dispatch-title">DISPATCH</h2><Link to="/dispatch/">All editions</Link></div>
        {post && <article><DispatchSignal key={post.id} post={post}/></article>}
    </section>;
}
