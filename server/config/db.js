import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const connectDB = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Conexión exitosa a PostgreSQL");
    console.log("\tHora actual en PostgreSQL:", res.rows[0].now);
  } catch (error) {
    console.error("❌ Error en conexión a PostgreSQL:", error);
    process.exit(1);
  }
};

export { connectDB, pool };
