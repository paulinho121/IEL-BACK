# Digital Store API

API REST da **Digital Store**, projeto final do módulo de Back-end da Digital College. Implementa o escopo do [repositório oficial do projeto](https://github.com/digitalcollegebr/projeto-backend): usuários, categorias e produtos com CRUD completo, autenticação JWT, migrations, testes e documentação Swagger.

O front-end da loja está em [paulinho121/IEL-FRONT](https://github.com/paulinho121/IEL-FRONT) (no ar em https://iel-front.vercel.app).

🔗 **API no ar:** https://iel-back.vercel.app · documentação Swagger em https://iel-back.vercel.app/docs

## Equipe

- Paulo Fernando (trabalho individual)

## Tecnologias

| Pacote | Para quê |
| --- | --- |
| Node.js + Express 5 | Servidor HTTP e rotas |
| Sequelize + mysql2 | ORM, migrations e seeders sobre o MySQL |
| dotenv | Configuração por variáveis de ambiente |
| bcryptjs | Hash das senhas |
| jsonwebtoken | Geração e validação do token JWT |
| swagger-ui-express | Documentação interativa em `/docs` |
| Jest + Supertest | Testes unitários e de integração (com SQLite em memória) |
| nodemon | Recarrega o servidor durante o desenvolvimento |

## Como rodar

Pré-requisitos: **Node.js 20+** e **MySQL 8** rodando.

```bash
git clone https://github.com/paulinho121/IEL-BACK.git
cd IEL-BACK
npm install
cp .env.example .env
```

Abra o `.env` e preencha `DB_USER` e `DB_PASSWORD` com o usuário do seu MySQL. Depois:

```bash
npm run db:create    # cria o banco digital_store
npm run db:migrate   # cria as tabelas
npm run db:seed      # opcional: usuário admin, 6 categorias e 15 produtos de exemplo
npm run dev          # sobe a API em http://localhost:3333
```

- Documentação Swagger: http://localhost:3333/docs
- Especificação OpenAPI em JSON: http://localhost:3333/docs.json

**Usuário criado pelo seed:** `admin@digitalstore.com` / senha `admin123`. Use-o em `POST /v1/user/token` para gerar um token.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API com nodemon |
| `npm start` | Sobe a API em modo produção |
| `npm test` | Roda os testes (não precisa de MySQL: usa SQLite em memória) |
| `npm run db:create` | Cria o banco definido em `DB_NAME` |
| `npm run db:migrate` | Executa as migrations |
| `npm run db:seed` | Insere os dados de exemplo |
| `npm run db:reset` | Desfaz tudo, recria as tabelas e roda o seed |

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3333` | Porta HTTP |
| `APP_URL` | `http://localhost:3333` | Endereço público, usado para montar a URL das imagens |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | Servidor MySQL |
| `DB_USER` / `DB_PASSWORD` | `root` / vazio | Credenciais do MySQL |
| `DB_NAME` | `digital_store` | Nome do banco |
| `JWT_SECRET` | — | Segredo que assina os tokens. Use um valor longo e aleatório |
| `JWT_EXPIRES_IN` | `1d` | Validade do token |

## Endpoints

Todas as rotas `POST`, `PUT` e `DELETE` exigem o cabeçalho `Authorization: Bearer <token>`, **exceto** o cadastro de usuário e a geração do token (sem elas ninguém conseguiria se cadastrar e logar).

| Método | Rota | Token | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| POST | `/v1/user/token` | — | 200 `{ token }` | 400 |
| POST | `/v1/user` | — | 201 | 400 |
| GET | `/v1/user/:id` | — | 200 | 404 |
| PUT | `/v1/user/:id` | ✔ | 204 | 400, 401, 404 |
| DELETE | `/v1/user/:id` | ✔ | 204 | 401, 404 |
| GET | `/v1/category/search` | — | 200 | 400 |
| GET | `/v1/category/:id` | — | 200 | 404 |
| POST | `/v1/category` | ✔ | 201 | 400, 401 |
| PUT | `/v1/category/:id` | ✔ | 204 | 400, 401, 404 |
| DELETE | `/v1/category/:id` | ✔ | 204 | 401, 404 |
| GET | `/v1/product/search` | — | 200 | 400 |
| GET | `/v1/product/:id` | — | 200 | 404 |
| POST | `/v1/product` | ✔ | 201 | 400, 401 |
| PUT | `/v1/product/:id` | ✔ | 204 | 400, 401, 404 |
| DELETE | `/v1/product/:id` | ✔ | 204 | 401, 404 |

Os erros sempre voltam como JSON: `{ "message": "...", "errors": ["..."] }`.

### Busca de produtos

`GET /v1/product/search` aceita, combinados:

| Parâmetro | Exemplo | Efeito |
| --- | --- | --- |
| `limit` | `30` | Itens por página (padrão 12; `-1` traz tudo) |
| `page` | `2` | Página (padrão 1) |
| `fields` | `name,images,price` | Limita os campos devolvidos (o `id` sempre vem) |
| `match` | `Tênis` | Termo procurado no nome ou na descrição |
| `category_ids` | `1,6` | Produtos de qualquer uma dessas categorias |
| `price-range` | `100-200` | Faixa de preço |
| `option[ID]` | `option[1]=41,42` | Produtos cuja opção de ID 1 tem algum desses valores |

Exemplo: `GET /v1/product/search?match=nike&category_ids=5&price-range=100-1000&limit=-1`

### Imagens

No cadastro, cada imagem é enviada em base64 (`{ "type": "image/png", "content": "<base64>" }`). A API grava o arquivo em `public/media/product-<id>/`, guarda o caminho relativo na tabela `product_images` e devolve a URL completa em `images[].content`. No `PUT`:

- `{ "id": 2, "deleted": true }` remove a imagem e o arquivo;
- `{ "id": 3, "content": "<base64>" }` troca a imagem;
- `{ "id": 1, "content": "<URL atual>" }` mantém a imagem;
- `{ "type": "...", "content": "<base64>" }` adiciona uma nova.

As opções seguem a mesma ideia (`deleted`, alteração parcial pelo `id` ou criação sem `id`) e aceitam `values` ou `value`, como aparece na documentação oficial.

## Banco de dados

```
users                categories              products
─────                ──────────              ────────
id (PK)              id (PK)                 id (PK)
firstname            name                    enabled, name, slug (único)
surname              slug (único)            use_in_menu, stock, description
email (único)        use_in_menu             price (índice), price_with_discount
password (bcrypt)    created_at/updated_at   created_at/updated_at
created_at/updated_at        │                  │
                             │   product_category (PK composta)
                             └──── category_id ─┤ product_id ──┐
                                   (índice)                    │
                    product_images ── product_id (FK) ─────────┤
                    product_options ─ product_id (FK) ─────────┘
```

- As migrations ficam em `src/database/migrations` e os dados de exemplo em `src/database/seeders`.
- Imagens, opções e vínculos com categorias usam `ON DELETE CASCADE`: apagar um produto não deixa registros órfãos.
- `slug` e `email` são únicos. Há índices em `products.price` (filtro `price-range`) e `product_category.category_id` (filtro `category_ids`).
- A busca de produtos primeiro conta e pagina só os `id`s, sem joins, e só depois carrega imagens, opções e categorias da página atual. Assim a contagem e a paginação continuam corretas e rápidas com relações 1:N.
- Criação e edição de produtos rodam numa **transação**: se algo falhar (por exemplo, uma categoria inexistente), nada fica salvo e as imagens já gravadas em disco são apagadas.

## Estrutura (MVC)

```
src/
├── config/        # database.js (Sequelize e sequelize-cli) e env.js
├── controllers/   # Recebem a requisição e devolvem o status HTTP
├── database/      # migrations/ e seeders/
├── docs/          # openapi.js (Swagger)
├── middleware/    # auth (JWT), errorHandler e notFound
├── models/        # Models do Sequelize e relacionamentos
├── routes/        # Rotas /v1/user, /v1/category e /v1/product
├── services/      # Regras de negócio e validações
├── utils/         # HttpError, validators, pagination e imageStorage
├── app.js         # Monta o Express (usado também pelos testes)
└── server.js      # Conecta ao banco e abre a porta
tests/             # Jest + Supertest
```

O fluxo de uma requisição é `routes` → `middleware/auth` (se for rota protegida) → `controller` → `service` → `model`. Os services lançam `HttpError(400|401|404)` e o `errorHandler` transforma qualquer erro na resposta JSON e no status corretos.

## Testes

```bash
npm test
```

São 41 testes: unitários (paginação) e de integração cobrindo os 15 endpoints, os status 200/201/204/400/401/404, os filtros da busca, o upload e a remoção de imagens e a transação desfeita em caso de erro. Eles rodam num SQLite em memória, sem precisar de MySQL.

## Deploy

A API roda na [Vercel](https://vercel.com/) como função serverless (`api/index.js` reaproveita o `src/app.js`) e o banco é um MySQL gratuito na [Aiven](https://aiven.io/), acessado com SSL. Cada push no `main` publica uma nova versão.

Variáveis configuradas no painel da Vercel:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Service URI do MySQL (`mysql://usuario:senha@host:porta/banco`) |
| `DB_SSL_CA` | Conteúdo do certificado CA da Aiven |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Assinatura e validade do token |
| `APP_URL` | Endereço público da API, usado para montar a URL das imagens |
| `MEDIA_DIR` | `/tmp/media`: na Vercel só a pasta temporária aceita escrita |

Para criar as tabelas e os dados de exemplo no banco hospedado, preencha um `.env.production` (com `DATABASE_URL` e `DB_SSL_CA_FILE=ca.pem`) e rode:

```bash
npm run db:migrate:prod
npm run db:seed:prod
```

> As imagens de exemplo (`public/seed`) fazem parte do deploy. Imagens enviadas pela API ficam na pasta temporária da função e podem sumir quando ela reinicia; para guardá-las de vez seria preciso um armazenamento externo (S3, Vercel Blob etc.).

## Decisões sobre a documentação oficial

- **Token ausente:** a seção 05 da documentação fala em `400`, mas todos os endpoints listam `401 Unauthorized` para token ausente ou inválido. A API segue os endpoints e responde **401**.
- **Rotas públicas:** `POST /v1/user` e `POST /v1/user/token` não exigem token, senão seria impossível criar o primeiro usuário e fazer login.
- **`value` x `values`:** os exemplos de opções usam os dois nomes; a API aceita ambos e sempre responde com `values` em forma de lista.
- **`radius`:** a coluna é `INTEGER`, então `"4px"` é salvo como `4`.
