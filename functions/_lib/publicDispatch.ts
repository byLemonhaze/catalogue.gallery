import { dispatchQuery, mergeDispatches, type DispatchPost } from '../../src/lib/dispatch';
import { queryPublic, type PublicEnv } from './publicContent';
export async function publicDispatches(env: PublicEnv = {}) {
    const live = await queryPublic<DispatchPost[]>(dispatchQuery, env);
    return mergeDispatches(Array.isArray(live) ? live : []);
}
