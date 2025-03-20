# Backend för EzReadz

Den här backend-servern är byggd med Fastify och hanterar autentisering, användardata, bokinformation och recensioner. Backend hämtar böcker från Google Books API och sparar dem i en MySQL-databas, som är hostad på Inleed. Servern är hostad på Render.

## Teknologier

- Node.js med Fastify för API-hantering  
- MySQL för datalagring  
- JWT (JSON Web Token) för autentisering  
- Google Books API för att hämta bokinformation  
- bcrypt för lösenordshantering  
- CORS för att möjliggöra anrop från frontend  

## API-Endpoints

### Autentisering
| Metod | Endpoint     | Beskrivning                                   |
|------ |------------ |------------------------------------------------|
| POST  | `/login`    | Logga in och få en JWT-token                   |
| GET   | `/validate` | Validera JWT-token och hämta användardata      |

### Användare
| Metod  | Endpoint     | Beskrivning                                  |
|--------|--------------|----------------------------------------------|
| POST   | `/users`     | Skapa en ny användare                        |
| GET    | `/users`     | Hämta alla användare                         |
| PUT    | `/users/:id` | Uppdatera en användare                       |
| DELETE | `/users/:id` | Ta bort en användare                         |

### Böcker
| Metod  | Endpoint       | Beskrivning                                |
|--------|----------------|--------------------------------------------|
| GET    | `/books`       | Hämta alla böcker                          |
| GET    | `/books/:isbn` | Hämta en bok via ISBN                      |
| POST   | `/books`       | Lägg till en bok från Google Books API     |
| PUT    | `/books/:isbn` | Uppdatera bokinformation                   |
| DELETE | `/books/:isbn` | Ta bort en bok                             |
| POST   | `/books/:isbn/like` | Gilla/ta bort gilla på en bok         |

### Recensioner
| Metod  | Endpoint               | Beskrivning                        |
|--------|------------------------|------------------------------------|
| GET    | `/books/:isbn/reviews` | Hämta alla recensioner för en bok  |
| POST   | `/books/:isbn/reviews` | Lägg till en recension             |
| PUT    | `/reviews/:id`         | Uppdatera en recension             |
| DELETE | `/reviews/:id`         | Ta bort en recension               |

