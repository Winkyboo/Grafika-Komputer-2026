// matrix3.js
//
// Semua matrix di sini disimpan dalam bentuk column-major Float32Array
// dengan 9 elemen, mengikuti convention WebGL:
//
//   | m0 m3 m6 |
//   | m1 m4 m7 |
//   | m2 m5 m8 |
//
// Convention yang dipakai pada seluruh praktikum ini adalah
// COLUMN-VECTOR convention:
//
//   P' = M * P
//
// Sehingga untuk composite transform (Scale -> Rotate -> Translate)
// urutan penulisan multiplikasi adalah:
//
//   M = T * R * S
//
// PENTING: jangan mencampur convention row-vector dan column-vector
// pada bagian kode manapun.

export const Mat3 = {
  identity() {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  },

  translation(
    tx,
    ty
  ) {
    return new Float32Array([
      1,  0,  0,
      0,  1,  0,
      tx, ty, 1
    ]);
  },

  rotation(rad) {
    const c =
      Math.cos(rad);

    const s =
      Math.sin(rad);

    return new Float32Array([
       c, s, 0,
      -s, c, 0,
       0, 0, 1
    ]);
  },

  scaling(
    sx,
    sy
  ) {
    return new Float32Array([
      sx, 0,  0,
      0,  sy, 0,
      0,  0,  1
    ]);
  },

  // Mengembalikan matrix hasil (a * b) dalam arti:
  // hasil ini akan berperilaku seperti menerapkan transform b
  // terlebih dahulu, lalu transform a, terhadap sebuah vector.
  //
  // Dipakai sebagai:
  //   matrix = Mat3.multiply(matrix, nextTransform)
  // yang secara efektif membangun:
  //   matrix_baru = matrix_lama * nextTransform
  multiply(
    a,
    b
  ) {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];

    const a10 = a[3];
    const a11 = a[4];
    const a12 = a[5];

    const a20 = a[6];
    const a21 = a[7];
    const a22 = a[8];

    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];

    const b10 = b[3];
    const b11 = b[4];
    const b12 = b[5];

    const b20 = b[6];
    const b21 = b[7];
    const b22 = b[8];

    return new Float32Array([
      b00 * a00 +
      b01 * a10 +
      b02 * a20,

      b00 * a01 +
      b01 * a11 +
      b02 * a21,

      b00 * a02 +
      b01 * a12 +
      b02 * a22,

      b10 * a00 +
      b11 * a10 +
      b12 * a20,

      b10 * a01 +
      b11 * a11 +
      b12 * a21,

      b10 * a02 +
      b11 * a12 +
      b12 * a22,

      b20 * a00 +
      b21 * a10 +
      b22 * a20,

      b20 * a01 +
      b21 * a11 +
      b22 * a21,

      b20 * a02 +
      b21 * a12 +
      b22 * a22
    ]);
  }
};