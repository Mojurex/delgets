# Амжилт Кибер сургуулийн рэнк

Сургуулийн үүдний ELRON самбар дээр ангиудын сарын онооны рэнкийг тасралтгүй харуулах дэлгэц.
Анги бүр өдөр бүр шалгуур тус бүрээс оноо авна (+) эсвэл хасуулна (−); бүх тоо эдгээр
бичлэгээс тооцогдоно. Firestore-оос зөвхөн уншина, юу ч бичихгүй.

## Ажиллуулах

```bash
npm install
npm run dev        # http://localhost:5173/?demo=1
npm test           # Vitest
npm run build      # dist/ хавтсанд
```

`?demo=1` гэж нээвэл Firebase холбогдоогүй ч 27 ангийн бодитой mock өгөгдлөөр ажиллана,
20 секунд тутамд шинэ оноо нэмэгдэж шууд урсгалыг турших боломжтой.

Туршилтын параметрүүд:

| Параметр | Үйлдэл |
|---|---|
| `?demo=1` | Mock өгөгдөл |
| `?demo=1&date=2026-11-13` | Өнөөдрийг солино |
| `?view=overview`, `?view=criteria`, `?view=insights`, `?view=class:7-1` | Нэг дэлгэцийг зогсоож харуулна |

## Firebase холбох

1. Firebase Console → Project settings → Your apps → Config хэсгээс утгуудыг аваад
   `.env.example`-ийг `.env` болгон хуулж бөглөнө:

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

2. Firestore-ийн security rules-д энэ аппын уншдаг collection-уудыг унших эрх нээлттэй
   байх ёстой (`allow read`). Апп бичих эрх шаардахгүй.

3. `.env` байхгүй үед хөгжүүлэлтийн горим (`npm run dev`) mock өгөгдлөөр, харин
   production build хоосон дэлгэцээр ажиллана. Зохиомол оноог олны өмнө хэзээ ч гаргахгүй.

### Firestore-ийн бүтэц

Өгөгдлийн хандалт бүхэлдээ [src/data/adapter.ts](src/data/adapter.ts) дотор байна.
Одоогоор дараах бүтцийг уншина. Жижүүр багшийн системийн бодит бүтэц өөр бол зөвхөн
энэ файлын `toClassInfo`, `toDutyCheck`, `toTeacherEvent` функцүүдийг засна.

```
classes/{id}        { name: "7-1", studentCount: 31 }
dutyChecks/{id}     { date: "2026-11-12", classId, absentExcused, absentUnexcused,
                      truancies, uniformViolations, hygiene (−3…+3), shoesViolations,
                      givenBy, createdAt: Timestamp }
teacherPoints/{id}  { date: "2026-11-12", classId, points, reason, givenBy,
                      createdAt: Timestamp }
```

- `classId` нь `classes`-ийн document id эсвэл ангийн нэр байж болно. "7.1", "7/1", "7а",
  "7 А" зэрэг хэлбэрийг бүгдийг нь "7-1" болгож хувиргана.
- `dutyChecks` нь тэмдэглэл (зөрчлийн тоо) хадгалдаг тул онооны дүрмээр оноо болгоно.
  Өвчтэй, чөлөөтэй сурагч (`absentExcused`) оноо хасуулахгүй.
- Хэрэв систем оноог шууд (+3, −2) хадгалдаг бол `toTeacherEvent`-тэй адил нэг
  хувиргагч бичээд `category`-г тохируулна.

## Онооны дүрэм өөрчлөх

[src/config/points.ts](src/config/points.ts):

```ts
export const POINT_RULES = {
  attendance: { full: 5, perUnexcused: -1 },   // бүгд ирсэн +5, шалтгаангүй сурагч бүрд −1
  truancy:    { none: 3, perTruancy: -2 },     // таслалтгүй өдөр +3, таслалт бүрд −2
  uniform:    { allOk: 2, perViolation: -1 },
  hygiene:    { min: -3, max: 3 },             // жижүүр багшийн үнэлгээг шууд авна
  shoes:      { allOk: 2, perViolation: -1 },
  activity:   { min: -10, max: 10 },           // багшийн оноог шууд авна
};
export const normalizeBySize = false;          // true бол ангийн сурагчийн тоонд харьцуулна
export const RANK_CHANGE_DAYS = 7;             // байрны өөрчлөлтийг хэдэн хоногийн өмнөхтэй харьцуулах
```

Дүрэм өөрчлөгдөхөд өмнөх өдрүүдийн оноо ч шинэ дүрмээр дахин тооцогдоно, учир нь оноо
бичлэгээс байнга тооцогддог.

Рэнкийн дүрэм: сарын нийт оноо өндөр нь эхэнд. Тэнцвэл хасуулсан оноо бага нь, дараа нь
ирцийн оноо өндөр нь. Хуанлийн сар, Улаанбаатарын цагаар.

## Ангийн жагсаалт өөрчлөх

[src/config/classes.ts](src/config/classes.ts) файлд бага, дунд, ахлах гэсэн 3 бүлгээр
ангиудыг "анги-бүлэг" хэлбэрээр бичнэ. Кодын өөр хаана ч ангийн нэр байхгүй.

## Дэлгэцийн тохиргоо

[src/config/display.ts](src/config/display.ts): дэлгэц бүрийн хугацаа, хүрэлтийн дараа
автомат эргэлт рүү буцах хугацаа (60 с), шөнийн reload цаг (03:00), burn-in шилжилт.

Ажиглалтын дүрмүүд [src/insights/rules.ts](src/insights/rules.ts) дотор; шинэ дүрэм
нэмэхдээ функц бичээд `RULES` жагсаалтад нэмнэ.

## Deploy хийх

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>      # .firebaserc үүснэ
npm run deploy                 # build хийгээд Firebase Hosting руу байршуулна
```

Апп PWA тул нэг удаа ачаалагдсаны дараа интернет тасарсан ч ажиллана: Firestore-ийн
offline cache-ээс сүүлийн өгөгдлийг харуулж, баруун доор "Сүлжээ тасарсан, сүүлд 08:42-д
шинэчлэгдсэн" гэж бичнэ.

Самбар дээр суулгах зааврыг [KIOSK.md](KIOSK.md) файлаас харна уу.

## Бүтэц

```
src/config/      ангиуд, онооны дүрэм, дэлгэцийн тохиргоо
src/data/        adapter (Firestore, зөвхөн унших), mock, төрлүүд
src/lib/         цэвэр тооцоо: оноо, рэнк, сарын явц, эргэлт, цаг
src/insights/    ажиглалтын дүрмүүд
src/components/  хүрээ, шууд урсгал, график, тэмдэг
src/pages/       ерөнхий самбар, ангийн дэлгэрэнгүй, шалгуурын тойм, ажиглалт
src/app/         эргэлт, хүрэлт, kiosk hook-ууд
```

Тооцоо бүгд pure function, `npm test`-ээр шалгагдана.
