
use napi::{Error, Status};
use napi_derive::napi;

#[cfg(target_os = "macos")]
extern crate blas;

#[cfg(target_os = "macos")]
#[napi]
pub fn multiply_accelerate(a: Vec<Vec<f64>>, b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    let (m, k, n) = crate::helpers::dims_match(&a, &b)?;

    // col-major для BLAS
    let mut flat_a = Vec::with_capacity(m * k);
    for j in 0..k {
        for i in 0..m {
            flat_a.push(a[i][j]);
        }
    }
    let mut flat_b = Vec::with_capacity(k * n);
    for j in 0..n {
        for i in 0..k {
            flat_b.push(b[i][j]);
        }
    }
    let mut flat_c = vec![0.0; m * n];

    // Оптимизация: умножение матриц с помощью BLAS
    unsafe {
        blas::dgemm(
            b'N', b'N',
            m as i32, n as i32, k as i32,
            1.0,
            &flat_a, m as i32,
            &flat_b, k as i32,
            0.0,
            &mut flat_c, m as i32,
        );
    }

    let mut result = vec![vec![0.0; n]; m];
    for j in 0..n {
        for i in 0..m { 
            result[i][j] = flat_c[j * m + i];
        }
    }
    Ok(result)
}

#[cfg(target_os = "macos")]
#[napi]
pub async fn multiply_accelerate_async(a: Vec<Vec<f64>>, b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    tokio::task::spawn_blocking(move || multiply_accelerate(a, b))
        .await
        .map_err(|e| Error::new(Status::GenericFailure, format!("Не удалось умножить матрицы: {e}")))?
}

#[cfg(not(target_os = "macos"))]
#[napi]
pub fn multiply_accelerate(_a: Vec<Vec<f64>>, _b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    Err(Error::new(Status::GenericFailure, "Accelerate framework недоступен на этой платформе."))
}

#[cfg(not(target_os = "macos"))]
#[napi]
pub async fn multiply_accelerate_async(_a: Vec<Vec<f64>>, _b: Vec<Vec<f64>>) -> napi::Result<Vec<Vec<f64>>> {
    Err(Error::new(Status::GenericFailure, "Accelerate framework недоступен на этой платформе."))
}