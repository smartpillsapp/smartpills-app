// Banco de imágenes por especialidad para los pills. Se usa SOLO como
// respaldo: los pills nuevos llevan ya su propia `image` (og:image del
// artículo original o, si no existe, una de aquí, asignada en la ingesta).
// Este pool sirve también para los pills antiguos sin `image`.

const BASE = "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/pills/";
const S = (folder, file) => `${BASE}${folder}/${file}`;

// Solo para Dermatología, que aún no tiene fotos propias
const Q = "?w=800&q=90";
const UNS = (id) => `https://images.unsplash.com/${id}${Q}`;

export const SPECIALTY_IMAGES = {
  "Medicina Familiar y Comunitaria": [
    S("medicina-familiar%20y%20comunitaria", "IMG_4794.jpg"),
    S("medicina-familiar%20y%20comunitaria", "IMG_4795.jpg"),
    S("medicina-familiar%20y%20comunitaria", "IMG_4796.jpg"),
    S("medicina-familiar%20y%20comunitaria", "IMG_4805.jpg"),
    S("medicina-familiar%20y%20comunitaria", "IMG_4806.jpg"),
    S("medicina-familiar%20y%20comunitaria", "IMG_4808.JPG"),
    S("medicina-familiar%20y%20comunitaria", "IMG_4809.jpg"),
  ],
  "Pediatría": [
    S("pediatria", "IMG_4829.jpg"),
    S("pediatria", "IMG_4830.jpg"),
    S("pediatria", "IMG_4837.jpg"),
  ],
  "Medicina Interna": [
    S("medicina%20interna", "IMG_4806.jpg"),
    S("medicina%20interna", "IMG_4808.JPG"),
    S("medicina%20interna", "IMG_4809.jpg"),
    S("medicina%20interna", "IMG_4810.jpg"),
  ],
  "Cardiología": [
    S("cardiologia", "IMG_4776.jpg"),
    S("cardiologia", "IMG_4777.jpg"),
    S("cardiologia", "IMG_4779.jpg"),
  ],
  "Cirugía General y Digestiva": [
    S("cirugia%20general%20y%20digestiva", "IMG_4810.jpg"),
    S("cirugia%20general%20y%20digestiva", "IMG_4841.jpg"),
  ],
  "Cirugía Ortopédica y Traumatología": [
    S("cirugia%20ortopedica%20y%20traumatologia", "IMG_4780.jpg"),
    S("cirugia%20ortopedica%20y%20traumatologia", "IMG_4781.jpg"),
    S("cirugia%20ortopedica%20y%20traumatologia", "IMG_4838.jpg"),
  ],
  "Obstetricia y Ginecología": [
    S("obstetricia%20y%20ginecologia", "IMG_4786.jpg"),
    S("obstetricia%20y%20ginecologia", "IMG_4787.jpg"),
    S("obstetricia%20y%20ginecologia", "IMG_4819.jpg"),
  ],
  "Anestesiología y Dolor": [
    S("anestesiologia%20y%20dolor", "IMG_4788.jpg"),
    S("anestesiologia%20y%20dolor", "IMG_4789.jpg"),
  ],
  "Radiodiagnóstico": [
    S("radiodiagnostico", "IMG_4821.jpg"),
    S("radiodiagnostico", "IMG_4822.jpg"),
  ],
  "Dermatología": [
    S("dermatologia", "IMG_4790.jpg"),
    S("dermatologia", "IMG_4791.jpg"),
  ],
  "Psiquiatría": [
    S("psiquiatria", "IMG_4825.jpg"),
    S("psiquiatria", "IMG_4826.jpg"),
    S("psiquiatria", "IMG_4827.jpg"),
  ],
  "Oncología Médica": [
    // Carpeta subida con typo "onocologia medica" — se usa ese path
    S("onocologia%20medica", "IMG_4817.jpg"),
    S("onocologia%20medica", "IMG_4818.JPG"),
    S("onocologia%20medica", "IMG_4819.jpg"),
  ],
  "Neurología": [
    S("neurologia", "IMG_4825.jpg"),
    S("neurologia", "IMG_4826.jpg"),
    S("neurologia", "IMG_4827.jpg"),
  ],
  "Aparato Digestivo": [
    S("aparato%20digestivo", "IMG_4779.jpg"),
    S("aparato%20digestivo", "IMG_4810.jpg"),
  ],
  "Oftalmología": [
    S("oftalmologia", "IMG_4820.jpg"),
    S("oftalmologia", "IMG_4824.jpg"),
  ],
  "Enfermería": [
    S("enfermeria", "IMG_4794.jpg"),
    S("enfermeria", "IMG_4795.jpg"),
    S("enfermeria", "IMG_4796.jpg"),
    S("enfermeria", "IMG_4803.jpg"),
    S("enfermeria", "IMG_4804.jpg"),
    S("enfermeria", "IMG_4805.jpg"),
  ],
  "Fisioterapia": [
    S("fisioterapia", "IMG_4780.jpg"),
  ],
  "Farmacología": [
    S("farmacologia", "IMG_4789.jpg"),
    S("farmacologia", "IMG_4816.jpg"),
    S("farmacologia", "IMG_4817.jpg"),
  ],
};

// Banco de imágenes de stock (Unsplash) — se usa en el ~20% de los casos
// cuando el artículo no tiene imagen propia. El 80% restante usa las fotos
// personalizadas de SPECIALTY_IMAGES de arriba.
const SPECIALTY_STOCK = {
  "Medicina Familiar y Comunitaria": [UNS("photo-1666214280557-f1b5022eb634"), UNS("photo-1576091160399-112ba8d25d1d"), UNS("photo-1612349317150-e413f6a5b16d")],
  "Pediatría":                        [UNS("photo-1632833239869-a37e3a5806d2"), UNS("photo-1576765608866-5b51046452be"), UNS("photo-1612531386530-97286d97c2d2")],
  "Medicina Interna":                 [UNS("photo-1576091160399-112ba8d25d1d"), UNS("photo-1551190822-a9333d879b1f"), UNS("photo-1538108149393-fbbd81895907")],
  "Cardiología":                      [UNS("photo-1628348068343-c6a848d2b6dd"), UNS("photo-1559757175-5700dde675bc"), UNS("photo-1631815589968-fdb09a223b1e")],
  "Cirugía General y Digestiva":      [UNS("photo-1571772996211-2f02c9727629"), UNS("photo-1631217868264-e5b90bb7e133"), UNS("photo-1581595220892-b0739db3ba8c")],
  "Cirugía Ortopédica y Traumatología":[UNS("photo-1576091160550-2173dba999ef"), UNS("photo-1571019613454-1cb2f99b2d8b"), UNS("photo-1571902943202-507ec2618e8f")],
  "Obstetricia y Ginecología":        [UNS("photo-1576765608866-5b51046452be"), UNS("photo-1531983412531-1f49a365ffed"), UNS("photo-1582719471384-894fbb16e074")],
  "Anestesiología y Dolor":           [UNS("photo-1571772996211-2f02c9727629"), UNS("photo-1530026405186-ed1f139313f8"), UNS("photo-1631217868264-e5b90bb7e133")],
  "Radiodiagnóstico":                 [UNS("photo-1530026405186-ed1f139313f8"), UNS("photo-1576091160550-2173dba999ef"), UNS("photo-1631815589968-fdb09a223b1e")],
  "Dermatología":                     [UNS("photo-1612531386530-97286d97c2d2"), UNS("photo-1532187863486-abf9dbad1b69"), UNS("photo-1582719471384-894fbb16e074")],
  "Psiquiatría":                      [UNS("photo-1582719471384-894fbb16e074"), UNS("photo-1531956531700-dc0ee0f1f9a5"), UNS("photo-1573497019418-b400bb3ab074")],
  "Oncología Médica":                 [UNS("photo-1579154204601-01588f351e67"), UNS("photo-1532187863486-abf9dbad1b69"), UNS("photo-1631217868264-e5b90bb7e133")],
  "Neurología":                       [UNS("photo-1559757148-5c350d0d3c56"), UNS("photo-1530026405186-ed1f139313f8"), UNS("photo-1573497019418-b400bb3ab074")],
  "Aparato Digestivo":                [UNS("photo-1581595220892-b0739db3ba8c"), UNS("photo-1571772996211-2f02c9727629"), UNS("photo-1538108149393-fbbd81895907")],
  "Oftalmología":                     [UNS("photo-1532187863486-abf9dbad1b69"), UNS("photo-1612349317150-e413f6a5b16d"), UNS("photo-1573497019418-b400bb3ab074")],
  "Enfermería":                       [UNS("photo-1559757148-5c350d0d3c56"), UNS("photo-1666214280557-f1b5022eb634"), UNS("photo-1576091160399-112ba8d25d1d")],
  "Fisioterapia":                     [UNS("photo-1581595220892-b0739db3ba8c"), UNS("photo-1571019613454-1cb2f99b2d8b"), UNS("photo-1571902943202-507ec2618e8f")],
  "Farmacología":                     [UNS("photo-1584308666744-24d5c474f2ae"), UNS("photo-1587854692152-cbe660dbde88"), UNS("photo-1471864190281-a93a3070b6de")],
};

// Mapeo de categorías legacy a especialidades nuevas.
export const LEGACY_CATEGORY_TO_SPECIALTY = {
  urgencias:             "Medicina Interna",
  enfermería:            "Enfermería",
  farmacología:          "Farmacología",
  cardiología:           "Cardiología",
  pediatría:             "Pediatría",
  oncología:             "Oncología Médica",
  investigación_clínica: "Medicina Interna",
  noticias_sanitarias:   "Medicina Familiar y Comunitaria",
  seguridad:             "Medicina Interna",
};

export const DEFAULT_PILL_IMAGE = S("medicina-familiar%20y%20comunitaria", "IMG_4794.jpg");

// Hash simple para distribuir las imágenes de forma estable por pill.
function hashId(s) {
  let h = 0;
  for(let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickPillImage(article) {
  // 1) Foto propia del artículo (og:image de la web) — siempre tiene prioridad
  if(article?.image) return article.image;

  // 2) Determinar categoría
  let key = null;
  if(Array.isArray(article?.specialties) && article.specialties.length > 0) {
    key = article.specialties[0];
  } else if(article?.category) {
    key = LEGACY_CATEGORY_TO_SPECIALTY[article.category] || null;
  }

  const h = hashId(String(article?.id || ""));

  // 3) 20% de los artículos usan imagen de stock (Unsplash), 80% usan fotos propias.
  //    La selección es estable: el mismo artículo siempre obtiene el mismo tipo de imagen.
  const useStock = (h % 5) === 0;

  if(useStock) {
    const stockPool = (key && SPECIALTY_STOCK[key]) || SPECIALTY_STOCK["Medicina Interna"];
    if(stockPool?.length) return stockPool[Math.floor(h / 5) % stockPool.length];
  }

  const customPool = (key && SPECIALTY_IMAGES[key]) || SPECIALTY_IMAGES["Medicina Interna"];
  if(!customPool || customPool.length === 0) return DEFAULT_PILL_IMAGE;
  return customPool[Math.floor(h / 2) % customPool.length];
}
