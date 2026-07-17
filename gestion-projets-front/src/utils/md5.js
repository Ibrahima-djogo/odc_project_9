// Implémentation compacte et standard de MD5 pour JavaScript
export function md5(str) {
  const RotateLeft = (n, c) => (n << c) | (n >>> (32 - c));
  
  const k = [];
  const r = [
    7, 12, 17, 22, 5, 9, 14, 20, 
    4, 11, 16, 23, 6, 10, 15, 21
  ];
  
  for (let i = 0; i < 64; i++) {
    k[i] = 0 | (Math.abs(Math.sin(i + 1)) * 4294967296);
  }
  
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  
  const words = [];
  const utf8 = unescape(encodeURIComponent(str));
  
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8);
  }
  
  words[utf8.length >> 2] |= 0x80 << ((utf8.length % 4) * 8);
  words[(((utf8.length + 8) >> 6) << 4) + 14] = utf8.length * 8;
  
  for (let i = 0; i < words.length; i += 16) {
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }
      
      const temp = d;
      d = c;
      c = b;
      b = (b + RotateLeft(a + f + k[j] + (words[i + g] || 0), r[(j >> 4) * 4 + (j % 4)])) | 0;
      a = temp;
    }
    
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }
  
  const hex = [h0, h1, h2, h3].map(h => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += ((h >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return s;
  });
  
  return hex.join("");
}
