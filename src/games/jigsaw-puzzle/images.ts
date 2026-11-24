import type { Picture } from './catalog'

export const pictureURL = (picture: Picture) => import.meta.env.BASE_URL + picture.path
