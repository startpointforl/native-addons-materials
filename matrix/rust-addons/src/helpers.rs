use napi::{Error, Status};

pub fn dims_match(a: &Vec<Vec<f64>>, b: &Vec<Vec<f64>>) -> Result<(usize, usize, usize), Error> {
    if a.is_empty() || b.is_empty() || a[0].is_empty() || b[0].is_empty() {
        return Err(Error::new(Status::InvalidArg, "Матрицы не могут быть пустыми"));
    }
    let n = a.len();
    let k1 = a[0].len();
    let k2 = b.len();
    let m = b[0].len();
    if k1 != k2 {
        return Err(Error::new(Status::InvalidArg, "Неверные размеры матриц"));
    }
    Ok((n, k1, m))
}

// Vec<Vec<f64>> -> Vec<f64> row-major
#[inline]
pub fn flatten_row_major(a: &Vec<Vec<f64>>) -> (usize, usize, Vec<f64>) {
    let n = a.len();
    let m = a[0].len();
    let mut out = Vec::with_capacity(n * m);
    for row in a {
        out.extend_from_slice(row);
    }
    (n, m, out)
}

// B: k x m (row-major) -> BT: m x k (row-major)
#[inline]
pub fn transpose_row_major(b_rm: &[f64], k: usize, m: usize) -> Vec<f64> {
    let mut bt = vec![0.0; m * k];
    for i in 0..k {
        let bi = &b_rm[i * m..(i + 1) * m];
        for j in 0..m {
            bt[j * k + i] = bi[j];
        }
    }
    bt
}

// row-major -> Vec<Vec<f64>>
#[inline]
pub fn row_major_to_vec(c_rm: Vec<f64>, n: usize, m: usize) -> Vec<Vec<f64>> {
    let mut out = Vec::with_capacity(n);
    for i in 0..n {
        out.push(c_rm[i * m..(i + 1) * m].to_vec());
    }
    out
}
