# UniPark V2 - Backend API RESTful

Bienvenido al repositorio oficial del Backend de **UniPark V2**, un sistema integral de control de acceso, gestión de infraestructura de parqueaderos e inteligencia de negocios (Business Intelligence).

---

## Consideraciones Globales

- **URL Base:** `http://localhost:5000/api/v1`
- **Formato:** `application/json` y `multipart/form-data`
- **Autenticación:** JWT
- **Header:** `Authorization: Bearer <token>`
- **Control de Acceso:** PBAC por roles

---

---

## Arquitectura del Proyecto

```
src/
 ├── assets/
 │   ├── vehiculos/
 │   └── zonas/
 ├── config/
 ├── controllers/
 ├── middlewares/
 ├── routes/
 ├── services/
 ├── utils/
 │   ├── validators/
 ├── app.js
server.js
```

---

## Tecnologías

- Node.js
- Express
- PostgreSQL
- JWT
- PBAC

---

## Autenticación

Header requerido:

```
Authorization: Bearer <token>
```

---

## Base URL

```
http://localhost:5000/api/v1
```

---

# ENDPOINTS

---

## Personas

| Método | Endpoint      | Descripción   |
| ------ | ------------- | ------------- |
| POST   | /personas     | Crear persona |
| GET    | /personas     | Listar        |
| GET    | /personas/:id | Obtener       |
| PUT    | /personas/:id | Actualizar    |

### Ejemplo

```json
{
  "nombres_completos": "Anderson Guevara",
  "tipo_documento": "CC",
  "numero_documento": "123",
  "telefono": "3000000000"
}
```

---

## Usuarios

| Método | Endpoint      | Descripción   |
| ------ | ------------- | ------------- |
| POST   | /usuarios     | Crear usuario |
| POST   | /auth/login   | Login         |
| POST   | /auth/logout  | Logout        |
| POST   | /auth/refresh | Refresh       |

---

## Vehículos

| Método | Endpoint            | Descripción |
| ------ | ------------------- | ----------- |
| POST   | /vehiculos          | Crear       |
| POST   | /vehiculos/:id/foto | Subir foto  |
| GET    | /vehiculos          | Listar      |
| GET    | /vehiculos/:id      | Obtener     |
| PUT    | /vehiculos/:id      | Actualizar  |
| DELETE | /vehiculos/:id      | Eliminar    |

---

## Zonas

| Método | Endpoint   | Descripción |
| ------ | ---------- | ----------- |
| POST   | /zonas     | Crear       |
| GET    | /zonas     | Listar      |
| GET    | /zonas/:id | Obtener     |
| PUT    | /zonas/:id | Actualizar  |
| DELETE | /zonas/:id | Eliminar    |

---

## Accesos

| Método | Endpoint          | Descripción |
| ------ | ----------------- | ----------- |
| POST   | /acceso/escanear  | QR          |
| POST   | /acceso/visitante | Manual      |

---

## Administración

### Sedes

| Método | Endpoint         |
| ------ | ---------------- |
| GET    | /admin/sedes     |
| POST   | /admin/sedes     |
| PUT    | /admin/sedes/:id |
| DELETE | /admin/sedes/:id |

### Instituciones

| Método | Endpoint                 |
| ------ | ------------------------ |
| GET    | /admin/instituciones     |
| POST   | /admin/instituciones     |
| PUT    | /admin/instituciones/:id |

---

## Reportes

| Método | Endpoint             |
| ------ | -------------------- |
| GET    | /reportes/pernoctas  |
| GET    | /reportes/ocupacion  |
| GET    | /reportes/horas-pico |

---

## Ejemplo CURL

```bash
curl -X GET http://localhost:5000/api/v1/personas \
 -H "Authorization: Bearer TOKEN"
```

---

## Notas

- API basada en arquitectura por capas
- Control de acceso por roles
- Manejo de errores centralizado

---

## Autor

Anderson Guevara
Proyecto UniPark v2
