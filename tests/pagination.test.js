// Testes unitários das funções de paginação (não usam banco nem HTTP)
const { parsePagination, parseFields, pickFields } = require("../src/utils/pagination");

describe("parsePagination", () => {
  test("usa limit 12 e page 1 por padrão", () => {
    expect(parsePagination({})).toEqual({ limit: 12, page: 1, offset: 0, sqlLimit: 12 });
  });

  test("calcula o offset da página", () => {
    expect(parsePagination({ limit: "30", page: "2" })).toMatchObject({ offset: 30, sqlLimit: 30 });
  });

  test("limit -1 busca tudo e ignora page", () => {
    expect(parsePagination({ limit: "-1", page: "5" })).toEqual({ limit: -1, page: 1, offset: undefined, sqlLimit: undefined });
  });

  test.each([{ limit: "0" }, { limit: "abc" }, { limit: "-2" }, { page: "0" }, { page: "1.5" }])(
    "recusa %p com status 400",
    (query) => {
      expect(() => parsePagination(query)).toThrow(expect.objectContaining({ status: 400 }));
    },
  );
});

describe("parseFields e pickFields", () => {
  const allowed = ["id", "name", "slug"];

  test("sem fields devolve null (todos os campos)", () => {
    expect(parseFields(undefined, allowed)).toBeNull();
  });

  test("aceita campos permitidos e recusa os demais", () => {
    expect(parseFields("name, slug", allowed)).toEqual(["name", "slug"]);
    expect(() => parseFields("name,password", allowed)).toThrow(expect.objectContaining({ status: 400 }));
  });

  test("pickFields mantém o id e os campos pedidos", () => {
    expect(pickFields({ id: 1, name: "A", slug: "a" }, ["name"])).toEqual({ id: 1, name: "A" });
  });
});
