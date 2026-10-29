# Domain Pack — Mathematics

Applies when `subject:` is Algebra (linear algebra, algebra 2), Analysis
(calculus), Logic, Probability/Statistics, or any math course. This pack
steers usage of the existing dialect; it adds no new syntax.

## The graph mandate (hard rule)

**If a section teaches a function, transformation, inequality, sequence, or
distribution on ℝ, it MUST include at least one `plot` block.** Math guides
that are 100% text lose the intuition layer that makes theorems stick.

Required plots (pick the relevant ones per sheet):

| Concept                                    | Plot it as                                             |
| ------------------------------------------ | ------------------------------------------------------ |
| Function family / definition               | 2–3 members overlaid, `from` the relevant window       |
| Derivative / sign table                    | `f` and `f'` on one plot — signs become visible        |
| Limits / asymptotes                        | plot with the asymptotic window, e.g. `from 2 to 8`    |
| Inequality / solution set                  | plot `f`, state the solution interval below it         |
| Sequences & convergence                    | partial sums or `a_n` vs `n`                           |
| Newton / fixed-point iteration             | the curve + iteration staircase intuition line         |
| Growth-rate comparison (algorithms, big-O) | `log(x)`, `x`, `x*log(x)`, `x^2` together              |
| Normal distribution / statistics           | density curve; shade intuition by stating the interval |

Exceptions (no plot needed): pure algebraic manipulation sections, matrix
computation walkthroughs, proof steps with no geometric content.

## 3D Surfaces & Multivariable Calculus (`plot3d`)

**For quadric surfaces, quadratic forms, multivariable calculus, and machine learning loss landscapes, use the `plot3d` block.** The renderer automatically generates an interactive WebGL 3D surface with drag-rotation, pinch-zoom, and colormap shading.

```plot3d
# Hyperbolic Paraboloid Loss Landscape: Saddle Point (lambda_1 > 0, lambda_2 < 0)
z = x^2 - y^2 from -2 to 2
```

Supported 3D concepts:

- **Quadratic Forms & SVD**: $z = x^T A x$ showing positive-definite paraboloids ($x^2 + y^2$) vs indefinite saddle points ($x^2 - y^2$).
- **Bivariate Distributions**: $z = 3 * \exp(-(x^2 + y^2)/2)$ for 2D Gaussian probability densities.
- **Wave Interference**: $z = \sin(\sqrt{x^2 + y^2})$ for radial harmonic ripples.

## Formatting rules

1. **Matrices are KaTeX, never layout-by-spaces.** Use `\begin{pmatrix}`
   / `bmatrix` / augmented matrices. _(Known failure of the older HTML
   guides: matrices typed with spaces inside a text span.)_
2. **Multi-step derivations** use `$$…$$` with `aligned`, one step per line,
   with the justification as a `\text{}` comment or trailing short note.
3. **Proof anatomy**: statement (as `:::theorem`) → one-line intuition
   (+ plot when possible) → proof sketch in a `:::solution` →
   counterexample or boundary case as `:::trap`.
4. **Method selection is content.** When a problem type has several methods
   (Aⁿ: diagonalization / Cayley–Hamilton / direct powers), give a compare
   table: method, cost, when it wins, when it fails.
5. **Worked exercises**: statement → approach (1 line) → numbered steps →
   boxed answer → _"where students lose marks"_ line.
6. Clone the course's worksheet style if the student supplies samples —
   same exercise phrasing and sub-question structure.
7. Rote-critical items are boxes, never prose: `:::definition`,
   `:::theorem`, `:::formula`; error patterns are `:::trap`.

## Content traps worth a `:::trap` (recurring in this domain)

- Subspace test: forgetting $0 \in W$ and closure checks.
- Basis vs spanning set vs linearly independent — three different claims.
- Eigenvalues of a real matrix can be complex; say when ℂ is allowed.
- Row swaps change det's sign; $C(A,B)$ vs $C(B,A)$ in change of basis.
- "$f$ linear" implies $f(0)=0$ — instant rejection test for bad candidates.
- Rank–nullity counts _dimensions_, not vectors.

## Section skeleton

````markdown
## <Concept>

:::definition <Term>
<One-sentence precise definition + the symbol it gets.>
:::

```plot
<the defining curve(s) in the relevant window>
```
````

:::theorem <Name, if any>
<Statement.>
:::
:::solution
<Intuition first, then the argument.>
:::

:::exercise tag:exam
<Worksheet-style statement.>
:::solution
<numbered steps → boxed answer → loss-of-marks note>
:::
:::

```

```
