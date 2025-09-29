#include <vector>

bool CanMultiply(const std::vector<std::vector<double>>& a, const std::vector<std::vector<double>>& b) {
    return !a.empty() && !b.empty() && a[0].size() == b.size();
}

static bool ReadShape(const Napi::Array& mat, size_t& rows, size_t& cols) {
    rows = mat.Length();
    if (rows == 0) {
        cols = 0;
        return true;
    }

    Napi::Value first = mat.Get((uint32_t)0);
    if (!first.IsArray()) {
        return false;
    }

    cols = first.As<Napi::Array>().Length();
    for (uint32_t i = 0; i < rows; ++i) {
        Napi::Value v = mat.Get(i);
        if (!v.IsArray()) {
            return false;
        }

        if (v.As<Napi::Array>().Length() != cols) {
            return false;
        }
    }
    return true;
}

std::vector<std::vector<double>> JsArrayToMatrix(const Napi::Array& jsMatrix) {
    std::vector<std::vector<double>> matrix;
    for (uint32_t i = 0; i < jsMatrix.Length(); i++) {
        Napi::Array jsRow = jsMatrix.Get(i).As<Napi::Array>();
        std::vector<double> row;
        for (uint32_t j = 0; j < jsRow.Length(); j++) {
            row.push_back(jsRow.Get(j).As<Napi::Number>().DoubleValue());
        }
        matrix.push_back(row);
    }
    return matrix;
}
  
Napi::Array MatrixToJsArray(const Napi::Env& env, const std::vector<std::vector<double>>& matrix) {
    Napi::Array jsMatrix = Napi::Array::New(env, matrix.size());
    for (size_t i = 0; i < matrix.size(); i++) {
        Napi::Array jsRow = Napi::Array::New(env, matrix[i].size());
        for (size_t j = 0; j < matrix[i].size(); j++) {
            jsRow.Set(j, Napi::Number::New(env, matrix[i][j]));
        }
        jsMatrix.Set(i, jsRow);
    }
    return jsMatrix;
}

// JS number[][] -> vector col-major (по аналогии с flatten2D из js-native/worker)
static void FlattenToColMajor(const Napi::Array& mat, size_t rows, size_t cols, std::vector<double>& out) {
    out.resize(rows * cols);
    for (size_t i = 0; i < rows; ++i) {
        Napi::Array row = mat.Get((uint32_t)i).As<Napi::Array>();
        for (size_t j = 0; j < cols; ++j) {
            double val = row.Get((uint32_t)j).ToNumber().DoubleValue();
            out[j * rows + i] = val;
        }
    }
}

// vector col-major -> JS number[][] (по аналогии с unflatten2D из js-native/worker)
static Napi::Array ColMajorToJs(const Napi::Env& env, const std::vector<double>& colMajor, size_t rows, size_t cols) {
    Napi::Array jsRes = Napi::Array::New(env, rows);
    for (size_t i = 0; i < rows; ++i) {
        Napi::Array row = Napi::Array::New(env, cols);
        for (size_t j = 0; j < cols; ++j) {
            row.Set((uint32_t)j, Napi::Number::New(env, colMajor[j * rows + i]));
        }
        jsRes.Set((uint32_t)i, row);
    }
    return jsRes;
}

// JS number[][] -> vector row-major (по аналогии с flatten2D из js-native/worker)
static void FlattenRowMajor(const Napi::Array& mat, size_t rows, size_t cols, std::vector<double>& out) {
    out.resize(rows * cols);
    for (size_t i = 0; i < rows; ++i) {
        Napi::Array row = mat.Get((uint32_t)i).As<Napi::Array>();
        const size_t base = i * cols;
        for (size_t j = 0; j < cols; ++j) {
            out[base + j] = row.Get((uint32_t)j).ToNumber().DoubleValue();
        }
    }
}

// vector row-major -> JS number[][] (по аналогии с unflatten2D из js-native/worker)
static Napi::Array RowMajorToJs(const Napi::Env& env, const std::vector<double>& C, size_t rows, size_t cols) {
    Napi::Array jsRes = Napi::Array::New(env, rows);
    for (size_t i = 0; i < rows; ++i) {
        Napi::Array row = Napi::Array::New(env, cols);
        const size_t base = i * cols;
        for (size_t j = 0; j < cols; ++j) {
            row.Set((uint32_t)j, Napi::Number::New(env, C[base + j]));
        }
        jsRes.Set((uint32_t)i, row);
    }
    return jsRes;
}

// Транспонирование row-major B(k x n) -> BT(n x k)
static void TransposeRowMajor(const std::vector<double>& B, size_t k, size_t n, std::vector<double>& BT) {
    BT.resize(n * k);
    for (size_t i = 0; i < k; ++i) {
        const size_t ib = i * n;
        for (size_t j = 0; j < n; ++j) {
            // BT[j][i] = B[i][j]
            BT[j * k + i] = B[ib + j];
        }
    }
}