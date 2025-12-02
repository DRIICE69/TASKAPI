# Todo API

API RESTful pour gérer des tâches (Node.js, Express, MongoDB).

Fonctionnalités:
- Créer une tâche (title, description, dueDate)
- Lister toutes les tâches
- Récupérer une tâche par id
- Mettre à jour une tâche
- Supprimer une tâche

Installation (local):

1. Copier `.env.example` vers `.env` et ajuster `MONGO_URI` si besoin.
2. Installer les dépendances:

```powershell
cd d:/WORKS/todo-api
npm install
```

3. Lancer en local:

```powershell
npm run dev
```

Avec Docker (recommandé):

```powershell
docker compose up --build
```

API endpoints:
- `GET /api/tasks` — lister
- `POST /api/tasks` — créer
- `GET /api/tasks/:id` — récupérer
- `PUT /api/tasks/:id` — mettre à jour
- `DELETE /api/tasks/:id` — supprimer

Variables d'environnement:
- `MONGO_URI` (ex: `mongodb://mongo:27017/todo_db`)
- `PORT` (default 8000)

