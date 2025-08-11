# Profile Service

A Midway-based service that manages user profiles using event sourcing with snapshots.

## English

### Running

```bash
npm install
npm run dev
```

### API

| Method | Path                                  | Description                  |
| ------ | ------------------------------------- | ---------------------------- |
| GET    | `/api/v1/health`                      | health check                 |
| GET    | `/profiles/:userId`                   | get profile by user id       |
| GET    | `/profiles/by-username/:username`     | get profile by username      |
| PUT    | `/profiles/:userId`                   | create profile               |
| PATCH  | `/profiles/:userId`                   | update profile               |

### Creating a profile

```http
PUT /profiles/<userId>
Content-Type: application/json

{
  "username": "john",
  "display_name": "John",
  "bio": "about me"
}
```

## Русский

### Запуск

```bash
npm install
npm run dev
```

### API

| Метод | Путь                                   | Описание                     |
| ----- | -------------------------------------- | ---------------------------- |
| GET   | `/api/v1/health`                       | проверка состояния           |
| GET   | `/profiles/:userId`                    | получить профиль по userId   |
| GET   | `/profiles/by-username/:username`      | получить профиль по имени    |
| PUT   | `/profiles/:userId`                    | создать профиль              |
| PATCH | `/profiles/:userId`                    | изменить профиль             |

### Создание профиля

```http
PUT /profiles/<userId>
Content-Type: application/json

{
  "username": "john",
  "display_name": "John",
  "bio": "about me"
}
```

### Tests

```bash
npm test
```

