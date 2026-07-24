# Son Hüküm / Final Verdict

Kaynaklı bilgi sorularını sinematik bir 3B adam asmaca sahnesiyle birleştiren
Türkçe ve İngilizce web oyunu.

## Oyun modları

- **Klasik:** Sorunun cevabını harf ve sayıları seçerek tamamla.
- **AS:** Doğru cevaplarla infaz düzeneğini adım adım kur.
- **KURTAR:** Doğru cevaplarla karakterin bağlarını çöz.

Altı karakterin her biri için üç zorluk seviyesinde 99 soruluk ayrı havuz
bulunur. Soruların 33'ü salt bilgi, 66'sı belgelenmiş eylem ve çelişkileri
hedefleyen açıkça etiketlenmiş kara mizah varyasyonlarıdır.

## Yerel geliştirme

```bash
npm install
npm run dev
```

Oyun: [http://localhost:5173](http://localhost:5173)  
Avatar laboratuvarı: [http://localhost:5173/avatar-lab](http://localhost:5173/avatar-lab)

## Kontroller

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

3B sahne paketi etkileşim öncesinde ayrı bir kod parçası olarak yüklenir.
Efekt ve animasyon sesleri Web Audio API ile üretilir; arka plan müziği
bulunmaz.
