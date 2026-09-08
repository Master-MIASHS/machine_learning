/**
 * Math module barrel export.
 * Import individual modules for tree-shaking; this barrel is for convenience.
 */

// ── Utilities ──
export * from './util.js';

// ── Statistical distributions & information theory ──
export * from './gaussian.js';
export * from './discrete.js';
export * from './entropy.js';
export * from './kl.js';
export * from './bayes.js';
export * from './free-energy.js';

// ── Part I — Optimization fundamentals ──
export * from './test-functions.js';
export * from './optimality.js';
export * from './gradient-descent.js';
export * from './stochastic.js';
export * from './coordinate-descent.js';
export * from './newton.js';
export * from './adam.js';

// ── Part II — Classification (CM1) ──
export * from './metrics.js';
export * from './svm.js';

// ── Part III — Clustering ──
export * from './clustering.js';

// ── Part IV — Régression linéaire ──
export * from './linear-model.js';

// ── Part V — Ensembles & Regularization ──
export * from './synthetic-data.js';
export * from './regression.js';
export * from './loss-functions.js';
export * from './regularization.js';
export * from './ensemble.js';
export * from './diversity.js';
export * from './random-forest.js';
export * from './tree-utils.js';
export * from './boosting.js';
export * from './margin-analysis.js';

// ── Part VI — Set-valued Prediction ──
export * from './prediction-sets.js';
export * from './conformal.js';
export * from './regression-conformal.js';
export * from './bootstrap.js';

// --- Part VII – Optimum de Bayes
export * from './bayes-learning.js';

// --- Part VIII – Consistance
export * from './consistency.js';
export * from './knn.js';
export * from './cross-validation.js';
export * from './dimension.js';

// --- Part IX – Généralisation
export * from './concentration.js';
export * from './generalization.js';
export * from './vc.js';

// --- Part X – Fonctions de perte
export * from './calibration.js';

// ── Part IX — Généralisation (duplicated barrel exports, pre-existing) ──
export * from './concentration';
export * from './generalization';
export * from './vc';
