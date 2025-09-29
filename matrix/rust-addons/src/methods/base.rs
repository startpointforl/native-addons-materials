use napi::{Error, Status};
use napi_derive::napi;

use crate::helpers::{dims_match, flatten_row_major, row_major_to_vec};

#[napi]
pub fn multiply_base(a: Vec<Vec<f64>>, b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    let (n, k, m) = dims_match(&a, &b)?;
    let (_, _, a_rm) = flatten_row_major(&a);
    let (_, _, b_rm) = flatten_row_major(&b);

    let mut c = vec![0.0; n * m];
    for i in 0..n {
        for j in 0..m {
            let mut s = 0.0;
            for t in 0..k {
                s += a_rm[i * k + t] * b_rm[t * m + j];
            }
            c[i * m + j] = s;
        }
    }
    Ok(row_major_to_vec(c, n, m))
}

#[napi]
pub async fn multiply_async(a: Vec<Vec<f64>>, b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    tokio::task::spawn_blocking(move || multiply_base(a, b))
        .await
        .map_err(|e| Error::new(Status::GenericFailure, format!("Не удалось умножить матрицы: {e}")))?
}