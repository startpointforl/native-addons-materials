use wide::f64x4;
use napi::{Error, Status};
use napi_derive::napi;
use crate::helpers::{dims_match, flatten_row_major, row_major_to_vec, transpose_row_major};

#[inline]
pub fn dot_wide(a: &[f64], b: &[f64]) -> f64 {
    debug_assert_eq!(a.len(), b.len());
    let len = a.len();
    let head_len = len - (len % 4);

    let (head_a, tail_a) = a.split_at(head_len);
    let (head_b, tail_b) = b.split_at(head_len);

    let mut acc = f64x4::from(0.0);
    for (ca, cb) in head_a.chunks_exact(4).zip(head_b.chunks_exact(4)) {
        // Оптимизация: Загружаем по 4 double сразу из a и b
        let va = f64x4::from([ca[0], ca[1], ca[2], ca[3]]);
        let vb = f64x4::from([cb[0], cb[1], cb[2], cb[3]]);
        acc = acc + va * vb;
    }
    let lanes = acc.to_array();
    let mut sum = lanes[0] + lanes[1] + lanes[2] + lanes[3];

    for (x, y) in tail_a.iter().zip(tail_b) {
        sum += x * y;
    }
    sum
}

#[inline]
pub fn matmul_simd_row_row(a_rm: &[f64], bt_rm: &[f64], n: usize, k: usize, m: usize) -> Vec<f64> {
    let mut c = vec![0.0; n * m];
    for i in 0..n {
        let arow = &a_rm[i * k..(i + 1) * k];
        let crow = &mut c[i * m..(i + 1) * m];
        for j in 0..m {
            let btrow = &bt_rm[j * k..(j + 1) * k];
            crow[j] = dot_wide(arow, btrow);
        }
    }
    c
}

#[napi]
pub fn multiply_simd(a: Vec<Vec<f64>>, b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    // Оптимизации
	// 1. Сплющиваем a и b в row-major
	// 2. Транспонируем b в bt_rm
	// 3. Вызываем matmul_simd_row_row
	// 4. Возвращаем результат, распаковывая в JS
    let (n, k, m) = dims_match(&a, &b)?;
    let (_, _, a_rm) = flatten_row_major(&a);
    let (_, _, b_rm) = flatten_row_major(&b);
    let bt_rm = transpose_row_major(&b_rm, k, m);
    let c_rm = matmul_simd_row_row(&a_rm, &bt_rm, n, k, m);
    Ok(row_major_to_vec(c_rm, n, m))
}

#[napi]
pub async fn multiply_simd_async(a: Vec<Vec<f64>>, b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    tokio::task::spawn_blocking(move || multiply_simd(a, b))
        .await
        .map_err(|e| Error::new(Status::GenericFailure, format!("Не удалось умножить матрицы: {e}")))?
}