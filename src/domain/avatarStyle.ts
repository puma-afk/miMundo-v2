export type AvatarStyle = { skin: 'light' | 'warm' | 'deep'; robe: 'teal' | 'lavender' | 'rose'; hair: 'auto' | 'short' | 'long' | 'braid' };
export const defaultAvatarStyle: AvatarStyle = {skin:'warm',robe:'teal',hair:'auto'};
export function validAvatarStyle(value: unknown): value is AvatarStyle {
 if(!value || typeof value!=='object')return false;
 const v=value as AvatarStyle;
 return ['light','warm','deep'].includes(v.skin)&&['teal','lavender','rose'].includes(v.robe)&&['auto','short','long','braid'].includes(v.hair);
}
