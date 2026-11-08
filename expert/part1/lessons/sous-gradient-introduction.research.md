# Recherche — Introduction au sous-gradient

Vérifications faites le 2026-11-08 sur les sources primaires accessibles.

## VERIFIED

1. **Boyd, Duchi, Pilanci, Vandenberghe, « Subgradients », notes EE364b
   (13 avril 2022)** — https://web.stanford.edu/class/ee364b/lectures/subgradients_notes.pdf
   - §1 : exemple ∂|·|(0) = [−1, 1].
   - §2 : ∂f(x) toujours fermé et convexe ; §2.1 : f convexe, x ∈ int dom f ⇒
     ∂f(x) non vide et borné.
   - §2.2 : f différentiable en x ⇔ ∂f(x) = {∇f(x)}.
   - §2.3 : 0 ∈ ∂f(x*) ⇔ x* minimiseur.
   - §3.1 : homogénéité positive ; §3.2 : règle de la somme (f_i convexes).
   - §3.3 « Affine transformations of domain » : h(x) = f(Ax + b) ⇒
     ∂h(x) = Aᵀ∂f(Ax + b) (égalité, f convexe). Les notes ne donnent ni règle de
     chaîne générale ni règle de produit (vérifié le 2026-11-08 sur le PDF) ;
     le contre-exemple x · x² = x³ (non convexe) de la leçon est élémentaire.
   - Pas d'énoncé explicite ∂f(x) = [f′₋(x), f′₊(x)] en 1D (§2.4 traite les
     dérivées directionnelles, éq. (2)).
2. **Boyd (avec J. Park), « Subgradient Methods », notes EE364b (mai 2014)** —
   https://web.stanford.edu/class/ee364b/lectures/subgrad_method_notes.pdf
   - §1, §2.1 : « not a descent method », d'où f_best.
   - §3.1 : hypothèses ‖g‖₂ ≤ G, R ≥ ‖x⁽¹⁾ − x*‖₂.
   - §3.2, éq. (3) : f_best^(k) − f* ≤ (R² + G² Σα_i²)/(2 Σα_i) ; pas constant ⇒
     limite G²α/2.
   - §3.3 : α_i = (R/G)/√k ⇒ f_best^(k) − f* ≤ RG/√k.
   - La leçon réindexe à partir de w₀ (somme i = 0…k−1 sur k pas) : équivalent.
3. **Tibshirani (1996), JRSS-B 58(1):267–288** — §2.2 « Orthonormal design
   case », éq. (3) p. 269 : β̂_j = sign(β̂_j°)(|β̂_j°| − γ)⁺, pour la forme
   **contrainte** (γ fixé par Σ|β̂_j| = t) ; repris §10, éq. (13).
   https://www.jstor.org/stable/2346178
4. **Hastie, Tibshirani, Friedman, ESL 2e éd. (2009)** — §3.4.2 éq. (3.52) :
   forme pénalisée **avec ½** ; §3.4.3 et Table 3.4 p. 71 : lasso
   sign(β̂_j)(|β̂_j| − λ)₊. Attention : la ligne Ridge de la Table 3.4
   (β̂_j/(1+λ)) correspond à l'objectif Ridge sans ½ (éq. 3.41). La leçon
   écrit explicitement Ridge avec (λ/2)‖w‖² pour obtenir z/(1+λ) dans la même
   normalisation. https://doi.org/10.1007/978-0-387-84858-7

## UNVERIFIED (texte primaire inaccessible)

- **Rockafellar, Convex Analysis (1970)** : numéros 23.4 / 24.7 (∂f non vide,
  convexe, compact), 23.8 (somme), 24.1 (dérivées unilatérales, 1D), 25.1
  (différentiabilité). **Non cités** dans le texte visible : la leçon renvoie à
  Rockafellar sans numéro. La Proposition E.2 (1D, ∂f = [f′₋, f′₊]) est donc
  attribuée à Rockafellar sans numéro de théorème ; à confirmer sur un
  exemplaire papier.
- **Nesterov (2004)** : §3.2 (méthode du sous-gradient), numéro de théorème
  du taux non confirmé. Cité sans numéro dans la leçon.
