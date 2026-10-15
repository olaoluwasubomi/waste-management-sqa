export function assertTestDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Integration tests require .env.test.",
    );
  }

  const url = new URL(connectionString);

  const databaseName = decodeURIComponent(
    url.pathname.replace(/^\/+/, ""),
  );

  const isSafeDatabase =
    ["postgresql:", "postgres:"].includes(url.protocol) &&
    databaseName === "waste_management_test" &&
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.username === "waste_test_user" &&
    (url.port === "5432" || url.port === "");

  if (!isSafeDatabase) {
    throw new Error(
      "Unsafe database connection: integration tests must use the local waste_management_test database with waste_test_user.",
    );
  }
}