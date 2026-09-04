<script lang="ts">
	import PageTemplate from '$lib/components/layout/PageTemplate.svelte';
	import TheorySection from '$lib/components/narrative/TheorySection.svelte';
	import Bibliography from '$lib/components/narrative/bib/Bibliography.svelte';
	import BibElement from '$lib/components/narrative/bib/BibElement.svelte';
	import { getPageByPath, getAdjacentPages } from '$lib/navigation.js';
	import { settings } from '$lib/stores/index.js';
	import { asset, resolve } from '$app/paths';

	const meta = getPageByPath('/intro');
	const { prev: prevMeta, next: nextMeta } = $derived(
		getAdjacentPages(meta?.path ?? '', $settings.expertMode)
	);
</script>

<svelte:head>
	<title>{meta?.title ?? 'Introduction'} — Fondations de l'Apprentissage Statistique</title>
</svelte:head>

<PageTemplate
	title={meta?.title ?? 'Introduction'}
	subtitle="Fondations de l'Apprentissage Statistique"
	prev={prevMeta}
	next={nextMeta}
>
	<TheorySection>
		<p>
			L'apprentissage automatique (Machine Learning) moderne repose sur trois piliers : la <strong
				>modélisation mathématique</strong
			>, l'<strong>optimisation numérique</strong>
			et la <strong>garantie statistique</strong>. Concevoir un modèle performant ne consiste pas
			seulement à écrire une fonction de perte élégante, mais demande également de savoir l'ajuster
			efficacement sur de grands volumes de données, tout en contrôlant sa complexité pour garantir
			sa capacité de généralisation sur des observations futures.
		</p>
		<p>Ce cours est basé sur les notes suivantes :</p>
		<ul>
			<li>
				<a href={asset('/pdf/optim.pdf')} target="_blank" rel="noopener noreferrer">
					<strong>Partie 1 :</strong> Optimisation pour l'Apprentissage (PDF)
				</a>
			</li>
			<li>
				<a href={asset('/pdf/regularization.pdf')} target="_blank" rel="noopener noreferrer">
					<strong>Partie 4 :</strong> Agrégation, Forêts & Régularisation (PDF)
				</a>
			</li>
			<li>
				<a href={asset('/pdf/set_valued.pdf')} target="_blank" rel="noopener noreferrer">
					<strong>Partie 5 :</strong> Évaluation & Prédictions Conformelles (PDF)
				</a>
			</li>
			<li>
				<a href={asset('/pdf/theory.pdf')} target="_blank" rel="noopener noreferrer">
					<strong>Parties 6 à 9 :</strong> Théorie de l'Apprentissage Statistique —
					optimum de Bayes, consistance, généralisation, fonctions de perte (PDF)
				</a>
			</li>
		</ul>

		<h2>Plan du cours</h2>

		<ul>
			<li>
				<a href={resolve('/part1/lesson1')}>
					<strong>Partie I — Optimisation :</strong> conditions d'un minimum, fonctions
					d'optimisation en ML, descente de gradient et accélération (dont Adam), SGD,
					descente par coordonnées et méthode de Newton.
				</a>
			</li>
			<li>
				<a href={resolve('/part2/lesson1')}>
					<strong>Partie II — Classification supervisée (contenu à venir) :</strong>
					cadre de l'apprentissage supervisé et k-NN, classifieurs linéaires et
					régression logistique, arbres de décision, SVM.
				</a>
			</li>
			<li>
				<a href={resolve('/part3/lesson1')}>
					<strong>Partie III — Clustering (contenu à venir) :</strong> clustering
					hiérarchique, k-moyennes et évaluation d'un clustering.
				</a>
			</li>
			<li>
				<a href={resolve('/part4/lesson1')}>
					<strong>Partie IV — Régularisation :</strong> méthodes ensemblistes et Bagging,
					Random Forest et sélection de features, Boosting (AdaBoost, Gradient Boosting),
					régularisation L1/L2/Elastic Net.
				</a>
			</li>
			<li>
				<a href={resolve('/part5/lesson1')}>
					<strong>Partie V — Set-valued / Prédictions conformelles :</strong>
					classification Top-K, prédiction conformelle, intervalles de prédiction.
				</a>
			</li>
			<li>
				<a href={resolve('/part6/lesson1')}>
					<strong>Partie VI — Optimum de Bayes :</strong> classifieur de Bayes,
					régression optimale (L2/L1), risque de Bayes comme borne irréductible.
				</a>
			</li>
			<li>
				<a href={resolve('/part7/lesson1')}>
					<strong>Partie VII — Consistance :</strong> convergence des classifieurs appris
					(en probabilité, en moyenne quadratique, presque sûrement — et au sens universel), consistance du k-NN.
				</a>
			</li>
			<li>
				<a href={resolve('/part8/lesson1')}>
					<strong>Partie VIII — Généralisation :</strong> inégalités de concentration
					(Markov, Tchebychev), bornes de généralisation pour classes finies, dimension VC
					et lemme de Sauer–Shelah, SVM, limites de la théorie VC et double descente.
				</a>
			</li>
			<li>
				<a href={resolve('/part9/lesson1')}>
					<strong>Partie IX — Fonctions de perte :</strong> de la perte 0-1 aux pertes
					proxy convexes, calibration des pertes, décomposition de l'erreur.
				</a>
			</li>
		</ul>

		<h2>Objectifs du cours</h2>

		<p>À l'issue de cet enseignement de Master, vous serez capables de :</p>

		<ul>
			<li>
				<strong>Analyser et modéliser :</strong> Identifier les propriétés mathématiques fondamentales
				d'un problème d'apprentissage (convexité, coercivité, régularité du gradient, forte convexité)
				afin d'en déduire l'existence, l'unicité et la stabilité d'une solution.
			</li>
			<li>
				<strong>Concevoir et optimiser :</strong> Sélectionner l'algorithme de descente de gradient le
				plus adapté à la structure de vos données et à la dimension du problème (descente de gradient
				classique, accélérée, stochastique, par coordonnées ou méthode de Newton).
			</li>
			<li>
				<strong>Maîtriser la complexité :</strong> Appliquer et comparer les méthodes de régularisation
				(Ridge, Lasso, Elastic Net) et de réduction de variance par méthodes d'ensemble (Bagging, Forêts
				Aléatoires, Gradient Boosting) pour résoudre le dilemme Biais-Variance.
			</li>
			<li>
				<strong>Garantir et certifier :</strong> Évaluer précisément la calibration d'un classifieur
				et appliquer la
				<em>Conformal Prediction</em> (prédiction conforme) pour construire des intervalles de prédiction
				garantis à un niveau de confiance choisi, sans hypothèse forte sur la distribution des données.
			</li>
			<li>
				<strong>Caractériser l'optimum :</strong> Dériver le classifieur de Bayes et la
				régression optimale (espérance conditionnelle pour la perte L2, médiane conditionnelle
				pour la perte L1) et identifier le risque de Bayes comme borne inférieure
				irréductible de la performance.
			</li>
			<li>
				<strong>Analyser la convergence :</strong> Définir la consistance d'une suite de
				classifieurs appris (en probabilité, en moyenne quadratique, presque sûrement — et au sens universel) et la vérifier pour
				des algorithmes standards tels que le k-NN.
			</li>
			<li>
				<strong>Bonder la généralisation :</strong> Appliquer les inégalités de concentration
				(Markov, Tchebychev) et la théorie VC (dimension VC, lemme de Sauer–Shelah) pour
				établir des bornes de généralisation (classes finies, SVM), et discuter les limites
				de la théorie VC en deep learning (double descente).
			</li>
			<li>
				<strong>Concevoir des pertes optimisables :</strong> Expliquer pourquoi la perte 0-1
				ne s'optimise pas, choisir une perte proxy convexe (charnière, logistique), appliquer
				le théorème de calibration et décomposer l'excès de risque en termes d'estimation,
				de calibration et d'approximation.
			</li>
		</ul>
	</TheorySection>

	<Bibliography>
		<!-- Optimisation et Fondations -->
		<BibElement
			authors={['Boyd, S.', 'Vandenberghe, L.']}
			year={2004}
			title="Convex Optimization"
			journal="Cambridge University Press."
			link="https://web.stanford.edu/~boyd/cvxbook/"
		/>
		<BibElement
			authors={['Nesterov, Y.']}
			year={1983}
			title="A method of solving a convex programming problem with convergence rate O(1/k²)"
			journal="Soviet Mathematics Doklady, 27, 372–376."
		/>
		<BibElement
			authors={['Nesterov, Y.']}
			year={2004}
			title="Introductory Lectures on Convex Optimization: A Basic Course"
			journal="Kluwer Academic Publishers."
			link="https://link.springer.com/book/10.1007/978-1-4419-8853-9"
		/>
		<BibElement
			authors={['Nocedal, JC.', 'Wright, S.']}
			year={2006}
			title="Numerical Optimization"
			journal="Springer Science & Business Media."
			link="https://link.springer.com/book/10.1007/978-0-387-40065-5"
		/>
		<BibElement
			authors={['Rockafellar, R. T.']}
			year={1970}
			title="Convex Analysis"
			journal="Princeton University Press."
		/>
		<BibElement
			authors={['Robbins, H.', 'Monro, S.']}
			year={1951}
			title="A Stochastic Approximation Method"
			journal="The Annals of Mathematical Statistics, Vol. 22, No. 3, pp. 400-407."
			link="https://www.jstor.org/stable/2236626"
		/>
		<BibElement
			authors={['Polyak, B. T.']}
			year={1964}
			title="Some methods of speeding up the convergence of iteration methods"
			journal="USSR Computational Mathematics and Mathematical Physics, 4(5), 1–17."
			link="https://doi.org/10.1016/0041-5553(64)90137-5"
		/>
		<BibElement
			authors={['Bottou, L.']}
			year={2010}
			title="Large-scale machine learning with stochastic gradient descent"
			journal="Proceedings of COMPSTAT'2010, 177–186."
			link="https://hal.inria.fr/inria-00577394/document"
		/>
		<BibElement
			authors={['Bottou, L.', 'Curtis, F. E.', 'Nocedal, J.']}
			year={2018}
			title="Optimization methods for large-scale machine learning"
			journal="SIAM Review, 60(2), 223-311."
			link="https://doi.org/10.1137/16M1080173"
		/>
		<BibElement
			authors={['Bubeck, S.']}
			year={2015}
			title="Convex Optimization: Algorithms and Complexity"
			journal="Foundations and Trends® in Machine Learning."
			link="https://arxiv.org/abs/1405.4980"
		/>
		<BibElement
			authors={['Duchi, J.', 'Hazan, E.', 'Singer, Y.']}
			year={2011}
			title="Adaptive subgradient methods for online learning and stochastic optimization"
			journal="Journal of Machine Learning Research, 12(Jul), 2121–2159."
			link="https://jmlr.org/papers/v12/duchi11a.html"
		/>

		<!-- Optimisation adaptative : Adam -->
		<BibElement
			authors={['Kingma, D. P.', 'Ba, J.']}
			year={2015}
			title="Adam: A Method for Stochastic Optimization"
			journal="ICLR"
			link="https://arxiv.org/abs/1412.6980"
		/>
		<BibElement
			authors={['Reddi, S. J.', 'Kale, S.', 'Kumar, S.']}
			year={2018}
			title="On the Convergence of Adam and Beyond"
			journal="ICLR"
		/>
		<BibElement
			authors={['Wilson, A. C.', 'Roelofs, R.', 'Stern, M.', 'Srebro, N.', 'Recht, B.']}
			year={2017}
			title="The Marginal Value of Adaptive Gradient Methods in Machine Learning"
			journal="NeurIPS"
		/>
		<BibElement
			authors={['Loshchilov, I.', 'Hutter, F.']}
			year={2019}
			title="Decoupled Weight Decay Regularization"
			journal="ICLR"
		/>
		<BibElement
			authors={['Sahu, S.', 'Sarkar, A.', 'Hogan, C. J.', 'Wells, M. T.']}
			year={2026}
			title="Adapt or Forget: Provable Tradeoffs Between Adam and SGD in Nonstationary Optimization"
			journal="arXiv preprint"
			link="https://arxiv.org/abs/2605.04269"
		/>

		<BibElement
			authors={['Shalev-Shwartz, S.', 'Ben-David, S.']}
			year={2014}
			title="Understanding Machine Learning: From Theory to Algorithms"
			journal="Cambridge University Press."
			link="https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/"
		/>
		<BibElement
			authors={['Azencott, C. A.']}
			year={2011}
			title="Introduction au Machine Learning"
			journal="Dunod. ISBN : 978-2-10-084143-1."
			link="http://cazencott.info/dotclear/public/lectures/IntroML_Azencott.pdf"
		/>
		<BibElement
			authors={['Novembre, J.', 'Johnson, T.', 'Bryc, K.', 'et al.']}
			year={2008}
			title="Genes mirror geography within Europe"
			journal="Nature, 456, 98–101. DOI : 10.1038/nature07331."
			link="https://www.nature.com/articles/nature07331"
		/>
		<BibElement
			authors={['Benureau, F. C.']}
			year={2015}
			title="L’auto-exploration des espaces sensorimoteurs chez les robots"
			journal="Thèse de doctorat."
			link="https://fabien.benureau.com/docs/phd_benureau.pdf"
		/>

		<!-- Régularisation et Méthodes d'Ensemble -->
		<BibElement
			authors={['Hastie, T.', 'Tibshirani, R.', 'Friedman, J.']}
			year={2009}
			title="The Elements of Statistical Learning: Data Mining, Inference, and Prediction"
			journal="Springer Science & Business Media, Second Edition."
			link="https://hastie.su.domains/ElemStatLearn/"
		/>
		<BibElement
			authors={['Breiman, L.']}
			year={1996}
			title="Bagging Predictors"
			journal="Machine Learning."
			link="https://doi.org/10.1007/BF00058655"
		/>
		<BibElement
			authors={['Breiman, L.']}
			year={2001}
			title="Random Forests"
			journal="Machine Learning, Vol. 45, No. 1, pp. 5-32."
			link="https://doi.org/10.1023/A:1010933404324"
		/>
		<BibElement
			authors={['Freund, Y.', 'Schapire, R. E.']}
			year={1997}
			title="A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting"
			journal="Journal of Computer and System Sciences, Vol. 55, No. 1, pp. 119-139."
			link="https://doi.org/10.1006/jcss.1997.1504"
		/>
		<BibElement
			authors={['Friedman, J. H.']}
			year={2001}
			title="Greedy Function Approximation: A Gradient Boosting Machine"
			journal="The Annals of Statistics, Vol. 29, No. 5, pp. 1189-1232."
			link="https://www.jstor.org/stable/2699986"
		/>
		<BibElement
			authors={['Hoerl, A. E.', 'Kennard, R. W.']}
			year={1970}
			title="Ridge regression: Biased estimation for nonorthogonal problems"
			journal="Technometrics, 12(1), 55-67."
			link="https://doi.org/10.1080/00401706.1970.10488634"
		/>
		<BibElement
			authors={['Tibshirani, R.']}
			year={1996}
			title="Regression Shrinkage and Selection via the Lasso"
			journal="Journal of the Royal Statistical Society, Series B, 58(1), 267–288."
			link="https://doi.org/10.1111/j.2517-6161.1996.tb02080.x"
		/>
		<BibElement
			authors={['Zou, H.', 'Hastie, T.']}
			year={2005}
			title="Regularization and variable selection via the elastic net"
			journal="Journal of the Royal Statistical Society, Series B, 67(2), 301–320."
			link="https://doi.org/10.1111/j.1467-9868.2005.00503.x"
		/>
		<BibElement
			authors={['Zou, H.', 'Hastie, T.', 'Tibshirani, R.']}
			year={2007}
			title="On the 'Degrees of Freedom' of the Lasso"
			journal="The Annals of Statistics, 35(5), 2173–2192."
			link="https://doi.org/10.1214/009053607000000127"
		/>
		<BibElement
			authors={['Lee, J.D.', 'Sun, D.L.', 'Sun, Y.', 'Taylor, J.E.']}
			year={2016}
			title="Exact Post-Selection Inference, with Application to the Lasso"
			journal="The Annals of Statistics, 44(3), 907–927."
			link="https://doi.org/10.1214/15-AOS1371"
		/>
		<BibElement
			authors={['Geurts, P.', 'Ernst, D.', 'Wehenkel, L.']}
			year={2006}
			title="Extremely randomized trees"
			journal="Machine Learning, 63(1), 3–42."
			link="https://doi.org/10.1007/s10994-006-6226-1"
		/>
		<BibElement
			authors={['Louppe, G.', 'et al.']}
			year={2014}
			title="Understanding Random Forests: From Theory to Practice"
			journal="arXiv preprint arXiv:1407.7502."
			link="https://arxiv.org/abs/1407.7502"
		/>

		<!-- Calibration et Prédictions Conformelles -->
		<BibElement
			authors={['Guo, C.', 'Pleiss, G.', 'Sun, Y.', 'Weinberger, K. Q.']}
			year={2017}
			title="On Calibration of Modern Neural Networks"
			journal="International Conference on Machine Learning (ICML), PMLR, pp. 1321-1330."
			link="https://arxiv.org/abs/1706.04599"
		/>
		<BibElement
			authors={['Lapin, M.', 'Hein, M.', 'Schiele, B.']}
			year={2016}
			title="Loss Functions for Top-k Error: Analysis and Insights"
			journal="Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 1468–1477."
			link="https://arxiv.org/abs/1512.00486"
		/>
		<BibElement
			authors={['Angelopoulos, A. N.', 'Bates, S.']}
			year={2021}
			title="A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification"
			journal="arXiv preprint arXiv:2107.07511."
			link="https://arxiv.org/abs/2107.07511"
		/>
		<BibElement
			authors={['Romano, Y.', 'Patterson, E.', 'Candès, E. J.']}
			year={2019}
			title="Conformalized Quantile Regression"
			journal="Advances in Neural Information Processing Systems (NeurIPS), Vol. 32."
			link="https://arxiv.org/abs/1905.03222"
		/>
		<BibElement
			authors={['Vovk, V.', 'Gammerman, A.', 'Shafer, G.']}
			year={2005}
			title="Algorithmic Learning in a Random World"
			journal="Springer."
			link="https://doi.org/10.1007/b106715"
		/>
		<BibElement
			authors={['Sadinle, M.', 'Lei, J.', 'Wasserman, L.']}
			year={2019}
			title="Least Ambiguous Set-Valued Classifiers With Bounded Error Levels"
			journal="Journal of the American Statistical Association, 114(525), 223–234."
			link="https://arxiv.org/abs/1609.00451"
		/>
		<BibElement
			authors={['Romano, Y.', 'Sesia, M.', 'Candès, E.']}
			year={2020}
			title="Classification with Valid and Adaptive Coverage"
			journal="Advances in Neural Information Processing Systems (NeurIPS)."
			link="https://arxiv.org/abs/2006.02544"
		/>
		<BibElement
			authors={['Barber, R. F.', 'Candès, E. J.', 'Ramdas, A.', 'Tibshirani, R. J.']}
			year={2021}
			title="Predictive Inference with the Jackknife+"
			journal="Annals of Statistics, 49(1), 486–507."
			link="https://arxiv.org/abs/1905.02928"
		/>
		<BibElement
			authors={['Barber, R.F.', 'Candès, E.J.', 'Ramdas, A.', 'Tibshirani, R.J.']}
			year={2021}
			title="The Limits of Distribution-Free Conditional Predictive Inference"
			journal="Information and Inference: A Journal of the IMA, 10(2), 455–482."
			link="https://arxiv.org/abs/1903.04684"
		/>
		<BibElement
			authors={['Tibshirani, R.J.', 'Barber, R.F.', 'Candès, E.J.', 'Ramdas, A.']}
			year={2019}
			title="Conformal Prediction Under Covariate Shift"
			journal="Advances in Neural Information Processing Systems (NeurIPS)."
			link="https://arxiv.org/abs/1904.06019"
		/>

		<!-- Apprentissage Statistique et Généralisation -->
		<BibElement
			authors={['Devroye, L.', 'Györfi, L.', 'Lugosi, G.']}
			year={1996}
			title="A Probabilistic Theory of Pattern Recognition"
			journal="Springer-Verlag."
			link="https://doi.org/10.1007/978-1-4612-0711-5"
		/>
		<BibElement
			authors={['Duda, R. O.', 'Hart, P. E.', 'Stork, D. G.']}
			year={2000}
			title="Pattern Classification (2nd ed.)"
			journal="Wiley-Interscience."
			link="https://www.wiley-vch.de/en/areas-interest/engineering/pattern-classification-978-0-471-05669-0"
		/>
		<BibElement
			authors={['James, G.', 'Witten, D.', 'Hastie, T.', 'Tibshirani, R.']}
			year={2021}
			title="An Introduction to Statistical Learning: with Applications in R (2nd ed.)"
			journal="Springer Texts in Statistics. New York: Springer."
			link="https://doi.org/10.1007/978-1-0716-1418-1"
		/>
		<BibElement
			authors={['Bishop, C. M.']}
			year={2006}
			title="Pattern Recognition and Machine Learning"
			journal="Springer."
			link="https://www.microsoft.com/en-us/research/uploads/prod/2006/01/biszman.pdf"
		/>
		<BibElement
			authors={['Vapnik, V. N.']}
			year={1998}
			title="Statistical Learning Theory"
			journal="Wiley."
			link="https://www.wiley.com/en-us/Statistical+Learning+Theory-p-9780471152125"
		/>
		<BibElement
			authors={['Bach, F.']}
			year={2024}
			title="Learning Theory from First Principles"
			journal="MIT Press."
		/>
		<BibElement
			authors={['Stone, C. J.']}
			year={1977}
			title="Consistent Nonparametric Regression"
			journal="The Annals of Statistics, Vol. 5, No. 4, pp. 595-620."
			link="https://projecteuclid.org/journals/annals-of-statistics/volume-5/issue-4/Consistent-Nonparametric-Regression/10.1214/aos/1176343886.full"
		/>
		<BibElement
			authors={['Sauer, N.']}
			year={1972}
			title="On the density of families of sets"
			journal="Journal of Combinatorial Theory, Series A, 13(1), 145-147."
		/>
		<BibElement
			authors={['Shelah, S.']}
			year={1972}
			title="A combinatorial problem; stability and order for models and theories in infinitary languages"
			journal="Pacific Journal of Mathematics, 41(1), 247-261."
		/>
		<BibElement
			authors={['Cover, T. M.', 'Hart, P. E.']}
			year={1967}
			title="Nearest neighbor pattern classification"
			journal="IEEE Transactions on Information Theory, Vol. 13, No. 1, pp. 21-27."
			link="https://ieeexplore.ieee.org/document/1053964"
		/>
		<BibElement
			authors={['Boucheron, S.', 'Lugosi, G.', 'Massart, P.']}
			year={2013}
			title="Concentration Inequalities: A Nonasymptotic Theory of Independence"
			journal="Oxford University Press."
			link="https://global.oup.com/academic/product/concentration-inequalities-9780199535255"
		/>
		<BibElement
			authors={['Hoeffding, W.']}
			year={1963}
			title="Probability inequalities for sums of bounded random variables"
			journal="Journal of the American Statistical Association, 58(301), 13-30."
		/>
		<BibElement
			authors={[
				'Dauphin, Y. N.',
				'Pascanu, R.',
				'Gulcehre, C.',
				'Cho, K.',
				'Ganguli, S.',
				'Bengio, Y.'
			]}
			year={2014}
			title="Identifying and attacking the saddle point problem in high-dimensional non-convex optimization"
			journal="Advances in Neural Information Processing Systems (NeurIPS)."
		/>
		<BibElement
			authors={['Golub, G. H.', 'Van Loan, C. F.']}
			year={2013}
			title="Matrix Computations (4th ed.)"
			journal="Johns Hopkins University Press."
			link="https://www.cs.cornell.edu/cv/GVL4/"
		/>

		<!-- Généralisation en deep learning et pertes proxy -->
		<BibElement
			authors={['Bartlett, P. L.']}
			year={1998}
			title="The sample complexity of pattern classification with neural networks: the size of the weights is more important than the size of the network"
			journal="IEEE Transactions on Information Theory, 44(2), 525-536."
		/>
		<BibElement
			authors={['Belkin, M.', 'Hsu, D.', 'Ma, S.', 'Mandal, S.']}
			year={2019}
			title="Reconciling modern machine-learning practice and the classical bias–variance trade-off"
			journal="PNAS, 116(32), 15849-15854."
		/>
		<BibElement
			authors={['Bartlett, P. L.', 'Foster, D. J.', 'Telgarsky, M.']}
			year={2017}
			title="Spectrally-normalized margin bounds for neural networks"
			journal="NeurIPS 2017."
		/>
		<BibElement
			authors={['Zhang, C.', 'Bengio, S.', 'Hardt, M.', 'Recht, B.', 'Vinyals, O.']}
			year={2017}
			title="Understanding deep learning requires rethinking generalization"
			journal="ICLR 2017."
		/>
		<BibElement
			authors={['Soudry, D.', 'Hoffer, E.', 'Nacson, M. S.', 'Gunasekar, S.', 'Srebro, N.']}
			year={2018}
			title="The implicit bias of gradient descent on separable data"
			journal="Journal of Machine Learning Research, 19(1), 2822-2878."
		/>
		<BibElement
			authors={['Bartlett, P. L.', 'Jordan, M. I.', 'McAuliffe, J.']}
			year={2006}
			title="Convexity, Classification, and Risk Bounds"
			journal="Journal of the American Statistical Association, 101(473), 138-156."
		/>
		<BibElement
			authors={['Vapnik, V. N.']}
			year={1995}
			title="The Nature of Statistical Learning Theory"
			journal="Springer-Verlag."
		/>
	</Bibliography>
</PageTemplate>
