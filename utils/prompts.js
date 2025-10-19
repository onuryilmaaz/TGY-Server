const createTextSummarizePrompt = (text, summaryLength = "orta") => {
  const lengthInstructions = {
    kısa: "2-3 cümle ile çok kısa bir özet",
    orta: "1 paragraf halinde orta uzunlukta bir özet",
    uzun: "2-3 paragraf halinde detaylı bir özet",
  };

  return `Aşağıdaki metni özetle. Özet ${
    lengthInstructions[summaryLength] || lengthInstructions.orta
  } şeklinde olmalı.

Özetleme kuralları:
- Ana konuları ve önemli noktaları koru
- Gereksiz detayları çıkar
- Akıcı ve anlaşılır Türkçe kullan
- Objektif bir ton kullan
- Orijinal metnin ana mesajını koru

Özetlenecek metin:
"${text}"

Cevabını SADECE aşağıdaki JSON formatında ver:

{
  "originalLength": ${text.length},
  "summary": "Özet metni (String)",
  "keyPoints": ["Ana nokta 1", "Ana nokta 2", "Ana nokta 3 (Array of Strings)"],
  "summaryLength": "${summaryLength}"
}

Sadece istenen JSON çıktısını ver, başka hiçbir metin ekleme.`;
};

const createImageAnalysisPrompt = (userText) => {
  return `Bu görseli analiz et ve kullanıcının sorusuna/isteğine göre detaylı bir açıklama yap.

Kullanıcının sorusu/isteği: "${userText}"

Analiz kuralları:
- Görselde gördüklerini detaylı şekilde açıkla
- Kullanıcının sorusuna odaklan
- Renkleri, nesneleri, kişileri, aktiviteleri tanımla
- Görsel kompozisyon hakkında bilgi ver
- Eğer metin varsa oku ve açıkla
- Görsel kalitesi ve teknik özellikler hakkında yorum yap

Cevabını SADECE aşağıdaki JSON formatında ver:

{
  "description": "Görselin genel açıklaması (String)",
  "detailedAnalysis": "Kullanıcının sorusuna odaklı detaylı analiz (String)",
  "objects": ["Nesne 1", "Nesne 2", "Nesne 3 (Array of Strings)"],
  "colors": ["Renk 1", "Renk 2", "Renk 3 (Array of Strings)"],
  "textInImage": "Görseldeki metin varsa (String, yoksa boş string)",
  "mood": "Görselin genel atmosferi/havası (String)",
  "technicalNotes": "Teknik özellikler (çözünürlük, kalite vb.) (String)"
}

Sadece istenen JSON çıktısını ver, başka hiçbir metin ekleme.`;
};

module.exports = {
  createTextSummarizePrompt,
  createImageAnalysisPrompt,
};
