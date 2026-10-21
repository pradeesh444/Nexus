import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";
import { seed, tables } from "./seed.js";
export async function createStore({
  mongoUri = process.env.MONGODB_URI,
  dataFile = process.env.DATA_FILE || "data/workspace.json",
} = {}) {
  let queue = Promise.resolve();
  const serial = (fn) => {
    const next = queue.then(fn);
    queue = next.catch(() => {});
    return next;
  };
  if (mongoUri) {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "nexus_erp");
    const hello = await db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") {
      await client.close();
      throw Error(
        "MongoDB requires a replica set for ERP transactions. Use the included docker compose setup.",
      );
    }
    for (const t of [...tables, "meta"]) {
      await db.createCollection(t).catch((e) => {
        if (e.code !== 48) throw e;
      });
    }
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("products").createIndex({ sku: 1 }, { unique: true });
    await db.collection("employees").createIndex({ code: 1 }, { unique: true });
    await db
      .collection("attendance")
      .createIndex({ employeeId: 1, date: 1 }, { unique: true });
    await db
      .collection("payroll")
      .createIndex({ employeeId: 1, month: 1 }, { unique: true });
    await db
      .collection("meta")
      .updateOne(
        { _id: "workspace" },
        { $setOnInsert: { revision: 0 } },
        { upsert: true },
      );
    const read = async (session) => {
      const s = {};
      for (const t of tables)
        s[t] = (await db.collection(t).find({}, { session }).toArray()).map(
          ({ _id, ...row }) => row,
        );
      return s;
    };
    const mutate = async (fn) =>
      serial(async () => {
        const session = client.startSession();
        try {
          return await session.withTransaction(
            async () => {
              // A shared revision write serializes concurrent business transactions across processes.
              await db
                .collection("meta")
                .updateOne(
                  { _id: "workspace" },
                  { $inc: { revision: 1 } },
                  { session },
                );
              const before = await read(session);
              const draft = structuredClone(before);
              const result = await fn(draft);
              for (const t of tables) {
                const previous = new Map(before[t].map((v) => [v.id, v]));
                for (const row of draft[t]) {
                  if (
                    JSON.stringify(previous.get(row.id)) !== JSON.stringify(row)
                  )
                    await db
                      .collection(t)
                      .replaceOne(
                        { _id: row.id },
                        { _id: row.id, ...row },
                        { upsert: true, session },
                      );
                  previous.delete(row.id);
                }
                for (const id of previous.keys())
                  await db.collection(t).deleteOne({ _id: id }, { session });
              }
              return result;
            },
            {
              readConcern: { level: "snapshot" },
              writeConcern: { w: "majority" },
            },
          );
        } finally {
          await session.endSession();
        }
      });
    await mutate((s) => {
      if (s.users.length === 0) Object.assign(s, seed());
    });
    return {
      mode: "mongodb",
      read: () =>
        serial(async () => {
          const session = client.startSession();
          try {
            return await session.withTransaction(() => read(session), {
              readConcern: { level: "snapshot" },
            });
          } finally {
            await session.endSession();
          }
        }),
      mutate,
      close: () => client.close(),
    };
  }
  const file = path.resolve(dataFile);
  await mkdir(path.dirname(file), { recursive: true });
  let current;
  try {
    current = JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    current = seed();
    await writeFile(file, JSON.stringify(current, null, 2), { mode: 0o600 });
  }
  const persist = async (draft) => {
    await writeFile(file + ".tmp", JSON.stringify(draft, null, 2), {
      mode: 0o600,
    });
    await rename(file + ".tmp", file);
    current = draft;
  };
  return {
    mode: "local-demo",
    read: async () => {
      await queue;
      return structuredClone(current);
    },
    mutate: (fn) =>
      serial(async () => {
        const draft = structuredClone(current);
        const result = await fn(draft);
        await persist(draft);
        return result;
      }),
    close: async () => {
      await queue;
    },
  };
}
