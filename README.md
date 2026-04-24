# Planify

Planify — це веб-застосунок для продуктивного керування календарем. Він створений для користувачів, які мають кілька розкладів і хочуть бачити Google Calendar події, власні події та нотатки в одному зручному просторі.

Демо: [https://planiifyy.netlify.app/](https://planiifyy.netlify.app/)

## Огляд

Planify допомагає зменшити хаос у плануванні завдяки об'єднанню зовнішніх календарів і власного процесу планування користувача. Ідея продукту проста: користувач має бачити свій день, створювати власні події, додавати до них контекст через нотатки та легко розрізняти джерела подій.

Продукт корисний для студентів, фрилансерів, невеликих команд і спеціалістів, які користуються кількома календарями: особистим, робочим, університетським або іншими.

## Бізнес-функції

- Повноцінний єдиний календар для внутрішніх Planify-подій і синхронізованих Google Calendar подій.
- Підключення Google-акаунтів через OAuth, із підтримкою до трьох акаунтів.
- Синхронізація подій із Google Calendar у базу даних застосунку.
- CRUD для внутрішніх подій: створення, редагування, видалення, all-day події та події з конкретним часом.
- Робота з календарем через click-to-create, drag-based time selection, drag-and-drop та resize.
- Перегляд календаря у форматах day, week, month grid і month agenda.
- Модуль нотаток для збереження контексту поза календарною сіткою.
- Прив'язка нотаток до подій, включно зі створенням нотатки під час створення події.
- Модальне вікно деталей події з часом, локацією, організатором, посиланням на джерело, описом і прив'язаними нотатками.
- Налаштування підключених Google-акаунтів і кольорів для різних календарних джерел.
- Авторизація, захищені маршрути застосунку, підтвердження email, маршрут для скидання пароля, сторінка політики приватності та сторінка умов використання.

## Технічні функції

- Nuxt 4 single page application на Vue 3 та TypeScript.
- Supabase Auth для email/password авторизації та керування сесією.
- Supabase Postgres для користувачів, налаштувань, Google-акаунтів, календарів, подій і нотаток.
- Supabase Edge Functions для Google OAuth, оновлення токенів, отримання календарів і синхронізації подій.
- Інтеграція з Google Calendar API через OAuth scopes.
- Pinia stores для стану застосунку, календаря, нотаток, користувача, налаштувань та інтеграцій.
- ScheduleX calendar із підтримкою drag-and-drop, resize, current-time indicator і кількох режимів перегляду.
- Feature-oriented структура через `app/features`, `app/entities` і `app/shared`.
- Shared UI layer для кнопок, інпутів, модальних вікон, dropdown, toast, date picker та layout-компонентів.
- Zod schemas і локальні validation helpers для форм і API-відповідей.
- DOMPurify для безпечного рендерингу описів подій із зовнішніх календарів.
- Tailwind CSS 4 з reusable variants і utility-based styling.

## Поточний стан MVP

Поточний MVP — це unified calendar hub. На етапі планування також розглядалися AI email parsing і автоматичне виявлення дедлайнів, але реалізований фокус MVP свідомо звужений: підключити Google Calendar акаунти, синхронізувати події, показати все в одному календарі та дати користувачу керувати внутрішніми Planify-подіями з прив'язаними нотатками.

Календар уже має повний набір функцій, запланований для поточного MVP. Він підтримує кілька режимів перегляду, відображення Google-подій, CRUD для внутрішніх подій, створення подій кліком, вибір часу drag interaction, drag-and-drop оновлення, resize, деталі події та кольори для різних джерел.

## Зв'язок календаря і нотаток

Planify розглядає нотатки як контекст для планування. Нотатка може існувати окремо або бути прив'язаною до конкретної календарної події.

- `calendar_events` зберігає і синхронізовані Google-події, і внутрішні Planify-події.
- `notes.calendar_event_id` опційно прив'язує нотатку до події.
- Одна подія може мати кілька прив'язаних нотаток.
- Нотатку можна створити окремо на сторінці Notes і прив'язати до події.
- Нотатку також можна створити одразу під час створення нової події.
- У деталях події відображаються пов'язані нотатки.

Цей зв'язок робить застосунок не просто календарем: події відповідають на питання "коли", а нотатки — "що важливо пам'ятати".

## Сторінки

| Маршрут | Сторінка | Призначення |
| --- | --- | --- |
| `/` | Landing | Коротко представляє Planify і веде до app та legal pages. |
| `/login` | Login | Вхід через email і пароль. |
| `/signup` | Sign Up | Створення акаунта через Supabase Auth. |
| `/confirm` | Confirm Email | Обробка посилання підтвердження email. |
| `/forgot-password` | Forgot Password | Відправка листа для скидання пароля. |
| `/reset-password` | Reset Password | Маршрут для завершення reset flow. |
| `/app` | Dashboard | Захищена стартова сторінка застосунку. |
| `/app/calendar` | Calendar | Основна сторінка: єдиний календар із Google-подіями та внутрішніми подіями. |
| `/app/notes` | Notes | Створення і перегляд нотаток, включно з нотатками, прив'язаними до подій. |
| `/app/settings` | Settings | Підключення Google-акаунтів і кольори календарних джерел. |
| `/privacy-policy` | Privacy Policy | Опис використання і зберігання даних Google Calendar. |
| `/terms-of-service` | Terms | Умови використання сервісу. |
| `/ui` | UI Playground | Внутрішня сторінка для перевірки shared UI components. |

## Технічний стек

| Область | Технології |
| --- | --- |
| Frontend | Nuxt 4, Vue 3, TypeScript |
| State | Pinia, VueUse |
| UI | Tailwind CSS, Reka UI, Nuxt Icon, shared components |
| Calendar | ScheduleX, Temporal polyfill |
| Backend | Supabase Auth, Supabase Postgres, Edge Functions |
| Integrations | Google OAuth, Google Calendar API |
| Validation | Zod, custom validation helpers |
| Deployment | Netlify |

## Структура застосунку

```text
app/
  entities/      Domain-level модулі: calendar, sidebar
  features/      User-facing features: auth, notes, settings, integrations
  shared/        Reusable UI, constants, variants, API types, shared types
  pages/         Nuxt routes для landing, auth, legal pages та app
supabase/
  functions/     Edge Functions для Google OAuth і calendar syncing
```

## Модель даних

Planify використовує Supabase tables:

- `profiles`: профіль користувача.
- `google_accounts`: підключені Google-акаунти, metadata та OAuth tokens.
- `google_calendars`: календарі, знайдені в підключених Google-акаунтах.
- `calendar_events`: синхронізовані Google-події та внутрішні Planify-події, розділені через поля на кшталт `is_internal` і `google_account_id`.
- `notes`: нотатки користувача, які можуть бути прив'язані до події через `calendar_event_id`.
- `settings`: користувацькі preferences, включно з кольорами джерел подій.

## Напрям розвитку

Планування продукту визначило Planify як застосунок, який починається з надійного unified calendar, а з часом може вирости у smart planning assistant.

Поточний MVP:

- Підключення кількох Google Calendar акаунтів.
- Єдиний календарний інтерфейс.
- Створення і керування внутрішніми подіями.
- Нотатки, прив'язані до подій.
- Кольорові preferences для календарних джерел.

Майбутні ідеї:

- RSVP actions для Google invitations, якщо це дозволяють permissions.
- Hide/ignore external events усередині Planify без змін у Google Calendar.
- Email viewer для підключених Google-акаунтів.
- AI-assisted email parsing для виявлення дедлайнів і створення draft events.
- User-confirmed "add to calendar" flow для AI-detected deadlines.
- Conflict detection і smarter planning suggestions.

## Запуск локально

Встановити залежності:

```bash
pnpm install
```

Запустити development server:

```bash
pnpm dev
```

Відкрити локальний застосунок:

```text
http://localhost:3000
```

Запустити type-check:

```bash
pnpm typecheck
```

Зібрати production build:

```bash
pnpm build
```

## Змінні середовища

Client-side змінні Nuxt:

```env
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_PUBLIC_API_BASE=
```

Секрети для Supabase Edge Functions:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

`SUPABASE_SERVICE_ROLE_KEY` має використовуватися тільки на server-side у Supabase Edge Functions. Його не можна передавати в Nuxt client.

## Скрипти

| Команда | Опис |
| --- | --- |
| `pnpm dev` | Запускає Nuxt development server. |
| `pnpm build` | Збирає production build. |
| `pnpm typecheck` | Запускає Nuxt TypeScript checks. |
| `pnpm prepare` | Генерує Nuxt project artifacts. |
| `pnpm db:types` | Генерує Supabase database types. |

## Приватність

Planify використовує дані Google Calendar тільки для відображення, синхронізації та керування календарними подіями авторизованого користувача. Застосунок зберігає лише дані, необхідні для роботи сервісу: metadata підключених акаунтів, календарі, синхронізовані події, нотатки та preferences користувача.

## Статус

Planify — активний productivity-застосунок, сфокусований на об'єднанні календарів, плануванні подій і контексті через нотатки.
