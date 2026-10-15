/**
 * Crux Table — curated syntopicon input (AI-authored; verified by crux-table.mjs).
 *
 * Everything in this file was written by Claude in October 2026 after reading the
 * relevant chapters of the nine local Gutenberg texts. It contains three kinds of
 * material, and the build script treats them differently:
 *
 *   1. QUOTES (`Q`): candidate quotations, each tagged with its book. These are
 *      never shown as typed here. The build script searches each one in the source
 *      text (exact substring after normalising whitespace, Gutenberg italics markers
 *      _ and *, footnote anchors like [112], and curly vs straight quote glyphs),
 *      and the page displays the SOURCE's text at the matched span. Any candidate
 *      that does not match, or matches only inside editorial matter (introductions,
 *      indexes), is dropped and logged.
 *   2. JUDGEMENTS (stances, positions, notes, dispute kinds, pair notes, the
 *      dependency graph, editor's notes in the conversations): AI-generated
 *      interpretation, labelled as such in the UI.
 *   3. STRUCTURE (sub-questions, poles, thread order, vocabulary rows).
 *
 * Positions run from -2 (left pole) to +2 (right pole); `range` marks a stance that
 * spans the axis; `frame: 'reframes'` marks an author who rejects the question's
 * framing. Quote roles: asserts (default) | rejects (states a view in order to
 * reject it) | objection (voices an objection the author then answers) | quotes
 * (quotes another writer approvingly) | earlier (the author's own earlier view).
 */

export const PROVENANCE = 'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)';

// ---------------------------------------------------------------- quotations
export const Q = {
  // ---- Hume
  h1: ['hume', 'There is certainly a probability, which arises from a superiority of chances on any side; and according as this superiority encreases, and surpasses the opposite chances, the probability receives a proportionable encrease, and begets still a higher degree of belief or assent to that side, in which we discover the superiority.'],
  h2: ['hume', 'All probability, then, supposes an opposition of experiments and observations, where the one side is found to overbalance the other, and to produce a degree of evidence, proportioned to the superiority.'],
  h3: ['hume', 'Though there be no such thing as Chance in the world; our ignorance of the real cause of any event has the same influence on the understanding, and begets a like species of belief or opinion.'],
  h4: ['hume', 'chance, when strictly examined, is a mere negative word, and means not any real power which has anywhere a being in nature.'],
  h5: ['hume', 'it considers the turning up of each particular side as alike probable; and this is the very nature of chance, to render all the particular events, comprehended in it, entirely equal.'],
  h6: ['hume', 'That the sun will not rise to-morrow is no less intelligible a proposition, and implies no more contradiction than the affirmation, that it will rise.'],
  h7: ['hume', 'In this view, we must say, that it is only probable all men must die, or that the sun will rise to-morrow. But to conform our language more to common use, we ought to divide arguments into demonstrations, proofs, and probabilities. By proofs meaning such arguments from experience as leave no room for doubt or opposition.'],
  h8: ['hume', 'To endeavour, therefore, the proof of this last supposition by probable arguments, or arguments regarding existence, must be evidently going in a circle, and taking that for granted, which is the very point in question.'],
  h9: ['hume', 'Custom, then, is the great guide of human life. It is that principle alone which renders our experience useful to us, and makes us expect, for the future, a similar train of events with those which have appeared in the past.'],
  h10: ['hume', 'A wise man, therefore, proportions his belief to the evidence.'],
  h11: ['hume', 'That no testimony is sufficient to establish a miracle, unless the testimony be of such a kind, that its falsehood would be more miraculous, than the fact, which it endeavours to establish'],
  h12: ['hume', 'Upon the whole, then, it appears, that no testimony for any kind of miracle has ever amounted to a probability, much less to a proof'],
  h13: ['hume', 'When, therefore, these two kinds of experience are contrary, we have nothing to do but substract the one from the other, and embrace an opinion, either on one side or the other, with that assurance which arises from the remainder.'],
  h15: ['hume', 'all our experimental conclusions proceed upon the supposition that the future will be conformable to the past.'],
  h16: ['hume', 'We should never know how to adjust means to ends, or to employ our natural powers in the production of any effect. There would be an end at once of all action, as well as of the chief part of speculation.'],
  h17: ['hume', 'The case is the same with the probability of causes, as with that of chance.'],
  h18: ['hume', 'If a dye were marked with one figure or number of spots on four sides, and with another figure or number of spots on the two remaining sides, it would be more probable, that the former would turn up than the latter; though, if it had a thousand sides marked in the same manner, and only one side different, the probability would be much higher, and our belief or expectation of the event more steady and secure.'],

  // ---- Laplace
  l1: ['laplace', 'Probability is relative, in part to this ignorance, in part to our knowledge.'],
  l2: ['laplace', 'The theory of chance consists in reducing all the events of the same kind to a certain number of cases equally possible, that is to say, to such as we may be equally undecided about in regard to their existence, and in determining the number of cases favorable to the event whose probability is sought.'],
  l3: ['laplace', 'The curve described by a simple molecule of air or vapor is regulated in a manner just as certain as the planetary orbits; the only difference between them is that which comes from our ignorance.'],
  l4: ['laplace', 'Given for one instant an intelligence which could comprehend all the forces by which nature is animated and the respective situation of the beings who compose it—an intelligence sufficiently vast to submit these data to analysis—it would embrace in the same formula the movements of the greatest bodies of the universe and those of the lightest atom; for it, nothing would be uncertain and the future, as the past, would be present to its eyes.'],
  l5: ['laplace', 'When the probability of a single event is unknown we may suppose it equal to any value from zero to unity.'],
  l6: ['laplace', 'If we do not know which of the three urns contains black balls only, so that there is no reason to believe that it is C rather than B or A, these three hypotheses will appear equally possible'],
  l7: ['laplace', 'Thus we find that an event having occurred successively any number of times, the probability that it will happen again the next time is equal to this number increased by unity divided by the same number, increased by two units.'],
  l8: ['laplace', 'Placing the most ancient epoch of history at five thousand years ago, or at 1826213 days, and the sun having risen constantly in the interval at each revolution of twenty-four hours, it is a bet of 1826214 to one that it will rise again to-morrow.'],
  l9: ['laplace', 'But this number is incomparably greater for him who, recognizing in the totality of phenomena the principal regulator of days and seasons, sees that nothing at the present moment can arrest the course of it.'],
  l10: ['laplace', 'the principal means for ascertaining truth—induction and analogy—are based on probabilities; so that the entire system of human knowledge is connected with the theory set forth in this essay.'],
  l11: ['laplace', 'Yet induction, in leading to the discovery of the general principles of the sciences, does not suffice to establish them absolutely.'],
  l12: ['laplace', 'From what precedes, we ought generally to conclude that the more extraordinary the event, the greater the need of its being supported by strong proofs.'],
  l13: ['laplace', 'Applying this conclusion to all extraordinary deeds it results from it that the probability of the error or of the falsehood of the witness becomes as much greater as the fact attested is more extraordinary.'],
  l14: ['laplace', 'One may judge by this the immense weight of testimonies necessary to admit a suspension of natural laws, and how improper it would be to apply to this case the ordinary rules of criticism.'],
  l15: ['laplace', 'We would give no credence to the testimony of a man who should attest to us that in throwing a hundred dice into the air they had all fallen on the same face.'],
  l16: ['laplace', 'The probability that the ratio of the number of white balls drawn to the total number of balls drawn does not deviate beyond a given interval from the ratio of the number of white balls to the total number of balls contained in the urn, approaches indefinitely to certainty by the indefinite multiplication of events, however small this interval.'],
  l17: ['laplace', 'But in reflecting upon this we soon recognize that this regularity is only the development of the respective possibilities of simple events which ought to present themselves more often when they are more probable.'],
  l18: ['laplace', 'It follows again from this theorem that in a series of events indefinitely prolonged the action of regular and constant causes ought to prevail in the long run over that of irregular causes. It is this which renders the gains of the lotteries just as certain as the products of agriculture'],
  l19: ['laplace', 'It is seen in this essay that the theory of probabilities is at bottom only common sense reduced to calculus; it makes us appreciate with exactitude that which exact minds feel by a sort of instinct without being able ofttimes to give a reason for it. It leaves no arbitrariness in the choice of opinions and sides to be taken; and by its use can always be determined the most advantageous choice.'],
  l20: ['laplace', 'This is the fundamental principle of this branch of the analysis of chances which consists in passing from events to causes.'],
  l21: ['laplace', 'We will call this advantage mathematical hope.'],
  l22: ['laplace', 'the most important questions of life, which are indeed for the most part only problems of probability.'],
  l23: ['laplace', 'In a great number of cases, and these are the most important of the analysis of hazards, the possibilities of simple events are unknown and we are forced to search in past events for the indices which can guide us in our conjectures about the causes upon which they depend.'],
  l24: ['laplace', 'In things which are only probable the difference of the data, which each man has in regard to them, is one of the principal causes of the diversity of opinions which prevail in regard to the same objects.'],
  l25: ['laplace', 'It is thus that an incident related to a numerous assembly finds various degrees of credence, according to the extent of knowledge of the auditors.'],

  // ---- Mill
  m1: ['mill', 'There is no such thing as absolute certainty, but there is assurance sufficient for the purposes of human life.'],
  m2: ['mill', 'Complete liberty of contradicting and disproving our opinion, is the very condition which justifies us in assuming its truth for purposes of action; and on no other terms can a being with human faculties have any rational assurance of being right.'],
  m3: ['mill', 'This is the amount of certainty attainable by a fallible being, and this the sole way of attaining it.'],

  // ---- Darwin
  d1: ['darwin', 'I have hitherto sometimes spoken as if the variations—so common and multiform in organic beings under domestication, and in a lesser degree in those in a state of nature—had been due to chance. This, of course, is a wholly incorrect expression, but it serves to acknowledge plainly our ignorance of the cause of each particular variation.'],
  d2: ['darwin', 'When we look at the plants and bushes clothing an entangled bank, we are tempted to attribute their proportional numbers and kinds to what we call chance. But how false a view is this!'],
  d3: ['darwin', 'any very rare deviation, due to some extraordinary combination of circumstances, appears in the parent—say, once amongst several million individuals—and it reappears in the child, the mere doctrine of chances almost compels us to attribute its reappearance to inheritance.'],

  // ---- Jevons
  j1: ['jevons', 'Probability belongs wholly to the mind.'],
  j2: ['jevons', 'I prefer to dispense altogether with this obscure word belief, and to say that the theory of probability deals with quantity of knowledge, an expression of which a precise explanation and measure can presently be given.'],
  j3: ['jevons', 'But an all-sufficient objection is, that the theory does not measure what the belief is, but what it ought to be.'],
  j4: ['jevons', 'Chance then exists not in nature, and cannot coexist with knowledge; it is merely an expression, as Laplace remarked, for our ignorance of the causes in action, and our consequent inability to predict the result, or to bring it about infallibly.'],
  j5: ['jevons', 'The theory consists in putting similar cases on a par, and distributing equally among them whatever knowledge we possess.'],
  j6: ['jevons', 'It must be allowed that the hypothesis adopted by Laplace is in some degree arbitrary, so that there was some opening for the doubt which Boole has cast upon it.'],
  j7: ['jevons', 'But then the probability that it will continue to rise for as long a period in the future is only (1,000,000,000 + 1)/(2,000,000,000 + 1), or almost exactly 1/2.'],
  j8: ['jevons', 'Thus on the first occasion on which a person sees a shark, and notices that it is accompanied by a little pilot fish, the odds are 2 to 1, or the probability 2/3, that the next shark will be so accompanied.'],
  j9: ['jevons', 'I am convinced that it is impossible to expound the methods of induction in a sound manner, without resting them upon the theory of probability.'],
  j10: ['jevons', 'Inference but unfolds the hidden meaning of our observations, and the theory of probability shows how far we go beyond our data in assuming that new specimens will resemble the old ones, or that the future may be regarded as proceeding uniformly with the past.'],
  j11: ['jevons', 'In this state of ignorance, the only guide is the theory of probability, which proves that in the long run the mean of divergent results will come most nearly to the truth.'],
  j12: ['jevons', 'As Butler truly said, “Probability is the very guide of life.”'],
  j13: ['jevons', 'It defines rational expectation by measuring the comparative amounts of knowledge and ignorance, and teaches us to regulate our actions with regard to future events in a way which will, in the long run, lead to the least disappointment.'],
  j14: ['jevons', 'Boole seemed to entertain a like view, when he described the theory as engaged with “the equal distribution of ignorance;” but we may just as well say that it is engaged with the equal distribution of knowledge.'],
  j15: ['jevons', 'It is, as Laplace happily said, good sense reduced to calculation.'],
  j16: ['jevons', 'A steam-vessel, for instance, is missing and some persons believe that she has sunk in mid-ocean; others think differently. In the event itself there can be no such uncertainty; the steam-vessel either has sunk or has not sunk, and no subsequent discussion of the probable nature of the event can alter the fact.'],
  j17: ['jevons', 'the calculation of probabilities may be inversely applied'],
  j18: ['jevons', 'Every throw gives us some slight information as to the probable tendency of the coin'],
  j19: ['jevons', 'This is proved by the fact that different minds may regard the very same event at the same time with widely different degrees of probability.'],

  // ---- Peirce
  p1: ['peirce', 'We may, therefore, define the probability of a mode of argument as the proportion of cases in which it carries truth with it.'],
  p2: ['peirce', 'But, in the long run, there is a real fact which corresponds to the idea of probability, and it is that a given mode of inference sometimes proves successful and sometimes not, and that in a ratio ultimately fixed.'],
  p3: ['peirce', 'The theory of probabilities is simply the science of logic quantitatively treated.'],
  p4: ['peirce', 'Try to verify any law of nature, and you will find that the more precise your observations, the more certain they will be to show irregular departures from the law.'],
  p5: ['peirce', 'By thus admitting pure spontaneity or life as a character of the universe, acting always and everywhere though restrained within narrow bounds by law, producing infinitesimal departures from law continually, and great ones with infinite infrequency, I account for all the variety and diversity of the universe'],
  p6: ['peirce', 'because it gives rise to a vague way of thinking, as if the action of causation might either determine an event to happen or determine it not to happen, or leave it more or less free to happen or not, so as to give rise to an inherent chance in regard to its occurrence.'],
  p6b: ['peirce', 'But to speak of the probability of the event B, without naming the condition, really has no meaning at all.'],
  p7: ['peirce', 'But the only possible reason for drawing any analogy between such an arrangement and that of Nature is the principle that alternatives of which we know nothing must be considered as equally probable. But this principle is absurd. There is an indefinite variety of ways of enumerating the different possibilities, which, on the application of this principle, would give different results.'],
  p8: ['peirce', 'But let us suppose that we are totally ignorant what colored hair the inhabitants of Saturn have.'],
  p9: ['peirce', 'But the probability for each of the smaller areas being one-half, that for the larger should be at least unity, which is absurd.'],
  p10: ['peirce', 'But this solution betrays its origin if we apply it to the case in which the man has never seen the tide rise at all; that is, if we put m = 0.'],
  p11: ['peirce', 'In this case, the probability that it will rise the next time comes out 1/2, or, in other words, the solution involves the conceptualistic principle that there is an even chance of a totally unknown event.'],
  p12: ['peirce', 'The relative probability of this or that arrangement of Nature is something which we should have a right to talk about if universes were as plenty as blackberries, if we could put a quantity of them in a bag, shake them well up, draw out a sample, and examine them to see what proportion of them had one arrangement and what proportion another.'],
  p13: ['peirce', 'We may express this by saying that in the case of analytic inference we know the probability of our conclusion (if the premises are true), but in the case of synthetic inferences we only know the degree of trustworthiness of our proceeding.'],
  p14: ['peirce', 'Though a synthetic inference cannot by any means be reduced to deduction, yet that the rule of induction will hold good in the long run may be deduced from the principle that reality is only the object of the final opinion to which sufficient investigation would lead.'],
  p15: ['peirce', 'At present, historical criticism has almost exploded the miracles, great and small; so that the doctrine of necessity has never been in so great vogue as now.'],
  p16: ['peirce', 'It is an indubitable result of the theory of probabilities that every gambler, if he continues long enough, must ultimately be ruined.'],
  p17: ['peirce', 'The very idea of probability and of reasoning rests on the assumption that this number is indefinitely great.'],
  p18: ['peirce', 'But what, without death, would happen to every man, with death must happen to some man. At the same time, death makes the number of our risks, of our inferences, finite, and so makes their mean result uncertain.'],
  p19: ['peirce', 'He who would not sacrifice his own soul to save the whole world, is, as it seems to me, illogical in all his inferences, collectively. Logic is rooted in the social principle.'],
  p20: ['peirce', 'An individual inference must be either true or false, and can show no effect of probability; and, therefore, in reference to a single case considered in itself, probability can have no meaning.'],
  p21: ['peirce', 'The conception of probability as a matter of fact, i.e., as the proportion of times in which an occurrence of one kind is accompanied by an occurrence of another kind, is termed by Mr. Venn the materialistic view of the subject. But probability has often been regarded as being simply the degree of belief which ought to attach to a proposition, and this mode of explaining the idea is termed by Venn the conceptualistic view.'],
  p22: ['peirce', 'This last ratio may be called the chance of an event.'],
  p23: ['peirce', 'It is entirely in harmony with this law that the feeling of belief should be as the logarithm of the chance, this latter being the expression of the state of facts which produces the belief.'],
  p24: ['peirce', 'In short, to express the proper state of our belief, not one number but two are requisite, the first depending on the inferred probability, the second on the amount of knowledge on which that probability is based.'],
  p25: ['peirce', 'Probability and chance undoubtedly belong primarily to consequences, and are relative to premises'],
  p26: ['peirce', 'All our reasonings are of two kinds: 1. Explicative, analytic, or deductive; 2. Amplifiative, synthetic, or (loosely speaking) inductive.'],
  p27: ['peirce', 'The conception of probability here set forth is substantially that first developed by Mr. Venn, in his Logic of Chance.'],
  p28: ['peirce', 'it would be folly to deny that he ought to prefer the pack containing the larger portion of red cards, although, from the nature of the risk, it could not be repeated.'],
  p29: ['peirce', 'we thus come upon a celebrated paradox that, though he is certain to be ruined, the value of his expectation calculated according to the usual rules (which omit this consideration) is large.'],

  // ---- Venn
  v1: ['venn', 'we may define the probability or chance (the terms are here regarded as synonymous) of the event happening in that particular way as the numerical fraction which represents the proportion between the two different classes in the long run.'],
  v2: ['venn', 'the fundamental conception which the reader has to fix in his mind as clearly as possible, is, I take it, that of a series. But it is a series of a peculiar kind, one of which no better compendious description can be given than that which is contained in the statement that it combines individual irregularity with aggregate regularity.'],
  v3: ['venn', 'The science of Probability makes no assumption whatever about the way in which events are brought about, whether by causation or without it.'],
  v4: ['venn', 'It is the fact of this ignorance that makes us appeal to the theory of Probability, the grounds of it are of no importance.'],
  v5: ['venn', 'For is the supposition, that the different specified kinds of bags are equally likely, the most reasonable supposition under the circumstances in question? One man may think it is, another may take a contrary view.'],
  v6: ['venn', 'Give us either their actual prevalence in statistics, or the conditions by which such prevalence is brought about, and we know what to do; but without the help of such data we are reduced to guessing.'],
  v7: ['venn', 'It is hard to take such a rule as this seriously'],
  v8: ['venn', 'to show what astonishing conclusions are apt to be accepted on the supposed warrant of mathematics.'],
  v9: ['venn', 'Laplace, for instance, has pointed out that at the date of the writing of his Essai Philosophique, the odds in favour of the sun\'s rising again (on the old assumption as to the age of the world) were 1,826,214 to 1.'],
  v10: ['venn', 'To say nothing of the fact that recognizing and naming the fish implies that they have often been seen before, how many of the observed characteristics of that single \'event\' are to be considered essential?'],
  v11: ['venn', 'It will be enough here to remark that in our present reflective and rational stage we find that every inference in Probability involves some appeal to, or support from, Induction, but that it is impossible to base either upon the other.'],
  v12: ['venn', 'How can any arrangement of bags and balls, or other mechanical or numerical illustrations of unlikely events, be admitted as fairly illustrative of miraculous occurrences, or indeed of many of those which come under the designation of \'very extraordinary\' or \'highly improbable\'?'],
  v13: ['venn', 'It is sometimes overlooked that although a difference about facts is one of the conditions of a bonâ fide argument, a difference which reaches to ultimate principles is fatal to all argument.'],
  v14: ['venn', 'Most persons, we may presume, would receive the statement of the naturalist in this latter case almost as readily as in the former'],
  v15: ['venn', 'To attempt to induce any one to disbelieve in the existence of physical causation, in a given instance, by means of illustrations which to him seem only additional examples of the principle in question, is like trying to make a dam, in order to stop the flow of a river, by shovelling in snow.'],
  v16: ['venn', 'If one might judge by the interpretation and uses to which this theorem is sometimes exposed, we should regard it as one of the last remaining relics of Realism, which after being banished elsewhere still manages to linger in the remote province of Probability.'],
  v17: ['venn', 'but indeed if there is any value in the foregoing criticism, the basis on which the mathematics rest is faulty, owing to there being really nothing which we can with propriety call an objective probability.'],
  v18: ['venn', 'The danger of stopping too soon is easily seen, but in avoiding it we must not fall into the opposite error of going on too long, and so getting either gradually or suddenly under the influence of a changed set of circumstances.'],
  v19: ['venn', 'We cannot, it is true, remove the uncertainty in itself, but we can so act that the consequences of that uncertainty shall be less to us, or to those in whom we are interested.'],
  v20: ['venn', 'The measure of belief is the only common ground, and we must therefore compare this quantity in each case. The test afforded will be an exceedingly rough one, for the reasons mentioned above, but it will be better than none'],
  v21: ['venn', 'Hume, for instance, in his short essay on Probability, commences with the remark, "though there be no such thing as chance in the world, our ignorance of the real cause of any event has the same influence on the understanding, &c."'],
  v22: ['venn', 'On our view of Probability, therefore, its \'relativeness\' in any given case is a misleading expression'],
  v23: ['venn', 'This constitution is then converted into an \'objective probability\', supposed to develop into the sequence which exhibits the uniformity.'],
  v24: ['venn', 'The so-called \'moral expectation\', on the other hand, is the subjective value of this mathematical expectation.'],
  v25: ['venn', 'Considered therefore as a contribution to the theory of the subject, the distinction between Direct and Inverse Probability must be abandoned.'],
  v26: ['venn', 'The proof usually advanced makes use of what is called the Principle of Sufficient Reason.'],
  v27: ['venn', 'Again, the curious doctrine adopted by Jevons, that the principles of Induction rest entirely upon the theory of Probability,--a very different doctrine from that which is conveyed by saying that all knowledge of facts is probable only, i.e. not necessary,--seems unintelligible except on some such interpretation.'],
  v28: ['venn', 'When therefore these two kinds of experience are contrary, we have nothing to do but subtract the one from the other, and embrace an opinion, either on one side or the other, with that assurance which arises from the remainder.'],
  v29: ['venn', 'It is therefore with great prudence that Hume, and others after him, have practically insisted on commencing with a discussion of the credibility of the single miracle'],
  v30: ['venn', 'Suppose that we are comparing two things, of which one is wholly alien to Probability, in the sense that it is hopeless to attempt to assign any degree of numerical frequency to it, the only ground they have in common may be the amount of belief to which they are respectively entitled.'],
  v32: ['venn', 'For instance, Jevons (Principles of Science p. 258) says "Thus on the first occasion on which a person sees a shark, and notices that it is accompanied by a little pilot fish, the odds are 2 to 1 that the next shark will be so accompanied."'],
  v31: ['venn', 'He always appears to incline to the opinion that the individual judgment in probability is to admit of justification'],

  // ---- Poincaré
  po1: ['poincare', 'A gambler wants to try a coup; he asks my advice. If I give it to him, I shall use the calculus of probabilities, but I shall not guarantee success. This is what I shall call subjective probability.'],
  po2: ['poincare', 'When he makes a summary of his book, he will find that events have taken place in conformity with the laws of the calculus of probabilities. This is what I shall call objective probability, and it is this phenomenon which has to be explained.'],
  po3: ['poincare', 'The very name calculus of probabilities is a paradox. Probability opposed to certainty is what we do not know, and how can we calculate what we do not know?'],
  po4: ['poincare', 'Chance is only the measure of our ignorance. Fortuitous phenomena are, by definition, those whose laws we do not know.'],
  po5: ['poincare', 'So it must well be that chance is something other than the name we give our ignorance'],
  po6: ['poincare', 'it may happen that slight differences in the initial conditions produce very great differences in the final phenomena; a slight error in the former would make an enormous error in the latter. Prediction becomes impossible and we have the fortuitous phenomenon.'],
  po7: ['poincare', 'This doctor would dissipate the ignorance of the director, but he would have no influence on the dividends, which evidently are not an outcome of this ignorance.'],
  po8: ['poincare', 'So, therefore, we are reduced to defining the probable by the probable.'],
  po9: ['poincare', 'The illustrious geometer successively adopted two conventions which good sense seemed equally to dictate and with one he found 1/2, with the other 1/3.'],
  po10: ['poincare', 'Finally the problems to which the calculus of probabilities may be applied with profit are those in which the result is independent of the hypothesis made at the outset, provided only that this hypothesis satisfies the condition of continuity.'],
  po11: ['poincare', 'The convention about the a priori probability was unjustified, and that is why the calculation of the a posteriori probability led me to an inadmissible result.'],
  po12: ['poincare', 'I shall even add that if none were made, the problem of the a posteriori probability would have no meaning. It must always be made either explicitly or tacitly.'],
  po13: ['poincare', 'From this point of view, all the sciences would be only unconscious applications of the calculus of probabilities. To condemn this calculus would be to condemn the whole of science.'],
  po14: ['poincare', 'Besides how do we know whether this law, true for so many centuries, will still be true next year? To this objection, you will find nothing to reply, except: \'That is very improbable.\''],
  po15: ['poincare', 'We have compared the probability that an unknown savant should have found out what has been vainly sought for so long, with the probability that there is one madman the more on the earth; the second appears to us the greater.'],
  po16: ['poincare', 'These are very good reasons, but there is nothing mathematical about them; they are purely psychological.'],
  po17: ['poincare', 'Men demand of their gods to prove their existence by miracles; but the eternal marvel is that there are not miracles without cease.'],
  po18: ['poincare', 'The director of a life insurance company does not know when each of the insured will die, but he relies upon the calculus of probabilities and on the law of great numbers, and he is not deceived, since he distributes dividends to his stockholders.'],
  po19: ['poincare', 'All these theories are based on the laws of great numbers, and the calculus of probabilities would evidently involve them in its ruin.'],
  po20: ['poincare', 'What I know is not that such and such a thing is true, but that the best course for me is to act as if it were true.'],
  po21: ['poincare', 'There are numerous insurance companies which apply the rules of the calculus of probabilities, and they distribute to their shareholders dividends whose objective reality can not be contested. To invoke our ignorance and the necessity to act does not suffice to explain them.'],
  po22: ['poincare', 'A very slight cause, which escapes us, determines a considerable effect which we can not help seeing, and then we say this effect is due to chance.'],
  po23: ['poincare', 'These are the problems called probability of causes, the most interesting from the point of view of their scientific applications.'],
  po24: ['poincare', 'My adversary deals for the first time and he turns up a king. What is the probability that he is a sharper? The formulas ordinarily taught give 8/9, a result evidently rather surprising.'],
  po25: ['poincare', 'In the choice of this convention, we can be guided only by the principle of sufficient reason. Unfortunately this principle is very vague and very elastic'],
  po26: ['poincare', 'All players know this objective law; but it leads them into a remarkable error, which has been often exposed, but into which they always fall again.'],

  // ---- Russell
  r1: ['russell', 'It should be noted that probability is always relative to certain data.'],
  r2: ['russell', 'The man who has fed the chicken every day throughout its life at last wrings its neck instead, showing that more refined views as to the uniformity of nature would have been useful to the chicken.'],
  r3: ['russell', 'Thus our instincts certainly cause us to believe that the sun will rise to-morrow, but we may be in no better a position than the chicken which unexpectedly has its neck wrung.'],
  r4: ['russell', 'Under the same circumstances, a sufficient number of cases of association will make the probability of a fresh association nearly a certainty, and will make it approach certainty without limit.'],
  r5: ['russell', 'hence we can never use experience to prove the inductive principle without begging the question. Thus we must either accept the inductive principle on the ground of its intrinsic evidence, or forgo all justification of our expectations about the future.'],
  r6: ['russell', 'Thus probability is all we ought to seek.'],
  r7: ['russell', 'Thus the greater part of what would commonly pass as knowledge is more or less probable opinion.'],
  r8: ['russell', 'All our conduct is based upon associations which have worked in the past, and which we therefore regard as likely to work in the future; and this likelihood is dependent for its validity upon the inductive principle.'],
  r10: ['russell', 'The fact, therefore, that things often fail to fulfil our expectations is no evidence that our expectations will not probably be fulfilled in a given case or a given class of cases.'],
};

// ---------------------------------------------------------------- sub-questions
export const QUESTIONS = [
  {
    id: 'Q1', part: 'What is probability?',
    q: 'Is probability a degree of belief or a long-run frequency?',
    poles: ['in the mind', 'in the series'], kind: 'definition',
    terms: ['degree of belief', 'quantity of belief', 'measure of belief', 'belief', 'long run', 'series', 'proportion', 'conceptualist', 'materialist', 'subjective probability', 'objective probability', 'quantity of knowledge', 'degree of probability', 'probability is', 'frequency', 'credence'],
    synth: 'The shelf splits cleanly: Laplace, Jevons and (in his way) Russell put probability in a state of knowledge; Venn and the 1878 Peirce put it in a series; Poincaré keeps both and asks why they agree.',
  },
  {
    id: 'Q2', part: 'What is probability?',
    q: 'Is chance in the world, or only in our ignorance?',
    poles: ['only our ignorance', 'real in the world'], kind: 'fact',
    terms: ['chance', 'ignorance', 'necessity', 'necessitarian', 'determinis', 'fortuitous', 'spontaneity', 'absolute chance', 'hazard', 'unknown cause', 'free will', 'free-will', 'freedom of the will', 'caprice', 'random'],
    synth: 'Near-consensus for a century — chance is a name for ignorance — broken twice: by Peirce\'s absolute chance (1892) and by Poincaré\'s instability argument (1908). Venn declares the question irrelevant to probability.',
  },
  {
    id: 'Q3', part: 'What is probability?',
    q: 'Is the principle of indifference sound?',
    poles: ['unsound', 'sound'], kind: 'method',
    terms: ['equally possible', 'equally probable', 'equally likely', 'sufficient reason', 'no reason to', 'equally undecided', 'even chance', 'equal distribution', 'convention', 'arbitrary', 'urn', 'bag', 'indifferen'],
    synth: 'The load-bearing assumption of the classical theory. Laplace and Jevons build on it; Venn calls it arbitrary, Peirce absurd, and Poincaré rescues it only where the answer does not depend on the convention.',
  },
  {
    id: 'Q4', part: 'What can it justify?',
    q: 'Does the rule of succession hold — will the sun rise tomorrow?',
    poles: ['fails', 'holds'], kind: 'method',
    terms: ['rule of succession', 'sun will rise', 'rise again', 'to-morrow', 'tomorrow', 'next time', 'recurrence', 'm + 1', '1826214', 'shark', 'tide', 'sunrise', 'sun to rise'],
    synth: 'The most quotable fight on the shelf. The (m+1)/(m+2) rule inherits everything from Q3: those who accept equal priors accept the sunrise odds; those who reject them find the rule unserious.',
  },
  {
    id: 'Q5', part: 'What can it justify?',
    q: 'Can induction be justified?',
    poles: ['no rational ground', 'grounded by probability'], kind: 'justification',
    terms: ['induction', 'inductive', 'uniformity of nature', 'resemble the past', 'conformable to the past', 'synthetic', 'custom', 'habit', 'begging the question', 'generalis', 'generaliz', 'future'],
    synth: 'Hume\'s circle is never broken on this shelf; it is relocated. Laplace and Jevons fold induction into probability, Peirce justifies the method rather than the conclusion, Russell accepts a principle on intrinsic evidence.',
  },
  {
    id: 'Q6', part: 'What can it justify?',
    q: 'Can testimony establish a miracle?',
    poles: ['never', 'it can'], kind: 'framework',
    terms: ['testimony', 'testimonies', 'witness', 'miracle', 'miraculous', 'extraordinary', 'credib', 'veracity', 'deceive', 'marvellous', 'credence', 'prodigy'],
    synth: 'Hume and Laplace agree almost word for word, one by experience, one by calculus. Venn\'s dissent is the deepest on the shelf: miracle disputes are not probability problems at all, but clashes of first principles.',
  },
  {
    id: 'Q7', part: 'What can it justify?',
    q: 'What do we owe to the law of large numbers?',
    poles: ['a fact about ideal series', 'a law of the world'], kind: 'interpretation',
    terms: ['large numbers', 'great numbers', 'great number of', 'long run', 'bernoulli', 'average', 'constant causes', 'regularity', 'statistic', 'insurance', 'lotter', 'multiplication of events', 'law of error'],
    synth: 'Everyone accepts the theorem; they disagree about what it is about. Laplace and Poincaré read it as a fact about the world (constant causes, dividends); Venn calls that reading a relic of Realism.',
  },
  {
    id: 'Q8', part: 'What can it justify?',
    q: 'Is probability a sufficient guide to action?',
    poles: ['not by itself', 'sufficient'], kind: 'value',
    terms: ['guide of life', 'guide', 'action', 'conduct', 'expectation', 'advantage', 'insurance', 'gambl', 'lotter', 'wager', 'moral hope', 'mathematical hope', 'rational expectation', 'practical', 'prudence'],
    synth: 'Optimists (Laplace, Jevons) against conditionalists: Mill needs free contradiction, Peirce an unlimited community, Venn an aggregate, Poincaré an explanation of why acting on it works.',
  },
];

// ---------------------------------------------------------------- matrix cells
// [question, author, position, stance label, AI reading, quote ids (roles inline as 'id:role')]
export const CELLS = [
  // Q1
  ['Q1', 'hume', -1, 'Belief, bred by counted chances', 'Probability is a felt strength of assent, but one produced mechanically by the proportion of chances or of past experiments: a psychology of frequency rather than a definition.', ['h1', 'h2']],
  ['Q1', 'laplace', -2, 'Relative to our knowledge and our ignorance', 'Probability measures a state of information: two observers with different data rightly assign different probabilities to the same event.', ['l1', 'l24']],
  ['Q1', 'jevons', -2, 'Wholly in the mind — a “quantity of knowledge”', 'Jevons rejects “belief” as too psychological but keeps probability mental and normative: it measures what belief ought to be, given what we know.', ['j1', 'j3']],
  ['Q1', 'peirce', 2, 'How often a kind of inference carries truth', 'In 1878 Peirce defines probability as a long-run truth-ratio of an argument form, crediting Venn; belief enters only as its logarithmic “thermometer”.', ['p1', 'p2', 'p27']],
  ['Q1', 'venn', 2, 'A proportion in an endless series', 'The founding statement of the frequency view: probability is the limiting proportion of a class within a series; belief is a psychological accompaniment, not the subject.', ['v1', 'v2']],
  ['Q1', 'poincare', 0, 'Both: advice to a gambler, and the long-run record', 'Poincaré names subjective and objective probability side by side and makes their agreement the thing to be explained.', ['po1', 'po2'], [-1, 1]],
  ['Q1', 'russell', -1, 'Relative to data: a logical relation', 'Russell (thanking Keynes in his preface) treats probability as relative to given data, so new data change it without refuting the earlier estimate.', ['r1', 'r10']],
  // Q2
  ['Q2', 'hume', -2, 'No such thing as chance', 'Chance is a negative word for our ignorance of causes, yet that ignorance produces real degrees of belief.', ['h3', 'h4']],
  ['Q2', 'laplace', -2, 'Only ignorance: the vast intelligence', 'The demon passage: to a sufficiently vast intellect nothing is uncertain; a molecule of vapour is as determined as a planet.', ['l3', 'l4']],
  ['Q2', 'darwin', -2, '“Chance” is a wholly incorrect expression', 'Darwin uses “chance” only to confess ignorance of the causes of variation, not to deny they exist.', ['d1']],
  ['Q2', 'jevons', -2, 'Chance exists not in nature', 'Jevons follows Laplace explicitly: chance cannot coexist with knowledge and every event was determined from the first.', ['j4']],
  ['Q2', 'peirce', 2, 'Absolute chance: spontaneity in nature', 'The 1892 Peirce breaks with determinism: law is approximate, and irregular departures are real. His 1878 essay had warned against speaking of “inherent” chance.', ['p5', 'p4', 'p6:earlier']],
  ['Q2', 'venn', 0, 'Beside the point: probability needs only ignorance', 'Probability is indifferent to whether events are caused; it requires only that we cannot predict individuals and can rely on averages.', ['v3', 'v4']],
  ['Q2', 'poincare', 1, 'More than ignorance: small causes, great effects', 'Poincaré states the ignorance view in order to reject it: fortuitous phenomena are those where tiny differences in causes produce large differences in effects.', ['po4:rejects', 'po5', 'po6']],
  // Q3
  ['Q3', 'hume', 1, 'Equal chances are “the very nature of chance”', 'Hume describes, rather than defends, the mind treating each face of a die as alike probable.', ['h5']],
  ['Q3', 'laplace', 2, 'Foundational: cases “equally possible”', 'Equal possibility is defined by equal indecision, and extended to an unknown chance itself, which may be anything from zero to one.', ['l2', 'l5']],
  ['Q3', 'jevons', 2, 'Sound: treat equals equally', 'Jevons defends the principle as rational even-handedness with knowledge, while conceding Boole\'s point that Laplace\'s prior is “in some degree arbitrary”.', ['j5', 'j6']],
  ['Q3', 'peirce', -2, 'Absurd: it depends on how you count', 'Peirce\'s partition argument: re-describe the possibilities and indifference gives different answers; applied to nested regions it yields probabilities summing past one.', ['p7', 'p9']],
  ['Q3', 'venn', -1, 'Arbitrary unless statistics decide', 'Without frequencies of the causes, equal-likelihood assumptions are guesses; with them, the principle is unnecessary.', ['v5', 'v6']],
  ['Q3', 'poincare', 0, 'A convention, safe only where it washes out', 'Bertrand\'s chord shows good sense dictating rival conventions; the calculus is trustworthy only where any continuous convention gives the same result.', ['po8', 'po10', 'po24']],
  // Q4
  ['Q4', 'hume', null, 'Not a probability at all, but a “proof”', 'Writing before the rule existed, Hume classes the sunrise as a proof from uniform experience, while insisting its denial is perfectly conceivable.', ['h7', 'h6'], null, 'reframes'],
  ['Q4', 'laplace', 2, 'Holds: 1,826,214 to one — as a floor', 'Laplace gives the rule and the famous bet, then adds that knowledge of the solar system makes the true odds incomparably greater.', ['l7', 'l8', 'l9']],
  ['Q4', 'jevons', 2, 'Holds — and shows how far inference fades', 'Jevons applies the rule boldly (planets, metals, pilot fish) and draws a sober moral: predictions pushed far beyond the data fall towards one half.', ['j7', 'j8']],
  ['Q4', 'peirce', -2, 'It “betrays its origin” at m = 0', 'Set the observations to zero and the rule returns one half for a totally unknown event: the conceptualist principle Peirce has already rejected.', ['p10', 'p11', 'p12']],
  ['Q4', 'venn', -2, '“Hard to take such a rule as this seriously”', 'Venn traces the rule to bag-and-ball assumptions, quotes Laplace\'s odds and Jevons\'s shark, and finds no statistical confirmation that events repeat this way.', ['v7', 'v8', 'v10']],
  ['Q4', 'russell', 1, 'More cases, nearer certainty — never certainty', 'Russell endorses the qualitative content of the rule as a principle of induction, while the chicken shows it can fail at the last.', ['r4', 'r2']],
  // Q5
  ['Q5', 'hume', -2, 'Not by reasoning: by custom', 'Any probable argument for the uniformity of nature presupposes it. Expectation rests on custom, not reason.', ['h8', 'h15']],
  ['Q5', 'laplace', 2, 'Induction is probability', 'Induction and analogy are themselves probabilistic, which ties all knowledge to the calculus, though induction never establishes laws absolutely.', ['l10', 'l11']],
  ['Q5', 'darwin', 1, 'Improbable coincidence implies a cause', 'Darwin uses the “doctrine of chances” as a working argument: a one-in-millions deviation recurring in a child points to inheritance.', ['d3']],
  ['Q5', 'jevons', 2, 'Induction must rest on probability', 'Jevons makes the inverse application of probability the logic of induction, and says it shows how far we outrun our data.', ['j9', 'j10']],
  ['Q5', 'peirce', 1, 'Justified as a method, in the long run', 'Synthetic inference has no probability of its own; what we know is the trustworthiness of the procedure, guaranteed in the long run of inquiry.', ['p13', 'p14']],
  ['Q5', 'venn', -1, 'Probability presupposes induction', 'Every probability rests on an inductive generalisation about a series, so probability cannot ground induction; Venn names Jevons\'s doctrine “curious”.', ['v11', 'v27']],
  ['Q5', 'poincare', 1, 'Indispensable: science stands or falls with it', 'All science is an unconscious application of the calculus; the only answer to Hume\'s doubt is “That is very improbable.”', ['po13', 'po14']],
  ['Q5', 'russell', -1, 'Only by an unprovable principle', 'Russell restates Hume\'s circle and accepts it: the inductive principle can be neither proved nor disproved by experience.', ['r5', 'r6']],
  // Q6
  ['Q6', 'hume', -2, 'Only if its falsehood were more miraculous', 'Hume\'s maxim, and his verdict that no testimony for a miracle has ever reached even probability.', ['h11', 'h12', 'h10']],
  ['Q6', 'laplace', -2, 'The calculus confirms Hume', 'Laplace derives the maxim from Bayes\'s rule: the more extraordinary the fact, the likelier the witness erred or lied.', ['l13', 'l14', 'l15']],
  ['Q6', 'peirce', -1, 'Aside: criticism has “almost exploded” miracles', 'Peirce makes no argument about testimony on this shelf; he records, in passing, that historical criticism has discredited miracles.', ['p15']],
  ['Q6', 'venn', null, 'Not a probability question: first principles clash', 'Miracles are not rare draws from an urn. Disputants who differ on universal causation cannot be moved by testimony rules.', ['v12', 'v13', 'v15'], null, 'reframes'],
  ['Q6', 'poincare', -1, 'The Academy\'s rule: “one madman the more”', 'Poincaré applies Hume\'s comparison to circle-squarers, and admits the reasons are psychological rather than mathematical.', ['po15', 'po16', 'po17']],
  // Q7
  ['Q7', 'laplace', 2, 'Constant causes prevail in the long run', 'Bernoulli\'s theorem shows regularity without Providence, and Laplace extends it to institutions, justice and empires.', ['l16', 'l18', 'l17']],
  ['Q7', 'darwin', 1, 'Stable proportions come from causes, not chance', 'The regular proportions of an entangled bank are the output of the struggle for existence, not of chance.', ['d2']],
  ['Q7', 'jevons', 1, 'The mean of many errors nears the truth', 'For measurement, the long-run behaviour of means is the only guide when instruments disagree.', ['j11']],
  ['Q7', 'peirce', 0, 'It defines probability — no life is long enough', 'The long run is what probability means, yet every finite gambler is ruined and every life ends: the theorem points beyond the individual.', ['p16', 'p17', 'p18']],
  ['Q7', 'venn', -2, 'A “relic of Realism”', 'Venn accepts long-run frequency but denies there is any objective probability for it to converge to, and warns that social series change type.', ['v16', 'v17', 'v18']],
  ['Q7', 'poincare', 2, 'Real: insurance dividends are not ignorance', 'The law of great numbers produces dividends that would survive an all-knowing physician: the regularity is objective.', ['po18', 'po19']],
  // Q8
  ['Q8', 'hume', 1, 'Custom guides; the wise proportion belief', 'Without the habit of expecting the past to repeat there would be no action at all.', ['h9', 'h16']],
  ['Q8', 'laplace', 2, '“No arbitrariness in the choice”', 'Probability is common sense reduced to calculus and can always determine the most advantageous choice.', ['l19', 'l22']],
  ['Q8', 'mill', 0, 'Only where contradiction stays free', 'Mill voices the “assurance sufficient for human life” argument as an objection, then answers it: we may act on an opinion only if it remains open to refutation.', ['m1:objection', 'm2', 'm3']],
  ['Q8', 'jevons', 2, '“The very guide of life”', 'Jevons adopts Butler\'s maxim and defines rational expectation as what leads, in the long run, to the least disappointment.', ['j12:quotes', 'j13']],
  ['Q8', 'peirce', 0, 'Only for an unlimited community', 'Since a single case has no probability, acting on chances is rational only for someone whose interests extend to the indefinite community.', ['p19', 'p20']],
  ['Q8', 'venn', 1, 'Through aggregates, not prophecy', 'Probability cannot remove individual uncertainty but lets us act (insurance) so that its consequences matter less; beyond series it offers only rough belief.', ['v19', 'v20']],
  ['Q8', 'poincare', 1, 'It works — and acting is not the explanation', 'He states the “act as if” defence and finds it too thin: insurance dividends are objective and need explaining.', ['po20:rejects', 'po21']],
  ['Q8', 'russell', 1, 'All conduct rests on it — on an unproved principle', 'Most of what passes for knowledge is probable opinion, and all conduct depends on the inductive principle.', ['r8', 'r7']],
];

// Where an author is silent, a short AI note says why (optional).
export const SILENCE = {
  'Q5|mill': 'Mill treats induction in A System of Logic, which is not on this shelf. Jevons (ch. X) attacks him for “depreciating” the theory of probability.',
  'Q1|mill': 'On Liberty does not discuss probability; it is on the shelf for its argument about acting on fallible opinion (Q8).',
  'Q6|russell': 'The Problems of Philosophy does not take up testimony for miracles.',
  'Q4|poincare': 'Poincaré never states the rule of succession on this shelf; his treatment of a priori conventions (Q3) bears on it directly.',
  'Q6|jevons': 'The Principles of Science does not discuss testimony for miracles.',
  'Q2|russell': 'Russell does not take up chance in this book; determinism appears only as the “reign of law” assumed by science.',
};

// ---------------------------------------------------------------- vocabulary map
export const VOCAB = [
  {
    id: 'V1', concept: 'The number itself: what a probability measures',
    gloss: 'The same fraction is called a superiority of chances, a quantity of knowledge, a proportion in the long run, a relative number, or a subjective and objective probability.',
    cells: [
      ['hume', 'superiority of chances', 'h1'],
      ['laplace', 'ratio of favourable to possible cases', 'l2'],
      ['jevons', 'quantity of knowledge', 'j2'],
      ['peirce', 'materialistic / conceptualistic view', 'p21'],
      ['venn', 'proportion … in the long run', 'v1'],
      ['poincare', 'subjective / objective probability', 'po2'],
      ['russell', 'probable opinion', 'r7'],
    ],
  },
  {
    id: 'V2', concept: 'Reasoning from observed effects back to causes',
    gloss: 'Laplace\'s “passing from events to causes” becomes inverse probability, the inverse method, the probability of causes, and Peirce\'s synthetic inference.',
    cells: [
      ['hume', '“probability of causes” (a false friend)', 'h17'],
      ['laplace', 'passing from events to causes', 'l20'],
      ['darwin', 'the mere doctrine of chances', 'd3'],
      ['jevons', 'inverse application', 'j17'],
      ['peirce', 'synthetic / amplifiative inference', 'p26'],
      ['venn', 'Direct and Inverse Probability', 'v25'],
      ['poincare', 'probability of causes', 'po23'],
    ],
    warn: 'Hume\'s “probability of causes” (§47) means the probability that arises when causes act irregularly. It is not Laplace\'s inference from effects to causes.',
  },
  {
    id: 'V3', concept: 'Spreading ignorance evenly over the possibilities',
    gloss: 'The principle Keynes would later name “indifference” appears here as equal possibility, equal distribution, sufficient reason, an even chance, and a convention.',
    cells: [
      ['hume', 'alike probable', 'h5'],
      ['laplace', 'equally possible / equally undecided', 'l2'],
      ['jevons', 'equal distribution of knowledge (Boole: “of ignorance”)', 'j14'],
      ['peirce', 'an even chance of a totally unknown event', 'p11'],
      ['venn', 'Principle of Sufficient Reason', 'v26'],
      ['poincare', 'convention / principle of sufficient reason', 'po25'],
    ],
  },
  {
    id: 'V4', concept: 'The unknown objective chance of a simple event',
    gloss: 'What Laplace calls the “possibility” of an event is, for others, a tendency of the coin, or a reified “objective probability”.',
    cells: [
      ['laplace', 'possibility (of simple events)', 'l23'],
      ['jevons', 'probable tendency of the coin', 'j18'],
      ['peirce', 'inherent chance (to be avoided, 1878)', 'p6'],
      ['venn', '“objective probability” (rejected)', 'v23'],
      ['poincare', 'objective probability (the long-run record)', 'po2'],
    ],
    warn: '“Objective probability” is a false friend: Venn uses it for a hidden propensity he denies exists; Poincaré uses it for the observed long-run agreement of results with the calculus.',
  },
  {
    id: 'V5', concept: 'Is a probability relative to the person?',
    gloss: 'Laplace, Peirce and Russell call probability relative (to knowledge, premises, data); Venn calls that word misleading. They mostly agree on the facts and differ on the description.',
    cells: [
      ['laplace', 'relative … to this ignorance … to our knowledge', 'l1'],
      ['jevons', 'different minds … different degrees', 'j19'],
      ['peirce', 'relative to premises', 'p25'],
      ['venn', '“relativeness” is a misleading expression', 'v22'],
      ['russell', 'relative to certain data', 'r1'],
    ],
  },
  {
    id: 'V6', concept: 'The value of a gamble',
    gloss: 'Laplace\'s espérance, translated as “hope”, is Venn\'s “expectation”; the moral (utility-weighted) version of each is Daniel Bernoulli\'s.',
    cells: [
      ['laplace', 'mathematical hope / moral hope', 'l21'],
      ['jevons', 'rational expectation', 'j13'],
      ['peirce', 'the value of his expectation', 'p29'],
      ['venn', 'mathematical / moral expectation', 'v24'],
    ],
    warn: 'The Truscott–Emory translation of Laplace renders espérance as “hope”; English writers of the period say “expectation”. Same concept, translator\'s word.',
  },
  {
    id: 'V7', concept: 'What kind of knowledge the calculus is',
    gloss: 'One French sentence, two English translations; and three rival descriptions of the science itself.',
    cells: [
      ['laplace', 'common sense reduced to calculus', 'l19'],
      ['jevons', 'good sense reduced to calculation (quoting Laplace)', 'j15'],
      ['peirce', 'the science of logic quantitatively treated', 'p3'],
      ['poincare', 'a paradox', 'po3'],
      ['venn', 'individual irregularity with aggregate regularity', 'v2'],
    ],
    warn: 'Jevons quotes Laplace from a different translation than the 1902 one on this shelf, so the page cannot match the two verbatim; the link is an AI reading, not a detected echo.',
  },
];

// ---------------------------------------------------------------- conversations
// turn: [quote id, role, respondsTo (index of earlier turn, AI-inferred) | null]
export const THREADS = [
  {
    id: 'sunrise', title: 'Will the sun rise tomorrow?',
    lede: 'From a conceivable non-event to a bet of 1,826,214 to one, and back to a chicken.',
    turns: [
      ['h6', 'claim', null],
      ['h7', 'distinction', null],
      ['l8', 'number', 0],
      ['l9', 'repair', 2],
      ['j7', 'number', 2],
      ['j8', 'example', null],
      ['p10', 'objection', 2],
      ['p12', 'objection', null],
      ['v9', 'citation', 2],
      ['v7', 'critique', 8],
      ['v32', 'citation', 5],
      ['v10', 'critique', 10],
      ['r3', 'reply', 0],
      ['r2', 'example', null],
      ['r6', 'concession', null],
    ],
    notes: {
      2: 'Sixty-six years later the conceivable becomes calculable: Laplace prices the sunrise with Bayes\'s rule and a uniform prior.',
      6: 'Peirce, writing in Popular Science Monthly, attacks the rule at its zero point rather than at its large numbers.',
      8: 'Venn\'s third edition answers Laplace and Jevons by name; both echoes below were found by the page, not asserted by the model.',
      12: 'Russell returns to Hume\'s question without the formula: probability, yes, but resting on a principle nobody can prove.',
    },
  },
  {
    id: 'chance', title: 'Is chance only our ignorance?',
    lede: 'A century of agreement that chance is a name for ignorance, then two different ways out.',
    turns: [
      ['h3', 'claim', null],
      ['l4', 'claim', 0],
      ['l3', 'example', null],
      ['d1', 'concession', 0],
      ['j4', 'citation', 1],
      ['p6', 'warning', null],
      ['v21', 'citation', 0],
      ['v3', 'reframe', 6],
      ['p4', 'objection', 1],
      ['p5', 'claim', 8],
      ['po4', 'stated to reject', 0],
      ['po7', 'objection', 10],
      ['po22', 'claim', 10],
    ],
    notes: {
      3: 'Darwin, the same year as On Liberty, uses “chance” only as a confession of ignorance.',
      6: 'Venn quotes Hume almost verbatim; the page detects the shared words.',
      8: 'In 1892 Peirce turns against the consensus his own 1878 essay had shared.',
      10: 'Poincaré states the ignorance view in its sharpest form in order to refute it.',
    },
  },
  {
    id: 'testimony', title: 'How far should testimony move us?',
    lede: 'Hume\'s maxim, Laplace\'s calculus of witnesses, and Venn\'s claim that the argument never touches the real disagreement.',
    turns: [
      ['h10', 'claim', null],
      ['h11', 'claim', null],
      ['h13', 'method', null],
      ['l12', 'claim', 1],
      ['l15', 'example', null],
      ['l14', 'claim', 1],
      ['v28', 'citation', 2],
      ['v14', 'objection', 3],
      ['v12', 'objection', 4],
      ['v13', 'reframe', null],
      ['v29', 'irony', 1],
      ['v15', 'image', null],
      ['po15', 'example', 1],
      ['po16', 'concession', null],
    ],
    notes: {
      3: 'Laplace turns Hume\'s balance of experiences into a ratio of hypotheses — the same verdict, now with urns.',
      6: 'Venn reprints Hume\'s subtraction rule in a footnote; the page finds the shared words despite Venn\'s modernised spelling.',
      9: 'The turn of the conversation: if the parties differ about universal causation, no calculus of witnesses can decide between them.',
      12: 'Poincaré\'s Academy applies Hume\'s comparison to mathematics and calls it psychology.',
    },
  },
  {
    id: 'longrun', title: 'What does the long run owe us?',
    lede: 'From lotteries as certain as agriculture to a logic that needs an unlimited community.',
    turns: [
      ['l16', 'theorem', null],
      ['l18', 'claim', 0],
      ['j13', 'claim', 1],
      ['p16', 'objection', 1],
      ['p18', 'claim', null],
      ['p19', 'claim', 4],
      ['v16', 'critique', 0],
      ['v17', 'critique', null],
      ['v19', 'claim', null],
      ['po18', 'reply', 6],
      ['po7', 'reply', null],
      ['r8', 'claim', null],
    ],
    notes: {
      3: 'Peirce accepts the long run and draws the conclusion nobody else does: for any one gambler it ends in ruin.',
      6: 'Venn quotes Laplace\'s Providence passage from another translation and calls Bernoulli\'s theorem a relic of Realism.',
      9: 'Poincaré answers with balance sheets: the dividends would survive an all-knowing physician.',
    },
  },
];

// ---------------------------------------------------------------- disagreement
// AI-proposed dependency graph: if two authors disagree upstream, the downstream
// disagreements are probably consequences.
export const DEPS = [
  ['Q1', 'Q3'], ['Q1', 'Q7'], ['Q1', 'Q8'], ['Q2', 'Q7'], ['Q2', 'Q6'],
  ['Q3', 'Q4'], ['Q3', 'Q6'], ['Q4', 'Q5'], ['Q5', 'Q8'], ['Q7', 'Q8'],
];

export const KINDS = {
  definition: 'Definition — at risk of being verbal: the parties may mean different things by “probability”.',
  fact: 'Fact (metaphysical) — about what the world contains; no calculation settles it.',
  method: 'Method — about which assumptions a calculation may legitimately start from.',
  justification: 'Justification — about what could make an inference reasonable at all.',
  framework: 'Framework — about whether the question is one probability can answer.',
  interpretation: 'Interpretation — a shared theorem, read as being about different things.',
  value: 'Value — about how to act and what we owe to others when acting on chances.',
};

export const PAIRS = {
  'laplace|venn': 'The cleanest crux on the shelf. Laplace\'s probability is a state of knowledge, so ignorance can be divided evenly; Venn\'s is a proportion in a series, so ignorance yields nothing. Their quarrels over the sunrise and the long run follow from that.',
  'hume|laplace': 'Hume describes how belief follows counted chances; Laplace turns that psychology into a calculus. They agree on chance and on miracles, and part on whether induction is reasoning (Laplace) or custom (Hume).',
  'jevons|venn': 'Contemporaries in open dispute: Venn calls Jevons\'s grounding of induction in probability “curious” and mocks the pilot-fish odds. The root is Q1: knowledge in the mind against frequency in a series.',
  'peirce|venn': 'Allies on the definition (Peirce credits Venn), divided on what follows from it: Peirce makes frequency a theory of inference whose validity lives in the long run of an unlimited community, and later gives chance a place in nature.',
  'laplace|peirce': 'Peirce attacks the inverse method at its root (equal probability for the unknown) and later rejects Laplace\'s determinism outright. Two cruxes, one logical (Q3) and one metaphysical (Q2).',
  'laplace|poincare': 'Poincaré keeps Laplace\'s calculus but not its foundations: indifference becomes a convention that must wash out, and chance becomes instability rather than ignorance.',
  'hume|russell': 'Russell restates Hume\'s problem in probabilistic language and accepts its force. Where Hume rests on custom, Russell rests on an inductive principle accepted for its intrinsic evidence.',
  'jevons|peirce': 'Both are logicians of science. Jevons grounds induction in inverse probability; Peirce denies that synthetic conclusions have probabilities at all, only methods with track records.',
  'poincare|venn': 'Both doubt the classical priors, but Poincaré takes the law of large numbers to be about the world (dividends), and Venn takes it to be about the series we construct.',
  'hume|venn': 'Venn quotes Hume with approval on chance and on miracles, then argues that the miracle debate is not one that testimony rules can settle.',
  'darwin|peirce': 'Darwin\'s “chance” confesses ignorance of the causes of variation; Peirce\'s 1892 cosmology makes chance a real source of variety, partly inspired by evolution.',
};

// ---------------------------------------------------------------- live example
// A sub-question added the way the live feature adds one, precomputed so the
// static wiki has a meaningful example. Quotes are verified like all others.
export const EXAMPLE = {
  q: 'Can a single event have a probability?',
  poles: ['no — only series do', 'yes — for a mind'],
  terms: ['single', 'individual', 'isolated', 'unique', 'once', 'single case', 'one event', 'repeated'],
  cells: [
    ['hume', 1, 'Yes: steadiness of expectation', 'Hume\'s die is thrown once; what varies is how steady our expectation is.', ['h18']],
    ['laplace', 2, 'Yes, relative to each listener\'s knowledge', 'One incident, told to one assembly, earns different degrees of credence from different auditors.', ['l25']],
    ['jevons', 2, 'Yes: the event is fixed, the probability is ours', 'The missing steamer has either sunk or not; probability belongs to the minds considering it.', ['j16']],
    ['peirce', -2, 'No — yet choose the redder pack', 'A single case has no probability, but it would be folly not to prefer the better pack: the paradox that leads Peirce to the social principle.', ['p20', 'p28']],
    ['venn', -1, 'Only via a series, or as rough belief', 'Venn will compare unique events only through the “measure of belief”, which he calls exceedingly rough, and doubts De Morgan\'s individual judgments.', ['v30', 'v31']],
    ['poincare', 1, 'Yes, as advice: subjective probability', 'The gambler\'s one coup gets subjective probability; the observer\'s long book gets objective probability.', ['po1']],
  ],
};
