# UniEvents

Platformă web pentru managementul evenimentelor universitare din cadrul USV, dezvoltată în cadrul disciplinei **Tehnologii Web și Arhitecturi Orientate pe Servicii (TWAAOS)**.

Aplicația centralizează evenimente universitare și oferă funcționalități pentru:
- studenți
- organizatori
- administratori

## Stack tehnologic

- **Backend:** Python 3, Flask, Flask-SQLAlchemy, Flask-Migrate
- **Frontend:** React
- **Database:** PostgreSQL
- **Autentificare:** JWT, Google Sign-In / OAuth flow pentru studenți
- **Containerizare:** Docker, Docker Compose
- **Versionare:** Git, GitHub

## Funcționalități implementate

### Student
- autentificare cu Google Sign-In mock pentru conturi `@student.usv.ro`
- vizualizare evenimente
- căutare și filtrare evenimente
- vizualizare calendar evenimente
- înscriere la evenimente
- anulare înscriere
- trimitere feedback după eveniment
- vizualizare materiale asociate unui eveniment

### Organizator
- autentificare cu email + parolă
- creare evenimente
- editare evenimente
- ștergere evenimente
- schimbare status eveniment
- vizualizare participanți la eveniment
- încărcare materiale pentru evenimente
- ștergere materiale
- acces la rapoarte și statistici de bază

### Administrator
- autentificare cu email + parolă
- vizualizare organizatori
- rapoarte agregate despre evenimente, înscrieri și feedback

## Structura proiectului

```text
backend/
  app/
    models/
    routes/
    services/
    utils/
    __init__.py
  migrations/
  seed.py

frontend/

docs/

docker-compose.yml
README.md

## Rulare locală

```bash
docker compose up --build
```



## API-uri

### Sistem
GET /api/health

### Autentificare
POST /api/auth/student/google
POST /api/auth/organizer/login
POST /api/auth/admin/login
POST /api/auth/logout
POST /api/auth/refresh

### Categorii
GET /api/categories
GET /api/categories/:id
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id

### Evenimente
GET /api/events
GET /api/events/:id
POST /api/events
PUT /api/events/:id
DELETE /api/events/:id
PUT /api/events/:id/status
GET /api/events/search
GET /api/events/calendar

### Înscrieri
GET /api/registrations
POST /api/registrations
GET /api/registrations/:id
PUT /api/registrations/:id
DELETE /api/registrations/:id
GET /api/events/:id/registrations

### Materiale
GET /api/materials
POST /api/materials
GET /api/materials/:id
PUT /api/materials/:id
GET /api/events/:id/materials
DELETE /api/materials/:id

### Utilizatori
GET /api/users
POST /api/users
GET /api/users/organizers
POST /api/users/organizers
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id

### Feedback
GET /api/feedback
GET /api/feedback/:id
POST /api/feedback
PUT /api/feedback/:id
DELETE /api/feedback/:id
GET /api/feedback/event/:id
GET /api/events/:id/feedback/summary

### Raportare
GET /api/reports/summary
GET /api/reports/events-by-organizer
GET /api/reports/registrations-by-event
GET /api/reports/feedback-by-event


---

## Stadiu proiect

Backendul aplicației este aproape complet finalizat și testat.

- Backend implementare: ~95%
- Backend demo-ready: ~95%
- Frontend: în curs de dezvoltare (MVP planificat)
- Documentație: în curs de finalizare

Proiectul este împărțit în 3 etape principale:

1. **Zona 1 — Polish & Consistență**
   - uniformizare mesaje API
   - eliminare inconsistențe
   - curățare cod

2. **Zona 2 — Hardening & Robustness**
   - validări input (ex: `max_participants`)
   - validare statusuri (registrations/events)
   - eliminare fallback-uri nesigure (`SECRET_KEY`)
   - uniformizare mesaje de eroare în engleză
   - verificări minime de consistență

3. **Zona 3 — Documentare & livrabile**
   - README final
   - capturi pentru livrabile
   - raport de cercetare

---

## Securitate și validare (Zona 2)

Au fost implementate următoarele îmbunătățiri:

- eliminare fallback insecure pentru `SECRET_KEY`
- validare strictă pentru:
  - `max_participants` (integer pozitiv)
  - statusuri înregistrări (`confirmed`, `cancelled`, `pending`)
  - statusuri evenimente
- conversie completă a mesajelor de eroare în limba engleză
- verificări minime de consistență pentru ownership (organizator eveniment)

---

## Testare manuală (Postman)

Pentru validarea backendului, au fost testate următoarele scenarii:

### Autentificare
- login organizator/admin
- Google login student
- refresh token

### Evenimente
- creare eveniment valid/invalid
- editare eveniment
- ștergere eveniment
- validare `max_participants`

### Înscrieri
- creare înscriere
- schimbare status valid/invalid
- prevenire valori invalide

### Feedback
- creare feedback
- prevenire duplicate
- validare rating

### Cazuri de eroare
- date invalide
- ID-uri inexistente
- tipuri greșite (string vs int)

---