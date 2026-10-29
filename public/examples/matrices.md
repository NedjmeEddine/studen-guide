---
title: Matrices: Rank, Inverses & Diagonalization
subject: Mathematics
course: ENSTA Linear Algebra 2025/2026
difficulty: exam
est-time: 50m
lang: en
mode: both
extras: [quiz, flashcards]
---

## 1. Matrix Invertibility & Determinants

Hook: a square matrix represents a geometric transformation; its determinant measures how hyper-volume scales, and non-zero determinant guarantees a unique inverse transformation.

:::definition Invertible Matrix & Rank
A square matrix $A \in \mathcal{M}_n(\mathbb{R})$ is **invertible** (non-singular) if and only if:
$$\det(A) \neq 0 \iff \text{rank}(A) = n \iff \ker(A) = \{0\}$$
:::

:::formula 2x2 Inverse & Cramer Shortcut
For $A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$ with $\det(A) = ad - bc \neq 0$:
$$A^{-1} = \frac{1}{ad - bc} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$$
:::

:::trap The Determinant Addition Fallacy
$$\det(A + B) \neq \det(A) + \det(B) \qquad \text{(In general!)}$$
However, determinants are strictly multiplicative:
$$\det(AB) = \det(A)\det(B), \qquad \det(A^{-1}) = \frac{1}{\det(A)}, \qquad \det(kA) = k^n \det(A)$$
_Notice the $k^n$ exponent for an $n \times n$ matrix!_
:::

## 2. Computational Complexity of Matrix Solvers

When solving linear systems $Ax = b$ of dimension $n$:

```plot
# Algorithm Time Complexity Scaling with Matrix Dimension n
# O(n^3): Standard Gaussian Elimination
y = 0.05 * x^3 from 1 to 20
# O(n^2.81): Strassen Matrix Algorithm
y = 0.05 * x^2.81 from 1 to 20
# O(n^2): Matrix-Vector Multiplication / Back-substitution
y = 0.5 * x^2 from 1 to 20
```

| Method                | Flop Complexity              | Stable on Arbitrary $A$?             | Choose When…                                               |
| --------------------- | ---------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| **Gaussian (LU)**     | $\frac{2}{3}n^3 + O(n^2)$    | Yes (with partial pivoting)          | Standard dense linear solver ($n \le 5\,000$).             |
| **Cholesky ($LL^T$)** | $\frac{1}{3}n^3$ (2× faster) | Requires symmetric positive-definite | Covariance matrices, energy minimization.                  |
| **Strassen**          | $O(n^{2.807})$               | Recursive, higher numerical error    | Giant theoretical matrix multiplication ($n \ge 10\,000$). |

## 3. Eigenvalues & Diagonalization

```plot3d
# Quadratic Form & ML Loss Landscape: Hyperbolic Paraboloid Saddle Point (lambda_1 > 0, lambda_2 < 0)
z = x^2 - y^2 from -2 to 2
```

:::theorem The Diagonalization Condition
A matrix $A \in \mathcal{M}_n(\mathbb{R})$ is **diagonalizable** over $\mathbb{R}$ if and only if:

1. Its characteristic polynomial $P_A(\lambda) = \det(A - \lambda I)$ splits completely into linear factors over $\mathbb{R}$.
2. For every eigenvalue $\lambda_i$, the geometric multiplicity equals the algebraic multiplicity:
   $$\dim\left(\ker(A - \lambda_i I)\right) = m_i$$
   Then $A = P D P^{-1}$, where $D = \text{diag}(\lambda_1, \dots, \lambda_n)$ and columns of $P$ are the linearly independent eigenvectors.
   :::

### Methods to Compute $A^k$

| Method                               | Computational Cost                                | Prerequisite                   | Failure Mode                                            |
| ------------------------------------ | ------------------------------------------------- | ------------------------------ | ------------------------------------------------------- |
| **Diagonalization ($P D^k P^{-1}$)** | Eigenvalues + matrix inversion                    | $n$ independent eigenvectors   | Fails if defective ($m_{\text{geo}} < m_{\text{alg}}$). |
| **Cayley–Hamilton**                  | Polynomial division $x^k = P(\lambda)Q(x) + R(x)$ | Characteristic polynomial      | Tedious for $n \ge 4$.                                  |
| **Jordan Normal Form**               | Generalized eigenvectors                          | Always works over $\mathbb{C}$ | Computationally sensitive.                              |

:::trap The Real vs Complex Eigenvalues Trap
A real symmetric matrix $A = A^T$ is **always** diagonalizable over $\mathbb{R}$ with orthogonal eigenvectors (Spectral Theorem). But an arbitrary real matrix can have purely complex eigenvalues (e.g. 2D rotation $\begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix} \Rightarrow \lambda = \pm i$).
:::

## 4. Worked Exam Exercises

:::exercise tag:exam
Let $A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$. Compute eigenvalues, eigenvectors, and calculate $A^5$.
:::solution

1. **Characteristic polynomial**:
   $$\det(A - \lambda I) = \det\begin{pmatrix} 1-\lambda & 2 \\ 2 & 1-\lambda \end{pmatrix} = (1-\lambda)^2 - 4 = \lambda^2 - 2\lambda - 3 = (\lambda - 3)(\lambda + 1)$$
   Eigenvalues: $\lambda_1 = 3$, $\lambda_2 = -1$.
2. **Eigenvectors**:
   For $\lambda_1 = 3$:
   $$\begin{pmatrix} -2 & 2 \\ 2 & -2 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix} \Rightarrow x = y \Rightarrow v_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}$$
   For $\lambda_2 = -1$:
   $$\begin{pmatrix} 2 & 2 \\ 2 & 2 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix} \Rightarrow x = -y \Rightarrow v_2 = \begin{pmatrix} 1 \\ -1 \end{pmatrix}$$
3. **Diagonalization**:
   $$P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \qquad D = \begin{pmatrix} 3 & 0 \\ 0 & -1 \end{pmatrix}, \qquad P^{-1} = \frac{1}{-2}\begin{pmatrix} -1 & -1 \\ -1 & 1 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$
4. **Power $A^5$**:
   $$A^5 = P D^5 P^{-1} = P \begin{pmatrix} 3^5 & 0 \\ 0 & (-1)^5 \end{pmatrix} P^{-1} = \frac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix} 243 & 0 \\ 0 & -1 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$
   $$A^5 = \frac{1}{2}\begin{pmatrix} 243 & -1 \\ 243 & 1 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} 242 & 244 \\ 244 & 242 \end{pmatrix} = \begin{pmatrix} 121 & 122 \\ 122 & 121 \end{pmatrix}$$
   _Where students lose marks: forgetting the factor of $\frac{1}{\det(P)}$ when inverting $P$._
   :::
   :::

:::exercise tag:medium
If $A \in \mathcal{M}_3(\mathbb{R})$ has $\det(A) = 5$, what is $\det(2 A^{-1})$?
:::solution

1. **Multiplication by scalar in dimension $n=3$**:
   $$\det(k M) = k^n \det(M) \Rightarrow \det(2 A^{-1}) = 2^3 \det(A^{-1})$$
2. **Inverse determinant**:
   $$\det(A^{-1}) = \frac{1}{\det(A)} = \frac{1}{5}$$
3. **Calculation**:
   $$\det(2 A^{-1}) = 8 \times \frac{1}{5} = \frac{8}{5} = 1.6$$
   :::
   :::

## 5. Exam Traps & Checklist

:::checklist Final Exam Traps

- [ ] $\det(kA) = k^n \det(A)$ with exponent $n$, not $k\det(A)$.
- [ ] Swapping two rows changes the sign of the determinant ($\times -1$).
- [ ] Adding a multiple of row $i$ to row $j$ does **not** change the determinant.
- [ ] Triangular matrices have determinant equal to the product of diagonal entries.
- [ ] Orthogonal matrix $Q$: $Q^T Q = I \Rightarrow \det(Q) = \pm 1$.
      :::

```quiz
1. For an invertible 3x3 matrix A with det(A) = 4, what is det(3A)?
   a) 12   b) 36   c) 108
   ! c
   > det(kA) = k^n * det(A) = 3^3 * 4 = 27 * 4 = 108.
2. A real matrix has characteristic polynomial P(λ) = (λ - 2)^2 (λ - 5). For A to be diagonalizable, what must dim(ker(A - 2I)) equal?
   a) 1   b) 2   c) 3
   ! b
   > Geometric multiplicity of eigenvalue 2 must equal its algebraic multiplicity (2).
3. What is the determinant of any square matrix that has a column of all zeros?
   ! 0 (zero)
   > Expanding along the zero column yields 0; rank is strictly less than n.
```

```flashcards
Rank-Nullity Theorem :: rank(A) + nullity(A) = n (number of columns)
det(AB) :: det(A) * det(B)
det(kA) for n x n matrix :: k^n * det(A)
Spectral Theorem :: Every real symmetric matrix is orthogonally diagonalizable
```
