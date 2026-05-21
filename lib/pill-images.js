// Banco de imágenes por categoría/especialidad para los pills.
// 5-6 imágenes por especialidad. Selección determinística por id de pill.

const Q = "?w=800&q=90";
const I = (id) => `https://images.unsplash.com/${id}${Q}`;

export const SPECIALTY_IMAGES = {
  "Medicina Familiar y Comunitaria": [
    I("photo-1666214280557-f1b5022eb634"),
    I("photo-1576091160399-112ba8d25d1d"),
    I("photo-1612349317150-e413f6a5b16d"),
    I("photo-1551884170-09fb70a3a2ed"),
    I("photo-1638202993928-7d113b8e4f63"),
  ],
  "Pediatría": [
    I("photo-1632833239869-a37e3a5806d2"),
    I("photo-1620912189865-1ad97e7cfa44"),
    I("photo-1551601651-bc70d2c3d31a"),
    I("photo-1576765608866-5b51046452be"),
    I("photo-1612531386530-97286d97c2d2"),
  ],
  "Medicina Interna": [
    I("photo-1576091160399-112ba8d25d1d"),
    I("photo-1551190822-a9333d879b1f"),
    I("photo-1538108149393-fbbd81895907"),
    I("photo-1666214280557-f1b5022eb634"),
    I("photo-1530026405186-ed1f139313f8"),
  ],
  "Cardiología": [
    I("photo-1628348068343-c6a848d2b6dd"),
    I("photo-1559757175-7cb056fba93d"),
    I("photo-1530026405186-ed1f139313f8"),
    I("photo-1631815589968-fdb09a223b1e"),
    I("photo-1559757175-5700dde675bc"),
  ],
  "Cirugía General y Digestiva": [
    I("photo-1571772996211-2f02c9727629"),
    I("photo-1631217868264-e5b90bb7e133"),
    I("photo-1551601651-2a8555f1a136"),
    I("photo-1666214280557-f1b5022eb634"),
    I("photo-1530026405186-ed1f139313f8"),
  ],
  "Cirugía Ortopédica y Traumatología": [
    I("photo-1576091160550-2173dba999ef"),
    I("photo-1620331317290-d1d18a8c2c93"),
    I("photo-1505751172876-fa1923c5c528"),
    I("photo-1631815589968-fdb09a223b1e"),
    I("photo-1571772996211-2f02c9727629"),
  ],
  "Obstetricia y Ginecología": [
    I("photo-1576765608866-5b51046452be"),
    I("photo-1531983412531-1f49a365ffed"),
    I("photo-1581952976147-5a2d15560349"),
    I("photo-1612531386530-97286d97c2d2"),
    I("photo-1620912189865-1ad97e7cfa44"),
  ],
  "Anestesiología y Dolor": [
    I("photo-1571772996211-2f02c9727629"),
    I("photo-1530026405186-ed1f139313f8"),
    I("photo-1631217868264-e5b90bb7e133"),
    I("photo-1551601651-2a8555f1a136"),
    I("photo-1576091160550-2173dba999ef"),
  ],
  "Radiodiagnóstico": [
    I("photo-1530026405186-ed1f139313f8"),
    I("photo-1576091160550-2173dba999ef"),
    I("photo-1581595220892-b0739db3ba8c"),
    I("photo-1620331317290-d1d18a8c2c93"),
    I("photo-1559757175-7cb056fba93d"),
  ],
  "Dermatología": [
    I("photo-1612531386530-97286d97c2d2"),
    I("photo-1638202993928-7d113b8e4f63"),
    I("photo-1612349317150-e413f6a5b16d"),
    I("photo-1551884170-09fb70a3a2ed"),
    I("photo-1532187863486-abf9dbad1b69"),
  ],
  "Psiquiatría": [
    I("photo-1582719471384-894fbb16e074"),
    I("photo-1531956531700-dc0ee0f1f9a5"),
    I("photo-1573497019418-b400bb3ab074"),
    I("photo-1581952976147-5a2d15560349"),
    I("photo-1551884170-09fb70a3a2ed"),
  ],
  "Oncología Médica": [
    I("photo-1579154204601-01588f351e67"),
    I("photo-1532187863486-abf9dbad1b69"),
    I("photo-1631217868264-e5b90bb7e133"),
    I("photo-1559757148-5c350d0d3c56"),
    I("photo-1666214280557-f1b5022eb634"),
  ],
  "Neurología": [
    I("photo-1559757148-5c350d0d3c56"),
    I("photo-1530026405186-ed1f139313f8"),
    I("photo-1559757175-5700dde675bc"),
    I("photo-1620331317290-d1d18a8c2c93"),
    I("photo-1573497019418-b400bb3ab074"),
  ],
  "Aparato Digestivo": [
    I("photo-1581595220892-b0739db3ba8c"),
    I("photo-1571772996211-2f02c9727629"),
    I("photo-1538108149393-fbbd81895907"),
    I("photo-1551601651-2a8555f1a136"),
    I("photo-1530026405186-ed1f139313f8"),
  ],
  "Oftalmología": [
    I("photo-1559581812-2cf5b0b80f95"),
    I("photo-1546027550-9e3c5b8b94f7"),
    I("photo-1582719471384-894fbb16e074"),
    I("photo-1612531386530-97286d97c2d2"),
    I("photo-1532187863486-abf9dbad1b69"),
  ],
  "Enfermería": [
    I("photo-1559757148-5c350d0d3c56"),
    I("photo-1666214280557-f1b5022eb634"),
    I("photo-1576091160399-112ba8d25d1d"),
    I("photo-1551884170-09fb70a3a2ed"),
    I("photo-1612349317150-e413f6a5b16d"),
  ],
  "Fisioterapia": [
    I("photo-1581595220892-b0739db3ba8c"),
    I("photo-1571019613454-1cb2f99b2d8b"),
    I("photo-1571902943202-507ec2618e8f"),
    I("photo-1620331317290-d1d18a8c2c93"),
    I("photo-1638202993928-7d113b8e4f63"),
  ],
  "Farmacología": [
    I("photo-1584308666744-24d5c474f2ae"),
    I("photo-1587854692152-cbe660dbde88"),
    I("photo-1471864190281-a93a3070b6de"),
    I("photo-1559757175-5700dde675bc"),
    I("photo-1631217868264-e5b90bb7e133"),
  ],
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

export const DEFAULT_PILL_IMAGE = I("photo-1576091160399-112ba8d25d1d");

// Hash simple para distribuir las imágenes de forma estable por pill.
function hashId(s) {
  let h = 0;
  for(let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickPillImage(article) {
  if(article?.image) return article.image;
  let key = null;
  if(Array.isArray(article?.specialties) && article.specialties.length > 0) {
    key = article.specialties[0];
  } else if(article?.category) {
    key = LEGACY_CATEGORY_TO_SPECIALTY[article.category] || null;
  }
  const pool = (key && SPECIALTY_IMAGES[key]) || SPECIALTY_IMAGES["Medicina Interna"];
  if(!pool || pool.length === 0) return DEFAULT_PILL_IMAGE;
  const idx = hashId(String(article?.id || "")) % pool.length;
  return pool[idx];
}
