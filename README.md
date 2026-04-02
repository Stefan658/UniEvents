Platformă web pentru managementul evenimentelor universitare din cadrul USV.

## Stack tehnologic

- Backend: Flask (Python 3)
- Frontend: React
- Database: PostgreSQL
- Containerizare: Docker + Docker Compose
- Versionare: Git + GitHub

## Funcționalități vizate

- autentificare student cu Google OAuth (@student.usv.ro)
- listare evenimente
- filtrare și căutare evenimente
- calendar interactiv
- management evenimente pentru organizatori
- administrare și validare evenimente

## Structura proiectului

- `backend/` - servicii API Flask
- `frontend/` - aplicație React
- `docs/` - diagramă și documente proiect
- `docker-compose.yml` - rulare locală a întregii aplicații

## Rulare locală

```bash
docker compose up --build
<<<<<<< HEAD
```



## API-uri  

=======

```


## API-uri  
>>>>>>> 33e513c (Updated Structure)
  
### Sistem  
GET /api/health  

### Autentificare  
POST /api/auth/student/google      
POST /api/auth/organizer/login    
POST /api/auth/admin/login    
  
### Evenimente  
GET /api/events    
GET /api/events/:id    
POST /api/events    
PUT /api/events/:id    
DELETE /api/events/:id    

### Categorii  
GET /api/categories    
  
### Feedback  
POST /api/feedback    
  
### Raportare  
GET /api/reports/summary  
