# DeliveryFlow Microservices

DeliveryFlow est un projet Node.js de microservices oriente livraison. Le depot assemble:

- un `API Gateway` Express exposant REST et GraphQL;
- trois microservices gRPC (`order-service`, `delivery-service`, `courier-service`);
- une communication asynchrone par Kafka;
- une persistance locale SQLite par service.

L'objectif fonctionnel est de gerer le cycle de vie d'une commande de livraison, depuis la creation de la commande jusqu'a l'affectation d'un livreur et la mise a jour des statuts.

## Stack technique

- Runtime: `Node.js`
- Gateway HTTP: `Express`
- API GraphQL: `Apollo Server`
- RPC interne: `gRPC` avec `@grpc/grpc-js` et `@grpc/proto-loader`
- Event streaming: `Kafka` via `kafkajs`
- Base de donnees locale: `SQLite` via `better-sqlite3`
- Dev runtime: `nodemon`
- Infrastructure locale Kafka: `docker-compose` avec `Zookeeper` et `Kafka`

## Architecture globale

```text
Client REST / GraphQL
        |
        v
  API Gateway :3000
        |
        +--> Order Service :50051 ----> SQLite orders.db
        |
        +--> Delivery Service :50052 -> SQLite deliveries.db
        |
        +--> Courier Service :50053 --> SQLite couriers.db

Kafka topics:
- order.created
- delivery.created
- delivery.assigned
- delivery.status.updated
```

### Responsabilites

`gateway/`
- Point d'entree HTTP du systeme.
- Expose les routes REST `/api/orders`, `/api/deliveries`, `/api/couriers`.
- Expose GraphQL sur `/graphql`.
- Convertit les appels HTTP/GraphQL en appels gRPC vers les services internes.

`services/order-service/`
- Gere les commandes.
- Cree, lit, liste, met a jour le statut et supprime les commandes.
- Stocke les commandes dans SQLite.
- Consomme les evenements `delivery.status.updated` pour marquer automatiquement une commande comme `DELIVERED` quand une livraison est livree.

`services/delivery-service/`
- Gere les livraisons associees aux commandes.
- Cree les livraisons, affecte un livreur et met a jour les statuts.
- Consomme `order.created` pour creer automatiquement une livraison.
- Publie les evenements `delivery.created`, `delivery.assigned` et `delivery.status.updated`.

`services/courier-service/`
- Gere les livreurs.
- Cree, liste, consulte et met a jour leur statut.
- Consomme `delivery.assigned` pour passer automatiquement un livreur a l'etat `BUSY`.

`proto/`
- Contient les contrats gRPC partages entre la gateway et les services.

`client/`
- Reserve aux exemples d'appels REST et GraphQL.
- Dans l'etat actuel du depot, les fichiers sont presents mais vides.

`docs/`
- Repertoire prevu pour la documentation detaillee.
- Dans l'etat actuel du depot, les fichiers sont presents mais vides.

`tests/`
- Repertoire prevu pour les tests REST, GraphQL et gRPC.
- Dans l'etat actuel du depot, les fichiers sont presents mais vides.

## Structure du depot

```text
.
|-- gateway/
|   `-- src/
|       |-- app.js
|       |-- index.js
|       |-- config/grpcClients.js
|       |-- graphql/
|       `-- rest/
|-- services/
|   |-- order-service/
|   |-- delivery-service/
|   `-- courier-service/
|-- proto/
|-- client/
|-- docs/
|-- tests/
|-- docker-compose.yml
`-- package.json
```

## Services et configuration

### API Gateway

Chemin: `gateway/`

Role:
- sert de facade unique pour les clients;
- concentre REST et GraphQL;
- ouvre des clients gRPC vers les trois services.

Variables d'environnement:

```env
GATEWAY_PORT=3000
ORDER_SERVICE_URL=localhost:50051
DELIVERY_SERVICE_URL=localhost:50052
COURIER_SERVICE_URL=localhost:50053
```

Endpoints exposes:
- `GET /` retourne l'etat du gateway;
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `POST /api/deliveries`
- `GET /api/deliveries`
- `GET /api/deliveries/:id`
- `GET /api/deliveries/order/:orderId`
- `PATCH /api/deliveries/:id/assign`
- `PATCH /api/deliveries/:id/status`
- `POST /api/couriers`
- `GET /api/couriers`
- `GET /api/couriers/available`
- `GET /api/couriers/:id`
- `PATCH /api/couriers/:id/status`
- `POST /graphql`

### Order Service

Chemin: `services/order-service/`

Port gRPC:
- `50051`

Variables d'environnement:

```env
ORDER_SERVICE_PORT=50051
ORDER_DB_PATH=./src/db/orders.db
KAFKA_BROKER=localhost:9092
```

Responsabilites:
- creation de commande;
- consultation d'une commande par identifiant;
- liste des commandes;
- mise a jour du statut;
- suppression.

Persistance:
- fichier SQLite `orders.db`;
- journalisation SQLite en mode `WAL`.

Schema `orders`:

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Statuts metier:
- `CREATED`
- `ACCEPTED`
- `IN_DELIVERY`
- `DELIVERED`
- `CANCELLED`

### Delivery Service

Chemin: `services/delivery-service/`

Port gRPC:
- `50052`

Variables d'environnement:

```env
DELIVERY_SERVICE_PORT=50052
DELIVERY_DB_PATH=./src/db/deliveries.db
KAFKA_BROKER=localhost:9092
```

Responsabilites:
- creation d'une livraison a partir d'un `orderId`;
- recuperation par `id`;
- recuperation par `orderId`;
- liste des livraisons;
- affectation d'un coursier;
- changement de statut.

Persistance:
- fichier SQLite `deliveries.db`;
- journalisation SQLite en mode `WAL`.

Schema `deliveries`:

```sql
CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  courier_id TEXT,
  status TEXT NOT NULL,
  assigned_at TEXT,
  picked_up_at TEXT,
  delivered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Statuts metier:
- `PENDING`
- `ASSIGNED`
- `PICKED_UP`
- `IN_TRANSIT`
- `DELIVERED`
- `FAILED`

Regles internes observees dans le code:
- une seule livraison est autorisee par commande;
- `assignCourier` positionne automatiquement le statut a `ASSIGNED`;
- `updateDeliveryStatus` renseigne `picked_up_at` si le statut devient `PICKED_UP`;
- `updateDeliveryStatus` renseigne `delivered_at` si le statut devient `DELIVERED`.

### Courier Service

Chemin: `services/courier-service/`

Port gRPC:
- `50053`

Variables d'environnement:

```env
COURIER_SERVICE_PORT=50053
COURIER_DB_PATH=./src/db/couriers.db
KAFKA_BROKER=localhost:9092
```

Responsabilites:
- creation d'un livreur;
- liste complete des livreurs;
- liste des livreurs disponibles;
- recuperation par identifiant;
- mise a jour du statut.

Persistance:
- fichier SQLite `couriers.db`;
- journalisation SQLite en mode `WAL`.

Schema `couriers`:

```sql
CREATE TABLE couriers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Statuts metier:
- `AVAILABLE`
- `BUSY`
- `OFFLINE`

Types de vehicule:
- `BIKE`
- `MOTORBIKE`
- `CAR`

## Contrats REST

Les routes REST sont implementees dans `gateway/src/rest/` et servent de proxy vers gRPC.

### Orders

`POST /api/orders`

Payload:

```json
{
  "customerName": "Alice",
  "customerPhone": "+33123456789",
  "pickupAddress": "10 Rue A",
  "deliveryAddress": "20 Rue B"
}
```

`PATCH /api/orders/:id/status`

```json
{
  "status": "ACCEPTED"
}
```

### Deliveries

`POST /api/deliveries`

```json
{
  "orderId": "uuid-order"
}
```

`PATCH /api/deliveries/:id/assign`

```json
{
  "courierId": "uuid-courier"
}
```

`PATCH /api/deliveries/:id/status`

```json
{
  "status": "IN_TRANSIT"
}
```

### Couriers

`POST /api/couriers`

```json
{
  "name": "Samir",
  "phone": "+33600000000",
  "vehicleType": "BIKE"
}
```

`PATCH /api/couriers/:id/status`

```json
{
  "status": "OFFLINE"
}
```

### Gestion d'erreur

Le gateway encapsule les erreurs gRPC en HTTP `500` avec le format:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Pour les erreurs metier, le code HTTP depend de la reponse du service:
- `201` sur creation reussie;
- `200` sur lecture ou mise a jour reussie;
- `400` pour une validation ou un statut invalide;
- `404` quand l'entite demandee n'existe pas.

## Contrat GraphQL

Endpoint:

- `POST /graphql`

Types principaux:
- `Order`
- `Delivery`
- `Courier`
- `OrderDetails`

Enums:
- `OrderStatus`
- `DeliveryStatus`
- `CourierStatus`
- `VehicleType`

Queries:
- `orders`
- `order(id: ID!)`
- `orderDetails(id: ID!)`
- `deliveries`
- `delivery(id: ID!)`
- `deliveryByOrderId(orderId: ID!)`
- `couriers`
- `courier(id: ID!)`
- `availableCouriers`

Mutations:
- `createOrder(input: CreateOrderInput!)`
- `createCourier(input: CreateCourierInput!)`
- `createDelivery(orderId: ID!)`
- `assignCourier(deliveryId: ID!, courierId: ID!)`
- `updateDeliveryStatus(deliveryId: ID!, status: DeliveryStatus!)`
- `updateCourierStatus(courierId: ID!, status: CourierStatus!)`
- `updateOrderStatus(orderId: ID!, status: OrderStatus!)`

Resolutions notables:
- `OrderDetails.delivery` appelle `GetDeliveryByOrderId`;
- `Delivery.courier` appelle `GetCourier`;
- les mutations GraphQL deleguent directement aux services gRPC via le gateway.

## Contrats gRPC

### OrderService

Methodes:
- `CreateOrder`
- `GetOrder`
- `ListOrders`
- `UpdateOrderStatus`
- `DeleteOrder`

### DeliveryService

Methodes:
- `CreateDelivery`
- `GetDelivery`
- `GetDeliveryByOrderId`
- `ListDeliveries`
- `AssignCourier`
- `UpdateDeliveryStatus`

### CourierService

Methodes:
- `CreateCourier`
- `GetCourier`
- `ListCouriers`
- `ListAvailableCouriers`
- `UpdateCourierStatus`

Les contrats source se trouvent dans:
- `proto/order.proto`
- `proto/delivery.proto`
- `proto/courier.proto`

## Flux evenementiels Kafka

Le depot met en place une logique evenementielle entre services. Les topics utilises par le code sont:

- `order.created`
- `delivery.created`
- `delivery.assigned`
- `delivery.status.updated`

### Flux cible

1. Une commande est creee dans `order-service`.
2. Un evenement `ORDER_CREATED` est publie sur `order.created`.
3. `delivery-service` consomme `order.created`, cree automatiquement une livraison et publie `DELIVERY_CREATED`.
4. Lorsqu'un coursier est affecte, `delivery-service` publie `DELIVERY_ASSIGNED`.
5. `courier-service` consomme `delivery.assigned` et passe le coursier a `BUSY`.
6. Lorsqu'une livraison change de statut, `delivery-service` publie `DELIVERY_STATUS_UPDATED`.
7. `order-service` consomme `delivery.status.updated` et, si le statut est `DELIVERED`, passe la commande a `DELIVERED`.

### Detail par service

`order-service`
- consommateur de `delivery.status.updated`
- devrait etre producteur de `order.created`

`delivery-service`
- consommateur de `order.created`
- producteur de `delivery.created`
- producteur de `delivery.assigned`
- producteur de `delivery.status.updated`

`courier-service`
- consommateur de `delivery.assigned`

## Installation et execution

### Prerequis

- `Node.js` installe localement
- `npm`
- `Docker` et `Docker Compose` pour Kafka/Zookeeper

### Installation des dependances

A la racine:

```bash
npm run install:all
```

Ce script installe les dependances pour:
- `gateway`
- `services/order-service`
- `services/delivery-service`
- `services/courier-service`

### Variables d'environnement

Chaque module possede un fichier `.env.example`. Copier ces valeurs dans les `.env` correspondants si necessaire:

- `gateway/.env`
- `services/order-service/.env`
- `services/delivery-service/.env`
- `services/courier-service/.env`

### Demarrer Kafka

```bash
docker compose up -d
```

Le `docker-compose.yml` de ce depot demarre uniquement:
- `zookeeper` sur `2181`
- `kafka` sur `9092`

Il ne demarre pas la gateway ni les microservices Node.js.

### Demarrer les services applicatifs

Dans quatre terminaux separes:

```bash
npm run start:gateway
npm run start:order
npm run start:delivery
npm run start:courier
```

Les scripts `dev` utilisent `nodemon`, et les scripts racine `start:*` deleguent a ces scripts.

### Verification manuelle

Exemples simples:

```bash
curl http://localhost:3000/
curl http://localhost:3000/api/orders
```

L'interface GraphQL est disponible sur:

```text
http://localhost:3000/graphql
```

## Etat actuel du depot

Le depot reflete une base de travail fonctionnelle sur le plan de la structure, mais plusieurs zones sont encore incompletes ou incoherentes:

- `README.md` racine etait vide avant cette redaction.
- les fichiers sous `docs/` sont presents mais vides;
- les fichiers sous `tests/` sont presents mais vides;
- les fichiers du dossier `client/` sont presents mais vides;
- `services/order-service/src/kafka/producer.js` est vide alors que `order.grpc.js` importe `publishOrderCreated`;
- `services/courier-service/src/kafka/producer.js` contient une implementation de publication `order.created`, mais ce producteur n'est pas utilise par le service coursier.

Consequence pratique:
- le flux Kafka documente cote creation de commande semble vise par l'architecture, mais il n'est pas coherent avec l'etat exact des fichiers du workspace.

## Scripts racine

`package.json` expose:

- `npm run install:all`
- `npm run start:gateway`
- `npm run start:order`
- `npm run start:delivery`
- `npm run start:courier`

## Resume technique

Ce depot implemente une architecture microservices locale simple, centree sur:

- exposition client via REST et GraphQL;
- communication inter-services via gRPC;
- orchestration asynchrone via Kafka;
- stockage isole par service avec SQLite.

La separation des responsabilites est claire et lisible dans le code source. En revanche, la documentation detaillee, les exemples client, les tests automatises et une partie du chainage Kafka restent a finaliser pour obtenir une plateforme totalement coherente de bout en bout.
