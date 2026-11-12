import { dispatchMedia, type DispatchPost } from '../lib/dispatch';
export function DispatchThumbnail({post}: {post: DispatchPost}) {
    const images = dispatchMedia(post).slice(0,4);
    return <div className={`dispatch-cover ${images.length > 1 ? 'dispatch-cover--mosaic' : ''}`}>
        {images.map(image => <img key={image.url} src={image.url} alt="" loading="lazy" width="450" height="450" />)}
    </div>;
}
