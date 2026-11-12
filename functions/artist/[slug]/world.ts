import { profilePage } from '../../_lib/profilePage';
import { cachedPublicResponse, type PageEnv } from '../../_lib/seoResponse';
export function onRequestGet({request,env,params}:{request:Request;env:PageEnv;params:{slug:string}}) {
  return cachedPublicResponse(request,()=>profilePage(request,env,params.slug,'artist',true),env);
}
