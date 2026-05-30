import type { BlogPost } from './types';
import factoryTour from './factory-tour-one-day-myanmar';
import ipack from './ipack-third-party-inspection-myanmar';
import danshin from './danshin-needle-control-myanmar';

export const BLOG_POSTS: BlogPost[] = [factoryTour, danshin, ipack];

export type { BlogPost } from './types';
