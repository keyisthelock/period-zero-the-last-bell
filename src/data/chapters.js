// Data-driven chapter registry. Each chapter module exports:
// { id, num, title, objective, spawn, atmosphere, grants, build(ctx, game) -> runtime }
// runtime: { intro?, objective?, update?(dt), debugSolve? }
import ch1 from './ch1_detention.js';
import ch2 from './ch2_corridor.js';
import ch3 from './ch3_library.js';
import ch4 from './ch4_science.js';
import ch5 from './ch5_archive.js';

export const CHAPTERS = [ch1, ch2, ch3, ch4, ch5];
